import { useState } from 'react'

export default function MessageInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t `border-[var(--color-line)]` bg-white">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e)
        }}
        placeholder="Describe your issue..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none `bg-[var(--color-paper)]` border `border-[var(--color-line)]` rounded-lg
                   px-3 py-2.5 text-sm focus:outline-none focus:ring-2 `focus:ring-[var(--color-teal)]`
                   focus:border-transparent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 `h-[42px]` px-4 rounded-lg `bg-[var(--color-teal)]` text-white text-sm font-medium
                   disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity
                   flex items-center gap-1.5"
      >
        Send
        <i className="ti ti-arrow-right text-base" aria-hidden="true"></i>
      </button>
    </form>
  )
}
