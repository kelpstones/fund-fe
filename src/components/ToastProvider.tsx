import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

type ToastTone = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  tone: ToastTone;
  message: string;
  title?: string;
  duration: number;
  isExiting?: boolean;
};

type ToastPayload = {
  message: string;
  title?: string;
  duration?: number;
};

type ToastContextValue = {
  show: (toast: ToastItemInput) => number;
  success: (message: string, options?: Omit<ToastPayload, "message">) => number;
  error: (message: string, options?: Omit<ToastPayload, "message">) => number;
  info: (message: string, options?: Omit<ToastPayload, "message">) => number;
  warning: (message: string, options?: Omit<ToastPayload, "message">) => number;
  dismiss: (id: number) => void;
  clear: () => void;
};

type ToastItemInput = ToastPayload & {
  tone?: ToastTone;
};

const DEFAULT_DURATION = 4200;
const MAX_TOAST = 4;
const EXIT_DURATION = 160;
const ToastContext = createContext<ToastContextValue | null>(null);

const toneClass: Record<ToastTone, string> = {
  success: "alert-success",
  error: "alert-error",
  info: "alert-info",
  warning: "alert-warning",
};

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const sequence = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const exitTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    const exitTimer = exitTimers.current.get(id);
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isExiting: true } : item,
      ),
    );

    if (exitTimers.current.has(id)) return;
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, EXIT_DURATION);
    exitTimers.current.set(id, timeoutId);
  }, [removeToast]);

  const clearAll = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    exitTimers.current.forEach((timer) => clearTimeout(timer));
    exitTimers.current.clear();
    setToasts([]);
  }, []);

  const show = useCallback(
    ({ tone = "info", message, title, duration = DEFAULT_DURATION }: ToastItemInput) => {
      sequence.current += 1;
      const id = sequence.current;
      const item: ToastItem = { id, tone, message, title, duration };
      setToasts((current) => [...current.slice(-(MAX_TOAST - 1)), item]);

      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          dismiss(id);
        }, duration);
        timers.current.set(id, timeoutId);
      }

      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastPayload, "message">) =>
      show({ tone: "success", message, ...options }),
    [show],
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastPayload, "message">) =>
      show({ tone: "error", message, ...options }),
    [show],
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastPayload, "message">) =>
      show({ tone: "info", message, ...options }),
    [show],
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastPayload, "message">) =>
      show({ tone: "warning", message, ...options }),
    [show],
  );

  const value = useMemo(
    () => ({ show, success, error, info, warning, dismiss, clear: clearAll }),
    [show, success, error, info, warning, dismiss, clearAll],
  );

  useEffect(() => () => clearAll(), [clearAll]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast toast-top toast-end fr-toast-stack z-[1200] w-[min(92vw,25rem)]">
        {toasts.map((item) => {
          const Icon = toneIcon[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className={`alert ${toneClass[item.tone]} pointer-events-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 shadow-soft ${
                item.isExiting ? "fr-toast-exit" : "fr-toast-enter"
              }`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 grid gap-0.5 text-left">
                {item.title ? <p className="break-words text-sm font-black">{item.title}</p> : null}
                <p className="break-words text-sm font-semibold">{item.message}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square shrink-0"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss toast"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}
