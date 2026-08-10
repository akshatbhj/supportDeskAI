import "./App.css";
import { useState, useEffect } from "react";
import { DEMO_USERS } from "./data/demoUsers";
import { getConversation, sendMessage } from "./lib/api";
import UserSelect from "./components/UserSelect";
import MessageInput from "./components/MessageInput";
import ConversationThread from "./components/ConversationThread";

function makeMessage(sender, content) {
  return { id: crypto.randomUUID(), sender, content };
}

function App() {
  const [selectedUserId, setSelectedUserId] = useState(DEMO_USERS[0].id);
  const [conversation, setConversation] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getConversation(selectedUserId).then((conv) => {
      if (!cancelled) setConversation(conv);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  async function handleSend(text) {
    setConversation((c) => ({
      ...c,
      messages: [...c.messages, makeMessage("customer", text)],
    }));
    setIsSending(true);

    try {
      const result = await sendMessage(conversation.id, text);

      setConversation((c) => {
        const newMessages = [...c.messages];
        if (result.status === "escalated") {
          newMessages.push(
            makeMessage(
              "system",
              "This conversation was escalated to a human agent.",
            ),
          );
        } else if (result.reply) {
          newMessages.push(makeMessage("ai", result.reply));
        }
        return {
          ...c,
          status: result.status,
          classification: result.classification,
          escalationReason: result.escalationReason,
          messages: newMessages,
        };
      });
    } catch (error) {
      setConversation((c) => ({
        ...c,
        status: "escalated",
        escalationReason: "AI response failed — escalated automatically",
        messages: [
          ...c.messages,
          makeMessage(
            "system",
            "Something went wrong on our end. We've flagged this for a human to follow up.",
          ),
        ],
      }));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center p-4">
        <div className="w-full max-w-3xl h-[85vh] `bg-white` rounded-xl border `border-[var(--color-line)]` shadow-sm overflow-hidden flex flex-col">
          <UserSelect
            selectedUserId={selectedUserId}
            onChange={setSelectedUserId}
          />
          {conversation ? (
            <>
              <div className="flex-1 min-h-0">
                <ConversationThread
                  conversation={conversation}
                  isSending={isSending}
                />
              </div>
              <MessageInput onSend={handleSend} disabled={isSending} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm `text-[#6b6f6a]`">
              Loading conversation…
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
