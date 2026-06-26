# Discord + Groq Bot

A Discord bot powered by Groq AI, with conversation persistence via Supabase.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export DISCORD_BOT_TOKEN="your_discord_bot_token"
   export SUPABASE_URL="your_supabase_url"
   export SUPABASE_ANON_KEY="your_supabase_anon_key"
   export GROQ_API_KEY="your_groq_api_key"
   ```

3. Start the bot:
   ```bash
   npm start
   ```

## Usage

- **Mention the bot** in any channel it has access to: `@BotName hello!`
- **DM the bot** directly for private conversations
- The bot remembers conversation history per channel (last 20 messages as context)

## Deploy

Deploy to any Node.js host (Railway, Fly.io, Render, a VPS, etc.):

1. Set the three environment variables on your host
2. Run `npm install && npm start`

Make sure the bot has the following Discord permissions:
- Read Messages
- Send Messages
- Message Content Intent (enable in Developer Portal)
- Server Members Intent (optional)
