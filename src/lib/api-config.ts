// Librairies requises pour les APIs FEKM Training
// À installer avec: pnpm add formidable @upstash/ratelimit @upstash/redis uuid zod
// Types: pnpm add -D @types/formidable @types/uuid

export const dependencies = {
  production: [
    'formidable',           // Parsing multipart/form-data
    '@upstash/ratelimit',   // Rate limiting avec Redis
    '@upstash/redis',       // Client Redis
    'uuid',                 // Génération d'UUID
    'zod',                  // Validation de schémas
  ],
  development: [
    '@types/formidable',
    '@types/uuid',
    '@types/node',
  ],
};

// Configuration recommandée pour next.config.js
export const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '2gb', // Pour les uploads de vidéos
    },
    responseLimit: false, // Pour le streaming
  },
  // Configuration pour les fichiers statiques vidéo
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
    ];
  },
};
