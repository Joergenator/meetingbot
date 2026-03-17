import { google } from 'googleapis';
import { getClient } from './auth.js';

export async function getRecentEmails() {
  const auth = await getClient();
  const gmail = google.gmail({ version: 'v1', auth });

  // Fetch the 10 most recent emails
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 10,
    q: 'is:inbox',
  });

  if (!data.messages || data.messages.length === 0) {
    console.log('No emails found.');
    return [];
  }

  // Fetch full details for each email
  const emails = await Promise.all(
    data.messages.map(async (msg) => {
      const { data: full } = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = full.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
      const from = headers.find(h => h.name === 'From')?.value || '(unknown)';
      const snippet = full.snippet;

      return { id: msg.id, subject, from, snippet };
    })
  );

  return emails;
}