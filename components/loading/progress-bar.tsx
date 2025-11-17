"use client"

import React from 'react'

interface ProgressBarProps {
  value?: number // 0-100, if undefined -> indeterminate
  durationMs?: number
  easing?: string
  className?: string
  ariaLabel?: string
  onStart?: () => void
  onEnd?: () => void
}

export function ProgressBar({
  value,
  durationMs = 1000,
  easing = 'ease-in-out',
  className = '',
  ariaLabel = 'Loading progress',
  onStart,
  onEnd,
}: ProgressBarProps) {
  const style: React.CSSProperties = {
    ['--la-duration' as any]: `${durationMs}ms`,
    ['--la-easing' as any]: easing,
  }

  const barStyle: React.CSSProperties = value != null ? { width: `${Math.max(0, Math.min(100, value))}%` } : undefined

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`la-progress ${value == null ? 'la-progress--indeterminate' : ''} ${className}`}
      style={style}
    >
      <div
        className="la-progress__bar"
        style={barStyle}
        onAnimationStart={onStart}
        onAnimationEnd={onEnd}
      />
    </div>
  )
}
