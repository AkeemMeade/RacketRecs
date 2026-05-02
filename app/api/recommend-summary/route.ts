import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: messages,
  });

  const textContent = msg.content.find(block => block.type === 'text');
  const reply = textContent && 'text' in textContent ? textContent.text : '';

  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" }
  });
}