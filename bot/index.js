import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} from "discord.js";

// ── Configurazione ────────────────────────────────────────────────────────────
// Tutte le chiavi vengono lette direttamente dalle variabili d'ambiente di Render.
// NON sono più necessarie SUPABASE_URL o SUPABASE_ANON_KEY.
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GROQ_API_KEY  = process.env.GROQ_API_KEY;

// Modello e prompt di sistema configurabili tramite env var (opzionali)
const GROQ_MODEL    = process.env.GROQ_MODEL    || "llama3-8b-8192";
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "You are a helpful and friendly Discord bot assistant.";

if (!DISCORD_TOKEN) {
  console.error("[ERROR] La variabile d'ambiente DISCORD_TOKEN non è impostata.");
  process.exit(1);
}
if (!GROQ_API_KEY) {
  console.error("[ERROR] La variabile d'ambiente GROQ_API_KEY non è impostata.");
  process.exit(1);
}

// ── Client Discord ────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Memoria conversazione per canale (ultimi 20 messaggi per canale)
const conversationHistory = new Map();
const MAX_HISTORY = 20;

// ── Funzione: chiama Groq direttamente ────────────────────────────────────────
async function askGroq(messages) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";
}

// ── Funzione: invia risposta rispettando il limite di 2000 caratteri ──────────
async function sendReply(message, text) {
  if (text.length <= 2000) {
    await message.reply(text);
  } else {
    const chunks = text.match(/[\s\S]{1,2000}/g) || [];
    for (const chunk of chunks) {
      await message.channel.send(chunk);
    }
  }
}

// ── Evento: bot pronto ────────────────────────────────────────────────────────
client.once(Events.ClientReady, (readyClient) => {
  console.log(`[OK] Bot online: ${readyClient.user.tag}`);
  console.log(`[OK] Connesso a ${readyClient.guilds.cache.size} server`);
  readyClient.user.setActivity("chatting with AI", { type: 3 });
});

// ── Evento: messaggio ricevuto ────────────────────────────────────────────────
const typingIntervals = new Map();

client.on(Events.MessageCreate, async (message) => {
  // Ignora messaggi del bot stesso
  if (message.author.bot) return;
  if (message.author.id === client.user.id) return;

  // Risponde solo se menzionato o in DM
  const isMentioned = message.mentions.has(client.user, { ignoreRoles: true, ignoreEveryone: true });
  const isDM = !message.guild;
  if (!isMentioned && !isDM) return;

  // Pulisce la menzione dal testo
  let content = message.content.replace(/<@!?\d+>/g, "").trim();
  if (!content) content = "Hello!";

  const channelId = message.channel.id;

  try {
    // Avvia l'indicatore di digitazione
    await message.channel.sendTyping();
    const typingInterval = setInterval(() => {
      message.channel.sendTyping().catch(() => {});
    }, 8000);
    typingIntervals.set(message.id, typingInterval);

    // Recupera la cronologia della conversazione per questo canale
    if (!conversationHistory.has(channelId)) {
      conversationHistory.set(channelId, []);
    }
    const history = conversationHistory.get(channelId);

    // Aggiunge il messaggio dell'utente alla cronologia
    history.push({ role: "user", content });

    // Mantiene solo gli ultimi MAX_HISTORY messaggi
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    // Chiama Groq direttamente
    const reply = await askGroq(history);

    // Aggiunge la risposta del bot alla cronologia
    history.push({ role: "assistant", content: reply });

    // Ferma l'indicatore di digitazione
    clearInterval(typingInterval);
    typingIntervals.delete(message.id);

    // Invia la risposta
    await sendReply(message, reply);

  } catch (err) {
    console.error("[ERROR] Errore nella gestione del messaggio:", err);

    const interval = typingIntervals.get(message.id);
    if (interval) {
      clearInterval(interval);
      typingIntervals.delete(message.id);
    }

    await message.reply("Sorry, something went wrong. Please try again later.");
  }
});

// ── Evento: errore client ─────────────────────────────────────────────────────
client.on(Events.Error, (error) => {
  console.error("[ERROR] Client Discord error:", error);
});

// ── Login ─────────────────────────────────────────────────────────────────────
client.login(DISCORD_TOKEN);
