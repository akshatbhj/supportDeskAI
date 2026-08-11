import { supabase } from './supabaseClient'

export async function getConversation(userId) {
  // Look for an existing open conversation for this user.
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError) throw findError

  let conversation = existing
  if (!conversation) {
    const { data: created, error: insertError } = await supabase
      .from('conversations')
      .insert({ user_id: userId })
      .select()
      .single()
    if (insertError) throw insertError
    conversation = created
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
  if (messagesError) throw messagesError

  return {
    id: conversation.id,
    userId: conversation.user_id,
    status: conversation.status,
    classification: conversation.classification,
    escalationReason: conversation.escalation_reason,
    messages: messages.map((m) => ({ id: m.id, sender: m.sender, content: m.content })),
  }
}

export async function sendMessage(conversationId, text) {
  const { error: insertCustomerMsgError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender: 'customer', content: text })
  if (insertCustomerMsgError) throw insertCustomerMsgError

  const lower = text.toLowerCase()
  const looksUrgent = /urgent|down|can'?t log ?in|locked out|charged twice/.test(lower)
  const looksBilling = /invoice|charge|billing|refund|payment/.test(lower)

  const classification = looksUrgent ? 'urgent' : looksBilling ? 'billing' : 'general_question'
  const status = looksUrgent ? 'escalated' : 'open'
  const escalationReason = looksUrgent
    ? 'Classified as urgent — access or account-blocking issue'
    : null
  const reply = looksUrgent
    ? null
    : "Thanks for the details — here's what I found in our help docs. If this doesn't resolve it, let me know and I'll get a human involved."

  const { error: updateConvError } = await supabase
    .from('conversations')
    .update({
      classification,
      status,
      escalation_reason: escalationReason,
      escalated_at: status === 'escalated' ? new Date().toISOString() : null,
    })
    .eq('id', conversationId)
  if (updateConvError) throw updateConvError

  if (status === 'escalated') {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender: 'system',
      content: 'This conversation was escalated to a human agent.',
    })
  } else {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender: 'ai',
      content: reply,
    })
  }

  return { classification, status, escalationReason, reply }
}