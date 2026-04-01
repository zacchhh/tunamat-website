import { useState, useCallback } from 'react'
import Header from './components/Header'
import ModeSelector from './components/ModeSelector'
import NodeGraph from './components/NodeGraph'
import SegmentTray from './components/SegmentTray'
import MovementDetail from './components/MovementDetail'
import ExportFlowModal from './components/ExportFlowModal'
import useMovements from './hooks/useMovements'

const MAX_PER_SEGMENT = 4

export default function App() {
  const { movements, movementMap, loading, error, retry } = useMovements()
  const [mode, setMode] = useState('category')
  const [segments, setSegments] = useState([])
  const [detailMovement, setDetailMovement] = useState(null)
  const [showExport, setShowExport] = useState(false)

  // Quick-add: add to last segment, auto-create if empty or last has >= MAX_PER_SEGMENT
  const quickAdd = useCallback((movement) => {
    setSegments((prev) => {
      const lastSeg = prev[prev.length - 1]
      if (!lastSeg || lastSeg.movements.length >= MAX_PER_SEGMENT) {
        const name = `Segment ${prev.length + 1}`
        return [...prev, { id: crypto.randomUUID(), name, movements: [movement] }]
      }
      return prev.map((s, i) => i === prev.length - 1 ? { ...s, movements: [...s.movements, movement] } : s)
    })
  }, [])

  // Full add-to-segment from detail panel
  const addToSegment = useCallback((movement, segIdx) => {
    setSegments((prev) => {
      if (segIdx === -1) {
        const name = `Segment ${prev.length + 1}`
        return [...prev, { id: crypto.randomUUID(), name, movements: [movement] }]
      }
      return prev.map((s, i) => i === segIdx ? { ...s, movements: [...s.movements, movement] } : s)
    })
  }, [])

  const exportFlow = useCallback(() => {
    setShowExport(true)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      <Header count={movements.length} />
      <ModeSelector mode={mode} onModeChange={setMode} />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-2"
              style={{ borderColor: '#A675FF', borderTopColor: 'transparent' }} />
            <p className="text-xs" style={{ color: '#5E5880' }}>Loading movements...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-xl px-5 py-4 text-center"
            style={{ backgroundColor: 'rgba(232,93,159,0.08)', border: '1px solid rgba(232,93,159,0.2)' }}>
            <p className="text-sm font-medium" style={{ color: '#E85D9F' }}>Failed to load</p>
            <p className="text-xs mt-1 mb-3" style={{ color: '#5E5880' }}>{error}</p>
            <button onClick={retry}
              className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
              style={{ backgroundColor: 'rgba(166,117,255,0.15)', border: '1px solid rgba(166,117,255,0.3)', color: '#A675FF' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.25)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.15)' }}>
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <NodeGraph
          movements={movements} movementMap={movementMap} mode={mode}
          segments={segments}
          onQuickAdd={quickAdd}
          onShowDetail={setDetailMovement}
        />
      )}

      <SegmentTray segments={segments} onUpdate={setSegments} onExport={exportFlow} />

      {/* Export flow modal */}
      {showExport && (
        <ExportFlowModal segments={segments} onClose={() => setShowExport(false)} />
      )}

      {/* Detail overlay */}
      {detailMovement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(10,8,20,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDetailMovement(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDetailMovement(null)}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer z-10 border-none"
              style={{ backgroundColor: '#221F3D', color: '#8B84A8', border: '1px solid rgba(160,120,255,0.2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#E85D9F' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8B84A8' }}
            >×</button>
            <MovementDetail
              movement={detailMovement}
              segments={segments}
              onAddToSegment={addToSegment}
            />
          </div>
        </div>
      )}
    </div>
  )
}
