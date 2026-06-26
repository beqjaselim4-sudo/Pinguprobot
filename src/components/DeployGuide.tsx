import { useState } from "react";
import { Copy, Check, Terminal, Server, Package, Key } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function DeployGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const steps = [
    {
      title: "1. Add your API keys in the Configuration tab",
      description: "Go to the Configuration tab and enter your Discord Bot Token and Groq API Key in the API Keys section. Click Save. The bot will read these from the database automatically.",
      icon: Key,
    },
    {
      title: "2. Download the bot code",
      description: "The bot code is in the /bot folder of this project. Copy it to your machine or server.",
      icon: Package,
    },
    {
      title: "3. Install dependencies",
      code: "cd bot && npm install",
      icon: Terminal,
    },
    {
      title: "4. Set environment variables",
      description: "Only these two are required (the bot fetches Discord token and Groq key from the database):",
      envVars: [
        { name: "SUPABASE_URL", value: SUPABASE_URL },
        { name: "SUPABASE_ANON_KEY", value: SUPABASE_ANON_KEY },
      ],
      icon: Server,
    },
    {
      title: "5. Start the bot",
      code: "npm start",
      icon: Terminal,
    },
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4">
        <p className="text-sm text-accent-300">
          You no longer need to pass the Discord token or Groq key as environment variables to the bot.
          Enter them in the Configuration tab and the bot will fetch them from the database automatically.
        </p>
      </div>

      {steps.map((step, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-800 text-ink-300">
              <step.icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-medium text-ink-100">{step.title}</h3>
          </div>

          {step.description && (
            <p className="ml-11 text-sm text-ink-400">{step.description}</p>
          )}

          {step.code && (
            <div className="ml-11 flex items-center justify-between rounded-lg border border-ink-800 bg-ink-950 px-4 py-3">
              <code className="font-mono text-sm text-accent-400">{step.code}</code>
              <button
                onClick={() => copy(step.code!, `code-${i}`)}
                className="text-ink-500 transition-colors hover:text-ink-300"
              >
                {copied === `code-${i}` ? <Check className="h-4 w-4 text-accent-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}

          {step.envVars && (
            <div className="ml-11 space-y-2">
              {step.envVars.map((env) => (
                <div
                  key={env.name}
                  className="flex items-center justify-between rounded-lg border border-ink-800 bg-ink-950 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-ink-400">{env.name}</p>
                    <p className="truncate font-mono text-sm text-ink-200">{env.value}</p>
                  </div>
                  <button
                    onClick={() => copy(env.value, `env-${env.name}`)}
                    className="ml-3 flex-shrink-0 text-ink-500 transition-colors hover:text-ink-300"
                  >
                    {copied === `env-${env.name}` ? <Check className="h-4 w-4 text-accent-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="ml-11 rounded-lg border border-ink-800 bg-ink-900 p-4">
        <p className="text-sm text-ink-300">
          Make sure to enable these in the{" "}
          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-400 hover:text-accent-300"
          >
            Discord Developer Portal
          </a>
          :
        </p>
        <ul className="mt-2 space-y-1 text-sm text-ink-400">
          <li>- Message Content Intent (Bot settings)</li>
          <li>- Server Members Intent (Bot settings)</li>
          <li>- Bot permissions: Read Messages, Send Messages</li>
        </ul>
      </div>
    </div>
  );
}
