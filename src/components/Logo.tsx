import { Activity } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  variant?: 'light' | 'dark'
}

const sizes = {
  sm: { icon: 'h-8 w-8', text: 'text-lg' },
  md: { icon: 'h-10 w-10', text: 'text-xl' },
  lg: { icon: 'h-14 w-14', text: 'text-3xl' },
}

export function Logo({
  size = 'md',
  showText = true,
  variant = 'dark',
}: LogoProps) {
  const textClass =
    variant === 'light' ? 'text-white' : 'text-primary'

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${sizes[size].icon} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-elevated`}
      >
        <Activity className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="leading-tight">
          <p className={`${sizes[size].text} font-bold tracking-tight ${textClass}`}>
            AFRIMED
          </p>
          {size !== 'sm' && (
            <p
              className={`text-xs font-medium ${
                variant === 'light' ? 'text-white/70' : 'text-primary/60'
              }`}
            >
              Santé intelligente
            </p>
          )}
        </div>
      )}
    </div>
  )
}
