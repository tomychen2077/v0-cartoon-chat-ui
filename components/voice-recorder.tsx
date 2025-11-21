'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2, X } from 'lucide-react'

interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void
    disabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                onRecordingComplete(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('Failed to start recording:', error)
            alert('Microphone access denied or not available')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            chunksRef.current = []
            setRecordingTime(0)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (isRecording) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-full border border-destructive/20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-destructive">{formatTime(recordingTime)}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={cancelRecording}
                    title="Cancel"
                >
                    <X className="w-4 h-4" />
                </Button>
                <Button
                    variant="default"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-destructive hover:bg-destructive/90"
                    onClick={stopRecording}
                    title="Stop & Send"
                >
                    <Square className="w-3 h-3" />
                </Button>
            </div>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
            onClick={startRecording}
            disabled={disabled}
            title="Record Voice Message"
        >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
    )
}
