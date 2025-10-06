import React from "react";

interface SpinnerProps {
  text: string;
}

const loadingMessages = [
  "Plating the pixels...",
  "Warming up the oven...",
  "Consulting with the chef...",
  "Garnishing the details...",
  "Perfecting the presentation...",
];

const Spinner: React.FC<SpinnerProps> = ({ text }) => {
  const [message, setMessage] = React.useState(loadingMessages[0]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage((prev) => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-orange-500 mx-auto"></div>
      <h3 className="text-2xl font-semibold text-gray-700 mt-6">{text}</h3>
      <p className="text-gray-500 mt-2">{message}</p>
    </div>
  );
};

export default Spinner;
