'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Share2, Trash2, MoreVertical, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatBubbleProps {
  message: string
  sender: string
  avatar: string
  showAvatar?: boolean
  isOwn?: boolean
  timestamp?: string
  reactions?: { emoji: string; count: number }[]
  messageId?: string
  onDelete?: (messageId: string) => void
  mediaUrl?: string
  mediaType?: string
}

function ChatBubbleComponent({
  message,
  sender,
  avatar,
  showAvatar = true,
  isOwn = false,
  timestamp,
  reactions = [],
  messageId,
  onDelete,
  mediaUrl,
  mediaType,
}: ChatBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuUp, setMenuUp] = useState(false)
  const [menuLeft, setMenuLeft] = useState(0)
  const [menuTop, setMenuTop] = useState(0)
  const anchorRectRef = useRef<DOMRect | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

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
    if (messageId && onDelete) {
      onDelete(messageId)
      setShowMenu(false)
    }
  }

  useEffect(() => {
    if (showMenu && menuUp && anchorRectRef.current && menuRef.current) {
      const h = menuRef.current.getBoundingClientRect().height
      const top = anchorRectRef.current.top - 8 - h
      setMenuTop(Math.max(8, top))
    }
  }, [showMenu, menuUp])

  return (
    <div
      className={`flex gap-1.5 sm:gap-3 mb-2 sm:mb-4 group ${isOwn ? 'flex-row-reverse' : ''}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '160px' }}
      data-message-id={messageId}
    >
      {showAvatar && (
        <img
          src={avatar || "/placeholder.svg"}
          alt={sender}
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
        />
      )}
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
          
          {/* Menu button - positioned inside bubble */}
          <div className={`absolute ${isOwn ? '-top-3 -right-3' : '-top-3 -left-3'} z-10`}>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} shadow-md border border-border/40 hover:brightness-110`}
              onClick={(e) => {
                e.stopPropagation()
                try {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  anchorRectRef.current = rect
                  const spaceBelow = window.innerHeight - rect.bottom
                  setMenuUp(spaceBelow < 160)
                  const left = Math.min(Math.max(8, rect.left), window.innerWidth - 168)
                  const top = rect.bottom + 8
                  setMenuLeft(left)
                  setMenuTop(top)
                } catch {}
                setShowMenu((v) => !v)
              }}
            >
              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
          
          {/* Menu Dropdown - Works for both mobile and desktop */}
          {showMenu && createPortal((
            <>
              <div 
                className="fixed inset-0 z-[60] bg-background/30 backdrop-blur-[1px]"
                onClick={() => setShowMenu(false)}
              />
              <div
                ref={menuRef}
                className={`fixed bg-card border border-border rounded-lg shadow-lg p-1 z-[70] min-w-[160px]`}
                style={{ left: menuLeft, top: menuTop }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy()
                  }}
                  data-action="copy"
                  data-message-id={messageId}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent active:bg-accent/80 rounded-md transition-colors text-foreground"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare()
                  }}
                  data-action="share"
                  data-message-id={messageId}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent active:bg-accent/80 rounded-md transition-colors text-foreground"
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
                    data-action="delete"
                    data-message-id={messageId}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 active:bg-destructive/20 text-destructive rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </>
          ), document.body)}
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

export const ChatBubble = memo(ChatBubbleComponent)
