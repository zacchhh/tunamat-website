const LEVEL_COLORS = [
  { border: 'border-sage', bg: 'bg-sage-bg', activeBorder: 'border-sage', activeBg: 'bg-sage/10' },
  { border: 'border-earth-light', bg: 'bg-earth-bg', activeBorder: 'border-earth', activeBg: 'bg-earth/10' },
  { border: 'border-slate-light', bg: 'bg-slate-bg', activeBorder: 'border-slate', activeBg: 'bg-slate/10' },
  { border: 'border-clay-light', bg: 'bg-clay-bg', activeBorder: 'border-clay', activeBg: 'bg-clay/10' },
]

export default function NodeCard({ label, count, active, level = 0, onClick, nodeRef }) {
  const colors = LEVEL_COLORS[level % LEVEL_COLORS.length]
  const isActive = active

  return (
    <button
      ref={nodeRef}
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
        flex items-center justify-between gap-2 group
        ${isActive
          ? `${colors.activeBg} ${colors.activeBorder} scale-[1.02] shadow-md`
          : `bg-white ${colors.border}/30 hover:${colors.border} hover:shadow-sm`
        }
      `}
    >
      <span className={`text-sm font-medium leading-snug ${isActive ? 'text-bark' : 'text-bark-light'}`}>
        {label}
      </span>
      {count != null && (
        <span className={`
          text-xs font-semibold px-2 py-0.5 rounded-full shrink-0
          ${isActive ? `${colors.activeBg} text-bark` : 'bg-cream-dark text-bark-light/60'}
        `}>
          {count}
        </span>
      )}
    </button>
  )
}
