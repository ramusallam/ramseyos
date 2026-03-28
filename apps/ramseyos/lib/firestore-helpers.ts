export interface WriteResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function safeWrite(operation: () => Promise<string | void>): Promise<WriteResult> {
  try {
    const id = await operation();
    return { success: true, id: id ?? undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Firestore write error]", message);
    return { success: false, error: message };
  }
}

export async function safeRead<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    console.error("[Firestore read error]", err instanceof Error ? err.message : err);
    return fallback;
  }
}
