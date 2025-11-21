'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Share2, Trash2, MoreVertical, Image as ImageIcon, SmilePlus, Reply, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoicePlayer } from '@/components/voice-player'

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
  onReaction?: (emoji: string) => void
  onReply?: (message: Message) => void
  selectionMode?: boolean
  isSelected?: boolean
  onSelect?: () => void
  showName?: boolean
}

interface Message {
  id: string
  content: string
  sender: string
  // ... other fields
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
  onReaction,
  onReply,
  selectionMode = false,
  isSelected = false,
  onSelect,
  showName = true,
}: ChatBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [menuUp, setMenuUp] = useState(false)
  const [menuLeft, setMenuLeft] = useState(0)
  const [menuTop, setMenuTop] = useState(0)
  const anchorRectRef = useRef<DOMRect | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
      }).catch(console.error)
    } else {
      // Fallback
      const textArea = document.createElement("textarea")
      textArea.value = message
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err)
      }
      document.body.removeChild(textArea)
    }
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {selectionMode ? (
        <div className="flex items-center justify-center w-8 sm:w-10">
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-foreground/30 hover:border-primary'}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>
      ) : (
        !isOwn && (
          showAvatar ? (
            <img
              src={avatar || "/placeholder.svg"}
              alt={sender}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
          )
        )
      )}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
        {showName && <p className="text-[10px] sm:text-xs text-foreground/50 px-1.5 sm:px-3 mb-0.5 sm:mb-1">{sender}</p>}
        <div
          className={`relative max-w-[85%] sm:max-w-xs md:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl sm:rounded-3xl cursor-pointer active:scale-[0.98] transition-transform ${isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-secondary text-secondary-foreground rounded-bl-sm'
            }`}
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
            } catch { }
            if (!selectionMode) {
              setShowMenu((v) => !v)
            } else {
              onSelect?.()
            }
          }}
        >
          <p className="break-words text-sm sm:text-base leading-relaxed">{message}</p>

          {/* Media Display */}
          {mediaUrl && mediaType === 'voice' && (
            <div className="mt-2">
              <VoicePlayer audioUrl={mediaUrl} />
            </div>
          )}
          {mediaUrl && (mediaType === 'giphy' || mediaType?.startsWith('image/')) && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-full">
              <img
                src={mediaUrl}
                alt={mediaType === 'giphy' ? 'GIF' : 'Shared image'}
                className="max-w-full h-auto rounded-lg cursor-pointer"
                onClick={() => window.open(mediaUrl, '_blank')}
              />
            </div>
          )}
          {mediaUrl && !mediaType?.startsWith('image/') && mediaType !== 'voice' && mediaType !== 'giphy' && (
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

          {/* PC Hover Actions */}
          {!selectionMode && isHovered && (
            <div className={`hidden sm:flex absolute ${isOwn ? 'top-0 right-full mr-2' : 'top-0 left-full ml-2'} bg-background border border-border shadow-sm rounded-full p-0.5 gap-0.5 z-10 items-center`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-accent text-foreground/70"
                onClick={(e) => { e.stopPropagation(); onReaction?.('👍') }}
                title="Like"
              >
                <span className="text-xs">👍</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-accent text-foreground/70"
                onClick={(e) => { e.stopPropagation(); onReaction?.('❤️') }}
                title="Love"
              >
                <span className="text-xs">❤️</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-accent text-foreground/70"
                onClick={(e) => { e.stopPropagation(); onReaction?.('😂') }}
                title="Laugh"
              >
                <span className="text-xs">😂</span>
              </Button>
              {onReply && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-accent text-foreground/70"
                  onClick={(e) => { e.stopPropagation(); onReply({ id: messageId || '', content: message, sender } as any) }}
                >
                  <Reply className="w-3 h-3" />
                </Button>
              )}
              {isOwn && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-destructive/10 text-destructive/70 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(messageId || '') }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {/* Menu Dropdown */}
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
                {/* Mobile Reactions */}
                <div className="flex items-center justify-around px-1 py-2 border-b border-border/50 mb-1">
                  {['👍', '❤️', '😂'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation()
                        onReaction?.(emoji)
                        setShowMenu(false)
                      }}
                      className="text-xl hover:bg-accent rounded-full p-1.5 transition-colors leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {onReply && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onReply({ id: messageId || '', content: message, sender } as any)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent active:bg-accent/80 rounded-md transition-colors text-foreground"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                )}
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
                  {copyFeedback ? 'Copied!' : 'Copy'}
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
            <button
              key={i}
              className={`text-[10px] sm:text-xs bg-accent/20 rounded-full px-1.5 sm:px-2 py-0.5 hover:bg-accent/40 cursor-pointer transition-colors border border-transparent hover:border-border ${r.count > 0 ? '' : 'hidden'}`}
              onClick={(e) => {
                e.stopPropagation()
                onReaction?.(r.emoji)
              }}
            >
              {r.emoji} {r.count > 1 ? r.count : ''}
            </button>
          ))}
        </div>
        {timestamp && <p className="text-[10px] sm:text-xs text-foreground/40 mt-0.5 sm:mt-1 px-1.5 sm:px-2">{timestamp}</p>}
      </div>
    </div>
  )
}

export const ChatBubble = memo(ChatBubbleComponent)
