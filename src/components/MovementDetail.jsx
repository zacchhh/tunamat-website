import Badge from './Badge'
import { formatLabel } from '../utils/groupMovements'

const REP_ORDER = ['recovery', 'low', 'moderate', 'high', 'peak']

export default function MovementDetail({ movement, movementMap, onNavigate }) {
  const m = movement
  if (!m) return null

  const renderLinkedMovements = (ids, label, icon) => {
    if (!ids || ids.length === 0) return null
    const linked = ids.map((id) => movementMap[id]).filter(Boolean)
    if (linked.length === 0) return null
    return (
      <div>
        <h4 className="text-sm font-sans font-semibold text-bark-light/70 mb-2">{icon} {label}</h4>
        <div className="flex flex-wrap gap-1.5">
          {linked.map((lm) => (
            <button
              key={lm.id}
              onClick={() => onNavigate(lm)}
              className="text-xs px-3 py-1.5 rounded-lg bg-cream-dark hover:bg-earth-bg border border-earth-light/20 text-bark-light hover:text-bark transition-colors cursor-pointer"
            >
              {lm.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-earth-light/20 p-6 max-w-md w-full animate-slideIn overflow-y-auto max-h-[calc(100vh-220px)]">
      <h2 className="font-serif text-xl text-bark leading-snug mb-1">{m.name}</h2>
      <p className="text-xs text-bark-light/60 mb-4">{m.category} &middot; {m.subcategory}</p>

      {m.also_known_as?.length > 0 && (
        <p className="text-xs text-bark-light/50 italic mb-4">
          Also known as: {m.also_known_as.join(', ')}
        </p>
      )}

      {m.description && (
        <p className="text-sm text-bark-light leading-relaxed mb-4">{m.description}</p>
      )}

      {m.notes && (
        <div className="bg-sage-bg/50 border border-sage/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-sage font-semibold mb-1">Instructor Tip</p>
          <p className="text-sm text-bark-light leading-relaxed">{m.notes}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {m.starting_position && <Badge variant="earth">{formatLabel(m.starting_position)}</Badge>}
        {m.equipment?.map((e) => <Badge key={e} variant="clay">{formatLabel(e)}</Badge>)}
        {m.is_hold && <Badge variant="moss">Hold</Badge>}
        {m.movement_pattern?.map((mp) => <Badge key={mp} variant="slate">{mp}</Badge>)}
      </div>

      {(m.primary_muscles?.length > 0 || m.secondary_muscles?.length > 0) && (
        <div className="mb-4">
          <h4 className="text-xs font-sans font-semibold text-bark-light/60 mb-2">Muscles</h4>
          <div className="flex flex-wrap gap-1.5">
            {m.primary_muscles?.map((muscle) => (
              <Badge key={muscle} variant="solid">{formatLabel(muscle)}</Badge>
            ))}
            {m.secondary_muscles?.map((muscle) => (
              <Badge key={muscle} variant="outline">{formatLabel(muscle)}</Badge>
            ))}
          </div>
        </div>
      )}

      {m.plane_of_motion?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-sans font-semibold text-bark-light/60 mb-2">Plane of Motion</h4>
          <div className="flex flex-wrap gap-1.5">
            {m.plane_of_motion.map((p) => <Badge key={p} variant="slate">{formatLabel(p)}</Badge>)}
          </div>
        </div>
      )}

      {m.rep_ranges && (
        <div className="mb-4">
          <h4 className="text-xs font-sans font-semibold text-bark-light/60 mb-2">Rep Ranges</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REP_ORDER.map((key) => {
              if (!m.rep_ranges[key]) return null
              return (
                <div key={key} className="bg-cream-dark rounded-lg px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-bark-light/50 font-semibold">{key}</p>
                  <p className="text-sm text-bark font-medium">{m.rep_ranges[key]}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-2 border-t border-cream-dark">
        {renderLinkedMovements(m.progression_from_ids, 'Progresses From', '⬅')}
        {renderLinkedMovements(m.linked_movement_ids, 'Related', '🔗')}
        {renderLinkedMovements(m.progresses_to_ids, 'Progresses To', '➡')}
        {renderLinkedMovements(m.counter_movement_ids, 'Counter Movements', '↔')}
      </div>
    </div>
  )
}
