# DaCapo Chat – SLO Curriculumassistent

Een Nederlandse chatassistent die leraren helpt bij het vinden van curriculumdata in de SLO-database.

## Installatie

1. Clone deze repository
2. Installeer dependencies:
```bash
npm install
```

3. Kopieer `.env.example` naar `.env` en vul de API keys in:
```bash
cp .env.example .env
```

4. Verkrijg API keys:
   - **OpenAI API Key**: Registreer op [platform.openai.com](https://platform.openai.com/)
   - **Of gebruik OpenRouter**: Registreer op [openrouter.ai](https://openrouter.ai/) voor toegang tot meerdere LLM's
   - **SLO API Key**: Registreer op [opendata.slo.nl](https://opendata.slo.nl/curriculum/api/)

5. Start de server:
```bash
npm start
```

6. Open de browser op `http://localhost:3000`

## Gebruik

1. Start een gesprek met de chatbot
2. De assistent stelt verduidelijkende vragen over:
   - Vak (bijv. Nederlands, Wiskunde, Engels)
   - Niveau (bijv. Primair Onderwijs, Voortgezet Onderwijs)
   - Type informatie (Kerndoelen, Domeinen, Subdomeinen)
3. De assistent haalt relevante curriculumdata op
4. Exporteer resultaten naar Excel indien gewenst

## Project Structuur

```
SLO_chat/
├── server.js          # Express backend server
├── public/            # Frontend bestanden
│   ├── index.html     # Hoofd HTML pagina
│   ├── style.css      # Styling
│   └── app.js         # Frontend logica
├── .env               # API keys (niet in git)
├── .env.example       # Template voor omgevingsvariabelen
└── package.json       # Dependencies
```

## Technologieën

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **LLM**: OpenAI SDK (compatible with OpenAI, OpenRouter, etc.)
- **Data**: SLO Open Data API
