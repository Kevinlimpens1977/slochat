require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// System prompt for the Dutch SLO assistant
const SYSTEM_PROMPT = `Je bent DaCapo Chat, een vriendelijke en behulpzame assistent die leraren helpt bij het vinden van SLO-curriculumdata (Stichting Leerplan Ontwikkeling).

**Jouw taak:**
1. Stel verduidelijkende vragen om te achterhalen:
   - Welk vak (Nederlands, Wiskunde, Engels, Natuuronderwijs, etc.)
   - Welk onderwijsniveau (Primair Onderwijs, Voortgezet Onderwijs, etc.)
   - Welk type informatie (Kerndoelen, Domeinen, Subdomeinen, Examenprogramma's)

2. Pas als je ALLE benodigde informatie hebt, vraag je de gebruiker om bevestiging.

3. Zodra bevestigd, zeg je dat je de data ophaalt en presenteer je de resultaten op een gestructureerde, heldere manier in het Nederlands.

4. Na het presenteren van de data, bied je de mogelijkheid aan om de resultaten te exporteren naar Excel.

5. Wees altijd vriendelijk, geduldig en educatief. Leg de curriculumdata uit in de context van het Nederlandse onderwijs.

**Belangrijk:**
- Stel één vraag per keer om de leraar niet te overweldigen
- Bevestig het begrip voordat je data ophaalt
- Presenteer resultaten met kopjes en organisatie
- Markeer belangrijke informatie (bijv. kerndoel nummers, domeinnamen)`;

// API Route: /api/llm - OpenAI SDK integration
app.post('/api/llm', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    });

    // Add system prompt to messages
    const messagesWithSystem = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Stream the response using OpenAI SDK
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messagesWithSystem,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          // Format response to match expected SSE format
          const sseData = {
            choices: [{
              delta: { content },
              index: 0
            }]
          };
          res.write(`data: ${JSON.stringify(sseData)}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();

    } catch (streamError) {
      console.error('OpenAI stream error:', streamError);
      if (!res.headersSent) {
        res.status(500).json({ error: 'OpenAI API error', details: streamError.message });
      } else {
        res.end();
      }
    }

  } catch (error) {
    console.error('LLM API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// API Route: /api/slo - SLO Open Data API integration
app.get('/api/slo', async (req, res) => {
  try {
    const { subject, level, domain, subdomain, type } = req.query;

    if (!process.env.SLO_API_KEY) {
      return res.status(500).json({ error: 'SLO API key not configured' });
    }

    // Build SLO API URL based on parameters
    let apiUrl = 'https://opendata.slo.nl/curriculum/api/v1/';

    // Construct endpoint based on type
    if (type === 'kerndoelen' || !type) {
      apiUrl += 'kerndoel/';
    } else if (type === 'domeinen') {
      apiUrl += 'kerndoeldomein/';
    } else if (type === 'subdomeinen') {
      apiUrl += 'examenprogrammasubdomein/';
    }

    // Add query parameters if available
    const params = new URLSearchParams();
    if (subject) params.append('vak', subject);
    if (level) params.append('niveau', level);
    if (domain) params.append('domein', domain);
    if (subdomain) params.append('subdomein', subdomain);

    const fullUrl = params.toString() ? `${apiUrl}?${params.toString()}` : apiUrl;

    console.log('Fetching from SLO API:', fullUrl);

    const fetch = require('node-fetch');
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.SLO_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SLO API error:', errorText);
      return res.status(response.status).json({
        error: 'SLO API error',
        details: errorText,
        url: fullUrl
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('SLO API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DaCapo SLO Chat server running on http://localhost:${PORT}`);
  console.log(`🤖 Using OpenAI SDK for chat`);
  console.log(`📚 Ready to help teachers find SLO curriculum data!`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set in .env file');
  }
  if (!process.env.SLO_API_KEY) {
    console.warn('⚠️  WARNING: SLO_API_KEY not set in .env file');
  }
});
