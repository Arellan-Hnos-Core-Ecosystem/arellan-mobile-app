import api from "@/lib/api";

interface QueuedApproval {
  id: string;
  expenseId: string;
  decision: "APPROVED" | "REJECTED";
  confirmationToken?: string;
  rejectionReason?: string;
  queuedAt: number;
  retries: number;
}

const QUEUE_KEY = "arellan-approval-queue";
const MAX_RETRIES = 3;

function loadQueue(): QueuedApproval[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedApproval[]) : [];
  } catch {
    return [];
  }
}

function persistQueue(queue: QueuedApproval[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* storage full */ }
}

export function enqueueApproval(
  approval: Omit<QueuedApproval, "id" | "queuedAt" | "retries">,
): void {
  const queue = loadQueue();
  queue.push({
    ...approval,
    id: crypto.randomUUID(),
    queuedAt: Date.now(),
    retries: 0,
  });
  persistQueue(queue);
}

export function getQueueSize(): number {
  return loadQueue().length;
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = loadQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedApproval[] = [];

  for (const item of queue) {
    try {
      await api.post(`/finance/expenses/${item.expenseId}/approve`, {
        decision: item.decision,
        confirmationToken: item.confirmationToken,
        rejectionReason: item.rejectionReason,
      });
      synced++;
    } catch {
      const updated = { ...item, retries: item.retries + 1 };
      if (updated.retries < MAX_RETRIES) {
        remaining.push(updated);
      }
      failed++;
    }
  }

  persistQueue(remaining);
  return { synced, failed };
}

export function initSyncService(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    syncQueue().catch(() => {});
  };

  window.addEventListener("online", handleOnline);

  if (navigator.onLine && loadQueue().length > 0) {
    syncQueue().catch(() => {});
  }

  return () => window.removeEventListener("online", handleOnline);
}
