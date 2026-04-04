import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt } from "@/lib/anthropic/systemprompt";
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request:Request) {
  const { messages } = await request.json();

  const msg = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: systemPrompt,
  messages: messages,
})

console.log((msg.id));

  const textContent = msg.content.find(block => block.type === 'text');
  const reply = textContent && 'text' in textContent ? textContent.text : '';

  return new Response(JSON.stringify({ reply }), {
  headers: { "Content-Type": "application/json" }
});
}
