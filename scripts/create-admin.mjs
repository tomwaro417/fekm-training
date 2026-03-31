import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@fekm.test'
  const password = 'Admin123!'
  
  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash(password, 10)
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existing) {
      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date()
        }
      })
      console.log('✅ Compte admin mis à jour')
    } else {
      // Créer l'utilisateur
      await prisma.user.create({
        data: {
          email,
          name: 'Administrateur',
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date()
        }
      })
      console.log('✅ Compte admin créé')
    }
    
    console.log('\n📧 Email:', email)
    console.log('🔑 Mot de passe:', password)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
