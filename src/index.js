import express from 'express';
import dotenv from 'dotenv';
import { getAuthUrl, handleCallback, getClient } from './auth.js';

dotenv.config();
const app = express();
app.use(express.json());

// Step 1: Redirect user to Google login
app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// Step 2: Google redirects back here with a code
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  await handleCallback(code);
  res.send('✅ Connected! You can close this tab.');
});

// Test route
app.get('/', async (req, res) => {
  const client = await getClient();
  if (client) {
    res.json({ status: 'authenticated' });
  } else {
    res.json({ status: 'not connected', loginUrl: '/auth' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`MeetingBot running on http://localhost:${process.env.PORT}`);
});

app.get('/debug-auth-url', (req, res) => {
  const url = getAuthUrl();
  res.send(url);
});

import { getRecentEmails } from './gmail.js';

app.get('/emails', async (req, res) => {
  const emails = await getRecentEmails();
  res.json(emails);
});

import { analyzeEmail } from './ai.js';

app.get('/analyze', async (req, res) => {
  const emails = await getRecentEmails();
  
  const results = await Promise.all(
    emails.map(async (email) => {
      const analysis = await analyzeEmail(email);
      return {
        email,
        analysis,
      };
    })
  );

  res.json(results);
});
