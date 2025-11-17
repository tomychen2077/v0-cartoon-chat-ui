"use client"

import React from 'react'

interface SpinnerProps {
  size?: number
  ariaLabel?: string
  durationMs?: number
  easing?: string
  className?: string
  onStart?: () => void
  onEnd?: () => void
}

export function Spinner({
  size = 24,
  ariaLabel = 'Loading',
  durationMs = 1000,
  easing = 'ease-in-out',
  className = '',
  onStart,
  onEnd,
}: SpinnerProps) {
  const style: React.CSSProperties = {
    ['--la-duration' as any]: `${durationMs}ms`,
    ['--la-easing' as any]: easing,
    width: size,
    height: size,
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`la-spinner ${className}`}
      style={style}
      onAnimationStart={onStart}
      onAnimationEnd={onEnd}
    />
  )
}
