# Configuration Email - FEKM Training

Ce document explique comment configurer l'envoi d'emails dans l'application FEKM Training.

## Vue d'ensemble

L'application utilise **Nodemailer** pour l'envoi d'emails via SMTP. Les emails sont principalement utilisés pour :

- **Emails de bienvenue** : Envoyés lors de la création d'un compte utilisateur par un administrateur
- **Futurs usages** : Notifications, récupération de mot de passe, etc.

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# ============================================================================
# Configuration Email (SMTP)
# ============================================================================

# Hôte SMTP (ex: smtp.gmail.com, smtp.office365.com, mail.gandi.net)
SMTP_HOST=smtp.votre-fournisseur.com

# Port SMTP (587 pour TLS, 465 pour SSL)
SMTP_PORT=587

# Nom d'utilisateur SMTP (souvent votre adresse email)
SMTP_USER=votre-email@exemple.com

# Mot de passe SMTP ou clé d'application
SMTP_PASSWORD=votre_mot_de_passe_smtp

# Adresse d'expédition (optionnel)
SMTP_FROM=noreply@fekm-training.fr

# Nom d'expéditeur (optionnel)
SMTP_FROM_NAME=FEKM Training
```

### Fournisseurs SMTP recommandés

#### Gmail / Google Workspace
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-cle-dapplication  # Clé d'application, pas le mot de passe
```

> ⚠️ **Important** : Pour Gmail, vous devez créer une [Clé d'application](https://myaccount.google.com/apppasswords) et activer l'authentification à 2 facteurs.

#### Microsoft 365 / Outlook
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=votre-email@domaine.com
SMTP_PASSWORD=votre-mot-de-passe
```

#### Gandi
```env
SMTP_HOST=mail.gandi.net
SMTP_PORT=587
SMTP_USER=votre-email@domaine.com
SMTP_PASSWORD=votre-mot-de-passe
```

#### OVH
```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_USER=votre-email@domaine.com
SMTP_PASSWORD=votre-mot-de-passe
```

#### SendGrid (recommandé pour la production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.votre-cle-api-sendgrid
```

### Mode développement

En mode développement (`NODE_ENV=development`), si les variables SMTP ne sont pas configurées :

1. Les emails ne sont pas réellement envoyés
2. Le contenu de l'email est affiché dans la console
3. L'API retourne `emailSent: false` mais l'utilisateur est quand même créé

Cela permet de tester la création d'utilisateurs sans configurer de serveur SMTP.

## Utilisation

### Envoi d'un email de bienvenue

L'email de bienvenue est envoyé automatiquement lors de la création d'un utilisateur via l'API admin :

```typescript
POST /api/admin/users
{
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "role": "STUDENT",
  "sendWelcomeEmail": true  // Optionnel, true par défaut
}
```

### Réponse de l'API

```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": { /* ... */ },
    "tempPassword": "mot-de-passe-temporaire",
    "emailSent": true,
    "emailError": null
  }
}
```

Si l'envoi d'email échoue :
- L'utilisateur est quand même créé
- `emailSent` sera `false`
- `emailError` contiendra le message d'erreur
- L'erreur est loguée côté serveur

### Service Email (lib/email.ts)

Le service email expose les fonctions suivantes :

```typescript
import { sendWelcomeEmail, sendEmail, verifySMTPConfig } from '@/lib/email'

// Envoyer un email de bienvenue
const result = await sendWelcomeEmail({
  email: 'user@exemple.com',
  name: 'Jean Dupont',
  tempPassword: 'mot-de-passe',
  loginUrl: 'https://app.fekm-training.fr/login'
})

// Vérifier la configuration SMTP
const configCheck = await verifySMTPConfig()
if (!configCheck.valid) {
  console.error('SMTP non configuré:', configCheck.error)
}

// Envoyer un email générique
await sendEmail({
  to: 'user@exemple.com',
  subject: 'Sujet du message',
  text: 'Version texte',
  html: '<p>Version HTML</p>'
})
```

## Template Email

Le template de bienvenue comprend :

- **En-tête** : Logo et titre de l'application
- **Message de bienvenue** : Personnalisé avec le nom de l'utilisateur
- **Identifiants** : Email et mot de passe temporaire dans une boîte stylisée
- **Avertissement** : Mise en garde sur le caractère temporaire du mot de passe
- **Bouton CTA** : Lien direct vers la page de connexion
- **Instructions** : Étapes à suivre pour changer le mot de passe
- **Footer** : Informations de contact

Le template est responsive et compatible avec la plupart des clients email.

## Dépannage

### Les emails ne partent pas

1. Vérifiez les logs serveur pour les erreurs
2. Assurez-vous que les variables d'environnement sont correctement chargées
3. Testez la connexion SMTP avec `verifySMTPConfig()`

### Erreurs d'authentification

- **Gmail** : Utilisez une clé d'application, pas votre mot de passe principal
- **Microsoft** : Vérifiez que l'authentification SMTP est activée
- **SendGrid** : Utilisez `apikey` comme nom d'utilisateur

### Emails dans les spams

Pour éviter que les emails arrivent en spam :

1. Configurez les enregistrements SPF et DKIM pour votre domaine
2. Utilisez une adresse d'expédition valide
3. Évitez les mots suspects dans le sujet
4. Utilisez un service dédié comme SendGrid ou Mailgun en production

## Sécurité

- Les mots de passe SMTP ne doivent jamais être commités dans le code
- Utilisez des clés d'application plutôt que les mots de passe principaux
- En production, utilisez TLS/SSL (port 465 ou 587 avec STARTTLS)
- Limitez le rate limiting sur les endpoints d'envoi d'email
