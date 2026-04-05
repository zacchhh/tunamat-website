import { useState } from 'react'
import Badge from './Badge'
import { formatLabel } from '../utils/groupMovements'

const REP_ORDER = ['recovery', 'low', 'moderate', 'high', 'peak']

export default function MovementDetail({ movement, nodeRef, segments, onAddToSegment }) {
  const m = movement
  const [showPicker, setShowPicker] = useState(false)
  const [added, setAdded] = useState(false)
  if (!m) return null

  const handleAdd = (segIdx) => {
    onAddToSegment?.(m, segIdx)
    setShowPicker(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div
      ref={nodeRef}
      className="rounded-2xl w-[320px] p-5 select-none relative"
      style={{
        backgroundColor: '#1E1B35',
        border: '1px solid rgba(160, 120, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(10,8,20,0.5), 0 0 24px rgba(120,80,255,0.06)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-semibold leading-snug mb-0.5" style={{ color: '#E8E4F0' }}>
        {m.name}
      </h3>
      <p className="text-[11px] font-medium mb-3" style={{ color: '#5E5880' }}>
        {m.region} · {m.sub_region}
      </p>

      {m.also_known_as?.length > 0 && (
        <p className="text-[11px] italic mb-3" style={{ color: '#5E5880' }}>
          aka {m.also_known_as.join(', ')}
        </p>
      )}

      {m.description && (
        <p className="text-xs leading-relaxed mb-3" style={{ color: '#8B84A8' }}>{m.description}</p>
      )}

      {m.notes && (
        <div
          className="rounded-xl p-3 mb-3"
          style={{
            backgroundColor: 'rgba(60, 200, 180, 0.06)',
            border: '1px solid rgba(60, 200, 180, 0.15)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#3CC8B4' }}>Tip</p>
          <p className="text-xs leading-relaxed" style={{ color: '#8B84A8' }}>{m.notes}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {m.starting_position && <Badge variant="orange">{formatLabel(m.starting_position)}</Badge>}
        {m.equipment?.map((e) => <Badge key={e} variant="gold">{formatLabel(e)}</Badge>)}
        {m.is_hold && <Badge variant="green">Hold</Badge>}
        {m.movement_pattern?.map((mp) => <Badge key={mp} variant="teal">{mp}</Badge>)}
      </div>

      {(m.primary_muscles?.length > 0 || m.secondary_muscles?.length > 0) && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: '#5E5880' }}>Muscles</p>
          <div className="flex flex-wrap gap-1.5">
            {m.primary_muscles?.map((muscle) => (
              <Badge key={muscle} variant="purple">{formatLabel(muscle)}</Badge>
            ))}
            {m.secondary_muscles?.map((muscle) => (
              <Badge key={muscle} variant="muted">{formatLabel(muscle)}</Badge>
            ))}
          </div>
        </div>
      )}

      {m.plane_of_motion?.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: '#5E5880' }}>Plane</p>
          <div className="flex flex-wrap gap-1.5">
            {m.plane_of_motion.map((p) => <Badge key={p} variant="teal">{formatLabel(p)}</Badge>)}
          </div>
        </div>
      )}

      {m.rep_ranges && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5" style={{ color: '#5E5880' }}>Reps</p>
          <div className="grid grid-cols-3 gap-1.5">
            {REP_ORDER.map((key) => {
              if (!m.rep_ranges[key]) return null
              return (
                <div
                  key={key}
                  className="rounded-lg px-2 py-1.5 text-center"
                  style={{ backgroundColor: 'rgba(160,120,255,0.06)', border: '1px solid rgba(160,120,255,0.08)' }}
                >
                  <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: '#5E5880' }}>{key}</p>
                  <p className="text-[11px] font-semibold" style={{ color: '#E8E4F0' }}>{m.rep_ranges[key]}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add to Segment button */}
      {onAddToSegment && (
        <div className="relative">
          <button
            onClick={() => {
              if (segments?.length === 0) {
                onAddToSegment(m, -1) // -1 signals "create new segment"
                setAdded(true)
                setTimeout(() => setAdded(false), 1200)
              } else {
                setShowPicker(!showPicker)
              }
            }}
            className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: added ? 'rgba(52,199,89,0.15)' : 'rgba(60, 200, 180, 0.1)',
              border: `1px solid ${added ? 'rgba(52,199,89,0.35)' : 'rgba(60, 200, 180, 0.25)'}`,
              color: added ? '#34C759' : '#3CC8B4',
            }}
            onMouseEnter={(e) => { if (!added) e.currentTarget.style.backgroundColor = 'rgba(60, 200, 180, 0.2)' }}
            onMouseLeave={(e) => { if (!added) e.currentTarget.style.backgroundColor = 'rgba(60, 200, 180, 0.1)' }}
          >
            {added ? '✓ Added' : '+ Add to Segment'}
          </button>

          {showPicker && segments?.length > 0 && (
            <div
              className="absolute bottom-full left-0 right-0 mb-1 rounded-xl p-1.5 z-10"
              style={{
                backgroundColor: '#221F3D',
                border: '1px solid rgba(160,120,255,0.25)',
                boxShadow: '0 -4px 20px rgba(10,8,20,0.5)',
              }}
            >
              {segments.map((seg, idx) => (
                <button
                  key={seg.id}
                  onClick={() => handleAdd(idx)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
                  style={{ color: '#E8E4F0', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.12)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {seg.name}
                  <span className="ml-1.5" style={{ color: '#5E5880' }}>({seg.movements.length})</span>
                </button>
              ))}
              <button
                onClick={() => handleAdd(-1)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all mt-0.5"
                style={{
                  color: '#3CC8B4',
                  backgroundColor: 'transparent',
                  borderTop: '1px solid rgba(160,120,255,0.1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(60,200,180,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                + New Segment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
