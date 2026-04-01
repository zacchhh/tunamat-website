import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'

const INTENSITIES = ['recovery', 'low', 'moderate', 'high', 'peak']

function buildFlowPayload(name, description, intensity, segments) {
  return {
    name,
    description: description || null,
    intensity,
    tags: [],
    category: null,
    equipment: [...new Set(segments.flatMap(s => s.movements.flatMap(m => m.equipment || [])))],
    segments: segments.map((seg, segIdx) => ({
      order: segIdx,
      focus: seg.name,
      duration: seg.movements.length * 60,
      movements: seg.movements.map((mov, movIdx) => ({
        movementId: mov.id,
        order: movIdx,
        pacing: { preset: intensity },
        notes: null,
      })),
    })),
  }
}

export default function ExportFlowModal({ segments, onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'saving' | 'success'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [intensity, setIntensity] = useState('moderate')
  const [error, setError] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef(null)

  const deepLink = savedId ? `tunamat://import/${savedId}` : ''

  // Render QR code when we have a deep link
  useEffect(() => {
    if (!deepLink || !qrRef.current) return
    QRCode.toCanvas(qrRef.current, deepLink, {
      width: 180,
      margin: 2,
      color: { dark: '#E8E4F0', light: '#1E1B35' },
    })
  }, [deepLink])

  const handleExport = async () => {
    if (!name.trim()) { setError('Flow name is required'); return }

    const hasMovements = segments.some(s => s.movements.length > 0)
    if (!hasMovements) { setError('Add at least 1 movement to a segment'); return }

    setError(null)
    setStep('saving')

    const payload = buildFlowPayload(name.trim(), description.trim(), intensity, segments)

    const { data, error: dbError } = await supabase
      .from('shared_flows')
      .insert({ name: payload.name, description: payload.description, flow_json: payload })
      .select('id')
      .single()

    if (dbError) {
      setError(dbError.message)
      setStep('form')
      return
    }

    setSavedId(data.id)
    setStep('success')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(deepLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadJSON = () => {
    const payload = buildFlowPayload(name.trim(), description.trim(), intensity, segments)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim().replace(/\s+/g, '-').toLowerCase()}-flow.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10,8,20,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl p-6 w-full max-w-md"
        style={{ backgroundColor: '#1E1B35', border: '1px solid rgba(160,120,255,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer border-none"
          style={{ backgroundColor: '#221F3D', color: '#8B84A8' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#E85D9F' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8B84A8' }}
        >
          x
        </button>

        {step === 'form' && (
          <>
            <h2 className="text-base font-bold mb-4" style={{ color: '#E8E4F0' }}>Export Flow</h2>

            {/* Name */}
            <label className="block mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: '#8B84A8' }}>
                Flow Name *
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Stretch"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'rgba(160,120,255,0.06)',
                  border: '1px solid rgba(160,120,255,0.2)',
                  color: '#E8E4F0',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(166,117,255,0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(160,120,255,0.2)' }}
              />
            </label>

            {/* Description */}
            <label className="block mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: '#8B84A8' }}>
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{
                  backgroundColor: 'rgba(160,120,255,0.06)',
                  border: '1px solid rgba(160,120,255,0.2)',
                  color: '#E8E4F0',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(166,117,255,0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(160,120,255,0.2)' }}
              />
            </label>

            {/* Intensity */}
            <label className="block mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: '#8B84A8' }}>
                Intensity
              </span>
              <div className="flex gap-1.5">
                {INTENSITIES.map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all capitalize border-none"
                    style={{
                      backgroundColor: intensity === level ? 'rgba(166,117,255,0.25)' : 'rgba(160,120,255,0.06)',
                      border: intensity === level ? '1px solid rgba(166,117,255,0.5)' : '1px solid rgba(160,120,255,0.15)',
                      color: intensity === level ? '#A675FF' : '#5E5880',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </label>

            {error && (
              <p className="text-xs mb-3 font-medium" style={{ color: '#E85D9F' }}>{error}</p>
            )}

            <button
              onClick={handleExport}
              className="w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all border-none"
              style={{ backgroundColor: 'rgba(166,117,255,0.2)', border: '1px solid rgba(166,117,255,0.4)', color: '#A675FF' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.35)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.2)' }}
            >
              Export Flow
            </button>
          </>
        )}

        {step === 'saving' && (
          <div className="flex flex-col items-center py-8">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin mb-3"
              style={{ borderColor: '#A675FF', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: '#8B84A8' }}>Saving flow...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center">
            <h2 className="text-base font-bold mb-1" style={{ color: '#E8E4F0' }}>Flow Exported</h2>
            <p className="text-xs mb-4" style={{ color: '#5E5880' }}>Scan the QR code or copy the link to import in TunaMat</p>

            {/* QR Code */}
            <canvas ref={qrRef} className="rounded-xl mb-4" />

            {/* Deep link display */}
            <div
              className="w-full rounded-lg px-3 py-2 mb-3 text-center text-xs font-mono select-all break-all"
              style={{ backgroundColor: 'rgba(160,120,255,0.06)', border: '1px solid rgba(160,120,255,0.15)', color: '#A675FF' }}
            >
              {deepLink}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 w-full">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border-none"
                style={{
                  backgroundColor: copied ? 'rgba(60,200,180,0.2)' : 'rgba(166,117,255,0.2)',
                  border: copied ? '1px solid rgba(60,200,180,0.4)' : '1px solid rgba(166,117,255,0.4)',
                  color: copied ? '#3CC8B4' : '#A675FF',
                }}
                onMouseEnter={(e) => { if (!copied) e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.35)' }}
                onMouseLeave={(e) => { if (!copied) e.currentTarget.style.backgroundColor = 'rgba(166,117,255,0.2)' }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <button
                onClick={handleDownloadJSON}
                className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border-none"
                style={{ backgroundColor: 'rgba(60,200,180,0.12)', border: '1px solid rgba(60,200,180,0.3)', color: '#3CC8B4' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(60,200,180,0.22)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(60,200,180,0.12)' }}
              >
                Download JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
