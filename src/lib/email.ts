import nodemailer from 'nodemailer'
import { logError, logWarning } from './error-handler'

// ============================================================================
// Configuration SMTP
// ============================================================================

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
  fromName: string
}

function getSMTPConfig(): SMTPConfig {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const from = process.env.SMTP_FROM || 'noreply@fekm-training.fr'
  const fromName = process.env.SMTP_FROM_NAME || 'FEKM Training'

  if (!host || !user || !pass) {
    throw new Error(
      'Configuration SMTP incomplète. Variables requises: SMTP_HOST, SMTP_USER, SMTP_PASSWORD'
    )
  }

  return {
    host,
    port,
    secure: port === 465, // true pour port 465, false pour les autres
    auth: { user, pass },
    from,
    fromName,
  }
}

// ============================================================================
// Transporter Nodemailer
// ============================================================================

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter

  const config = getSMTPConfig()

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })

  return transporter
}

// ============================================================================
// Template Email de Bienvenue
// ============================================================================

export interface WelcomeEmailData {
  name: string
  email: string
  tempPassword: string
  loginUrl: string
}

function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const { name, email, tempPassword, loginUrl } = data

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur FEKM Training</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      font-size: 16px;
      margin-top: 8px;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-text {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 24px;
    }
    .credentials-box {
      background-color: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .credentials-box h3 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .credential-row {
      display: flex;
      margin-bottom: 12px;
      align-items: center;
    }
    .credential-label {
      font-weight: 600;
      color: #64748b;
      min-width: 120px;
    }
    .credential-value {
      color: #1f2937;
      font-family: 'Courier New', monospace;
      background-color: #e2e8f0;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
    }
    .password-warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    .password-warning h4 {
      color: #92400e;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .password-warning p {
      color: #a16207;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      text-align: center;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    }
    .instructions {
      background-color: #eff6ff;
      border-radius: 8px;
      padding: 20px;
      margin-top: 24px;
    }
    .instructions h4 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 12px;
    }
    .instructions ol {
      padding-left: 20px;
      color: #374151;
    }
    .instructions li {
      margin-bottom: 8px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    @media (max-width: 480px) {
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
      .content { padding: 30px 20px; }
      .credential-row { flex-direction: column; align-items: flex-start; }
      .credential-label { margin-bottom: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🥋 Bienvenue sur FEKM Training</h1>
      <p>Votre plateforme d'entraînement au Krav Maga</p>
    </div>
    
    <div class="content">
      <p class="welcome-text">Bonjour <strong>${escapeHtml(name)}</strong>,</p>
      
      <p>Votre compte a été créé avec succès sur la plateforme FEKM Training. Vous pouvez dès maintenant accéder à tous les contenus de formation et suivre votre progression.</p>
      
      <div class="credentials-box">
        <h3>🔐 Vos identifiants de connexion</h3>
        <div class="credential-row">
          <span class="credential-label">Email :</span>
          <span class="credential-value">${escapeHtml(email)}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Mot de passe :</span>
          <span class="credential-value">${escapeHtml(tempPassword)}</span>
        </div>
      </div>
      
      <div class="password-warning">
        <h4>⚠️ Important</h4>
        <p>Ce mot de passe est temporaire. Pour des raisons de sécurité, vous devez le changer lors de votre première connexion.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="cta-button">Accéder à la plateforme</a>
      </div>
      
      <div class="instructions">
        <h4>📋 Prochaines étapes</h4>
        <ol>
          <li>Cliquez sur le bouton ci-dessus pour vous connecter</li>
          <li>Connectez-vous avec vos identifiants</li>
          <li>Accédez à votre profil pour changer votre mot de passe</li>
          <li>Commencez à explorer les techniques et modules disponibles</li>
        </ol>
      </div>
      
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
        Si vous n'avez pas demandé la création de ce compte, veuillez ignorer cet email ou contacter votre instructeur.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FEKM Training</strong></p>
      <p>Fédération Européenne de Krav Maga</p>
      <p style="margin-top: 12px; font-size: 12px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.<br>
        Pour toute question, contactez votre instructeur.
      </p>
    </div>
  </div>
</body>
</html>`
}

function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const { name, email, tempPassword, loginUrl } = data

  return `Bienvenue sur FEKM Training

Bonjour ${name},

Votre compte a été créé avec succès sur la plateforme FEKM Training.

VOS IDENTIFIANTS DE CONNEXION
=============================
Email : ${email}
Mot de passe temporaire : ${tempPassword}

⚠️ IMPORTANT : Ce mot de passe est temporaire. Vous devez le changer lors de votre première connexion pour des raisons de sécurité.

LIEN DE CONNEXION
=================
${loginUrl}

PROCHAINES ÉTAPES
=================
1. Cliquez sur le lien ci-dessus pour vous connecter
2. Connectez-vous avec vos identifiants
3. Accédez à votre profil pour changer votre mot de passe
4. Commencez à explorer les techniques et modules disponibles

---
FEKM Training - Fédération Européenne de Krav Maga
Cet email a été envoyé automatiquement, merci de ne pas y répondre.`
}

function escapeHtml(text: string): string {
  const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return text.replace(/[&<>"']/g, (char) => div[char as keyof typeof div])
}

// ============================================================================
// Fonctions d'envoi d'emails
// ============================================================================

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envoie un email de bienvenue à un nouvel utilisateur
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<SendEmailResult> {
  try {
    // Mode développement sans SMTP configuré
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('========================================')
      console.log('📧 EMAIL DE BIENVENUE (MODE DÉVELOPPEMENT)')
      console.log('========================================')
      console.log(`À: ${data.email}`)
      console.log(`Sujet: Bienvenue sur FEKM Training`)
      console.log('---')
      console.log(generateWelcomeEmailText(data))
      console.log('========================================')
      return { success: true, messageId: 'dev-mode-simulated' }
    }

    const config = getSMTPConfig()
    const transport = getTransporter()

    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to: data.email,
      subject: 'Bienvenue sur FEKM Training - Vos identifiants de connexion',
      text: generateWelcomeEmailText(data),
      html: generateWelcomeEmailHTML(data),
    })

    logWarning('EmailService', 'Email de bienvenue envoyé', {
      to: data.email,
      messageId: info.messageId,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    logError('EmailService.sendWelcomeEmail', error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Vérifie la configuration SMTP
 */
export async function verifySMTPConfig(): Promise<{
  valid: boolean
  error?: string
}> {
  try {
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      return { valid: true }
    }

    // Vérifier que les variables requises sont présentes
    const host = process.env.SMTP_HOST
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASSWORD

    if (!host || !user || !pass) {
      return {
        valid: false,
        error: 'Configuration SMTP incomplète. Variables requises: SMTP_HOST, SMTP_USER, SMTP_PASSWORD'
      }
    }

    const transport = getTransporter()
    await transport.verify()
    return { valid: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return { valid: false, error: errorMessage }
  }
}

/**
 * Envoie un email générique (pour futurs besoins)
 */
export async function sendEmail(options: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<SendEmailResult> {
  try {
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('========================================')
      console.log('📧 EMAIL (MODE DÉVELOPPEMENT)')
      console.log('========================================')
      console.log(`À: ${options.to}`)
      console.log(`Sujet: ${options.subject}`)
      console.log('---')
      console.log(options.text)
      console.log('========================================')
      return { success: true, messageId: 'dev-mode-simulated' }
    }

    const config = getSMTPConfig()
    const transport = getTransporter()

    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    logError('EmailService.sendEmail', error)
    return { success: false, error: errorMessage }
  }
}
