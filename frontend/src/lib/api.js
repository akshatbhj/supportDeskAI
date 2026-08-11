import { supabase } from './supabaseClient'

export async function getConversation(userId) {
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
  const { data, error } = await supabase.functions.invoke('handle-message', {
    body: { conversationId, text },
  })

  if (error) {
    throw error
  }

  return data
}