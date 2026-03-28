export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 p-8 text-white/40">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ message = "Nothing here yet" }: { message?: string }) {
  return (
    <div className="p-8 text-center text-white/30 text-sm">
      {message}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-red-400/70 text-sm mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
