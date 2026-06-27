# Discord Groq Bot

Bot Discord alimentato da Groq AI. Non richiede Supabase: legge tutte le chiavi direttamente dalle variabili d'ambiente.

## Variabili d'ambiente richieste

Configura queste variabili nel pannello **Environment** del tuo servizio Render:

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `DISCORD_TOKEN` | ✅ Sì | Token del bot Discord (Developer Portal → Bot → Token) |
| `GROQ_API_KEY` | ✅ Sì | API key di Groq (console.groq.com → API Keys) |
| `GROQ_MODEL` | No | Modello Groq da usare (default: `llama3-8b-8192`) |
| `SYSTEM_PROMPT` | No | Prompt di sistema per il bot (default: assistente generico) |

## Setup locale

```bash
cd bot
npm install
DISCORD_TOKEN="il-tuo-token" GROQ_API_KEY="la-tua-key" npm start
```

## Deploy su Render

1. Crea un nuovo servizio **Background Worker** su Render
2. Collega il repository GitHub
3. Imposta la **Root Directory** su `bot`
4. Imposta il **Build Command**: `npm install`
5. Imposta lo **Start Command**: `npm start`
6. Aggiungi le variabili d'ambiente `DISCORD_TOKEN` e `GROQ_API_KEY`
7. Clicca **Deploy**

## Permessi Discord richiesti

Assicurati che il bot abbia nel Developer Portal:
- **Message Content Intent** abilitato
- Permessi: Read Messages, Send Messages

## Funzionamento

- Il bot risponde quando viene **menzionato** in un canale o riceve un **messaggio diretto**
- Mantiene una **cronologia della conversazione** per canale (ultimi 20 messaggi)
- Chiama **direttamente** l'API di Groq senza intermediari
- **Nessuna dipendenza da Supabase**
