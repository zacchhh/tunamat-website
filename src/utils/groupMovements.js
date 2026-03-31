const MODES = {
  category: {
    label: 'By Muscle Group',
    groupKey: 'category',
    hasSubcategory: true,
    columnHeaders: ['Muscle Group', 'Subcategory', 'Movements', 'Detail'],
  },
  equipment: {
    label: 'By Equipment',
    groupKey: 'equipment',
    hasSubcategory: false,
    columnHeaders: ['Equipment', 'Movements', 'Detail'],
  },
  movement_pattern: {
    label: 'By Movement Pattern',
    groupKey: 'movement_pattern',
    hasSubcategory: false,
    columnHeaders: ['Movement Pattern', 'Movements', 'Detail'],
  },
  starting_position: {
    label: 'By Starting Position',
    groupKey: 'starting_position',
    hasSubcategory: false,
    columnHeaders: ['Starting Position', 'Movements', 'Detail'],
  },
  plane_of_motion: {
    label: 'By Plane of Motion',
    groupKey: 'plane_of_motion',
    hasSubcategory: false,
    columnHeaders: ['Plane of Motion', 'Movements', 'Detail'],
  },
}

function formatLabel(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function groupByKey(movements, key) {
  const groups = {}
  movements.forEach((m) => {
    const values = Array.isArray(m[key]) ? m[key] : [m[key]]
    values.forEach((val) => {
      if (!val) return
      const label = formatLabel(val)
      if (!groups[label]) groups[label] = []
      groups[label].push(m)
    })
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, items, count: items.length }))
}

function getSubcategories(movements) {
  const groups = {}
  movements.forEach((m) => {
    const sub = m.subcategory || 'Other'
    if (!groups[sub]) groups[sub] = []
    groups[sub].push(m)
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, items, count: items.length }))
}

export { MODES, groupByKey, getSubcategories, formatLabel }
