import { useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error";

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
};

const INITIAL: ToastState = { visible: false, message: "", type: "success" };

export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<ToastState>(INITIAL);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, type: ToastType = "success") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ visible: true, message, type });
      timer.current = setTimeout(() => setToast(INITIAL), durationMs);
    },
    [durationMs]
  );

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error = useCallback((msg: string) => show(msg, "error"), [show]);

  return { toast, show, success, error };
}
