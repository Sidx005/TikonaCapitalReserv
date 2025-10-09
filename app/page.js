// pages/index.js or app/page.js
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#343541] w-full flex flex-col items-center justify-center p-4">
      <h1 className="text-white text-2xl font-bold mb-4">Welcome to StockGPT</h1>
      <div className="w-full max-w-2xl h-[80vh]">
        <ChatInterface />
      </div>
    </div>
  );
}
