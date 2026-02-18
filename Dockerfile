# Dockerfile pour FEKM Training App
FROM node:20-alpine AS base

# Installer les dépendances système
RUN apk add --no-cache libc6-compat openssl

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Générer le client Prisma
RUN npx prisma generate

# Copier tout le projet
COPY . .

# Build l'application
RUN pnpm build

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Commande de démarrage
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && pnpm start"]
