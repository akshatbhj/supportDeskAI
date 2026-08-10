export default function MessageBubble({ sender, content }) {
  const isCustomer = sender === 'customer'
  const isSystem = sender === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs `text-[var(--color-ink-muted)] `italic">{content}</span>
      </div>
    )
  }

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isCustomer
            ? '`bg-[var(--color-teal)]` text-white rounded-br-sm'
            : 'bg-white border `border-[var(--color-line)]` `text-[var(--color-ink)]` rounded-bl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
