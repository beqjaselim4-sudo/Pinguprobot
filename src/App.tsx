import { useState } from "react";
import { Settings, MessageSquare, Rocket, Bot, Zap } from "lucide-react";
import StatsBar from "./components/StatsBar";
import ConfigPanel from "./components/ConfigPanel";
import ConversationsPanel from "./components/ConversationsPanel";
import DeployGuide from "./components/DeployGuide";
import BotControl from "./components/BotControl";

type Tab = "control" | "config" | "conversations" | "deploy";

const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: "control", label: "Bot Control", icon: Zap },
  { id: "config", label: "Configuration", icon: Settings },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "deploy", label: "Deploy Bot", icon: Rocket },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("config");

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg shadow-accent-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-ink-50">Groq Discord Bot</h1>
              <p className="text-xs text-ink-500">AI-powered Discord assistant</p>
            </div>
          </div>
          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-lg border border-ink-800 px-3 py-1.5 text-xs text-ink-400 transition-colors hover:border-ink-700 hover:text-ink-200 sm:flex"
          >
            <span className="h-2 w-2 rounded-full bg-accent-500 pulse-dot" />
            Powered by Groq
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Stats */}
        <div className="mb-8">
          <StatsBar />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-ink-800 bg-ink-900 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-ink-800 text-ink-50 shadow-sm"
                  : "text-ink-400 hover:text-ink-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-5 sm:p-6">
          {activeTab === "control" && <BotControl />}
          {activeTab === "config" && <ConfigPanel />}
          {activeTab === "conversations" && <ConversationsPanel />}
          {activeTab === "deploy" && <DeployGuide />}
        </div>
      </main>

      <footer className="border-t border-ink-800 py-6">
        <p className="text-center text-xs text-ink-600">
          Groq Discord Bot - Built with Supabase Edge Functions
        </p>
      </footer>
    </div>
  );
}

export default App;
