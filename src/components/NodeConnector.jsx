import { useEffect, useState, useCallback } from 'react'

export default function NodeConnector({ parentRef, childRefs, color = '#7a8b6f', containerRef }) {
  const [paths, setPaths] = useState([])

  const updatePaths = useCallback(() => {
    if (!parentRef?.current || !containerRef?.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const parentRect = parentRef.current.getBoundingClientRect()

    const newPaths = []
    childRefs.forEach((ref) => {
      if (!ref?.current) return
      const childRect = ref.current.getBoundingClientRect()

      const x1 = parentRect.right - containerRect.left
      const y1 = parentRect.top + parentRect.height / 2 - containerRect.top
      const x2 = childRect.left - containerRect.left
      const y2 = childRect.top + childRect.height / 2 - containerRect.top

      const cpOffset = Math.min(Math.abs(x2 - x1) * 0.5, 60)

      newPaths.push({
        d: `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`,
        key: `${y1}-${y2}`,
      })
    })
    setPaths(newPaths)
  }, [parentRef, childRefs, containerRef])

  useEffect(() => {
    updatePaths()
    const observer = new ResizeObserver(updatePaths)
    if (containerRef?.current) observer.observe(containerRef.current)
    window.addEventListener('scroll', updatePaths, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updatePaths, true)
    }
  }, [updatePaths, containerRef])

  if (paths.length === 0) return null

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
      {paths.map((p) => (
        <path
          key={p.key}
          d={p.d}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.3"
        />
      ))}
    </svg>
  )
}
