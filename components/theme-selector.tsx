'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import * as Dialog from '@radix-ui/react-dialog'
import { Palette, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const THEME_COLORS = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
    { name: 'Cyan', value: 'cyan', class: 'bg-cyan-500' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
]

interface ThemeSelectorProps {
    currentTheme?: string
    onThemeChange?: (theme: string) => void
}

export function ThemeSelector({ currentTheme = 'blue', onThemeChange }: ThemeSelectorProps) {
    const [open, setOpen] = useState(false)
    const [selectedTheme, setSelectedTheme] = useState(currentTheme)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('profiles')
                .update({ theme_color: selectedTheme })
                .eq('id', user.id)

            if (error) throw error

            onThemeChange?.(selectedTheme)
            setOpen(false)
        } catch (error) {
            console.error('Failed to save theme:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" title="Choose Theme">
                    <Palette className="w-5 h-5" />
                </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-2xl shadow-2xl w-[90vw] max-w-md p-6 z-50">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-lg font-bold">Choose Your Theme</Dialog.Title>
                        <Dialog.Close asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <X className="w-5 h-5" />
                            </Button>
                        </Dialog.Close>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {THEME_COLORS.map((theme) => (
                            <button
                                key={theme.value}
                                onClick={() => setSelectedTheme(theme.value)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${selectedTheme === theme.value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full ${theme.class}`} />
                                <span className="text-xs font-medium">{theme.name}</span>
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                    >
                        {saving ? 'Saving...' : 'Save Theme'}
                    </Button>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
