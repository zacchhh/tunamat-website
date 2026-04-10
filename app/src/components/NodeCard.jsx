const LEVEL_ACCENTS = [
  '#A675FF', '#F5A040', '#3CC8B4', '#E85D9F', '#D4B848',
]

const PILL_COLORS = {
  progress: { base: '#D4944A', active: '#F5A040', bg: 'rgba(212,148,74,0.08)', bgActive: 'rgba(245,160,64,0.14)', border: 'rgba(212,148,74,0.25)', borderActive: 'rgba(245,160,64,0.45)' },
  linked:   { base: '#3AA89A', active: '#3CC8B4', bg: 'rgba(60,200,180,0.06)', bgActive: 'rgba(60,200,180,0.14)', border: 'rgba(60,200,180,0.2)', borderActive: 'rgba(60,200,180,0.4)' },
}

export default function NodeCard({ label, count, active, level = 0, onClick, icon, onQuickAdd, onShowDetail, variant, onCollapse, pillColor, dimmed, imageUrl }) {
  const accent = LEVEL_ACCENTS[level % LEVEL_ACCENTS.length]

  if (variant === 'branch') {
    const scheme = PILL_COLORS[pillColor] || PILL_COLORS.progress
    const textColor = active ? scheme.active : scheme.base
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onClick?.() }}
        style={{
          height: 26,
          backgroundColor: active ? scheme.bgActive : scheme.bg,
          border: `1px solid ${active ? scheme.borderActive : scheme.border}`,
          boxShadow: active ? `0 0 8px ${scheme.border}` : 'none',
        }}
        className="rounded-full transition-all duration-150 cursor-pointer select-none px-2.5 flex items-center gap-1 group/card relative hover:scale-[1.02]"
      >
        {icon && <span className="text-[10px] shrink-0 opacity-80">{icon}</span>}
        <span className="text-[10px] font-semibold truncate" style={{ color: textColor }}>{label}</span>
        {count != null && (
          <span className="text-[8px] font-bold px-1 rounded-full shrink-0 tabular-nums"
            style={{ backgroundColor: active ? `${scheme.active}18` : `${scheme.base}12`, color: textColor }}>
            {count}
          </span>
        )}
      </div>
    )
  }

  const isMovementCard = onShowDetail

  const labelRow = (
    <div className="flex items-center gap-2 min-w-0">
      {icon && <span className="text-sm shrink-0">{icon}</span>}
      <div className="font-medium leading-snug truncate text-sm min-w-0 flex-1" style={{ color: active ? accent : '#E8E4F0' }}>
        {label}
      </div>
      {count != null && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums"
          style={{ backgroundColor: active ? `${accent}18` : 'rgba(160,120,255,0.08)', color: active ? accent : '#8B84A8' }}>
          {count}
        </span>
      )}
    </div>
  )

  const actionPills = (onShowDetail || onQuickAdd) && (
    <div className="mt-1 flex items-center gap-1.5">
      {onShowDetail && (
        <button onClick={(e) => { e.stopPropagation(); onShowDetail() }}
          className="px-2 py-0.5 rounded-full text-[9px] font-semibold cursor-pointer border transition-all"
          style={{ backgroundColor: 'rgba(166,117,255,0.08)', borderColor: 'rgba(166,117,255,0.2)', color: '#A675FF' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.08)' }}>
          View Details
        </button>
      )}
      {onQuickAdd && (
        <button onClick={(e) => { e.stopPropagation(); onQuickAdd() }}
          className="px-2 py-0.5 rounded-full text-[9px] font-semibold cursor-pointer border transition-all"
          style={{ backgroundColor: 'rgba(60,200,180,0.08)', borderColor: 'rgba(60,200,180,0.2)', color: '#3CC8B4' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(60,200,180,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(60,200,180,0.08)' }}>
          + Flow
        </button>
      )}
    </div>
  )

  const dimmedIndicator = dimmed && (
    <div className="mt-1">
      <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: '#5E5880' }}>Already added</span>
    </div>
  )

  const closeButton = onCollapse && (
    <button onClick={(e) => { e.stopPropagation(); onCollapse() }}
      className="absolute top-1.5 right-2 w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer border-none bg-transparent rounded-full transition-all opacity-50 hover:opacity-100 z-10"
      style={{ color: '#8B84A8' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#E85D9F' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#8B84A8' }}
      title="Remove">×</button>
  )

  const thumbnail = isMovementCard && imageUrl && (
    <div
      className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
      style={{ width: 44, height: 44, backgroundColor: 'rgba(160,120,255,0.08)', border: '1px solid rgba(160,120,255,0.1)' }}
    >
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        draggable={false}
        className="w-full h-full object-contain"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    </div>
  )

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      style={{
        height: isMovementCard ? 66 : 46,
        backgroundColor: active ? '#221F3D' : '#1E1B35',
        border: active ? `1.5px solid ${accent}60` : '1px solid rgba(160, 120, 255, 0.12)',
        boxShadow: active
          ? `0 0 20px ${accent}15, 0 4px 16px rgba(10,8,20,0.4)`
          : '0 2px 8px rgba(10,8,20,0.3)',
        opacity: dimmed ? 0.45 : 1,
      }}
      className={`
        rounded-2xl transition-all duration-200 cursor-pointer select-none
        group/card relative
        ${isMovementCard ? 'px-2.5 flex items-center gap-2' : 'px-4 flex flex-col justify-center'}
        ${active ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
      `}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = `${accent}30`
          e.currentTarget.style.boxShadow = `0 0 16px ${accent}08, 0 4px 16px rgba(10,8,20,0.4)`
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'rgba(160, 120, 255, 0.12)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,8,20,0.3)'
        }
      }}
    >
      {closeButton}
      {isMovementCard ? (
        <>
          {thumbnail}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {labelRow}
            {actionPills}
            {dimmedIndicator}
          </div>
        </>
      ) : (
        labelRow
      )}
    </div>
  )
}
