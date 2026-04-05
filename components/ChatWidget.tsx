"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/components/useChat";
import { ChatMessage } from "@/components/ChatMessage";
import { FaRegMessage } from "react-icons/fa6";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim()) return;
    setInput("");
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FFC038] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#FFB76B] transition-opacity cursor-pointer"
      >
        {isOpen ? "✕" : <FaRegMessage />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <p className="text-sm font-semibold">RacketRecs Assistant</p>
            <button onClick={clearChat} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex gap-2 text-black">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-3 py-2 bg-[#FFC038] text-white text-sm rounded-lg disabled:opacity-40 hover:bg-[#FFB76B] hover:cursor-pointer"
            >
              Send
            </button>
          </div>

        </div>
      )}
    </>
  );
}