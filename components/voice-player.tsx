'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause } from 'lucide-react'

interface VoicePlayerProps {
    audioUrl: string
}

export function VoicePlayer({ audioUrl }: VoicePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const handleEnded = () => setIsPlaying(false)
        const handleError = (e: Event) => {
            console.error('Audio playback error:', e)
            setIsPlaying(false)
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div
            className="flex items-center gap-2 bg-secondary/50 rounded-2xl p-2 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
        >
            <audio ref={audioRef} preload="metadata">
                <source src={audioUrl} type="audio/webm" />
                <source src={audioUrl} type="audio/ogg" />
                <source src={audioUrl} type="audio/mpeg" />
            </audio>

            <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 flex-shrink-0"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <div className="flex-1 min-w-0">
                <div className="relative h-1 bg-background rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    )
}
