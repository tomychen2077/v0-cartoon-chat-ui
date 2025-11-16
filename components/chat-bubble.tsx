'use client'

import { useState } from 'react'
import { Copy, Share2, Trash2, MoreVertical, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatBubbleProps {
  message: string
  sender: string
  avatar: string
  isOwn?: boolean
  timestamp?: string
  reactions?: { emoji: string; count: number }[]
  messageId?: string
  onDelete?: (messageId: string) => void
  mediaUrl?: string
  mediaType?: string
}

export function ChatBubble({
  message,
  sender,
  avatar,
  isOwn = false,
  timestamp,
  reactions = [],
  messageId,
  onDelete,
  mediaUrl,
  mediaType,
}: ChatBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setShowMenu(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Message from ${sender}`,
          text: message,
        })
        setShowMenu(false)
      } catch (err) {
        // User cancelled or error - fallback to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const handleDelete = () => {
    if (messageId && onDelete && confirm('Are you sure you want to delete this message?')) {
      onDelete(messageId)
      setShowMenu(false)
    }
  }

  return (
    <div className={`flex gap-1.5 sm:gap-3 mb-2 sm:mb-4 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      <img
        src={avatar || "/placeholder.svg"}
        alt={sender}
        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
      />
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
        <p className="text-[10px] sm:text-xs text-foreground/50 px-1.5 sm:px-3 mb-0.5 sm:mb-1">{sender}</p>
        <div className={`relative max-w-[80%] sm:max-w-xs md:max-w-md px-2.5 sm:px-4 py-1.5 sm:py-3 rounded-2xl sm:rounded-3xl ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-secondary text-secondary-foreground rounded-bl-sm'
        }`}>
          <p className="break-words text-xs sm:text-base leading-relaxed">{message}</p>
          
          {/* Media Display */}
          {mediaUrl && mediaType?.startsWith('image/') && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-full">
              <img
                src={mediaUrl}
                alt="Shared image"
                className="max-w-full h-auto rounded-lg cursor-pointer"
                onClick={() => window.open(mediaUrl, '_blank')}
              />
            </div>
          )}
          {mediaUrl && !mediaType?.startsWith('image/') && (
            <div className="mt-2">
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                View attachment
              </a>
            </div>
          )}
          
          {/* Menu button - Always visible on mobile, visible on hover for desktop */}
          <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} -top-7 z-10`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 opacity-100 md:opacity-70 md:group-hover:opacity-100 hover:opacity-100 transition-opacity shadow-sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
          
          {/* Menu Dropdown - Works for both mobile and desktop */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-[5]"
                onClick={() => setShowMenu(false)}
              />
              <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-8 bg-card border border-border rounded-lg shadow-lg p-1 z-20 min-w-[120px]`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent active:bg-accent/80 rounded-md transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent active:bg-accent/80 rounded-md transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                {isOwn && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 active:bg-destructive/20 text-destructive rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-1 mt-0.5 sm:mt-2 px-1.5 sm:px-2 flex-wrap justify-center">
          {reactions.map((r, i) => (
            <span key={i} className="text-[10px] sm:text-xs bg-accent/20 rounded-full px-1.5 sm:px-2 py-0.5 hover:bg-accent/40 cursor-pointer transition-colors">
              {r.emoji} {r.count > 1 ? r.count : ''}
            </span>
          ))}
        </div>
        {timestamp && <p className="text-[10px] sm:text-xs text-foreground/40 mt-0.5 sm:mt-1 px-1.5 sm:px-2">{timestamp}</p>}
      </div>
    </div>
  )
}
