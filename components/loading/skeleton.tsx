"use client"

import React from 'react'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  rounded?: boolean
  durationMs?: number
  easing?: string
  className?: string
  ariaLabel?: string
  onStart?: () => void
  onEnd?: () => void
}

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = true,
  durationMs = 1000,
  easing = 'ease-in-out',
  className = '',
  ariaLabel = 'Loading content',
  onStart,
  onEnd,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    ['--la-duration' as any]: `${durationMs}ms`,
    ['--la-easing' as any]: easing,
    width,
    height,
    borderRadius: rounded ? '9999px' : undefined,
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`la-skeleton ${className}`}
      style={style}
      onAnimationStart={onStart}
      onAnimationEnd={onEnd}
    />
  )
}
