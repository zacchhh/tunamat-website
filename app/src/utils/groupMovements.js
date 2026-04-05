const MODES = {
  region: {
    label: 'By Region',
    groupKey: 'region',
    hasSubregion: true,
    columnHeaders: ['Region', 'Subregion', 'Movements', 'Detail'],
  },
  equipment: {
    label: 'By Equipment',
    groupKey: 'equipment',
    hasSubregion: false,
    columnHeaders: ['Equipment', 'Movements', 'Detail'],
  },
  movement_pattern: {
    label: 'By Movement Pattern',
    groupKey: 'movement_pattern',
    hasSubregion: false,
    columnHeaders: ['Movement Pattern', 'Movements', 'Detail'],
  },
  starting_position: {
    label: 'By Starting Position',
    groupKey: 'starting_position',
    hasSubregion: false,
    columnHeaders: ['Starting Position', 'Movements', 'Detail'],
  },
  plane_of_motion: {
    label: 'By Plane of Motion',
    groupKey: 'plane_of_motion',
    hasSubregion: false,
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

function getSubregions(movements) {
  const groups = {}
  movements.forEach((m) => {
    const sub = m.sub_region || 'Other'
    if (!groups[sub]) groups[sub] = []
    groups[sub].push(m)
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, items, count: items.length }))
}

export { MODES, groupByKey, getSubregions, formatLabel }
