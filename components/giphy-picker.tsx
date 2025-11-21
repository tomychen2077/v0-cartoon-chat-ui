'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Loader2 } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface GiphyPickerProps {
    onSelect: (gifUrl: string) => void
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function GiphyPicker({ onSelect, open, onOpenChange }: GiphyPickerProps) {
    const [search, setSearch] = useState('')
    const [gifs, setGifs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Using Giphy's public beta key - users should replace with their own
    const GIPHY_API_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'

    useEffect(() => {
        if (open) {
            loadTrending()
        }
    }, [open])

    const loadTrending = async () => {
        setLoading(true)
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
            )
            const data = await response.json()
            setGifs(data.data || [])
        } catch (error) {
            console.error('Failed to load trending GIFs:', error)
        } finally {
            setLoading(false)
        }
    }

    const searchGifs = async (query: string) => {
        if (!query.trim()) {
            loadTrending()
            return
        }

        setLoading(true)
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
            )
            const data = await response.json()
            setGifs(data.data || [])
        } catch (error) {
            console.error('Failed to search GIFs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        searchGifs(search)
    }

    const handleSelectGif = (gif: any) => {
        const gifUrl = gif.images.fixed_height.url
        onSelect(gifUrl)
        onOpenChange(false)
        setSearch('')
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-2xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden z-50 flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <Dialog.Title className="text-lg font-bold">Choose a GIF</Dialog.Title>
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <X className="w-5 h-5" />
                            </Button>
                        </Dialog.Close>
                    </div>

                    <div className="p-4 border-b border-border">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Search GIFs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loading && gifs.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {gifs.map((gif) => (
                                    <button
                                        key={gif.id}
                                        onClick={() => handleSelectGif(gif)}
                                        className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
                                    >
                                        <img
                                            src={gif.images.fixed_height_small.url}
                                            alt={gif.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">Powered by GIPHY</p>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
