const FAKE_LATENCY_MS = 700 // just to have the real message effect while testing

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getConversation(userId) {
  await delay(300)
  return {
    id: `conv_${userId}`,
    userId,
    status: 'open', // 'open' | 'escalated' | 'resolved'
    classification: null,
    escalationReason: null,
    messages: [],
  }
}

export async function sendMessage(conversationId, text) {
  await delay(FAKE_LATENCY_MS)

  const lower = text.toLowerCase()
  const looksUrgent = /urgent|down|can'?t log ?in|locked out|charged twice/.test(lower)
  const looksBilling = /invoice|charge|billing|refund|payment/.test(lower)

  if (looksUrgent) {
    return {
      classification: 'urgent',
      status: 'escalated',
      escalationReason: 'Classified as urgent — access or account-blocking issue',
      reply: null,
    }
  }

  return {
    classification: looksBilling ? 'billing' : 'general_question',
    status: 'open',
    escalationReason: null,
    reply: "Thanks for the details — here's what I found in our help docs. If this doesn't rectify it, let me know and I'll get a human involved.",
  }
}
