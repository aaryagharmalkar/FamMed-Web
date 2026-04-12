import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages = [] } = await req.json();
    const apiKey = Deno.env.get('CHATBOT_API_KEY');
    const apiUrl = Deno.env.get('CHATBOT_API_URL');

    if (!apiKey || !apiUrl) {
      return new Response(JSON.stringify({ error: 'Missing chatbot secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        messages,
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    const payload = await response.json();
    const reply = payload?.choices?.[0]?.message?.content || payload?.reply || payload?.message || '';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
