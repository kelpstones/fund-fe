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

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
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
    () => ({ show, success, error, info, warning, dismiss, clear }),
    [show, success, error, info, warning, dismiss, clear],
  );

  useEffect(() => () => clear(), [clear]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast toast-top toast-end z-[1200] mt-16 w-[min(92vw,25rem)] sm:mt-20">
        {toasts.map((item) => {
          const Icon = toneIcon[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className={`alert ${toneClass[item.tone]} pointer-events-auto shadow-soft`}
            >
              <Icon size={18} />
              <div className="grid gap-0.5">
                {item.title ? <p className="text-sm font-black">{item.title}</p> : null}
                <p className="text-sm font-semibold">{item.message}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square"
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
