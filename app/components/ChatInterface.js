'use client'
import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Copy, CheckCheck, LoaderCircleIcon, Trash2, ArrowUp } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          id: Date.now(),
          role: "model",
          parts: [{ text: "Hello! How can I assist you today?" }],
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Saving the messages
  useEffect(() => {
    if (messages.length > 0)
      localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  // This effect is for scrolling to yhe bottom where once the latest messags appear , the window scrolls to it

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 1500);
  };

const clearChat = () => {
  if (confirm("Do you really want to delete the chat history?")) {
    localStorage.removeItem("chatHistory")
    setChatList([{
      id: Date.now(),
      role: "model",
      parts: [{ text: "Chat history cleared! How can I help you now?" }],
      timestamp: new Date().toISOString()
    }])
  }
}


  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage = {
      id: Date.now(),
      role: "user",
      parts: [{ text: message }],
      timestamp: new Date().toISOString()
    };

    const modelPlaceholder = {
      id: Date.now() + 1,
      role: "model",
      parts: [{ text: "" }],
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage, modelPlaceholder]);
    const msgToSend = message;
    setMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          msg: msgToSend
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });

          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              parts: [{ text: fullResponse }]
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          parts: [{ text: "Error! Cannot generate at this moment due to some technical issues." }]
        };
        return updated;
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl w-full bg-[#000] rounded-md overflow-hidden">
      
      <div className="flex  items-center justify-between bg-[#202123] p-3 border-x-transparent border-b-transparent">
        <button
          onClick={clearChat}
          title="Clear Chat History"
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          Clear Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 container1 overflow-x-hidden">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-3`}
          >
            {m.role === "user" ? null : <div className="w-8 h-8 p-1 bg-white flex items-center justify-center rounded-full text-green-500 border-2 border-cyan-500 mt-1"><Bot className=''/></div>}
            <div
              className={`p-3 max-w-[70%] rounded-xl break-words whitespace-pre-wrap shadow ${
                m.role === "user"
                  ? "bg-neutral-600 border border-neutral-500 text-white rounded-br-none"
                  : "bg-transparent shadow-none text-white rounded-bl-none"
              } ${isLoading && m.role === "model" && m.parts[0].text === "" ? "animate-pulse" : ""}`}
            >
              {isLoading && m.role === "model" && m.parts[0].text === "" ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
              )}
              {/* Bottom banners containing Date and Copy Text Fucntionaliy */}
              <div className='flex justify-end items-center w-full mt-1'>
                <span className="text-xs text-gray-400 text-right">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="relative ml-2">
                  <button
                    onClick={() => handleCopy(m.id, m.parts[0].text)}
                    className="hover:text-blue-400 transition-colors"
                    title="Copy message"
                  >
                    {copiedMessageId === m.id ? (
                      <CheckCheck className='h-3 w-3' />
                    ) : (
                      <Copy className='h-4 w-4 text-gray-400' />
                    )}
                  </button>
                  {copiedMessageId === m.id && (
                    <span className="absolute -top-5 right-0 bg-gray-700 text-white text-xs px-1 rounded">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>
            {m.role === "user" ? <User className="w-6 h-6 text-gray-400 mt-1" /> : null}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    {/* Textarea where the messges would go in */}
      <div className="bg-neutral-800 p-4 flex rounded-3xl items-center gap-3 border-t border-gray-700">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#343541] text-white placeholder-gray-400"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim() || isLoading}
          className="p-3 cursor-pointer disabled:cursor-not-allowed text-black bg-white hover:bg-black hover:text-white disabled:bg-gray-500 rounded-full transition-colors"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
