import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { BotConfig, Conversation, Message } from "../types";

export function useBotConfig() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bot_config")
      .select("*")
      .limit(1)
      .single();
    if (error) setError(error.message);
    else setConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (updates: Partial<BotConfig>) => {
    if (!config) return;
    const { data, error } = await supabase
      .from("bot_config")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", config.id)
      .select("*")
      .single();
    if (error) throw error;
    setConfig(data);
    return data;
  };

  return { config, loading, error, refetch: fetchConfig, updateConfig };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("last_message_at", { ascending: false });
    if (!error && data) setConversations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setMessages(data);
        setLoading(false);
      });
  }, [conversationId]);

  return { messages, loading };
}

export function useStats() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    userMessages: 0,
    assistantMessages: 0,
  });

  useEffect(() => {
    (async () => {
      const [{ count: convCount }, { count: msgCount }, { count: userCount }, { count: assistantCount }] =
        await Promise.all([
          supabase.from("conversations").select("*", { count: "exact", head: true }),
          supabase.from("messages").select("*", { count: "exact", head: true }),
          supabase.from("messages").select("*", { count: "exact", head: true }).eq("role", "user"),
          supabase.from("messages").select("*", { count: "exact", head: true }).eq("role", "assistant"),
        ]);
      setStats({
        totalConversations: convCount || 0,
        totalMessages: msgCount || 0,
        userMessages: userCount || 0,
        assistantMessages: assistantCount || 0,
      });
    })();
  }, []);

  return stats;
}
