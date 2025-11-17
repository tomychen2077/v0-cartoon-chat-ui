# Loading Animations

This project includes three lightweight, theme-aware loading animations built with CSS:

- Spinner
- Progress Bar (determinate and indeterminate)
- Skeleton (shimmer)

All animations:
- Are under 50KB total (CSS + components)
- Respect light and dark themes via existing CSS variables
- Are responsive and configurable (`durationMs`, `easing`)
- Provide accessibility (`role`, `aria-*`) and reduced motion support
- Expose start/end hooks via React props

## Usage

Import the components from `components/loading/*`.

### Spinner

```tsx
import { Spinner } from '@/components/loading/spinner'

<Spinner size={32} durationMs={800} easing="ease-out" ariaLabel="Loading messages" />
```

Props:
- `size` (number): pixels, default 24
- `durationMs` (number): default 1000
- `easing` (string): CSS easing, default `ease-in-out`
- `ariaLabel` (string)
- `onStart`, `onEnd` (callbacks)

### Progress Bar

```tsx
import { ProgressBar } from '@/components/loading/progress-bar'

// Indeterminate
<ProgressBar durationMs={1200} easing="ease-in-out" />

// Determinate
<ProgressBar value={65} durationMs={500} easing="ease" ariaLabel="Upload progress" />
```

Props:
- `value` (0–100): omit for indeterminate
- `durationMs`, `easing`, `ariaLabel`, `onStart`, `onEnd`

### Skeleton

```tsx
import { Skeleton } from '@/components/loading/skeleton'

<div className="space-y-3">
  <Skeleton height={24} />
  <Skeleton height={16} />
  <Skeleton height={16} width="80%" />
</div>
```

Props:
- `width` (number|string): default `100%`
- `height` (number|string): default `16`
- `rounded` (boolean): default `true`
- `durationMs`, `easing`, `ariaLabel`, `onStart`, `onEnd`

## Theming

Animations use color variables (`--primary`, `--muted`, etc.) defined in `app/globals.css`. They automatically adapt to light/dark.

## Reduced Motion

Users with `prefers-reduced-motion: reduce` will see static placeholders. No animations run.

## JavaScript Hooks

Each component fires `onAnimationStart` and `onAnimationEnd` via props (`onStart`, `onEnd`). For indeterminate or continuous animations, only `onStart` fires unless you control visibility.

## Older Browsers

Animations rely on standard CSS keyframes and transitions. Older browsers will still render static placeholders.

