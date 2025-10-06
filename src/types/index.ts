export enum AppStep {
  MENU_INPUT,
  DISH_SELECTION,
  CONTEXT_INPUT,
  CONTEXT_VALIDATION,
  GENERATING,
  RESULTS,
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DishContext {
  dishName: string;
  imageUrl: string | null;
}

export interface ContextualInfo {
  summary: string;
  sources: GroundingSource[];
  dishContexts: DishContext[];
}

export interface GeneratedDish {
  name: string;
  imageBase64: string;
}
