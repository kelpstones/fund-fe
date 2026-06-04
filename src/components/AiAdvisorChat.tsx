import { useMemo, useRef, useState, type FormEvent } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { advisorConfig, askAiAdvisor, type AdvisorMessage } from "../lib/aiAdvisor";
import { useAuth } from "../lib/auth/AuthProvider";
import { useLanguage } from "../lib/i18n/LanguageProvider";

const copy = {
  id: {
    title: "AI Advisor",
    subtitle: "Tanya soal FundRaise",
    open: "Buka AI Advisor",
    close: "Tutup AI Advisor",
    send: "Kirim",
    thinking: "Sedang menjawab...",
    placeholder: "Tulis pertanyaan...",
    welcome:
      "Halo, saya AI Advisor FundRaise. Tanyakan soal peluang UMKM, pengajuan, invoice, wallet, atau langkah berikutnya.",
    configMissing:
      "AI Advisor belum dikonfigurasi. Isi VITE_AI_ADVISOR_URL di env frontend.",
    error: "AI Advisor belum bisa menjawab. Coba lagi sebentar.",
    suggestions: ["Langkah saya berikutnya apa?", "Cari peluang UMKM", "Jelaskan invoice"],
  },
  en: {
    title: "AI Advisor",
    subtitle: "Ask about FundRaise",
    open: "Open AI Advisor",
    close: "Close AI Advisor",
    send: "Send",
    thinking: "Thinking...",
    placeholder: "Write a question...",
    welcome:
      "Hi, I am FundRaise AI Advisor. Ask about UMKM opportunities, submissions, invoices, wallet, or next steps.",
    configMissing:
      "AI Advisor is not configured yet. Set VITE_AI_ADVISOR_URL in the frontend env.",
    error: "AI Advisor cannot answer right now. Please try again shortly.",
    suggestions: ["What should I do next?", "Find UMKM opportunities", "Explain invoice"],
  },
};

const buildMessage = (role: AdvisorMessage["role"], content: string): AdvisorMessage => ({
  role,
  content,
});

export function AiAdvisorChat() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const c = copy[language];
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    buildMessage("assistant", c.welcome),
  ]);

  const visibleMessages = useMemo(() => messages.filter((message) => message.content), [messages]);

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isSending) return;

    const userMessage = buildMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    if (!advisorConfig.url) {
      setMessages([...nextMessages, buildMessage("assistant", c.configMissing)]);
      return;
    }

    setIsSending(true);
    try {
      const answer = await askAiAdvisor({
        message: trimmed,
        history: nextMessages,
        context: {
          language,
          path: location.pathname,
          role: user?.role ?? "public",
        },
      });
      setMessages([...nextMessages, buildMessage("assistant", answer)]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      setMessages([
        ...nextMessages,
        buildMessage("assistant", detail ? `${c.error}\n${detail}` : c.error),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const openChat = () => {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="btn btn-primary fixed bottom-5 right-5 z-[1050] h-14 min-h-14 w-14 rounded-full p-0 text-white shadow-lg hover:text-white"
          aria-label={c.open}
          onClick={openChat}
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : null}

      {open ? (
        <section
          className="fixed bottom-5 right-5 z-[1050] flex h-[min(76vh,38rem)] w-[min(92vw,26rem)] flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-2xl"
          aria-label={c.title}
        >
          <header className="flex items-center justify-between border-b border-base-300 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-base-content">{c.title}</h2>
                <p className="truncate text-xs text-base-content/60">{c.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              aria-label={c.close}
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div className="scrollbar-none flex-1 space-y-3 overflow-y-auto bg-base-200/45 px-4 py-4">
            {visibleMessages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                  className={`chat ${isUser ? "chat-end" : "chat-start"}`}
                >
                  <div
                    className={`chat-bubble max-w-[85%] whitespace-pre-wrap break-words text-sm leading-relaxed ${
                      isUser
                        ? "chat-bubble-primary text-white"
                        : "bg-base-300/70 text-base-content"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            {isSending ? (
              <div className="chat chat-start">
                <div className="chat-bubble bg-base-300/70 text-base-content">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {c.thinking}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-base-300 bg-base-100 p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {c.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="btn btn-outline btn-xs shrink-0"
                  disabled={isSending}
                  onClick={() => void sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form className="flex items-end gap-2" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="textarea textarea-bordered min-h-11 flex-1 resize-none"
                rows={1}
                value={input}
                placeholder={c.placeholder}
                disabled={isSending}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary h-11 min-h-11 text-white hover:text-white"
                disabled={isSending || !input.trim()}
                aria-label={c.send}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
