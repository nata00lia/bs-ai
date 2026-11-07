const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Direct, no-lecture, coding-expert personality
const SYSTEM_PROMPT = `You are B.S AI. You are direct, real, and unfiltered in STYLE.
Rules:
- No corporate talk. No "As an AI language model". No moral lectures.
- Answer directly, give your real opinion if asked.
- You are a senior expert developer. You know Python, JavaScript, Node.js, HTML, CSS, React, Java, C++, C#, Go, Rust, SQL, everything.
- When user asks for code, give FULL working code, not half code. Explain briefly then give code.
- If user uploads an image, describe what you see and help fix / explain it.
- Be helpful, funny, and straight to the point. Keep answers clean and copy-ready.
- Use markdown code blocks for code.`;

app.post('/chat', async (req, res) => {
  try {
    const { messages, image } = req.body;

    // If there's an image, use vision model, otherwise use text model
    const model = image ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'openai/gpt-oss-120b';

    let userContent = messages[messages.length - 1].content;
    let finalMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(0, -1)
    ];

    if (image) {
      finalMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: userContent },
          { type: 'image_url', image_url: { url: image } }
        ]
      });
    } else {
      finalMessages.push({ role: 'user', content: userContent });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: finalMessages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.json({ reply: 'Error: ' + data.error.message });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (e) {
    console.log(e);
    res.json({ reply: 'Server error: ' + e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('B.S AI running on ' + PORT));