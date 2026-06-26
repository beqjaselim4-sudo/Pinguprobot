import { useEffect, useState, useCallback } from "react";
import { Play, Square, Loader2, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";

type BotStatus = "offline" | "starting" | "online" | "error" | "unknown";

interface StatusInfo {
  status: string;
  last_started_at: string | null;
  has_discord_token: boolean;
  has_groq_key: boolean;
  is_active: boolean;
}

export default function BotControl() {
  const [status, setStatus] = useState<BotStatus>("unknown");
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    const [statusRes, configRes] = await Promise.all([
      supabase.from("bot_status").select("*").limit(1).single(),
      supabase.from("bot_config").select("discord_token, groq_api_key, is_active").limit(1).single(),
    ]);

    const statusData = statusRes.data;
    const configData = configRes.data;

    if (statusData) {
      setStatus(statusData.status as BotStatus);
    }
    if (configData) {
      setStatusInfo({
        status: statusData?.status || "offline",
        last_started_at: statusData?.last_started_at || null,
        has_discord_token: !!configData.discord_token,
        has_groq_key: !!configData.groq_api_key,
        is_active: configData.is_active,
      });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("bot-control", {
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      });
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);
      setSuccess("Bot avviato! Si sta connettendo a Discord...");
      setStatus("starting");
      setTimeout(() => fetchStatus(), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'avvio");
    }
    setActionLoading(false);
  };

  const handleStop = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("bot-control", {
        method: "POST",
        body: JSON.stringify({ action: "stop" }),
      });
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);
      setSuccess("Bot fermato.");
      setStatus("offline");
      setTimeout(() => fetchStatus(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'arresto");
    }
    setActionLoading(false);
  };

  const statusConfig: Record<BotStatus, { color: string; label: string; dot: string }> = {
    online: { color: "text-accent-400", label: "Online", dot: "bg-accent-500 pulse-dot" },
    starting: { color: "text-yellow-400", label: "Avvio in corso...", dot: "bg-yellow-500 animate-pulse" },
    offline: { color: "text-ink-400", label: "Offline", dot: "bg-ink-600" },
    error: { color: "text-red-400", label: "Errore", dot: "bg-red-500" },
    unknown: { color: "text-ink-500", label: "Caricamento...", dot: "bg-ink-700" },
  };

  const sc = statusConfig[status];
  const missingKeys = statusInfo && (!statusInfo.has_discord_token || !statusInfo.has_groq_key);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-900 p-5">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${sc.dot}`} />
          <div>
            <p className="text-sm font-medium text-ink-100">Bot {sc.label}</p>
            {statusInfo?.last_started_at && status === "online" && (
              <p className="text-xs text-ink-500">
                Attivo dal {new Date(statusInfo.last_started_at).toLocaleTimeString("it-IT")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "online" || status === "starting" ? (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Ferma
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={actionLoading || !!missingKeys}
              className="flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-500 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Avvia Bot
            </button>
          )}
        </div>
      </div>

      {missingKeys && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Configura le chiavi API prima di avviare</p>
            <p className="mt-1 text-yellow-400/80">
              Vai nella scheda <strong>Configuration</strong> e inserisci il Discord Bot Token e la Groq API Key,
              poi torna qui e clicca "Avvia Bot".
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Errore</p>
            <p className="mt-1 text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {success && !error && (
        <div className="flex items-center gap-2 rounded-lg border border-accent-500/30 bg-accent-500/10 px-4 py-3 text-sm text-accent-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="rounded-xl border border-ink-800 bg-ink-900/50 p-5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent-400" />
          <h3 className="text-sm font-semibold text-ink-100">Come funziona</h3>
        </div>
        <ol className="mt-3 space-y-2 text-sm text-ink-400">
          <li>1. Inserisci Discord Token e Groq API Key nella scheda <strong>Configuration</strong></li>
          <li>2. Torna qui e clicca <strong>Avvia Bot</strong> — il bot si connette a Discord automaticamente</li>
          <li>3. Vai su Discord e menziona il bot con <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-accent-400">@NomeBot ciao</code></li>
          <li>4. Il bot risponderà usando l'AI di Groq</li>
        </ol>
      </div>
    </div>
  );
}
