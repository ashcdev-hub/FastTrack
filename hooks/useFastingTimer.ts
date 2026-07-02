import { useEffect, useState } from "react";
import { AppState } from "react-native";

type CountdownState = {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  totalMinutes: number;
  isOver: boolean;
};

type ElapsedState = {
  hours: number;
  minutes: number;
  seconds: number;
};

export function useFastingTimer(
  startTime: string | null,
  countdownTo: string | null,
) {
  const [countdown, setCountdown] = useState<CountdownState>({
    hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0, isOver: false,
  });
  const [elapsed, setElapsed] = useState<ElapsedState>({ hours: 0, minutes: 0, seconds: 0 });
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setIsActive(state === "active");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isActive) return;

    if (!startTime && !countdownTo) {
      setCountdown({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0, isOver: false });
      setElapsed({ hours: 0, minutes: 0, seconds: 0 });
      setElapsedMinutes(0);
      return;
    }

    const tick = () => {
      const now = Date.now();

      if (startTime) {
        const diffMs = now - new Date(startTime).getTime();
        const totalSec = Math.max(0, Math.floor(diffMs / 1000));
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        setElapsed({ hours, minutes, seconds });
        setElapsedMinutes(Math.max(0, Math.floor(diffMs / 60000)));
      }

      if (countdownTo) {
        const diff = new Date(countdownTo).getTime() - now;
        const isOver = diff < 0;
        const totalSeconds = Math.floor(Math.abs(diff) / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        setCountdown({ hours, minutes, seconds, totalSeconds, totalMinutes, isOver });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, countdownTo, isActive]);

  return { countdown, elapsed, elapsedMinutes };
}
