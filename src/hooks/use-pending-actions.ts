"use client";

import { useCallback, useState, useTransition } from "react";

type Result<K extends string> = {
  isPending: boolean;
  pendingKey: K | null;
  start: (key: K, action: () => void | Promise<void>) => void;
};

// One transition shared across N named actions. `pendingKey` reveals which
// action is currently in flight so the UI can show per-button loading text;
// `isPending` is the simple boolean for disabling the rest.
export function usePendingActions<K extends string>(): Result<K> {
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<K | null>(null);

  const start = useCallback((key: K, action: () => void | Promise<void>) => {
    setPendingKey(key);
    startTransition(async () => {
      try {
        await action();
      } finally {
        setPendingKey(null);
      }
    });
  }, []);

  return { isPending, pendingKey, start };
}
