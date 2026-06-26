import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { messages: incomingMessages, channelId, channelName, guildId, guildName, authorName, authorId, groqApiKey } = await req.json();

    if (!incomingMessages || !Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config, error: configError } = await supabase
      .from("bot_config")
      .select("*")
      .limit(1)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "Bot not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!config.is_active) {
      return new Response(JSON.stringify({ error: "Bot is currently inactive" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_KEY = groqApiKey || config.groq_api_key || Deno.env.get("GROQ_API_KEY");
    if (!GROQ_KEY) {
      return new Response(JSON.stringify({ error: "Groq API key not configured. Add it in the dashboard under API Keys." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let conversationId: string;
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("channel_id", channelId)
      .single();

    if (existingConv) {
      conversationId = existingConv.id;
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString(), channel_name: channelName, guild_name: guildName })
        .eq("id", conversationId);
    } else {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          channel_id: channelId,
          channel_name: channelName,
          guild_id: guildId,
          guild_name: guildName,
        })
        .select("id")
        .single();
      if (convError || !newConv) {
        return new Response(JSON.stringify({ error: "Failed to create conversation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      conversationId = newConv.id;
    }

    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    const historyMessages = history ? history.reverse() : [];

    const lastMessage = incomingMessages[incomingMessages.length - 1];
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: lastMessage.content,
      author_name: authorName,
      author_id: authorId,
    });

    const groqMessages = [
      { role: "system", content: config.system_prompt },
      ...historyMessages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      { role: "user", content: lastMessage.content },
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: groqMessages,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return new Response(JSON.stringify({ error: `Groq API error: ${groqResponse.status}`, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqResponse.json();
    const assistantContent = groqData.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: assistantContent,
    });

    return new Response(JSON.stringify({ response: assistantContent, conversationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
