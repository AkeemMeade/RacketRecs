"use client";
import Link from "next/link";
import { Message } from "@/components/useChat";

type Props = {
  message: Message;
};

function renderContent(text: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, label, href] = match;
    const isExternal = href.startsWith("http");
    parts.push(
      isExternal ? (
        <a key={match.index} href={href} target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80 transition-opacity">
          {label}
        </a>
      ) : (
        <Link key={match.index} href={href}
          className="underline underline-offset-2 hover:opacity-80 transition-opacity">
          {label}
        </Link>
      )
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
          S
        </div>
      )}

      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "bg-[#FFC038] text-white rounded-br-sm"
          : "bg-gray-100 text-gray-800 rounded-bl-sm"
      }`}>
        {message.content === "" ? (
          <span className="flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        ) : (
          renderContent(message.content)
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-sky-300 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
          You
        </div>
      )}
    </div>
  );
}