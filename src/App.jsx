import { useState } from 'react'
import Header from './components/Header'
import ModeSelector from './components/ModeSelector'
import NodeGraph from './components/NodeGraph'
import useMovements from './hooks/useMovements'

export default function App() {
  const { movements, movementMap, loading, error } = useMovements()
  const [mode, setMode] = useState('category')

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header count={movements.length} />
      <ModeSelector mode={mode} onModeChange={setMode} />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-bark-light/60">Loading movements...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-clay-bg border border-clay/30 rounded-xl px-6 py-4 text-center">
            <p className="text-sm text-clay font-medium">Failed to load movements</p>
            <p className="text-xs text-clay/60 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <NodeGraph
          movements={movements}
          movementMap={movementMap}
          mode={mode}
        />
      )}
    </div>
  )
}
