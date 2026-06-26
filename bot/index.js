import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} from "discord.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/chat`;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
  process.exit(1);
}

async function fetchConfig() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bot_config?limit=1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}

const config = await fetchConfig();

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || config?.discord_token;
const GROQ_API_KEY = process.env.GROQ_API_KEY || config?.groq_api_key;

if (!DISCORD_TOKEN) {
  console.error("No Discord token found. Set DISCORD_BOT_TOKEN env var or add it in the dashboard under API Keys.");
  process.exit(1);
}
if (!GROQ_API_KEY) {
  console.error("No Groq API key found. Set GROQ_API_KEY env var or add it in the dashboard under API Keys.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const typingDelays = new Map();

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot online: ${readyClient.user.tag}`);
  console.log(`Connected to ${readyClient.guilds.cache.size} guild(s)`);
  readyClient.user.setActivity("chatting with AI", { type: 3 });
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.author.id === client.user.id) return;

  const isMentioned = message.mentions.has(client.user, { ignoreRoles: true, ignoreEveryone: true });
  const isDM = !message.guild;
  if (!isMentioned && !isDM) return;

  let content = message.content.replace(/<@!?\d+>/g, "").trim();
  if (!content) {
    content = "Hello!";
  }

  const channelId = message.channel.id;
  const channelName = message.guild ? message.channel.name : "dm";
  const guildId = message.guild?.id || null;
  const guildName = message.guild?.name || null;
  const authorName = message.author.username;
  const authorId = message.author.id;

  try {
    await message.channel.sendTyping();

    const typingInterval = setInterval(() => {
      message.channel.sendTyping().catch(() => {});
    }, 8000);
    typingDelays.set(message.id, typingInterval);

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content }],
        channelId,
        channelName,
        guildId,
        guildName,
        authorName,
        authorId,
        groqApiKey: GROQ_API_KEY,
      }),
    });

    clearInterval(typingInterval);
    typingDelays.delete(message.id);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Edge function error:", response.status, errText);
      await message.reply("Sorry, I encountered an error processing your request.");
      return;
    }

    const data = await response.json();
    const reply = data.response || "Sorry, I could not generate a response.";

    if (reply.length <= 2000) {
      await message.reply(reply);
    } else {
      const chunks = reply.match(/[\s\S]{1,2000}/g) || [];
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }
    }
  } catch (err) {
    console.error("Error processing message:", err);
    const interval = typingDelays.get(message.id);
    if (interval) {
      clearInterval(interval);
      typingDelays.delete(message.id);
    }
    await message.reply("Sorry, something went wrong. Please try again.");
  }
});

client.on(Events.Error, (error) => {
  console.error("Client error:", error);
});

client.login(DISCORD_TOKEN);
