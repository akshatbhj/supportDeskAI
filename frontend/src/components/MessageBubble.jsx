export default function MessageBubble({ sender, content }) {
  const isCustomer = sender === 'customer'
  const isSystem = sender === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-[#6b6f6a] italic">{content}</span>
      </div>
    )
  }

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isCustomer
            ? 'bg-amber-700 text-white rounded-br-sm'
            : 'bg-white border border-[#e4e2da] text-[#1f2421] rounded-bl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
