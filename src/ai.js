import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeEmail(email) {
  const prompt = `You are an assistant helping a busy professional manage their inbox.
  
Analyze the following email and determine if it is requesting a meeting or appointment.

Email subject: ${email.subject}
Email from: ${email.from}
Email content: ${email.snippet}

Respond ONLY with a JSON object in this exact format, no other text:
{
  "isMeetingRequest": true or false,
  "senderName": "extracted name or null",
  "suggestedDay": "any day or time hint mentioned, or null",
  "urgency": "low, normal or high",
  "reason": "one sentence explaining your decision"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      { role: 'user', content: prompt }
    ],
  });

  const text = response.content[0].text;
  
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse Claude response:', text);
    return null;
  }
}