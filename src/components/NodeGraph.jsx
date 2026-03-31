import { useState, useRef, useEffect, createRef, useCallback } from 'react'
import NodeCard from './NodeCard'
import NodeConnector from './NodeConnector'
import MovementDetail from './MovementDetail'
import { MODES, groupByKey, getSubcategories } from '../utils/groupMovements'

const CONNECTOR_COLORS = ['#7a8b6f', '#8b7355', '#5a7080', '#9b7a6a']

export default function NodeGraph({ movements, movementMap, mode }) {
  const config = MODES[mode]
  const containerRef = useRef(null)

  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedSubcat, setSelectedSubcat] = useState(null)
  const [selectedMovement, setSelectedMovement] = useState(null)

  // Reset selections when mode changes
  useEffect(() => {
    setSelectedGroup(null)
    setSelectedSubcat(null)
    setSelectedMovement(null)
  }, [mode])

  // Build groups
  const groups = groupByKey(movements, config.groupKey)

  // Build subcategories
  const subcategories = selectedGroup && config.hasSubcategory
    ? getSubcategories(selectedGroup.items)
    : null

  // Build movement list depending on path
  let movementList = null
  if (config.hasSubcategory && selectedSubcat) {
    movementList = selectedSubcat.items
  } else if (!config.hasSubcategory && selectedGroup) {
    movementList = selectedGroup.items
  }

  // Refs for connector lines
  const groupRefs = useRef({})
  const subcatRefs = useRef({})
  const movementRefs = useRef({})

  const getRef = (store, key) => {
    if (!store.current[key]) store.current[key] = createRef()
    return store.current[key]
  }

  // Active group ref
  const activeGroupRef = selectedGroup ? getRef(groupRefs, selectedGroup.label) : null
  // Active subcat ref
  const activeSubcatRef = selectedSubcat ? getRef(subcatRefs, selectedSubcat.label) : null

  // Child refs for connector from group to subcats/movements
  const getChildRefsForGroup = useCallback(() => {
    if (config.hasSubcategory && subcategories) {
      return subcategories.map((s) => getRef(subcatRefs, s.label))
    }
    if (!config.hasSubcategory && movementList) {
      return movementList.map((m) => getRef(movementRefs, m.id))
    }
    return []
  }, [config.hasSubcategory, subcategories, movementList])

  const getChildRefsForSubcat = useCallback(() => {
    if (movementList) {
      return movementList.map((m) => getRef(movementRefs, m.id))
    }
    return []
  }, [movementList])

  const handleNavigate = (movement) => {
    // Navigate to a linked movement: find its group and subcat
    const groupKey = config.groupKey
    const values = Array.isArray(movement[groupKey]) ? movement[groupKey] : [movement[groupKey]]
    const targetGroupLabel = values[0]?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    const targetGroup = groups.find((g) => g.label === targetGroupLabel)
    if (targetGroup) {
      setSelectedGroup(targetGroup)
      if (config.hasSubcategory) {
        const subs = getSubcategories(targetGroup.items)
        const targetSub = subs.find((s) => s.items.some((m) => m.id === movement.id))
        setSelectedSubcat(targetSub || null)
      }
    }
    setSelectedMovement(movement)
  }

  const columnHeaders = config.columnHeaders

  return (
    <div className="relative flex-1 overflow-x-auto" ref={containerRef}>
      <div className="flex gap-0 min-h-[calc(100vh-140px)] p-6 min-w-max">
        {/* Column 1: Groups */}
        <Column header={columnHeaders[0]} level={0}>
          {groups.map((group) => (
            <NodeCard
              key={group.label}
              label={group.label}
              count={group.count}
              active={selectedGroup?.label === group.label}
              level={0}
              nodeRef={getRef(groupRefs, group.label)}
              onClick={() => {
                setSelectedGroup(selectedGroup?.label === group.label ? null : group)
                setSelectedSubcat(null)
                setSelectedMovement(null)
              }}
            />
          ))}
        </Column>

        {/* Connector: Group → next column */}
        {selectedGroup && (
          <NodeConnector
            parentRef={activeGroupRef}
            childRefs={getChildRefsForGroup()}
            color={CONNECTOR_COLORS[0]}
            containerRef={containerRef}
          />
        )}

        {/* Column 2: Subcategories (only for category mode) */}
        {config.hasSubcategory && subcategories && (
          <Column header={columnHeaders[1]} level={1}>
            {subcategories.map((sub) => (
              <NodeCard
                key={sub.label}
                label={sub.label}
                count={sub.count}
                active={selectedSubcat?.label === sub.label}
                level={1}
                nodeRef={getRef(subcatRefs, sub.label)}
                onClick={() => {
                  setSelectedSubcat(selectedSubcat?.label === sub.label ? null : sub)
                  setSelectedMovement(null)
                }}
              />
            ))}
          </Column>
        )}

        {/* Connector: Subcat → movements */}
        {config.hasSubcategory && selectedSubcat && (
          <NodeConnector
            parentRef={activeSubcatRef}
            childRefs={getChildRefsForSubcat()}
            color={CONNECTOR_COLORS[1]}
            containerRef={containerRef}
          />
        )}

        {/* Column: Movements */}
        {movementList && (
          <Column header={config.hasSubcategory ? columnHeaders[2] : columnHeaders[1]} level={config.hasSubcategory ? 2 : 1}>
            {movementList
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((m) => (
                <NodeCard
                  key={m.id}
                  label={m.name}
                  active={selectedMovement?.id === m.id}
                  level={config.hasSubcategory ? 2 : 1}
                  nodeRef={getRef(movementRefs, m.id)}
                  onClick={() => {
                    setSelectedMovement(selectedMovement?.id === m.id ? null : m)
                  }}
                />
              ))}
          </Column>
        )}

        {/* Column: Detail */}
        {selectedMovement && (
          <Column header={columnHeaders[columnHeaders.length - 1]} level={3} wide>
            <MovementDetail
              movement={selectedMovement}
              movementMap={movementMap}
              onNavigate={handleNavigate}
            />
          </Column>
        )}
      </div>
    </div>
  )
}

function Column({ header, level, children, wide }) {
  const LEVEL_ACCENT = [
    'border-sage/30',
    'border-earth-light/30',
    'border-slate-light/30',
    'border-clay-light/30',
  ]

  return (
    <div
      className={`shrink-0 ${wide ? 'w-[420px]' : 'w-[240px]'} flex flex-col gap-2 px-4 animate-slideIn`}
      style={{ animationDelay: `${level * 50}ms` }}
    >
      <div className={`text-xs font-sans font-semibold uppercase tracking-wider text-bark-light/50 pb-2 mb-1 border-b-2 ${LEVEL_ACCENT[level % LEVEL_ACCENT.length]}`}>
        {header}
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pb-4">
        {children}
      </div>
    </div>
  )
}
