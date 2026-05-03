import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const firstUser = await prisma.admin.findFirst({ orderBy: { createdAt: 'asc' } })
  if (firstUser) {
    await prisma.admin.update({
      where: { id: firstUser.id },
      data: { role: 'OWNER' }
    })
    console.log(`Successfully promoted ${firstUser.username} to OWNER`)
  } else {
    console.log('No admin found')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
