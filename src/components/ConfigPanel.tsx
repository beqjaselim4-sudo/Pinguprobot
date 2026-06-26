import { useEffect, useState } from "react";
import type { BotConfig } from "../types";
import { GROQ_MODELS } from "../types";
import { useBotConfig } from "../hooks/useData";
import { Save, Power, AlertCircle, Check, Key, Eye, EyeOff, ExternalLink } from "lucide-react";

export default function ConfigPanel() {
  const { config, loading, updateConfig } = useBotConfig();
  const [form, setForm] = useState<BotConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscordToken, setShowDiscordToken] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateConfig({
        system_prompt: form.system_prompt,
        model: form.model,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
        is_active: form.is_active,
        discord_token: form.discord_token,
        groq_api_key: form.groq_api_key,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  const toggleActive = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      await updateConfig({ is_active: !form.is_active });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle");
    }
    setSaving(false);
  };

  if (loading || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-accent-500" />
        <p className="mt-3 text-sm text-ink-500">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div className="space-y-4 rounded-xl border border-ink-800 bg-ink-900 p-5">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-accent-400" />
          <h3 className="text-sm font-semibold text-ink-100">API Keys</h3>
        </div>
        <p className="text-xs text-ink-400">
          Enter your Discord bot token and Groq API key here. They are stored securely in your database.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-200">Discord Bot Token</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showDiscordToken ? "text" : "password"}
                value={form.discord_token || ""}
                onChange={(e) => setForm({ ...form, discord_token: e.target.value })}
                className="w-full rounded-lg border border-ink-800 bg-ink-950 px-4 py-2.5 pr-10 text-sm text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
                placeholder="MTk4NjIy..."
              />
              <button
                type="button"
                onClick={() => setShowDiscordToken(!showDiscordToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
              >
                {showDiscordToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
          >
            Get your token from Discord Developer Portal
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-200">Groq API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showGroqKey ? "text" : "password"}
                value={form.groq_api_key || ""}
                onChange={(e) => setForm({ ...form, groq_api_key: e.target.value })}
                className="w-full rounded-lg border border-ink-800 bg-ink-950 px-4 py-2.5 pr-10 text-sm text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
                placeholder="gsk_..."
              />
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
              >
                {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
          >
            Get your API key from Groq Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-900 p-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${form.is_active ? "bg-accent-500 pulse-dot" : "bg-ink-600"}`}
          />
          <div>
            <p className="text-sm font-medium text-ink-100">
              Bot is {form.is_active ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-ink-400">
              {form.is_active
                ? "Responding to messages in Discord"
                : "Will not respond to messages"}
            </p>
          </div>
        </div>
        <button
          onClick={toggleActive}
          disabled={saving}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            form.is_active
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "bg-accent-500/10 text-accent-400 hover:bg-accent-500/20"
          } disabled:opacity-50`}
        >
          <Power className="h-4 w-4" />
          {form.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink-200">System Prompt</label>
        <p className="text-xs text-ink-400">
          Defines the bot's personality and behavior. This is sent as the first message to Groq.
        </p>
        <textarea
          value={form.system_prompt}
          onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          rows={5}
          className="w-full resize-y rounded-lg border border-ink-800 bg-ink-900 px-4 py-3 text-sm text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
          placeholder="You are a helpful Discord bot..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-200">Model</label>
          <select
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="w-full rounded-lg border border-ink-800 bg-ink-900 px-4 py-2.5 text-sm text-ink-100 outline-none transition-colors focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
          >
            {GROQ_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-200">Max Tokens</label>
          <input
            type="number"
            min={64}
            max={8192}
            value={form.max_tokens}
            onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 1024 })}
            className="w-full rounded-lg border border-ink-800 bg-ink-900 px-4 py-2.5 text-sm text-ink-100 outline-none transition-colors focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink-200">Temperature</label>
          <span className="font-mono text-sm text-accent-400">{form.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={form.temperature}
          onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
          className="w-full accent-accent-500"
        />
        <div className="flex justify-between text-xs text-ink-500">
          <span>Precise (0.0)</span>
          <span>Balanced (0.7)</span>
          <span>Creative (2.0)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-500 disabled:opacity-50"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
