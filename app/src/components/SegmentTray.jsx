import { useState, useRef, useCallback } from 'react'

export default function SegmentTray({ segments, onUpdate, onExport }) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  // Drag state — single ref tracks what's being dragged
  const dragState = useRef(null) // { type: 'movement'|'segment', segIdx, movIdx? }
  const [dropTarget, setDropTarget] = useState(null) // visual indicator: { segIdx, movIdx? }

  const totalMovements = segments.reduce((sum, s) => sum + s.movements.length, 0)

  const addSegment = () => {
    const name = `Segment ${segments.length + 1}`
    onUpdate([...segments, { id: crypto.randomUUID(), name, movements: [] }])
  }

  const removeSegment = (segIdx) => {
    onUpdate(segments.filter((_, i) => i !== segIdx))
  }

  const removeMovement = (segIdx, movIdx) => {
    onUpdate(segments.map((s, i) =>
      i !== segIdx ? s : { ...s, movements: s.movements.filter((_, j) => j !== movIdx) }
    ))
  }

  const startEditName = (seg) => { setEditingId(seg.id); setEditName(seg.name) }
  const saveName = () => {
    if (!editingId) return
    onUpdate(segments.map((s) => s.id === editingId ? { ...s, name: editName || s.name } : s))
    setEditingId(null)
  }

  // --- Movement drag ---
  const onMovDragStart = (e, segIdx, movIdx) => {
    e.stopPropagation()
    dragState.current = { type: 'movement', segIdx, movIdx }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', 'movement')
  }

  const onMovDragOver = useCallback((e, segIdx, movIdx) => {
    if (dragState.current?.type !== 'movement') return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ segIdx, movIdx })
  }, [])

  const onEmptyDragOver = useCallback((e, segIdx) => {
    if (dragState.current?.type !== 'movement') return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ segIdx, movIdx: -1 })
  }, [])

  const onMovDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragState.current || dragState.current.type !== 'movement' || !dropTarget) {
      dragState.current = null
      setDropTarget(null)
      return
    }

    const from = dragState.current
    const to = dropTarget
    const updated = segments.map((s) => ({ ...s, movements: [...s.movements] }))
    const [moved] = updated[from.segIdx].movements.splice(from.movIdx, 1)

    // Adjust target index if moving within the same segment and source was before target
    let insertIdx = to.movIdx === -1 ? updated[to.segIdx].movements.length : to.movIdx
    if (from.segIdx === to.segIdx && from.movIdx < insertIdx) {
      insertIdx = Math.max(0, insertIdx - 1)
    }
    updated[to.segIdx].movements.splice(insertIdx, 0, moved)

    onUpdate(updated)
    dragState.current = null
    setDropTarget(null)
  }, [segments, dropTarget, onUpdate])

  const onDragEnd = useCallback(() => {
    dragState.current = null
    setDropTarget(null)
  }, [])

  // --- Segment drag ---
  const onSegDragStart = (e, segIdx) => {
    dragState.current = { type: 'segment', segIdx }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', 'segment')
  }

  const onSegDragOver = useCallback((e, segIdx) => {
    if (dragState.current?.type !== 'segment') return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ segIdx })
  }, [])

  const onSegDrop = useCallback((e, segIdx) => {
    e.preventDefault()
    if (!dragState.current || dragState.current.type !== 'segment') return
    const fromIdx = dragState.current.segIdx
    if (fromIdx === segIdx) { dragState.current = null; setDropTarget(null); return }

    const updated = [...segments]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(segIdx, 0, moved)
    onUpdate(updated)
    dragState.current = null
    setDropTarget(null)
  }, [segments, onUpdate])

  return (
    <div
      className="shrink-0 z-30 relative border-t"
      style={{
        backgroundColor: 'rgba(21, 18, 48, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(160, 120, 255, 0.15)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs font-bold uppercase tracking-[0.15em] cursor-pointer flex items-center gap-2 bg-transparent border-none"
          style={{ color: '#8B84A8' }}
        >
          <span style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>▾</span>
          Flow Builder
        </button>

        <span className="text-[10px] font-medium tabular-nums" style={{ color: '#5E5880' }}>
          {segments.length} segment{segments.length !== 1 ? 's' : ''} · {totalMovements} movement{totalMovements !== 1 ? 's' : ''}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={addSegment}
            className="px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
            style={{ backgroundColor: 'rgba(60, 200, 180, 0.12)', border: '1px solid rgba(60, 200, 180, 0.3)', color: '#3CC8B4' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(60, 200, 180, 0.22)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(60, 200, 180, 0.12)' }}
          >
            + Add Segment
          </button>

          {totalMovements > 0 && (
            <button
              onClick={onExport}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
              style={{ backgroundColor: 'rgba(166, 117, 255, 0.15)', border: '1px solid rgba(166, 117, 255, 0.35)', color: '#A675FF' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166, 117, 255, 0.28)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166, 117, 255, 0.15)' }}
            >
              Export Flow
            </button>
          )}
        </div>
      </div>

      {/* Segments area */}
      {!collapsed && (
        <div className="flex gap-3 px-4 pb-3 overflow-x-auto" style={{ minHeight: segments.length > 0 ? 100 : 0 }}>
          {segments.map((seg, segIdx) => {
            const isSegDropTarget = dropTarget?.segIdx === segIdx && dragState.current?.type === 'segment'
            return (
              <div
                key={seg.id}
                className="shrink-0 rounded-xl flex flex-col transition-all"
                style={{
                  backgroundColor: '#1E1B35',
                  border: isSegDropTarget
                    ? '1.5px solid rgba(166, 117, 255, 0.5)'
                    : '1px solid rgba(160, 120, 255, 0.15)',
                  width: 220,
                  minHeight: 80,
                  boxShadow: isSegDropTarget ? '0 0 12px rgba(166,117,255,0.15)' : 'none',
                }}
                onDragOver={(e) => {
                  onSegDragOver(e, segIdx)
                  onEmptyDragOver(e, segIdx)
                }}
                onDrop={(e) => {
                  if (dragState.current?.type === 'segment') onSegDrop(e, segIdx)
                  else onMovDrop(e)
                }}
              >
                {/* Segment header */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'rgba(160,120,255,0.1)' }}>
                  <span
                    className="cursor-grab text-[10px] select-none"
                    style={{ color: '#5E5880' }}
                    title="Drag to reorder segment"
                    draggable
                    onDragStart={(e) => onSegDragStart(e, segIdx)}
                    onDragEnd={onDragEnd}
                  >⠿</span>
                  {editingId === seg.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={(e) => e.key === 'Enter' && saveName()}
                      autoFocus
                      className="bg-transparent border-none outline-none text-xs font-semibold flex-1 min-w-0"
                      style={{ color: '#E8E4F0' }}
                    />
                  ) : (
                    <span
                      className="text-xs font-semibold flex-1 min-w-0 truncate cursor-pointer"
                      style={{ color: '#E8E4F0' }}
                      onDoubleClick={() => startEditName(seg)}
                      title="Double-click to rename"
                    >
                      {seg.name}
                    </span>
                  )}
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(166,117,255,0.1)', color: '#8B84A8' }}>
                    {seg.movements.length}
                  </span>
                  <button
                    onClick={() => removeSegment(segIdx)}
                    className="text-[10px] cursor-pointer bg-transparent border-none leading-none"
                    style={{ color: '#5E588080' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#E85D9F' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#5E588080' }}
                    title="Remove segment"
                  >✕</button>
                </div>

                {/* Movement list */}
                <div className="flex-1 flex flex-col gap-1 p-2 min-h-[40px]">
                  {seg.movements.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[10px] italic" style={{ color: '#5E588060' }}>Drop movements here</span>
                    </div>
                  )}
                  {seg.movements.map((mov, movIdx) => {
                    const isMovDropTarget = dropTarget?.segIdx === segIdx && dropTarget?.movIdx === movIdx && dragState.current?.type === 'movement'
                    return (
                      <div
                        key={`${mov.id}-${movIdx}`}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 cursor-grab group transition-all"
                        style={{
                          backgroundColor: isMovDropTarget ? 'rgba(166,117,255,0.15)' : 'rgba(160,120,255,0.06)',
                          border: isMovDropTarget
                            ? '1.5px solid rgba(166,117,255,0.4)'
                            : '1px solid rgba(160,120,255,0.1)',
                        }}
                        draggable
                        onDragStart={(e) => onMovDragStart(e, segIdx, movIdx)}
                        onDragOver={(e) => onMovDragOver(e, segIdx, movIdx)}
                        onDrop={onMovDrop}
                        onDragEnd={onDragEnd}
                      >
                        <span className="text-[9px] select-none" style={{ color: '#5E5880' }}>⠿</span>
                        {mov.image_url && (
                          <div
                            className="shrink-0 rounded overflow-hidden flex items-center justify-center"
                            style={{ width: 28, height: 28, backgroundColor: 'rgba(160,120,255,0.08)', border: '1px solid rgba(160,120,255,0.1)' }}
                          >
                            <img
                              src={mov.image_url}
                              alt=""
                              loading="lazy"
                              draggable={false}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium truncate" style={{ color: '#E8E4F0' }}>{mov.name}</div>
                          <div className="text-[9px] truncate" style={{ color: '#5E5880' }}>{mov.region}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMovement(segIdx, movIdx) }}
                          className="text-[9px] cursor-pointer bg-transparent border-none leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: '#5E5880' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#E85D9F' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#5E5880' }}
                        >✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {segments.length === 0 && (
            <div className="flex items-center justify-center w-full py-4">
              <span className="text-xs" style={{ color: '#5E588080' }}>Add a segment to start building your flow</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
