import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { ClassificationBadge, EscalationBanner } from "./StatusBadge";

export default function ConversationThread({ conversation, isSending }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length, isSending]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b `border-[var(--color-line)`] bg-white">
        <h1 className="font-['Space Grotesk'] text-lg font-medium">
          Support conversation
        </h1>
        <ClassificationBadge classification={conversation.classification} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {conversation.messages.length === 0 && (
          <p className="text-sm text-[#6b6f6a] text-center mt-8">
            Send a message below to start the conversation.
          </p>
        )}
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} sender={m.sender} content={m.content} />
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border border-[#e4e2da] text-sm text-[#6b6f6a]">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {conversation.status === "escalated" && (
        <div className="px-5 pb-3">
          <EscalationBanner reason={conversation.escalationReason} />
        </div>
      )}
    </div>
  );
}
