import { useState } from "react";
import { useConversations, useMessages } from "../hooks/useData";
import { MessageSquare, Hash, ChevronLeft, User, Bot } from "lucide-react";

export default function ConversationsPanel() {
  const { conversations, loading, refetch } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { messages, loading: msgLoading } = useMessages(selectedId);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-accent-500" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="mb-4 h-12 w-12 text-ink-700" />
        <p className="text-sm font-medium text-ink-300">No conversations yet</p>
        <p className="mt-1 text-xs text-ink-500">
          Conversations will appear here once the bot starts chatting on Discord.
        </p>
      </div>
    );
  }

  if (selectedId && selectedConv) {
    return (
      <div className="flex h-full flex-col fade-in-up">
        <div className="flex items-center gap-3 border-b border-ink-800 pb-4">
          <button
            onClick={() => setSelectedId(null)}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-ink-500" />
            <span className="text-sm font-medium text-ink-100">
              {selectedConv.channel_name || selectedConv.channel_id}
            </span>
          </div>
          {selectedConv.guild_name && (
            <span className="ml-2 rounded-md bg-ink-800 px-2 py-0.5 text-xs text-ink-400">
              {selectedConv.guild_name}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          {msgLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-accent-500" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">No messages in this conversation</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === "assistant"
                      ? "bg-accent-500/15 text-accent-400"
                      : "bg-ink-800 text-ink-300"
                  }`}
                >
                  {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`max-w-[75%] ${msg.role === "assistant" ? "" : "text-right"}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-ink-300">
                      {msg.role === "assistant" ? "Bot" : msg.author_name || "User"}
                    </span>
                    <span className="text-xs text-ink-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div
                    className={`rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === "assistant"
                        ? "bg-ink-800 text-ink-100"
                        : "bg-accent-600/15 text-ink-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 fade-in-up">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">{conversations.length} conversation(s)</p>
        <button
          onClick={refetch}
          className="text-xs text-accent-400 hover:text-accent-300"
        >
          Refresh
        </button>
      </div>
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => setSelectedId(conv.id)}
          className="flex w-full items-center gap-3 rounded-xl border border-ink-800 bg-ink-900 p-4 text-left transition-all hover:border-ink-700 hover:bg-ink-800/50"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-ink-800 text-ink-400">
            <Hash className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-ink-100">
                {conv.channel_name || conv.channel_id}
              </span>
              {conv.guild_name && (
                <span className="hidden truncate text-xs text-ink-500 sm:inline">
                  in {conv.guild_name}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500">
              Last message: {new Date(conv.last_message_at).toLocaleString()}
            </p>
          </div>
          <MessageSquare className="h-4 w-4 flex-shrink-0 text-ink-600" />
        </button>
      ))}
    </div>
  );
}
