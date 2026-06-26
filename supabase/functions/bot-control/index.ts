import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function supabaseFetch(path: string, options: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function getConfig() {
  const res = await supabaseFetch("/rest/v1/bot_config?limit=1");
  const rows = await res.json();
  return rows[0] || null;
}

async function updateStatus(status: string, extra: Record<string, unknown> = {}) {
  const existing = await supabaseFetch("/rest/v1/bot_status?limit=1");
  const rows = await existing.json();
  const row = rows[0];

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  };
  if (status === "online") updates.last_started_at = new Date().toISOString();
  if (status === "offline") updates.last_stopped_at = new Date().toISOString();

  if (row) {
    await supabaseFetch(`/rest/v1/bot_status?id=eq.${row.id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  } else {
    await supabaseFetch("/rest/v1/bot_status", {
      method: "POST",
      body: JSON.stringify(updates),
    });
  }
}

const BOT_SCRIPT = `
import { Client, GatewayIntentBits, Partials, Events } from "npm:discord.js@14.16.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const DISCORD_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const EDGE_FUNCTION_URL = SUPABASE_URL + "/functions/v1/chat";

async function heartbeat() {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/bot_status?limit=1", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
    });
    const rows = await res.json();
    if (rows[0]) {
      await fetch(SUPABASE_URL + "/rest/v1/bot_status?id=eq." + rows[0].id, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "online", updated_at: new Date().toISOString() }),
      });
    }
  } catch (e) { }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (c) => {
  console.log("Bot online: " + c.user.tag);
  await heartbeat();
  setInterval(heartbeat, 30000);
  c.user.setActivity("chatting with AI", { type: 3 });
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.author.id === client.user.id) return;
  const isMentioned = message.mentions.has(client.user, { ignoreRoles: true, ignoreEveryone: true });
  const isDM = !message.guild;
  if (!isMentioned && !isDM) return;

  let content = message.content.replace(/<@!?\\d+>/g, "").trim();
  if (!content) content = "Hello!";

  try {
    await message.channel.sendTyping();
    const typingInterval = setInterval(() => message.channel.sendTyping().catch(() => {}), 8000);

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + SUPABASE_ANON_KEY },
      body: JSON.stringify({
        messages: [{ role: "user", content }],
        channelId: message.channel.id,
        channelName: message.guild ? message.channel.name : "dm",
        guildId: message.guild?.id || null,
        guildName: message.guild?.name || null,
        authorName: message.author.username,
        authorId: message.author.id,
        groqApiKey: GROQ_API_KEY,
      }),
    });

    clearInterval(typingInterval);

    if (!response.ok) {
      await message.reply("Sorry, I encountered an error.");
      return;
    }
    const data = await response.json();
    const reply = data.response || "Sorry, I could not generate a response.";
    if (reply.length <= 2000) {
      await message.reply(reply);
    } else {
      const chunks = reply.match(/[\\s\\S]{1,2000}/g) || [];
      for (const chunk of chunks) await message.channel.send(chunk);
    }
  } catch (err) {
    console.error("Error:", err);
    try { await message.reply("Something went wrong. Please try again."); } catch (_) {}
  }
});

client.login(DISCORD_TOKEN).catch(async (err) => {
  console.error("Login failed:", err);
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/bot_status?limit=1", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
    });
    const rows = await res.json();
    if (rows[0]) {
      await fetch(SUPABASE_URL + "/rest/v1/bot_status?id=eq." + rows[0].id, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "error", error_message: "Login failed: " + String(err.message || err), updated_at: new Date().toISOString() }),
      });
    }
  } catch (_) {}
  Deno.exit(1);
});
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const statusRes = await supabaseFetch("/rest/v1/bot_status?limit=1");
      const statusRows = await statusRes.json();
      const configRes = await supabaseFetch(
        "/rest/v1/bot_config?select=is_active,discord_token,groq_api_key&limit=1"
      );
      const configRows = await configRes.json();
      const config = configRows[0] || {};
      const status = statusRows[0] || { status: "offline" };

      return new Response(
        JSON.stringify({
          status: status.status,
          last_started_at: status.last_started_at,
          has_discord_token: !!config.discord_token,
          has_groq_key: !!config.groq_api_key,
          is_active: config.is_active,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const act = body.action || url.searchParams.get("action");

    if (act === "start") {
      const config = await getConfig();

      if (!config) {
        return new Response(
          JSON.stringify({ error: "Bot config not found. Save your configuration first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!config.discord_token) {
        return new Response(
          JSON.stringify({ error: "Discord bot token not set. Add it in the Configuration tab." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!config.groq_api_key) {
        return new Response(
          JSON.stringify({ error: "Groq API key not set. Add it in the Configuration tab." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await updateStatus("starting");

      const scriptPath = "/tmp/bot_runner.ts";
      await Deno.writeTextFile(scriptPath, BOT_SCRIPT);

      const command = new Deno.Command("deno", {
        args: [
          "run",
          "--allow-net",
          "--allow-env",
          "--allow-read",
          "--allow-write",
          "--allow-run",
          scriptPath,
        ],
        env: {
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
          DISCORD_BOT_TOKEN: config.discord_token,
          GROQ_API_KEY: config.groq_api_key,
        },
        stdout: "piped",
        stderr: "piped",
      });

      const child = command.spawn();

      (async () => {
        const decoder = new TextDecoder();
        const reader = child.stdout.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          console.log("[bot]", decoder.decode(value).trim());
        }
      })();

      (async () => {
        const decoder = new TextDecoder();
        const reader = child.stderr.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          console.error("[bot-error]", decoder.decode(value).trim());
        }
      })();

      let connected = false;
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const status = await child.status.catch(() => null);
        if (status) {
          await updateStatus("error", {
            error_message: "Bot process exited. Check your Discord token.",
          });
          return new Response(
            JSON.stringify({ error: "Bot process exited. Check your Discord token is valid." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const statusRes = await supabaseFetch("/rest/v1/bot_status?limit=1");
        const rows = await statusRes.json();
        if (rows[0]?.status === "online") {
          connected = true;
          break;
        }
      }

      if (connected) {
        return new Response(
          JSON.stringify({ success: true, message: "Bot started successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await updateStatus("online");
      return new Response(
        JSON.stringify({ success: true, message: "Bot is connecting to Discord..." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (act === "stop") {
      await updateStatus("offline");
      return new Response(
        JSON.stringify({ success: true, message: "Bot stop requested" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use start or stop." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
