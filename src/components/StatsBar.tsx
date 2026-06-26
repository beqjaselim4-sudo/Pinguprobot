import { useStats } from "../hooks/useData";
import { MessageSquare, MessagesSquare, User, Bot } from "lucide-react";

export default function StatsBar() {
  const stats = useStats();

  const items = [
    {
      label: "Conversations",
      value: stats.totalConversations,
      icon: MessageSquare,
      color: "text-accent-400",
      bg: "bg-accent-500/10",
    },
    {
      label: "Total Messages",
      value: stats.totalMessages,
      icon: MessagesSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "User Messages",
      value: stats.userMessages,
      icon: User,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Bot Replies",
      value: stats.assistantMessages,
      icon: Bot,
      color: "text-accent-400",
      bg: "bg-accent-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-ink-800 bg-ink-900 p-4 transition-colors hover:border-ink-700"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-semibold text-ink-100">{item.value}</p>
              <p className="text-xs text-ink-500">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
