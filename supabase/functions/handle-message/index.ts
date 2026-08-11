import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_CLASSIFICATIONS = ['general_question', 'technical_issue', 'billing', 'urgent']

const KNOWLEDGE_BASE = `
- Password reset: Users can reset their password from the login screen via
  "Forgot password". The reset email can take up to 5 minutes to arrive;
  check spam first. If it still hasn't arrived after 15 minutes or two
  attempts, this is likely a delivery/account issue and should go to a
  human, not be treated as a simple FAQ answer.
- Billing cycle: Invoices are generated on the 1st of each month and charged
  to the card on file within 24 hours. Past invoices are available under
  Settings > Billing > History.
- Data export: Users can export their data as CSV from Settings > Data >
  Export. Exports larger than 10,000 rows are emailed as a download link
  instead of downloading directly.
- Integrations: Deskly supports Slack and email notifications, configured
  under Settings > Integrations.
`.trim()

const SYSTEM_PROMPT = `You are a support classification and reply assistant for a SaaS product called Deskly.

Classify the customer's message into EXACTLY one of: general_question, technical_issue, billing, urgent.
- Use "urgent" for anything suggesting the customer is locked out, blocked from working, being incorrectly charged, or otherwise blocked/at risk — these must be escalated to a human, not answered by you.
- For general_question, technical_issue, or billing, answer using ONLY the knowledge base below. If the knowledge base doesn't clearly cover it, set needs_human to true instead of guessing.

Knowledge base:
${KNOWLEDGE_BASE}

Respond with ONLY a JSON object, no other text, in this exact shape:
{"classification": "general_question" | "technical_issue" | "billing" | "urgent", "needs_human": boolean, "reply": string | null, "reason": string | null}

"reply" must be null if needs_human is true. "reason" must be null if needs_human is false, otherwise a short (<15 words) explanation for the handoff.`

function extractJson(raw: string) {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in model output')
  return JSON.parse(match[0])
}

function validateAiOutput(parsed: { classification: string; needs_human: any; reply: any }) {
  if (!ALLOWED_CLASSIFICATIONS.includes(parsed.classification)) {
    throw new Error(`Invalid classification: ${parsed.classification}`)
  }
  if (typeof parsed.needs_human !== 'boolean') {
    throw new Error('Missing/invalid needs_human')
  }
  if (!parsed.needs_human && typeof parsed.reply !== 'string') {
    throw new Error('Missing reply for non-escalated response')
  }
  return parsed
}

async function classifyWithHuggingFace(userMessage: any) {
  const apiKey = Deno.env.get('HF_API_KEY')
  if (!apiKey) throw new Error('HF_API_KEY not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`HF API error ${response.status}: ${body}`)
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content
    if (!raw) throw new Error('Empty response from model')

    return validateAiOutput(extractJson(raw))
  } finally {
    clearTimeout(timeout)
  }
}

async function notifyN8n({ conversationId, message, classification, reason }) {
  const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL not configured — skipping escalation notification')
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message, classification, reason }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`n8n webhook responded ${response.status}`)
    }
  } finally {
    clearTimeout(timeout)
  }
}

Deno.serve(async (req: { method: string; json: () => PromiseLike<{ conversationId: any; text: any }> | { conversationId: any; text: any } }) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { conversationId, text } = await req.json()
    if (!conversationId || !text) {
      return new Response(JSON.stringify({ error: 'conversationId and text are required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { data: currentConv, error: fetchError } = await supabase
      .from('conversations')
      .select('escalation_notified')
      .eq('id', conversationId)
      .single()
    if (fetchError) throw fetchError

    const { error: insertCustomerMsgError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender: 'customer', content: text })
    if (insertCustomerMsgError) throw insertCustomerMsgError

    let aiResult
    try {
      aiResult = await classifyWithHuggingFace(text)
    } catch (err) {
      console.error('AI classification failed:', err.message)
      aiResult = {
        classification: 'urgent',
        needs_human: true,
        reply: null,
        reason: 'AI classification failed — escalated automatically',
      }
    }

    const status = aiResult.needs_human ? 'escalated' : 'open'
    const escalationReason = aiResult.needs_human
      ? aiResult.reason ?? 'AI determined this requires a human'
      : null

    const { error: updateConvError } = await supabase
      .from('conversations')
      .update({
        classification: aiResult.classification,
        status,
        escalation_reason: escalationReason,
        escalated_at: status === 'escalated' ? new Date().toISOString() : null,
      })
      .eq('id', conversationId)
    if (updateConvError) throw updateConvError

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender: status === 'escalated' ? 'system' : 'ai',
      content:
        status === 'escalated'
          ? 'This conversation was escalated to a human agent.'
          : aiResult.reply,
    })

    if (status === 'escalated' && !currentConv.escalation_notified) {
      try {
        await notifyN8n({
          conversationId,
          message: text,
          classification: aiResult.classification,
          reason: escalationReason,
        })
        await supabase
          .from('conversations')
          .update({ escalation_notified: true })
          .eq('id', conversationId)
      } catch (err) {
        console.error('n8n notification failed:', err.message)
      }
    }

    return new Response(
      JSON.stringify({
        classification: aiResult.classification,
        status,
        escalationReason,
        reply: aiResult.reply,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('handle-message error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})