import { GoogleGenAI, Type, Modality } from "@google/genai";
import type {
  ContextualInfo,
  GroundingSource,
  DishContext,
} from "../types/index";

if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

const urlToGenerativePart = async (
  url: string
): Promise<{ part: any | null }> => {
  try {
    // Note: Direct client-side fetching can be blocked by CORS.
    // This is a best-effort attempt. A server-side proxy would be more robust.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const mimeType = blob.type;
    if (!mimeType.startsWith("image/")) {
      throw new Error("Fetched resource is not an image.");
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return {
      part: {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
    };
  } catch (error) {
    console.warn(`Could not process image from URL ${url}:`, error);
    return { part: null };
  }
};

export const extractDishesFromMenu = async (
  menuText: string
): Promise<string[]> => {
  if (!menuText.trim()) {
    return [];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `From the following menu text, extract only the names of the individual food dishes. Return them as a JSON array of strings. Do not include prices, descriptions, or category headers.
            
            Menu Text:
            ---
            ${menuText}
            ---
            `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "The name of a single dish from the menu.",
          },
        },
      },
    });

    const jsonStr = response.text?.trim() ?? "";
    const dishes = JSON.parse(jsonStr);
    if (
      Array.isArray(dishes) &&
      dishes.every((item) => typeof item === "string")
    ) {
      return dishes;
    }
    throw new Error("Parsed JSON is not a string array.");
  } catch (e) {
    console.error(
      "Failed to parse dishes from menu with AI, falling back to simple parsing:",
      e
    );
    return menuText
      .split("\n")
      .map((line) =>
        line.trim().replace(/(\s*(\$|\d{1,3}(,\d{3})*(\.\d+)?)\s*)$/, "")
      )
      .filter(
        (line) =>
          line !== "" &&
          line.length > 3 &&
          line.length < 50 &&
          /[a-zA-Z]/.test(line) &&
          line.toUpperCase() !== line
      );
  }
};

export const getMenuTextFromImage = async (
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  const imagePart = fileToGenerativePart(imageBase64, mimeType);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        imagePart,
        {
          text: "Extract all text from this menu. Present it as clean, readable text, preserving the layout if possible.",
        },
      ],
    },
  });
  return response.text ?? "";
};

export const getContextualInfo = async (
  restaurantName: string,
  dishes: string[]
): Promise<ContextualInfo> => {
  const dishList = dishes.join(", ");

  // Step 1: Search for information using the googleSearch tool, getting unstructured text back.
  const searchPrompt = `Perform a Google Search to find information about the restaurant "${restaurantName}" and its dishes: ${dishList}.
Provide a detailed text that includes:
1. A description of the restaurant's ambiance, typical plating style, and the visual appearance of its food.
2. For each of the following dishes, find ONE representative public image URL: ${dishList}. List the dish name followed by its URL. If you can't find an image, state that clearly.`;

  const searchResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: searchPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const searchResultText = searchResponse.text;
  const groundingMetadata = searchResponse.candidates?.[0]?.groundingMetadata;
  const sources: GroundingSource[] =
    groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Untitled",
        uri: chunk.web?.uri || "#",
      }))
      .filter((source) => source.uri !== "#") || [];

  // Step 2: Take the unstructured text and extract a structured JSON object from it.
  const extractionPrompt = `From the following text, extract the information into a JSON object.
The JSON object must have two keys: "summary" (a string) and "dishContexts" (an array of objects).
Each object in "dishContexts" must have two keys: "dishName" and "imageUrl".
The "dishName" must be one of these exact names: ${dishList}.
If no image URL is mentioned for a dish, the "imageUrl" value should be null.

Text to parse:
---
${searchResultText}
---`;

  const jsonResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: extractionPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "The summary of the restaurant's style.",
          },
          dishContexts: {
            type: Type.ARRAY,
            description: "List of dishes and their found image URLs.",
            items: {
              type: Type.OBJECT,
              properties: {
                dishName: { type: Type.STRING },
                imageUrl: { type: Type.STRING },
              },
              propertyOrdering: ["dishName", "imageUrl"],
            },
          },
        },
        propertyOrdering: ["summary", "dishContexts"],
      },
    },
  });

  const parsed = JSON.parse(jsonResponse.text?.trim() ?? "{}");

  // Ensure all requested dishes are in the context, even if no image was found
  const finalDishContexts: DishContext[] = dishes.map((dishName) => {
    const foundContext = parsed.dishContexts?.find(
      (dc: any) => dc.dishName.toLowerCase() === dishName.toLowerCase()
    );
    return {
      dishName: dishName,
      imageUrl: foundContext?.imageUrl || null,
    };
  });

  return {
    summary: parsed.summary || "No summary could be generated.",
    dishContexts: finalDishContexts,
    sources: sources,
  };
};

export const generateImageForDish = async (
  dishName: string,
  menuText: string,
  contextualSummary: string | null,
  referenceImageUrl: string | null
): Promise<string> => {
  // Primary strategy: Use reference image with gemini-2.5-flash-image-preview
  if (referenceImageUrl) {
    const { part: imagePart } = await urlToGenerativePart(referenceImageUrl);
    if (imagePart) {
      try {
        const textPrompt = `Generate a new, realistic, high-quality, appetizing photograph of "${dishName}". Use the provided image as a strong visual reference for plating, style, and ingredients. ${
          contextualSummary
            ? `The restaurant's style is: ${contextualSummary}`
            : ""
        }`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image-preview",
          contents: { parts: [imagePart, { text: textPrompt }] },
          config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData) {
            return part.inlineData?.data ?? ""; // Success!
          }
        }
      } catch (e) {
        console.error(
          "Image-to-image generation failed, falling back to text-to-image.",
          e
        );
      }
    }
  }

  // Fallback strategy: Use text-to-image with imagen-4.0-generate-001
  let prompt = `Generate a realistic, high-quality, appetizing photograph of a dish named "${dishName}".`;
  const relevantMenuDescription = findDishInMenu(dishName, menuText);
  if (relevantMenuDescription) {
    prompt += ` The menu description is: "${relevantMenuDescription}".`;
  }
  if (contextualSummary) {
    prompt += ` The dish is from a restaurant with the following style and context: "${contextualSummary}". Generate the image to match this aesthetic, paying attention to plating, lighting, and background.`;
  } else {
    prompt += ` The image should be well-lit and look professionally photographed on a neutral background.`;
  }

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: "image/png",
      aspectRatio: "1:1",
    },
  });

  if (response.generatedImages?.[0]?.image?.imageBytes) {
    return response.generatedImages[0].image.imageBytes;
  }

  throw new Error(
    "Image generation failed. The model did not return an image."
  );
};

const findDishInMenu = (dishName: string, menuText: string): string | null => {
  const lines = menuText.split("\n");
  const dishRegex = new RegExp(
    dishName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
    "i"
  );
  const dishLineIndex = lines.findIndex((line) => dishRegex.test(line));

  if (dishLineIndex === -1) {
    return null;
  }
  let description = lines[dishLineIndex];
  if (
    dishLineIndex + 1 < lines.length &&
    !lines[dishLineIndex + 1].match(/(\$|\d)/)
  ) {
    description += ` ${lines[dishLineIndex + 1]}`;
  }
  return description
    .replace(dishRegex, "")
    .replace(/(\$|\d{1,3}(,\d{3})*(\.\d+)?)/g, "")
    .trim();
};
