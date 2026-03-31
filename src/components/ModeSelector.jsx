import { MODES } from '../utils/groupMovements'

export default function ModeSelector({ mode, onModeChange }) {
  return (
    <div className="bg-cream-dark border-b border-earth-light/20 px-4 py-3 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex gap-2">
        {Object.entries(MODES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border
              ${mode === key
                ? 'bg-bark text-cream border-bark shadow-sm'
                : 'bg-white text-bark-light border-earth-light/30 hover:border-earth hover:bg-earth-bg'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
