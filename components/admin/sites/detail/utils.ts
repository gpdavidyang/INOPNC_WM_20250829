'use client'

export function filteredAndSortedAssignments(
  assignments: any[],
  laborByUser: Record<string, number>,
  query: string,
  sort: string,
  role: string
) {
  let filtered = [...(assignments || [])]

  // Filter
  if (query.trim()) {
    const q = query.toLowerCase()
    filtered = filtered.filter(a => {
      const name = (a?.profile?.full_name || '').toLowerCase()
      const email = (a?.profile?.email || '').toLowerCase()
      const company = (a?.profile?.organization?.name || '').toLowerCase()
      return name.includes(q) || email.includes(q) || company.includes(q)
    })
  }

  if (role !== 'all') {
    filtered = filtered.filter(a => a.role === role)
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sort) {
      case 'name_asc':
        return (a?.profile?.full_name || '').localeCompare(b?.profile?.full_name || '')
      case 'name_desc':
        return (b?.profile?.full_name || '').localeCompare(a?.profile?.full_name || '')
      case 'labor_desc':
        return (laborByUser[b.user_id] || 0) - (laborByUser[a.user_id] || 0)
      case 'labor_asc':
        return (laborByUser[a.user_id] || 0) - (laborByUser[b.user_id] || 0)
      case 'date_asc':
        return new Date(a.assigned_date).getTime() - new Date(b.assigned_date).getTime()
      case 'date_desc':
      default:
        return new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime()
    }
  })

  return filtered
}
