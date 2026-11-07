require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    const data = await response.json();
    if (data.error) return res.json({ error: data.error.message });
    res.json({ reply: data.choices[0].message.content });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Image generation - FIXED: Turbo model, no safe filter, strong cleaning
app.post('/generate-image', async (req, res) => {
  try {
    let prompt = req.body.prompt || '';
    // Remove ALL the request words, keep only the subject
    prompt = prompt
      .toLowerCase()
      .replace(/can you/g, '')
      .replace(/please/g, '')
      .replace(/generate an image of/g, '')
      .replace(/generate an image/g, '')
      .replace(/generate image of/g, '')
      .replace(/generate image/g, '')
      .replace(/generate a/g, '')
      .replace(/generate/g, '')
      .replace(/create an image of/g, '')
      .replace(/create image of/g, '')
      .replace(/create a/g, '')
      .replace(/create/g, '')
      .replace(/draw a/g, '')
      .replace(/draw/g, '')
      .replace(/make a picture of/g, '')
      .replace(/make an image of/g, '')
      .replace(/make a diagram of/g, '')
      .replace(/make a/g, '')
      .replace(/make an/g, '')
      .replace(/an image of/g, '')
      .replace(/a picture of/g, '')
      .trim();

    if (!prompt) prompt = 'beautiful landscape';

    // For diagrams, add a description that Turbo likes
    if (prompt.includes('tree diagram')) {
      prompt = 'educational tree diagram chart with branches, root, trunk, leaves, clear labels, white background, simple illustration';
    }

    const cleanPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${Date.now()}&model=turbo&nologo=true`;
    res.json({ imageUrl });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('B.S AI running on ' + PORT));