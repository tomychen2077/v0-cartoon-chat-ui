interface ChatBubbleProps {
  message: string
  sender: string
  avatar: string
  isOwn?: boolean
  timestamp?: string
  reactions?: { emoji: string; count: number }[]
}

export function ChatBubble({
  message,
  sender,
  avatar,
  isOwn = false,
  timestamp,
  reactions = [],
}: ChatBubbleProps) {
  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <img
        src={avatar || "/placeholder.svg"}
        alt={sender}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <p className="text-xs text-foreground/50 px-3 mb-1">{sender}</p>
        <div className={`max-w-xs px-4 py-3 rounded-3xl ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-secondary text-secondary-foreground rounded-bl-sm'
        }`}>
          <p className="break-words">{message}</p>
        </div>
        <div className="flex gap-1 mt-2 px-2 flex-wrap justify-center">
          {reactions.map((r, i) => (
            <span key={i} className="text-xs bg-accent/20 rounded-full px-2 py-0.5 hover:bg-accent/40 cursor-pointer transition-colors">
              {r.emoji} {r.count > 1 ? r.count : ''}
            </span>
          ))}
        </div>
        {timestamp && <p className="text-xs text-foreground/40 mt-1">{timestamp}</p>}
      </div>
    </div>
  )
}
