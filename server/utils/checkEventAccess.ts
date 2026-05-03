import prisma from '../utils/prisma'

export const checkEventAccess = async (eventId: string, userId: string, userRole: string): Promise<boolean> => {
  if (userRole === 'ADMIN' || userRole === 'OWNER') return true

  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { formSchema: true }
  })

  if (!ev) return false

  try {
    const schema = JSON.parse(ev.formSchema || '[]')
    const meta = schema.find((i: any) => i?.itemType === 'form_meta') || {}
    if (!meta.assignmentEnabled) return true
    const ids: string[] = Array.isArray(meta.assignedStaffIds) ? meta.assignedStaffIds : []
    return ids.includes(userId)
  } catch {
    return true
  }
}
