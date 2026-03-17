import { google } from 'googleapis';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN_PATH = './tokens/google.json';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
];

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

export async function handleCallback(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await fs.mkdir('./tokens', { recursive: true });
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  console.log('✅ Tokens saved!');
}

export async function getClient() {
  try {
    const raw = await fs.readFile(TOKEN_PATH, 'utf-8');
    const tokens = JSON.parse(raw);
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
  } catch {
    return null;
  }
}