import { useState } from "react";

export default function MessageInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t border-[#e4e2da] bg-white"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
        }}
        placeholder="Describe your issue..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-[#f7f6f2] border border-[#e4e2da] rounded-sm
                   px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6e56]
                   focus:border-transparent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 h-11 px-5 rounded-sm bg-amber-700 text-white text-sm font-semibold
             disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity
             flex items-center justify-center gap-2 cursor-pointer"
      >
        Send
        <span className="text-xl mb-0.5" aria-hidden="true">&rarr;</span>
      </button>
    </form>
  );
}
