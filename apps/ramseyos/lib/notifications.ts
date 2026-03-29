/**
 * RamseyOS Notification Scaffolding
 *
 * Provides basic browser notification support.
 * Not a full push notification system — just the foundation.
 */

export type NotificationPermissionStatus = "default" | "granted" | "denied";

export function getPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission as NotificationPermissionStatus;
}

export async function requestPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationPermissionStatus;
}

export function canNotify(): boolean {
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
}

export function sendNotification(title: string, options?: { body?: string; tag?: string }): void {
  if (!canNotify()) return;
  try {
    new Notification(title, {
      body: options?.body,
      tag: options?.tag || "ramseyos",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
    });
  } catch (err) {
    console.error("[Notification]", err);
  }
}

/**
 * Check if there are reminder-worthy items.
 * This is a lightweight check, not a scheduler.
 */
export interface ReminderCheck {
  hasPendingApprovals: boolean;
  hasOverdueTasks: boolean;
  hasDueSoonRecommendations: boolean;
}
