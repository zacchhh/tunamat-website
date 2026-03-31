import { MODES } from '../utils/groupMovements'

const MODE_ICONS = {
  category: '◉',
  equipment: '⬡',
  movement_pattern: '↗',
  starting_position: '⊡',
  plane_of_motion: '◇',
}

export default function ModeSelector({ mode, onModeChange }) {
  return (
    <div
      className="px-4 py-2 flex gap-1 shrink-0 z-20 overflow-x-auto relative border-b border-card-border"
      style={{ backgroundColor: 'var(--color-glass)', backdropFilter: 'blur(16px)' }}
    >
      {Object.entries(MODES).map(([key, { label }]) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          className={`
            px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer relative
            ${mode === key
              ? 'text-purple bg-purple-glow'
              : 'text-text-muted bg-transparent hover:text-text hover:bg-card/50'
            }
          `}
          style={mode === key ? { boxShadow: '0 0 12px rgba(166, 117, 255, 0.1)' } : {}}
        >
          <span className="mr-1.5 opacity-60">{MODE_ICONS[key]}</span>
          {label}
          {mode === key && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-purple" />
          )}
        </button>
      ))}
    </div>
  )
}
