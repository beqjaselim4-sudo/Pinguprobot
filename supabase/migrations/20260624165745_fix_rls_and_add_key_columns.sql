-- Drop existing authenticated-only policies and replace with anon+authenticated
-- so the dashboard works without a login flow.

-- bot_config
DROP POLICY IF EXISTS "select_bot_config" ON bot_config;
DROP POLICY IF EXISTS "insert_bot_config" ON bot_config;
DROP POLICY IF EXISTS "update_bot_config" ON bot_config;
DROP POLICY IF EXISTS "delete_bot_config" ON bot_config;

CREATE POLICY "select_bot_config" ON bot_config FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_bot_config" ON bot_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_bot_config" ON bot_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_bot_config" ON bot_config FOR DELETE
  TO anon, authenticated USING (true);

-- conversations
DROP POLICY IF EXISTS "select_conversations" ON conversations;
DROP POLICY IF EXISTS "insert_conversations" ON conversations;
DROP POLICY IF EXISTS "update_conversations" ON conversations;
DROP POLICY IF EXISTS "delete_conversations" ON conversations;

CREATE POLICY "select_conversations" ON conversations FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_conversations" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_conversations" ON conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_conversations" ON conversations FOR DELETE
  TO anon, authenticated USING (true);

-- messages
DROP POLICY IF EXISTS "select_messages" ON messages;
DROP POLICY IF EXISTS "insert_messages" ON messages;
DROP POLICY IF EXISTS "update_messages" ON messages;
DROP POLICY IF EXISTS "delete_messages" ON messages;

CREATE POLICY "select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

-- Add columns for Discord token and Groq API key to bot_config
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS discord_token text;
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS groq_api_key text;
