import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Récupérer l'email depuis les arguments
  const email = process.argv[2]
  
  if (!email) {
    console.error('Usage: npx tsx scripts/make-admin.ts <email>')
    process.exit(1)
  }
  
  // Mettre à jour l'utilisateur
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  })
  
  console.log(`✅ ${user.email} est maintenant ADMIN`)
  console.log(`Rôle: ${user.role}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
