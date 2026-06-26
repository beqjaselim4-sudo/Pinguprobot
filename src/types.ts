export interface BotConfig {
  id: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  updated_at: string;
  discord_token: string | null;
  groq_api_key: string | null;
}

export interface Conversation {
  id: string;
  channel_id: string;
  channel_name: string | null;
  guild_id: string | null;
  guild_name: string | null;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  author_name: string | null;
  author_id: string | null;
  created_at: string;
}

export const GROQ_MODELS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  { value: "llama3-70b-8192", label: "Llama 3 70B 8192" },
  { value: "llama3-8b-8192", label: "Llama 3 8B 8192" },
  { value: "gemma2-9b-it", label: "Gemma 2 9B" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B 32K" },
];
