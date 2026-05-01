import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const event = await prisma.event.findFirst({
    orderBy: { createdAt: 'desc' }
  })
  console.log('Event Schema:', event?.formSchema)
}

main().catch(console.error).finally(() => prisma.$disconnect())
