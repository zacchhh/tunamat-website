import { useState, useEffect } from 'react'

const API_URL = 'https://hhfexwrpsepoojekvcoz.supabase.co/functions/v1/movements'

export default function useMovements() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchMovements() {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setMovements(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }
    fetchMovements()
    return () => { cancelled = true }
  }, [])

  const movementMap = {}
  movements.forEach((m) => { movementMap[m.id] = m })

  return { movements, movementMap, loading, error }
}
