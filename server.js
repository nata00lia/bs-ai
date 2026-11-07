require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Normal chat - text
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

// Image generation - fixed for Image Refused error
app.post('/generate-image', async (req, res) => {
  try {
    let { prompt } = req.body;
    if (!prompt) prompt = 'beautiful illustration';

    // Clean the prompt - remove trigger words Pollinations blocks
    prompt = prompt
      .replace(/generate|create|draw|make a picture|make an image|make a diagram|please/gi, '')
      .replace(/a tree diagram/gi, 'a beautiful tree diagram illustration, educational, clean, labeled')
      .trim();

    if (!prompt) prompt = 'beautiful illustration';

    const cleanPrompt = encodeURIComponent('High quality illustration of ' + prompt + ', clean, detailed, vibrant');
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${Date.now()}&model=flux&nologo=true&safe=true`;
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