/**
 * Script de test pour le service email
 * Usage: NODE_ENV=development npx tsx scripts/test-email.ts
 */

import { sendWelcomeEmail, verifySMTPConfig } from '../src/lib/email'

async function testEmailService() {
  console.log('🧪 Test du service email\n')

  // Vérifier la configuration SMTP
  console.log('1️⃣ Vérification de la configuration SMTP...')
  const configCheck = await verifySMTPConfig()

  if (!configCheck.valid) {
    console.log('❌ Configuration SMTP invalide:', configCheck.error)
    console.log('\n💡 En mode développement, les emails seront simulés dans la console.')
    console.log('   Pour configurer SMTP, voir docs/EMAIL_CONFIGURATION.md')
  } else {
    console.log('✅ Configuration SMTP valide')
  }

  console.log('\n2️⃣ Test d\'envoi d\'email de bienvenue...')

  const result = await sendWelcomeEmail({
    email: 'test@exemple.com',
    name: 'Jean Test',
    tempPassword: 'TempPass123!',
    loginUrl: 'http://localhost:3000/login',
  })

  if (result.success) {
    console.log('✅ Email envoyé avec succès!')
    console.log('   Message ID:', result.messageId)
  } else {
    console.log('❌ Échec de l\'envoi:', result.error)
  }

  console.log('\n✨ Test terminé')
}

testEmailService().catch(console.error)
