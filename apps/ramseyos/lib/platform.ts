/**
 * Platform detection and capability queries for RamseyOS.
 *
 * Centralizes environment checks so the app can adapt to:
 *  - browser (current default)
 *  - desktop wrapper (Tauri/Electron — future)
 *  - mobile browser
 *
 * All checks are safe to call during SSR (return false/defaults).
 */

export type RuntimeEnv = "browser" | "desktop" | "mobile";

/** Detect the current runtime environment. */
export function getRuntimeEnv(): RuntimeEnv {
  if (typeof window === "undefined") return "browser";

  // Future desktop wrapper detection
  // Tauri: window.__TAURI_INTERNALS__  |  Electron: window.process?.versions?.electron
  const w = window as unknown as Record<string, unknown>;
  if (w.__TAURI_INTERNALS__ || (w.process as Record<string, unknown> | undefined)?.versions) {
    return "desktop";
  }

  // Coarse mobile detection — touch + narrow viewport
  if ("ontouchstart" in window && window.innerWidth < 768) {
    return "mobile";
  }

  return "browser";
}

/** Whether we're running inside a desktop wrapper (Tauri/Electron). */
export function isDesktop(): boolean {
  return getRuntimeEnv() === "desktop";
}

/** Whether the browser supports the Web Share API. */
export function canShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

/** Whether the browser supports the Clipboard API. */
export function canCopyToClipboard(): boolean {
  return typeof navigator !== "undefined" && !!navigator.clipboard?.writeText;
}

/**
 * Capability flags available in the current environment.
 * Desktop wrapper can extend these at runtime.
 */
export interface PlatformCapabilities {
  share: boolean;
  clipboard: boolean;
  camera: boolean;
  localFilesystem: boolean;
  pythonBackend: boolean;
  notifications: boolean;
}

export function getCapabilities(): PlatformCapabilities {
  const desktop = isDesktop();
  return {
    share: canShare(),
    clipboard: canCopyToClipboard(),
    camera: desktop, // Only expose in desktop wrapper for now
    localFilesystem: desktop,
    pythonBackend: desktop,
    notifications: typeof Notification !== "undefined" && Notification.permission === "granted",
  };
}

/**
 * Copy text to clipboard with fallback.
 * Returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (canCopyToClipboard()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Share content via native share sheet, falling back to clipboard copy.
 * Returns "shared" | "copied" | "failed".
 */
export async function shareOrCopy(opts: {
  title: string;
  text: string;
}): Promise<"shared" | "copied" | "failed"> {
  if (canShare()) {
    try {
      await navigator.share(opts);
      return "shared";
    } catch {
      // User cancelled or error — fall through to copy
    }
  }
  const ok = await copyToClipboard(opts.text);
  return ok ? "copied" : "failed";
}
