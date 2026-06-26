-- Bot configuration (single row, updatable from dashboard)
CREATE TABLE bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text NOT NULL DEFAULT 'You are a helpful, friendly Discord bot assistant. Keep responses concise and conversational. Respond in the same language the user is writing in.',
  model text NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  temperature real NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens int NOT NULL DEFAULT 1024 CHECK (max_tokens > 0 AND max_tokens <= 8192),
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Conversations (one per Discord channel)
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL UNIQUE,
  channel_name text,
  guild_id text,
  guild_name text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Messages (individual messages within conversations)
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  author_name text,
  author_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Enable RLS
ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- bot_config: only authenticated users can read/write
CREATE POLICY "select_bot_config" ON bot_config FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_bot_config" ON bot_config FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_bot_config" ON bot_config FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_bot_config" ON bot_config FOR DELETE
  TO authenticated USING (true);

-- conversations: only authenticated users can read/write
CREATE POLICY "select_conversations" ON conversations FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_conversations" ON conversations FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_conversations" ON conversations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_conversations" ON conversations FOR DELETE
  TO authenticated USING (true);

-- messages: only authenticated users can read/write
CREATE POLICY "select_messages" ON messages FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_messages" ON messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_messages" ON messages FOR DELETE
  TO authenticated USING (true);

-- Insert default config row
INSERT INTO bot_config (system_prompt, model, temperature, max_tokens, is_active)
VALUES (
  'You are a helpful, friendly Discord bot assistant. Keep responses concise and conversational. Respond in the same language the user is writing in.',
  'llama-3.3-70b-versatile',
  0.7,
  1024,
  true
);
