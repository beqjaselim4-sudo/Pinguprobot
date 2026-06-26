-- Track bot process status
CREATE TABLE IF NOT EXISTS bot_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'offline',
  last_started_at timestamptz,
  last_stopped_at timestamptz,
  pid text,
  error_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anon access (no auth flow in this app)
ALTER TABLE bot_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_bot_status" ON bot_status FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_bot_status" ON bot_status FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_bot_status" ON bot_status FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_bot_status" ON bot_status FOR DELETE
  TO anon, authenticated USING (true);

-- Insert a default row
INSERT INTO bot_status (status) VALUES ('offline')
ON CONFLICT DO NOTHING;
