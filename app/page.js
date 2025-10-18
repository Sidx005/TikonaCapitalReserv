// pages/index.js or app/page.js
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  return (
    <div className="min-h-screen bg-black w-full flex flex-col items-center justify-center p-20 ">
      <h1 className=" text-5xl bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent mb-4">Welcome to StockGPT</h1>
    <p className="w-80 bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent text-center">Your personal stock assistant to provide you the latest updates of the current share market</p>
      <div className="w-full mt-5 max-w-2xl h-[80vh]">
        <ChatInterface />
      </div>
    </div>
  );
}
