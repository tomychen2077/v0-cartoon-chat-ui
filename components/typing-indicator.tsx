export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-secondary/50 rounded-3xl rounded-bl-sm w-fit">
      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
