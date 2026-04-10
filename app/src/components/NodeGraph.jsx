import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import NodeCard from './NodeCard'
import { MODES, groupByKey, getSubregions } from '../utils/groupMovements'

const NODE_W = 210
const NODE_H = 46
const MOV_H = 66   // taller movement cards with action pills row
const PILL_H = 26
const PILL_W = 130
const PILL_GAP = 4
const NODE_GAP = 8
const COL_GAP = 80
const GRID_THRESHOLD = 10
const GRID_SUB_COL_GAP = 14
const ZOOM_MIN = 0.25
const ZOOM_MAX = 1.5
const ZOOM_STEP = 0.08
const GROUP_PAD = 12
const STACK_GAP = 22
const LABEL_H = 14
const PILL_MARGIN = 14
const LINKED_GAP = 30

function centerLayout(c, py, h = NODE_H) { const t = c * h + (c - 1) * NODE_GAP; const s = py - t / 2; return Array.from({ length: c }, (_, i) => ({ y: s + i * (h + NODE_GAP), xOffset: 0 })) }
function gridLayout(c, py, h = NODE_H) { const sc = c > 20 ? 3 : 2; const r = Math.ceil(c / sc); const t = r * h + (r - 1) * NODE_GAP; const s = py - t / 2; return Array.from({ length: c }, (_, i) => ({ y: s + Math.floor(i / sc) * (h + NODE_GAP), xOffset: (i % sc) * (NODE_W + GRID_SUB_COL_GAP) })) }
function smartLayout(c, py, h = NODE_H) { return c > GRID_THRESHOLD ? gridLayout(c, py, h) : centerLayout(c, py, h) }
function smartColWidth(c) { if (c <= GRID_THRESHOLD) return NODE_W; const sc = c > 20 ? 3 : 2; return sc * NODE_W + (sc - 1) * GRID_SUB_COL_GAP }
function isGridCol(c) { return c > GRID_THRESHOLD }

// From: adds above (vertical stack). To: adds below (vertical stack). Linked: adds right (direct child).
const PILL_DEFS = [
  { key: 'progression_from_ids', label: 'From', icon: '↑', pillColor: 'progress', action: 'up' },
  { key: 'progresses_to_ids', label: 'To', icon: '↓', pillColor: 'progress', action: 'down' },
  { key: 'linked_movement_ids', label: 'Linked', icon: '🔗', pillColor: 'linked', action: 'linked' },
]

export default function NodeGraph({ movements, movementMap, mode, onQuickAdd, onShowDetail }) {
  const config = MODES[mode]
  const containerRef = useRef(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panOrigin = useRef({ x: 0, y: 0 })
  const wasDrag = useRef(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedSubcat, setSelectedSubcat] = useState(null)

  const [anchorId, setAnchorId] = useState(null)
  const [upStack, setUpStack] = useState([])       // From ancestors (closest first)
  const [downStack, setDownStack] = useState([])    // To descendants (closest first)
  const [linkedChildren, setLinkedChildren] = useState({}) // { parentMovId: [childMovId] }
  const [openBranches, setOpenBranches] = useState({})

  const [containerH, setContainerH] = useState(600)
  const [smoothPan, setSmoothPan] = useState(false)

  useEffect(() => { const el = containerRef.current; if (el) setContainerH(el.clientHeight); const r = () => { if (el) setContainerH(el.clientHeight) }; window.addEventListener('resize', r); return () => window.removeEventListener('resize', r) }, [])

  const clearAll = () => { setAnchorId(null); setUpStack([]); setDownStack([]); setLinkedChildren({}); setOpenBranches({}) }
  useEffect(() => { setSelectedGroup(null); setSelectedSubcat(null); clearAll(); setPan({ x: 40, y: 0 }); setZoom(1) }, [mode])

  // Pan/zoom — mouse
  const handleMouseDown = useCallback((e) => { if (e.target.closest('[data-node]')) return; setSmoothPan(false); isPanning.current = true; wasDrag.current = false; panStart.current = { x: e.clientX, y: e.clientY }; panOrigin.current = { ...pan } }, [pan])
  const handleMouseMove = useCallback((e) => { if (!isPanning.current) return; const dx = e.clientX - panStart.current.x; const dy = e.clientY - panStart.current.y; if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDrag.current = true; setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy }) }, [])
  const handleMouseUp = useCallback(() => { isPanning.current = false; setTimeout(() => { wasDrag.current = false }, 0) }, [])
  useEffect(() => { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) } }, [handleMouseMove, handleMouseUp])
  const handleWheel = useCallback((e) => { e.preventDefault(); const r = containerRef.current?.getBoundingClientRect(); if (!r) return; const cx = e.clientX - r.left; const cy = e.clientY - r.top; const d = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP; const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + d)); const s = nz / zoom; setPan(p => ({ x: cx - s * (cx - p.x), y: cy - s * (cy - p.y) })); setZoom(nz) }, [zoom])
  useEffect(() => { const el = containerRef.current; if (!el) return; el.addEventListener('wheel', handleWheel, { passive: false }); return () => el.removeEventListener('wheel', handleWheel) }, [handleWheel])

  // Pan/zoom — touch (mobile)
  const lastTouchDist = useRef(null)
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1 && !e.target.closest('[data-node]')) {
      isPanning.current = true; wasDrag.current = false
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      panOrigin.current = { ...pan }
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [pan])
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isPanning.current) {
      e.preventDefault()
      const dx = e.touches[0].clientX - panStart.current.x
      const dy = e.touches[0].clientY - panStart.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDrag.current = true
      setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy })
    }
    if (e.touches.length === 2 && lastTouchDist.current != null) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const scale = dist / lastTouchDist.current
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
        const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * scale))
        const s = nz / zoom
        setPan(p => ({ x: cx - s * (cx - p.x), y: cy - s * (cy - p.y) }))
        setZoom(nz)
      }
      lastTouchDist.current = dist
    }
  }, [zoom])
  const handleTouchEnd = useCallback(() => {
    isPanning.current = false; lastTouchDist.current = null
    setTimeout(() => { wasDrag.current = false }, 0)
  }, [])
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    return () => { el.removeEventListener('touchstart', handleTouchStart); el.removeEventListener('touchmove', handleTouchMove); el.removeEventListener('touchend', handleTouchEnd) }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const safeClick = (fn) => () => { if (!wasDrag.current) fn() }
  const groups = config.flat ? [] : groupByKey(movements, config.groupKey)
  const subregions = selectedGroup && config.hasSubregion ? getSubregions(selectedGroup.items) : null
  let movementList = null
  if (config.flat) movementList = movements
  else if (config.hasSubregion && selectedSubcat) movementList = selectedSubcat.items
  else if (!config.hasSubregion && selectedGroup) movementList = selectedGroup.items
  if (movementList) movementList = [...movementList].sort((a, b) => a.name.localeCompare(b.name))
  const getValid = (mov, key) => (mov?.[key] || []).filter(id => movementMap[id])

  // All IDs in the tree
  const allTreeIds = useMemo(() => {
    const ids = new Set()
    if (anchorId) ids.add(anchorId)
    upStack.forEach(id => ids.add(id))
    downStack.forEach(id => ids.add(id))
    Object.values(linkedChildren).forEach(arr => arr.forEach(id => ids.add(id)))
    return ids
  }, [anchorId, upStack, downStack, linkedChildren])

  const selectFromList = (m) => { if (anchorId === m.id) clearAll(); else { setAnchorId(m.id); setUpStack([]); setDownStack([]); setLinkedChildren({}); setOpenBranches({}) } }
  const addUp = (id) => { setUpStack(p => [...p, id]); setOpenBranches({}) }
  const addDown = (id) => { setDownStack(p => [...p, id]); setOpenBranches({}) }
  const addLinkedChild = (parentId, childId) => {
    setLinkedChildren(prev => {
      const existing = prev[parentId] || []
      if (existing.includes(childId)) return prev
      return { ...prev, [parentId]: [...existing, childId] }
    })
    setOpenBranches(ob => ({ ...ob, [parentId]: null }))
  }
  // Recursively collect all descendant IDs from linkedChildren
  const collectDescendants = (id, lc) => {
    const desc = []
    const kids = lc[id] || []
    kids.forEach(cid => { desc.push(cid); desc.push(...collectDescendants(cid, lc)) })
    return desc
  }

  const removeUp = (idx) => {
    const removed = upStack.slice(idx)
    setUpStack(p => p.slice(0, idx))
    // Clean up all state for removed nodes and their linked descendants
    setLinkedChildren(prev => {
      const n = { ...prev }
      removed.forEach(id => { collectDescendants(id, prev).forEach(d => delete n[d]); delete n[id] })
      return n
    })
    setOpenBranches(ob => {
      const n = { ...ob }
      removed.forEach(id => { collectDescendants(id, linkedChildren).forEach(d => delete n[d]); delete n[id] })
      return n
    })
  }
  const removeDown = (idx) => {
    const removed = downStack.slice(idx)
    setDownStack(p => p.slice(0, idx))
    setLinkedChildren(prev => {
      const n = { ...prev }
      removed.forEach(id => { collectDescendants(id, prev).forEach(d => delete n[d]); delete n[id] })
      return n
    })
    setOpenBranches(ob => {
      const n = { ...ob }
      removed.forEach(id => { collectDescendants(id, linkedChildren).forEach(d => delete n[d]); delete n[id] })
      return n
    })
  }
  const removeLinkedChild = (parentId, childId) => {
    // Remove child and all its linked descendants
    const allToRemove = [childId, ...collectDescendants(childId, linkedChildren)]
    setLinkedChildren(prev => {
      const n = { ...prev, [parentId]: (prev[parentId] || []).filter(id => id !== childId) }
      allToRemove.forEach(id => delete n[id])
      return n
    })
    setOpenBranches(ob => {
      const n = { ...ob }
      allToRemove.forEach(id => delete n[id])
      return n
    })
  }
  const toggleBranch = (movId, key) => { setOpenBranches(ob => ({ ...ob, [movId]: ob[movId] === key ? null : key })) }

  // Full vertical stack: ancestors (top) → anchor → descendants (bottom)
  const fullStack = useMemo(() => {
    if (!anchorId) return []
    const s = []
    for (let i = upStack.length - 1; i >= 0; i--) s.push({ movId: upStack[i], role: 'ancestor' })
    s.push({ movId: anchorId, role: 'anchor' })
    for (let i = 0; i < downStack.length; i++) s.push({ movId: downStack[i], role: 'descendant' })
    return s
  }, [anchorId, upStack, downStack])

  // --- Layout ---
  const layout = useMemo(() => {
    const nodes = []; const lines = []; const groupBoxes = []; const labels = []
    const midY = containerH / 2
    let xCursor = 0
    const advanceCol = (w) => { const x = xCursor; xCursor += w + COL_GAP; return x }

    const placeItems = (items, pX, pW, pY, lv, type, color, getId, itemH = NODE_H, hideParentLine = false) => {
      const c = items.length; const pos = smartLayout(c, pY, itemH); const cw = smartColWidth(c); const bx = advanceCol(cw)
      if (isGridCol(c)) {
        const sc = c > 20 ? 3 : 2; const ch = Math.ceil(c / sc) * itemH + (Math.ceil(c / sc) - 1) * NODE_GAP
        groupBoxes.push({ x: bx - GROUP_PAD, y: pY - ch / 2 - GROUP_PAD, w: cw + GROUP_PAD * 2, h: ch + GROUP_PAD * 2 })
        if (!hideParentLine) lines.push({ x1: pX + pW, y1: pY, x2: bx - GROUP_PAD, y2: pY, color, dashed: true })
      }
      return items.map((item, i) => { const p = pos[i]; const n = { id: getId(item), x: bx + p.xOffset, y: p.y, data: item, type, level: lv }; nodes.push(n); if (!isGridCol(c) && !hideParentLine) lines.push({ x1: pX + pW, y1: pY, x2: n.x, y2: n.y + itemH / 2, color }); return n })
    }

    // Flat mode (All Movements): no group/subcat columns, render movements directly
    if (config.flat && movementList) {
      buildStack(movementList, 0, 0, midY, 0, true)
    } else {
      // Groups + subcats
      const gp = smartLayout(groups.length, midY); const gbx = advanceCol(smartColWidth(groups.length))
      const gns = groups.map((g, i) => { const n = { id: `group-${g.label}`, x: gbx + gp[i].xOffset, y: gp[i].y, data: g, type: 'group', level: 0 }; nodes.push(n); return n })
      const selGN = selectedGroup ? gns.find(n => n.data.label === selectedGroup.label) : null
      const selGY = selGN ? selGN.y + NODE_H / 2 : midY

      if (config.hasSubregion && subregions && selGN) {
        const sns = placeItems(subregions, selGN.x, NODE_W, selGY, 1, 'subcat', '#5A4F8060', s => `sub-${s.label}`)
        const selSN = selectedSubcat ? sns.find(n => n.data.label === selectedSubcat.label) : null
        if (movementList && selSN) buildStack(movementList, selSN.x, NODE_W, selSN.y + NODE_H / 2, 2)
      } else if (!config.hasSubregion && movementList && selGN) {
        buildStack(movementList, selGN.x, NODE_W, selGY, 1)
      }
    }

    function buildStack(movList, pX, pW, pY, lv, hideParentLine = false) {
      const anchor = anchorId ? movList.find(m => m.id === anchorId) : null
      if (!anchor) { placeItems(movList, pX, pW, pY, lv, 'movement', '#5A4F8050', m => `mov-${m.id}`, MOV_H, hideParentLine); return }

      const stackX = advanceCol(NODE_W)
      const anchorIdx = upStack.length
      const stepH = MOV_H + STACK_GAP

      // Place vertical stack nodes (ancestors + anchor + descendants)
      fullStack.forEach((entry, i) => {
        const off = i - anchorIdx
        const y = pY - MOV_H / 2 + off * stepH
        const mov = movementMap[entry.movId]; if (!mov) return
        nodes.push({ id: `stack-${entry.movId}`, x: stackX, y, data: mov, type: 'stackmov', level: lv + (entry.role === 'anchor' ? 0 : 1), role: entry.role })
        if (entry.role === 'anchor' && !hideParentLine) lines.push({ x1: pX + pW, y1: pY, x2: stackX, y2: y + MOV_H / 2, color: '#5A4F8050' })
        if (i < fullStack.length - 1) lines.push({ x1: stackX + NODE_W / 2, y1: y + MOV_H, x2: stackX + NODE_W / 2, y2: y + stepH, color: '#7B6FA830' })
        if (i > 0) {
          const labelY = y - (STACK_GAP - NODE_GAP) / 2 - LABEL_H / 2
          const isBelow = entry.role === 'descendant' || (entry.role === 'anchor' && i > 0)
          labels.push({ x: stackX, y: labelY, w: NODE_W, text: isBelow ? '↓' : '↑', type: 'arrow' })
        }
      })

      // Pills for top node (From only) and bottom node (To only) + Linked on any
      const topIdx = 0; const botIdx = fullStack.length - 1
      const topMovId = fullStack[topIdx]?.movId; const botMovId = fullStack[botIdx]?.movId

      fullStack.forEach((entry, i) => {
        const off = i - anchorIdx
        const nodeY = pY - MOV_H / 2 + off * stepH
        const mov = movementMap[entry.movId]; if (!mov) return
        const nodeCY = nodeY + MOV_H / 2
        const pillsX = stackX + NODE_W + PILL_MARGIN

        // From pill: centered above the top node
        if (i === topIdx) {
          const fromIds = getValid(mov, 'progression_from_ids').filter(id => !allTreeIds.has(id))
          if (fromIds.length > 0) {
            const pd = PILL_DEFS[0]; const bx = stackX + (NODE_W - PILL_W) / 2; const by = nodeY - 8 - PILL_H
            nodes.push({ id: `pill-${entry.movId}-${pd.key}`, x: bx, y: by, data: pd, type: 'branch', level: lv + 2, movId: entry.movId, pillColor: pd.pillColor })
            lines.push({ x1: stackX + NODE_W / 2, y1: nodeY, x2: bx + PILL_W / 2, y2: by + PILL_H, color: 'rgba(212,148,74,0.2)' })
          }
        }

        // To pill: centered below the bottom node
        if (i === botIdx) {
          const toIds = getValid(mov, 'progresses_to_ids').filter(id => !allTreeIds.has(id))
          if (toIds.length > 0) {
            const pd = PILL_DEFS[1]; const bx = stackX + (NODE_W - PILL_W) / 2; const by = nodeY + MOV_H + 8
            nodes.push({ id: `pill-${entry.movId}-${pd.key}`, x: bx, y: by, data: pd, type: 'branch', level: lv + 2, movId: entry.movId, pillColor: pd.pillColor })
            lines.push({ x1: stackX + NODE_W / 2, y1: nodeY + MOV_H, x2: bx + PILL_W / 2, y2: by, color: 'rgba(212,148,74,0.2)' })
          }
        }

        // Linked pill: to the right, only if no linked children yet
        const existingLinked = linkedChildren[entry.movId] || []
        if (existingLinked.length === 0) {
          const linkedIds = getValid(mov, 'linked_movement_ids').filter(id => !allTreeIds.has(id))
          if (linkedIds.length > 0) {
            const pd = PILL_DEFS[2]
            nodes.push({ id: `pill-${entry.movId}-${pd.key}`, x: pillsX, y: nodeCY - PILL_H / 2, data: pd, type: 'branch', level: lv + 2, movId: entry.movId, pillColor: pd.pillColor })
            lines.push({ x1: stackX + NODE_W, y1: nodeCY, x2: pillsX, y2: nodeCY, color: 'rgba(60,200,180,0.2)' })
          }
        }

        // Picker for open branch
        const openKey = openBranches[entry.movId]
        if (openKey) {
          const pillNode = nodes.find(n => n.id === `pill-${entry.movId}-${openKey}`)
          const pd = PILL_DEFS.find(p => p.key === openKey)
          if (pillNode && pd) {
            const resultMovs = getValid(mov, openKey).map(id => movementMap[id]).filter(Boolean)
            if (resultMovs.length > 0) {
              const lineColor = openKey === 'linked_movement_ids' ? 'rgba(60,200,180,0.25)' : 'rgba(245,160,64,0.25)'

              if (pd.action === 'up') {
                // From picker: stack options ABOVE the From pill, going upward
                const pX = stackX
                const totalH = resultMovs.length * MOV_H + (resultMovs.length - 1) * NODE_GAP
                const startY = pillNode.y - 12 - totalH
                resultMovs.forEach((m, idx) => {
                  const py = startY + idx * (MOV_H + NODE_GAP)
                  const already = allTreeIds.has(m.id)
                  nodes.push({ id: `pick-${entry.movId}-${openKey}-${m.id}`, x: pX, y: py, data: m, type: 'picker', level: lv + 3, parentMovId: entry.movId, branchKey: openKey, branchAction: pd.action, already })
                  lines.push({ x1: pillNode.x + PILL_W / 2, y1: pillNode.y, x2: pX + NODE_W / 2, y2: py + MOV_H, color: already ? 'rgba(90,80,128,0.15)' : lineColor })
                })
              } else if (pd.action === 'down') {
                // To picker: stack options BELOW the To pill, going downward
                const pX = stackX
                const startY = pillNode.y + PILL_H + 12
                resultMovs.forEach((m, idx) => {
                  const py = startY + idx * (MOV_H + NODE_GAP)
                  const already = allTreeIds.has(m.id)
                  nodes.push({ id: `pick-${entry.movId}-${openKey}-${m.id}`, x: pX, y: py, data: m, type: 'picker', level: lv + 3, parentMovId: entry.movId, branchKey: openKey, branchAction: pd.action, already })
                  lines.push({ x1: pillNode.x + PILL_W / 2, y1: pillNode.y + PILL_H, x2: pX + NODE_W / 2, y2: py, color: already ? 'rgba(90,80,128,0.15)' : lineColor })
                })
              } else {
                // Linked picker: to the right of the pill (existing behavior)
                const rX = pillNode.x + PILL_W + 16; const rCY = pillNode.y + PILL_H / 2
                const pos = smartLayout(resultMovs.length, rCY, MOV_H); const cw = smartColWidth(resultMovs.length)
                if (isGridCol(resultMovs.length)) {
                  const sc = resultMovs.length > 20 ? 3 : 2; const ch = Math.ceil(resultMovs.length / sc) * MOV_H + (Math.ceil(resultMovs.length / sc) - 1) * NODE_GAP
                  groupBoxes.push({ x: rX - GROUP_PAD, y: rCY - ch / 2 - GROUP_PAD, w: cw + GROUP_PAD * 2, h: ch + GROUP_PAD * 2 })
                  lines.push({ x1: pillNode.x + PILL_W, y1: rCY, x2: rX - GROUP_PAD, y2: rCY, color: lineColor, dashed: true })
                }
                resultMovs.forEach((m, idx) => {
                  const p = pos[idx]; const already = allTreeIds.has(m.id)
                  nodes.push({ id: `pick-${entry.movId}-${openKey}-${m.id}`, x: rX + p.xOffset, y: p.y, data: m, type: 'picker', level: lv + 3, parentMovId: entry.movId, branchKey: openKey, branchAction: pd.action, already })
                  if (!isGridCol(resultMovs.length)) lines.push({ x1: pillNode.x + PILL_W, y1: rCY, x2: rX + p.xOffset, y2: p.y + MOV_H / 2, color: already ? 'rgba(90,80,128,0.15)' : lineColor })
                })
              }
            }
          }
        }

        // Render persistent linked children with recursive pills
        if (existingLinked.length > 0) {
          const lcX = stackX + NODE_W + LINKED_GAP
          const totalH = existingLinked.length * MOV_H + (existingLinked.length - 1) * NODE_GAP
          const lcStartY = nodeCY - totalH / 2
          existingLinked.forEach((childId, ci) => {
            const childMov = movementMap[childId]; if (!childMov) return
            const cy = lcStartY + ci * (MOV_H + NODE_GAP)
            nodes.push({ id: `linked-${entry.movId}-${childId}`, x: lcX, y: cy, data: childMov, type: 'linkedchild', level: lv + 2, parentMovId: entry.movId })
            lines.push({ x1: stackX + NODE_W, y1: nodeCY, x2: lcX, y2: cy + MOV_H / 2, color: 'rgba(60,200,180,0.4)' })
            const midLX = (stackX + NODE_W + lcX) / 2
            const midLY = (nodeCY + cy + MOV_H / 2) / 2
            labels.push({ x: midLX - 10, y: midLY - LABEL_H / 2, w: 20, text: '↔', type: 'arrow' })
            // Recursive: place pills and children for this linked child
            placeLinkedNodePills(childId, lcX, cy, lv + 2)
          })
        }
      })
    }

    // Recursive pill placement for linked children
    function placeLinkedNodePills(movId, nodeX, nodeY, lv) {
      const mov = movementMap[movId]; if (!mov) return
      const nodeCY = nodeY + MOV_H / 2
      const pillsX = nodeX + NODE_W + PILL_MARGIN

      // Linked pill (only if no linked children yet for this node)
      const existingLC = linkedChildren[movId] || []
      if (existingLC.length === 0) {
        const linkedIds = getValid(mov, 'linked_movement_ids').filter(id => !allTreeIds.has(id))
        if (linkedIds.length > 0) {
          const pd = PILL_DEFS[2]
          nodes.push({ id: `pill-${movId}-${pd.key}`, x: pillsX, y: nodeCY - PILL_H / 2, data: pd, type: 'branch', level: lv + 1, movId, pillColor: pd.pillColor })
          lines.push({ x1: nodeX + NODE_W, y1: nodeCY, x2: pillsX, y2: nodeCY, color: 'rgba(60,200,180,0.2)' })
        }
      }

      // Picker for open branch on this linked child
      const openKey = openBranches[movId]
      if (openKey) {
        const pillNode = nodes.find(n => n.id === `pill-${movId}-${openKey}`)
        const pd = PILL_DEFS.find(p => p.key === openKey)
        if (pillNode && pd) {
          const resultMovs = getValid(mov, openKey).map(id => movementMap[id]).filter(Boolean)
          if (resultMovs.length > 0) {
            const rX = pillNode.x + PILL_W + 16; const rCY = pillNode.y + PILL_H / 2
            const pos = smartLayout(resultMovs.length, rCY, MOV_H)
            const lineColor = 'rgba(60,200,180,0.25)'
            resultMovs.forEach((m, idx) => {
              const p = pos[idx]; const already = allTreeIds.has(m.id)
              nodes.push({ id: `pick-${movId}-${openKey}-${m.id}`, x: rX + p.xOffset, y: p.y, data: m, type: 'picker', level: lv + 2, parentMovId: movId, branchKey: openKey, branchAction: 'linked', already })
              lines.push({ x1: pillNode.x + PILL_W, y1: rCY, x2: rX + p.xOffset, y2: p.y + MOV_H / 2, color: already ? 'rgba(90,80,128,0.15)' : lineColor })
            })
          }
        }
      }

      // Render this node's linked children recursively
      if (existingLC.length > 0) {
        const lcX = nodeX + NODE_W + LINKED_GAP
        const totalH = existingLC.length * MOV_H + (existingLC.length - 1) * NODE_GAP
        const lcStartY = nodeCY - totalH / 2
        existingLC.forEach((childId, ci) => {
          const childMov = movementMap[childId]; if (!childMov) return
          const cy = lcStartY + ci * (MOV_H + NODE_GAP)
          nodes.push({ id: `linked-${movId}-${childId}`, x: lcX, y: cy, data: childMov, type: 'linkedchild', level: lv + 1, parentMovId: movId })
          lines.push({ x1: nodeX + NODE_W, y1: nodeCY, x2: lcX, y2: cy + MOV_H / 2, color: 'rgba(60,200,180,0.4)' })
          const midLX = (nodeX + NODE_W + lcX) / 2; const midLY = (nodeCY + cy + MOV_H / 2) / 2
          labels.push({ x: midLX - 10, y: midLY - LABEL_H / 2, w: 20, text: '↔', type: 'arrow' })
          placeLinkedNodePills(childId, lcX, cy, lv + 1)
        })
      }
    }

    return { nodes, lines, groupBoxes, labels, totalWidth: xCursor }
  }, [groups, subregions, movementList, selectedGroup, selectedSubcat, anchorId, upStack, downStack, fullStack, linkedChildren, openBranches, allTreeIds, config, containerH, movementMap])

  const prevWidth = useRef(0)
  useEffect(() => { if (layout.totalWidth > prevWidth.current && containerRef.current) { const cw = containerRef.current.clientWidth; const tx = Math.min(40, cw / zoom - layout.totalWidth - 40); setPan(p => ({ x: tx * zoom, y: p.y })) }; prevWidth.current = layout.totalWidth }, [layout.totalWidth, zoom])

  // When a movement is selected as the anchor, recenter the viewport on it
  // so users don't have to manually pan back from a far-off grid position.
  useEffect(() => {
    if (!anchorId || !containerRef.current) return
    const anchorNode = layout.nodes.find(n => n.type === 'stackmov' && n.role === 'anchor')
    if (!anchorNode) return
    const cw = containerRef.current.clientWidth
    const ch = containerRef.current.clientHeight
    setSmoothPan(true)
    setPan({
      x: cw / 2 - (anchorNode.x + NODE_W / 2) * zoom,
      y: ch / 2 - (anchorNode.y + MOV_H / 2) * zoom,
    })
    const t = setTimeout(() => setSmoothPan(false), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorId])

  const clickGroup = (g) => { setSelectedGroup(selectedGroup?.label === g.label ? null : g); setSelectedSubcat(null); clearAll() }
  const clickSubcat = (s) => { setSelectedSubcat(selectedSubcat?.label === s.label ? null : s); clearAll() }

  // SVG
  const svgPaths = layout.lines.map((l, i) => { const cpx = Math.min(Math.abs(l.x2 - l.x1) * 0.4, 50); const cpy = Math.min(Math.abs(l.y2 - l.y1) * 0.4, 50); const v = Math.abs(l.x2 - l.x1) < Math.abs(l.y2 - l.y1); const d = v ? `M ${l.x1} ${l.y1} C ${l.x1} ${l.y1 + cpy * Math.sign(l.y2 - l.y1)}, ${l.x2} ${l.y2 - cpy * Math.sign(l.y2 - l.y1)}, ${l.x2} ${l.y2}` : `M ${l.x1} ${l.y1} C ${l.x1 + cpx} ${l.y1}, ${l.x2 - cpx} ${l.y2}, ${l.x2} ${l.y2}`; return <path key={i} d={d} fill="none" stroke={l.color} strokeWidth="2" strokeDasharray={l.dashed ? '6 4' : 'none'} /> })
  const svgBoxes = layout.groupBoxes.map((b, i) => <rect key={`b${i}`} x={b.x} y={b.y} width={b.w} height={b.h} rx={16} ry={16} fill="none" stroke="rgba(160,120,255,0.15)" strokeWidth="1.5" strokeDasharray="8 5" />)
  const svgBounds = useMemo(() => { let a = 0, b = 0, c = 1000, d = 1000; layout.nodes.forEach(n => { if (n.x < a) a = n.x; if (n.y < b) b = n.y; if (n.x + NODE_W > c) c = n.x + NODE_W; if (n.y + NODE_H > d) d = n.y + NODE_H }); layout.groupBoxes.forEach(g => { if (g.x < a) a = g.x; if (g.y < b) b = g.y; if (g.x + g.w > c) c = g.x + g.w; if (g.y + g.h > d) d = g.y + g.h }); return { minX: a - 120, minY: b - 120, w: c - a + 240, h: d - b + 240 } }, [layout.nodes, layout.groupBoxes])

  return (
    <div className="flex-1 overflow-hidden relative canvas-grab dot-grid" onMouseDown={handleMouseDown} ref={containerRef}>
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 select-none" style={{ backgroundColor: 'rgba(21,18,48,0.85)', border: '1px solid rgba(160,120,255,0.15)', backdropFilter: 'blur(8px)' }}>
        <button onClick={() => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP * 2))} className="text-xs font-bold cursor-pointer bg-transparent border-none w-5 h-5 flex items-center justify-center rounded" style={{ color: '#8B84A8' }} onMouseEnter={e => { e.currentTarget.style.color = '#A675FF' }} onMouseLeave={e => { e.currentTarget.style.color = '#8B84A8' }}>−</button>
        <span className="text-[10px] font-bold tabular-nums w-8 text-center" style={{ color: '#8B84A8' }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP * 2))} className="text-xs font-bold cursor-pointer bg-transparent border-none w-5 h-5 flex items-center justify-center rounded" style={{ color: '#8B84A8' }} onMouseEnter={e => { e.currentTarget.style.color = '#A675FF' }} onMouseLeave={e => { e.currentTarget.style.color = '#8B84A8' }}>+</button>
        <div style={{ width: 1, height: 12, backgroundColor: 'rgba(160,120,255,0.15)', margin: '0 2px' }} />
        <button onClick={() => { setZoom(1); setPan({ x: 40, y: 0 }) }} className="text-[10px] font-semibold cursor-pointer bg-transparent border-none rounded" style={{ color: '#5E5880' }} onMouseEnter={e => { e.currentTarget.style.color = '#A675FF' }} onMouseLeave={e => { e.currentTarget.style.color = '#5E5880' }}>Reset</button>
      </div>

      <div className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', transition: smoothPan ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}>
        <svg className="absolute pointer-events-none" style={{ left: svgBounds.minX, top: svgBounds.minY, width: svgBounds.w, height: svgBounds.h, overflow: 'visible' }} viewBox={`${svgBounds.minX} ${svgBounds.minY} ${svgBounds.w} ${svgBounds.h}`}>{svgBoxes}{svgPaths}</svg>

        {layout.labels.map((lbl, i) => (
          <div key={`l${i}`} className="absolute flex items-center justify-center pointer-events-none" style={{ left: lbl.x, top: lbl.y, width: lbl.w, height: LABEL_H }}>
            <span className={lbl.type === 'arrow' ? 'text-[14px] font-normal' : 'text-[9px] font-semibold uppercase tracking-wider'} style={{ color: '#7B6FA860' }}>{lbl.text}</span>
          </div>
        ))}

        {layout.nodes.map(node => {
          let onClick, subtitle, icon, count, qa, sd, variant, collapse, pillColor
          let w = NODE_W

          if (node.type === 'group') { onClick = safeClick(() => clickGroup(node.data)); count = node.data.count }
          else if (node.type === 'subcat') { onClick = safeClick(() => clickSubcat(node.data)); count = node.data.count }
          else if (node.type === 'movement') {
            onClick = safeClick(() => selectFromList(node.data))
            qa = () => onQuickAdd?.(node.data); sd = () => onShowDetail?.(node.data)
            if (anchorId === node.data.id) collapse = () => clearAll()
          }
          else if (node.type === 'stackmov') {
            qa = () => onQuickAdd?.(node.data); sd = () => onShowDetail?.(node.data); onClick = safeClick(() => {})
            if (node.role === 'ancestor') { const idx = upStack.indexOf(node.data.id); if (idx >= 0) collapse = () => removeUp(idx) }
            else if (node.role === 'descendant') { const idx = downStack.indexOf(node.data.id); if (idx >= 0) collapse = () => removeDown(idx) }
            else collapse = () => clearAll()
          }
          else if (node.type === 'branch') {
            variant = 'branch'; w = PILL_W; pillColor = node.pillColor
            icon = node.data.icon
            const mov = movementMap[node.movId]
            const allIds = mov ? getValid(mov, node.data.key) : []
            const availIds = allIds.filter(id => !allTreeIds.has(id))
            count = allIds.length
            onClick = safeClick(() => toggleBranch(node.movId, node.data.key))
          }
          else if (node.type === 'picker') {
            qa = () => onQuickAdd?.(node.data); sd = () => onShowDetail?.(node.data)
            if (node.already) {
              onClick = safeClick(() => {}) // can't add, already in tree
            } else {
              onClick = safeClick(() => {
                if (node.branchAction === 'up') addUp(node.data.id)
                else if (node.branchAction === 'down') addDown(node.data.id)
                else addLinkedChild(node.parentMovId, node.data.id)
              })
            }
          }
          else if (node.type === 'linkedchild') {
            qa = () => onQuickAdd?.(node.data); sd = () => onShowDetail?.(node.data)
            onClick = safeClick(() => {})
            collapse = () => removeLinkedChild(node.parentMovId, node.data.id)
          }

          const isActive =
            (node.type === 'group' && selectedGroup?.label === node.data.label) ||
            (node.type === 'subcat' && selectedSubcat?.label === node.data.label) ||
            (node.type === 'movement' && anchorId === node.data.id) ||
            (node.type === 'stackmov' && node.role === 'anchor') ||
            (node.type === 'branch' && openBranches[node.movId] === node.data.key)

          const zIdx = node.type === 'picker' ? 10 : undefined

          return (
            <div key={node.id} data-node className="absolute" style={{ left: node.x, top: node.y, width: w, zIndex: zIdx }}>
              <NodeCard label={node.data.label || node.data.name} count={count} active={isActive} level={node.level}
                onClick={onClick} icon={icon} onQuickAdd={node.already ? undefined : qa} onShowDetail={sd}
                variant={variant} onCollapse={collapse} pillColor={pillColor} dimmed={node.already}
                imageUrl={node.data.image_url} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
