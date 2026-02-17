import { PrismaClient, ProgressLevel, UserRole, VideoType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const beltsData = [
  {
    name: 'JAUNE', color: '#FFD700', order: 1,
    description: 'Premier niveau du programme FEKM. Initiation aux bases du Krav Maga.',
    examRequirements: 'Présentation de toutes les techniques du programme.',
    principles: 'Défense et contre-attaque. Simplicité et efficacité.',
  },
  {
    name: 'ORANGE', color: '#FF8C00', order: 2,
    description: 'Consolidation des bases et introduction aux défenses sur saisies.',
    examRequirements: 'Techniques du programme + révisions ceinture jaune.',
    principles: 'Gestion du stress. Défense sur saisisssements.',
  },
  {
    name: 'VERTE', color: '#228B22', order: 3,
    description: 'Défenses sur attaques circulaires et saisies complexes.',
    examRequirements: 'Techniques du programme + révisions ceintures précédentes.',
    principles: 'Défense sur attaques circulaires. Projection et équilibre.',
  },
  {
    name: 'BLEUE', color: '#1E90FF', order: 4,
    description: 'Introduction aux défenses au sol et aux attaques avec armes blanches.',
    examRequirements: 'Programme complet + révisions. Défenses au sol obligatoires.',
    principles: 'Combat au sol. Défense contre armes blanches.',
  },
  {
    name: 'MARRON', color: '#8B4513', order: 5,
    description: 'Techniques avancées, armes à feu et situations complexes.',
    examRequirements: 'Maîtrise de toutes les techniques.',
    principles: 'Défense contre armes à feu. Protection de tiers.',
  },
  {
    name: 'NOIRE_1', color: '#000000', order: 6,
    description: 'Premier grade ceinture noire. Synthèse et perfectionnement.',
    examRequirements: 'Examen complet de toutes les techniques du cursus.',
    principles: 'Maîtrise totale. Capacité d\'enseignement.',
  },
]

const modulesData: Record<string, Array<{ code: string; name: string; description: string; order: number }>> = {
  JAUNE: [
    { code: 'UV1', name: 'Frappe de face', description: 'Défenses contre frappes directes', order: 1 },
    { code: 'UV2', name: 'Frappe de côté', description: 'Défenses contre frappes latérales', order: 2 },
    { code: 'UV3', name: 'Saisisssements simples', description: 'Échappements basiques', order: 3 },
    { code: 'UV4', name: 'Attaques ponctuelles', description: 'Parades et contre-attaques', order: 4 },
    { code: 'UV5', name: 'Chutes et roulés', description: 'Techniques de réception', order: 5 },
  ],
  ORANGE: [
    { code: 'UV1', name: 'Saisisssements par devant', description: 'Défenses frontales', order: 1 },
    { code: 'UV2', name: 'Saisisssements par derrière', description: 'Défenses arrières', order: 2 },
    { code: 'UV3', name: 'Étranglements', description: 'Défenses sur étranglements', order: 3 },
    { code: 'UV4', name: 'Frappe de face avancées', description: 'Techniques avancées', order: 4 },
    { code: 'UV5', name: 'Frappe de côté avancées', description: 'Défenses latérales', order: 5 },
  ],
  VERTE: [
    { code: 'UV1', name: 'Défenses circulaires basses', description: 'Esquives basses', order: 1 },
    { code: 'UV2', name: 'Défenses circulaires hautes', description: 'Protections hautes', order: 2 },
    { code: 'UV3', name: 'Projections', description: 'Techniques de projection', order: 3 },
    { code: 'UV4', name: 'Immobilisations', description: 'Clés et contrôles', order: 4 },
    { code: 'UV5', name: 'Défenses au sol', description: 'Introduction au sol', order: 5 },
  ],
  BLEUE: [
    { code: 'UV1', name: 'Positions au sol', description: 'Garde et déplacements', order: 1 },
    { code: 'UV2', name: 'Frappes au sol', description: 'Ground and pound', order: 2 },
    { code: 'UV3', name: 'Défenses couteau', description: 'Menaces et attaques', order: 3 },
    { code: 'UV4', name: 'Défenses bâton', description: 'Armes contondantes', order: 4 },
    { code: 'UV5', name: 'Défenses armes à feu', description: 'Menaces par arme', order: 5 },
  ],
  MARRON: [
    { code: 'UV1', name: 'Combat au sol avancé', description: 'Soumissions avancées', order: 1 },
    { code: 'UV2', name: 'Défenses couteau avancées', description: 'Techniques complexes', order: 2 },
    { code: 'UV3', name: 'Défenses armes à feu avancées', description: 'Situations dynamiques', order: 3 },
    { code: 'UV4', name: 'Protections de tiers', description: 'Défense d\'autrui', order: 4 },
    { code: 'UV5', name: 'Scénarios complexes', description: 'Situations multiples', order: 5 },
  ],
  NOIRE_1: [
    { code: 'UV1', name: 'Synthèse frappes', description: 'Maîtrise des frappes', order: 1 },
    { code: 'UV2', name: 'Synthèse armes', description: 'Perfectionnement armes', order: 2 },
    { code: 'UV3', name: 'Combat au sol expert', description: 'Maîtrise du sol', order: 3 },
    { code: 'UV4', name: 'Pédagogie', description: 'Techniques d\'enseignement', order: 4 },
    { code: 'UV5', name: 'Préparation DIFE', description: 'Grade supérieur', order: 5 },
  ],
}

const techniquesData: Record<string, Record<string, Array<{ name: string; category: string; description: string; keyPoints: string[] }>>> = {
  JAUNE: {
    UV1: [
      { name: '360 défense', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Défense contre crochet', keyPoints: ['Blocage avant-bras', 'Rotation corps', 'Contre-attaque'] },
      { name: 'Défense direct avant', category: 'FRAPPE_DE_FACE', description: 'Parade et contre', keyPoints: ['Déviation externe', 'Entrée rapide', 'Frappe visage'] },
      { name: 'Défense direct arrière', category: 'FRAPPE_DE_FACE', description: 'Parade puissante', keyPoints: ['Blocage deux bras', 'Déplacement', 'Contrôle'] },
      { name: 'Défense uppercut', category: 'FRAPPE_DE_FACE', description: 'Protection uppercut', keyPoints: ['Blocage interne', 'Rapprochement', 'Genou'] },
    ],
    UV2: [
      { name: 'Défense revers avant', category: 'FRAPPE_DE_COTE', description: 'Parade sur revers', keyPoints: ['Blocage haut', 'Protection tête', 'Contre'] },
      { name: 'Défense revers arrière', category: 'FRAPPE_DE_COTE', description: 'Parade puissante', keyPoints: ['Blocage renforcé', 'Déplacement', 'Série'] },
      { name: 'Défense crochet', category: 'FRAPPE_DE_COTE', description: 'Esquive crochet', keyPoints: ['Esquive intérieure', 'Contre crochet', 'Garde'] },
    ],
    UV3: [
      { name: 'Échappement poignet deux mains', category: 'SAISISSEMENTS', description: 'Libération poignet', keyPoints: ['Rotation poignet', 'Pression', 'Retrait'] },
      { name: 'Échappement poignet une main', category: 'SAISISSEMENTS', description: 'Libération main', keyPoints: ['Vers le pouce', 'Explosion', 'Préparation'] },
      { name: 'Défense deux poignets', category: 'SAISISSEMENTS', description: 'Double saisie', keyPoints: ['Lever bras', 'Coup tête', 'Dégagement'] },
    ],
    UV4: [
      { name: 'Défense poussée', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Réaction poussée', keyPoints: ['Absorption', 'Équilibre', 'Riposte'] },
      { name: 'Défense tirage', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Contre tirage', keyPoints: ['Pas arrière', 'Récupération', 'Frappe'] },
      { name: 'Défense plaquage mur', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Sortie mur', keyPoints: ['Protection tête', 'Espace', 'Rotation'] },
    ],
    UV5: [
      { name: 'Chute avant', category: 'AUTRES', description: 'Réception avant', keyPoints: ['Absorption', 'Protection', 'Remontée'] },
      { name: 'Chute arrière', category: 'AUTRES', description: 'Réception arrière', keyPoints: ['Menton rentré', 'Frappe sol', 'Garde'] },
      { name: 'Roulé avant', category: 'AUTRES', description: 'Roulé réception', keyPoints: ['Courbe dos', 'Diagonal', 'Garde'] },
    ],
  },
  ORANGE: {
    UV1: [
      { name: 'Défense étreinte frontale', category: 'SAISISSEMENTS', description: 'Libération étreinte', keyPoints: ['Coup tête', 'Genou', 'Dégagement'] },
      { name: 'Défense étranglement frontal', category: 'STRANGULATIONS', description: 'Contre frontal', keyPoints: ['Protection', 'Frappes', 'Rotation'] },
      { name: 'Défense collet', category: 'SAISISSEMENTS', description: 'Libération collet', keyPoints: ['Deux sur une', 'Pouce', 'Rotation'] },
    ],
    UV2: [
      { name: 'Défense étreinte arrière', category: 'SAISISSEMENTS', description: 'Libération arrière', keyPoints: ['Balancement', 'Tête arrière', 'Contrôle'] },
      { name: 'Défense étranglement arrière', category: 'STRANGULATIONS', description: 'Contre arrière', keyPoints: ['Protection', 'Creusement', 'Rotation'] },
      { name: 'Défense étranglement levier', category: 'STRANGULATIONS', description: 'Avec bras', keyPoints: ['Protection', 'Déverrouillage', 'Projection'] },
    ],
    UV3: [
      { name: 'Défense étranglement mur', category: 'STRANGULATIONS', description: 'Mur + étranglement', keyPoints: ['Protection', 'Espace', 'Rotation'] },
      { name: 'Défense étranglement sol', category: 'STRANGULATIONS', description: 'Au sol', keyPoints: ['Protection', 'Réduction', 'Renversement'] },
      { name: 'Défense cheveux', category: 'SAISISSEMENTS', description: 'Cheveux saisis', keyPoints: ['Deux sur une', 'Poignet', 'Projection'] },
    ],
    UV4: [
      { name: 'Défense deux adversaires', category: 'FRAPPE_DE_FACE', description: 'Multi-opposition', keyPoints: ['Positionnement', 'Frappe', 'Rotation'] },
      { name: 'Défense direct + crochet', category: 'FRAPPE_DE_FACE', description: 'Combinaison', keyPoints: ['Blocage', 'Esquive', 'Enchaînement'] },
      { name: 'Riposte parade', category: 'FRAPPE_DE_FACE', description: 'Contre-attaques', keyPoints: ['Réactivité', 'Choix', 'Sortie'] },
    ],
    UV5: [
      { name: 'Défense revers + crochet', category: 'FRAPPE_DE_COTE', description: 'Latérale', keyPoints: ['Blocage', 'Esquive', 'Contre'] },
      { name: 'Défense genou', category: 'FRAPPE_DE_FACE', description: 'Parade genou', keyPoints: ['Blocage', 'Contrôle', 'Projection'] },
      { name: 'Défense série frappes', category: 'FRAPPE_DE_FACE', description: 'Enchaînement', keyPoints: ['Garde', 'Déplacements', 'Interruption'] },
    ],
  },
  VERTE: {
    UV1: [
      { name: 'Défense circulaire extérieure', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Esquive', keyPoints: ['Pas arrière', 'Rotation', 'Contre'] },
      { name: 'Défense circulaire intérieure', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Entrée', keyPoints: ['Avant', 'Protection', 'Corps'] },
      { name: 'Défense low kick', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Pied circulaire', keyPoints: ['Blocage', 'Contrôle', 'Contre'] },
    ],
    UV2: [
      { name: 'Défense high kick', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Tête haute', keyPoints: ['Deux bras', 'Rapprochement', 'Projection'] },
      { name: 'Défense crochet sauté', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Sauté', keyPoints: ['Recul', 'Timing', 'Contre'] },
      { name: 'Défense kick sauté', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Kick sauté', keyPoints: ['Latéral', 'Déséquilibre', 'Frappe'] },
    ],
    UV3: [
      { name: 'Projection intérieure', category: 'SAISISSEMENTS', description: 'Hip throw', keyPoints: ['Latéral', 'Hanche', 'Contrôle'] },
      { name: 'Projection extérieure', category: 'SAISISSEMENTS', description: 'Outer reap', keyPoints: ['Rotation', 'Fauchage', 'Contrôle'] },
      { name: 'Projection épaule', category: 'SAISISSEMENTS', description: 'Shoulder throw', keyPoints: ['Profonde', 'Rotation', 'Impact'] },
    ],
    UV4: [
      { name: 'Clé bras sol', category: 'SAISISSEMENTS', description: 'Immobilisation', keyPoints: ['Poignet', 'Coude', 'Pression'] },
      { name: 'Clé épaule', category: 'SAISISSEMENTS', description: 'Épaule', keyPoints: ['Rotation', 'Pression', 'Maintien'] },
      { name: 'Étranglement contrôlé', category: 'STRANGULATIONS', description: 'Immobilisation', keyPoints: ['Position', 'Progressif', 'Lâcher'] },
    ],
    UV5: [
      { name: 'Sortie garde fermée', category: 'ATTAQUES_AU_SOL', description: 'Passage', keyPoints: ['Hanches', 'Ouverture', 'Dominante'] },
      { name: 'Sortie montée', category: 'ATTAQUES_AU_SOL', description: 'Échappement', keyPoints: ['Pont', 'Rotation', 'Retournement'] },
      { name: 'Remontée technique', category: 'ATTAQUES_AU_SOL', description: 'Debout', keyPoints: ['Protection', 'Technique', 'Garde'] },
    ],
  },
  BLEUE: {
    UV1: [
      { name: 'Garde fermée', category: 'ATTAQUES_AU_SOL', description: 'Défensive', keyPoints: ['Jambes', 'Distance', 'Frappe'] },
      { name: 'Garde ouverte', category: 'ATTAQUES_AU_SOL', description: 'Active', keyPoints: ['Pieds', 'Espace', 'Attaques'] },
      { name: 'Demi-garde', category: 'ATTAQUES_AU_SOL', description: 'Transition', keyPoints: ['Genou', 'Pression', 'Passage'] },
    ],
    UV2: [
      { name: 'Ground and pound', category: 'ATTAQUES_AU_SOL', description: 'Depuis haut', keyPoints: ['Hanches', 'Série', 'Équilibre'] },
      { name: 'Frappes garde', category: 'ATTAQUES_AU_SOL', description: 'Défensives', keyPoints: ['Uppercuts', 'Coudes', 'Contrôle'] },
      { name: 'Genoux sol', category: 'ATTAQUES_AU_SOL', description: 'Clinch', keyPoints: ['Nuque', 'Traction', 'Genoux'] },
    ],
    UV3: [
      { name: 'Menace couteau frontale', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Ventrale', keyPoints: ['Mains', 'Déviation', 'Contrôle'] },
      { name: 'Attaque couteau direct', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Direct', keyPoints: ['Déviation', 'Rotation', 'Désarmement'] },
      { name: 'Attaque couteau bas', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Uppercut', keyPoints: ['Recul', 'Poignet', 'Projection'] },
    ],
    UV4: [
      { name: 'Attaque bâton vertical', category: 'ATTAQUES_AVEC_BATON', description: 'Vertical', keyPoints: ['Entrée', 'Distance', 'Contrôle'] },
      { name: 'Attaque bâton horizontal', category: 'ATTAQUES_AVEC_BATON', description: 'Horizontal', keyPoints: ['Blocage', 'Entrée', 'Projection'] },
      { name: 'Bâton sol', category: 'ATTAQUES_AVEC_BATON', description: 'Chute', keyPoints: ['Tête', 'Rapprochement', 'Contrôle'] },
    ],
    UV5: [
      { name: 'Arme poitrine', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Pistolet', keyPoints: ['Calme', 'Déviation', 'Contrôle'] },
      { name: 'Arme dos', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Dos', keyPoints: ['Détection', 'Rotation', 'Désarmement'] },
      { name: 'Arme tête', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Tête', keyPoints: ['Mains', 'Déviation', 'Projection'] },
    ],
  },
  MARRON: {
    UV1: [
      { name: 'Clé coude sol', category: 'ATTAQUES_AU_SOL', description: 'Soumission', keyPoints: ['Isolement', 'Levier', 'Abandon'] },
      { name: 'Étranglement arrière sol', category: 'ATTAQUES_AU_SOL', description: 'RNC', keyPoints: ['Dos', 'Jambes', 'Serrage'] },
      { name: 'Triangle', category: 'ATTAQUES_AU_SOL', description: 'Triangle choke', keyPoints: ['Jambes', 'Ajustement', 'Pression'] },
    ],
    UV2: [
      { name: 'Couteau dos', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Dorsale', keyPoints: ['Corps', 'Rotation', 'Désarmement'] },
      { name: 'Couteau sol', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Chute', keyPoints: ['Bras armé', 'Rotation', 'Maintien'] },
      { name: 'Couteau multiple', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Série', keyPoints: ['Déplacements', 'Parades', 'Contre'] },
    ],
    UV3: [
      { name: 'Arme côté un bras', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Latéral', keyPoints: ['Canon', 'Rotation', 'Désarmement'] },
      { name: 'Arme longue', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Fusil', keyPoints: ['Rapprochement', 'Canon', 'Désarmement'] },
      { name: 'Arme sol', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Sol', keyPoints: ['Protection', 'Contrôle', 'Retournement'] },
    ],
    UV4: [
      { name: 'Protection tiers devant', category: 'AUTRES', description: 'Autrui', keyPoints: ['Interposition', 'Protection', 'Évacuation'] },
      { name: 'Protection tiers derrière', category: 'AUTRES', description: 'Arrière', keyPoints: ['Saisie', 'Éloignement', 'Protection'] },
      { name: 'Évacuation groupe', category: 'AUTRES', description: 'Foule', keyPoints: ['Position', 'Corridor', 'Déplacement'] },
    ],
    UV5: [
      { name: 'Défense chaise', category: 'AUTRES', description: 'Objet', keyPoints: ['Esquive', 'Entrée', 'Neutralisation'] },
      { name: 'Défense bouteille', category: 'AUTRES', description: 'Improvisé', keyPoints: ['Distance', 'Déviation', 'Contrôle'] },
      { name: 'Sortie environnement', category: 'AUTRES', description: 'Espace', keyPoints: ['Repérage', 'Évacuation', 'Protection'] },
    ],
  },
  NOIRE_1: {
    UV1: [
      { name: 'Synthèse 360', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Toutes variantes', keyPoints: ['Hauteurs', 'Distances', 'Contres'] },
      { name: 'Synthèse saisisssements', category: 'SAISISSEMENTS', description: 'Complexes', keyPoints: ['Fluides', 'Transitions', 'Efficacité'] },
      { name: 'Enchaînements libres', category: 'FRAPPE_DE_FACE', description: 'Créativité', keyPoints: ['Adaptation', 'Fluidité', 'Réactivité'] },
    ],
    UV2: [
      { name: 'Perfectionnement couteau', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Maîtrise', keyPoints: ['Positions', 'Stress', 'Efficacité'] },
      { name: 'Perfectionnement bâton', category: 'ATTAQUES_AVEC_BATON', description: 'Maîtrise', keyPoints: ['Attaques', 'Désarmement', 'Contrôle'] },
      { name: 'Perfectionnement arme', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Maîtrise', keyPoints: ['Menaces', 'Désarmement', 'Sécurisation'] },
    ],
    UV3: [
      { name: 'Transitions', category: 'ATTAQUES_AU_SOL', description: 'Debout-sol', keyPoints: ['Chute', 'Adaptation', 'Remontée'] },
      { name: 'Soumissions avancées', category: 'ATTAQUES_AU_SOL', description: 'Clés', keyPoints: ['Isolement', 'Levier', 'Abandon'] },
      { name: 'Défense sol multiple', category: 'ATTAQUES_AU_SOL', description: 'Plusieurs', keyPoints: ['Rotation', 'Protection', 'Remontée'] },
    ],
    UV4: [
      { name: 'Pédagogie jaune', category: 'AUTRES', description: 'Débutants', keyPoints: ['Progression', 'Corrections', 'Encadrement'] },
      { name: 'Analyse technique', category: 'AUTRES', description: 'Avancée', keyPoints: ['Détail', 'Optimisation', 'Personnalisation'] },
      { name: 'Préparation cours', category: 'AUTRES', description: 'Structure', keyPoints: ['Objectifs', 'Progression', 'Évaluation'] },
    ],
    UV5: [
      { name: 'Maîtrise programme', category: 'AUTRES', description: 'Révision', keyPoints: ['Toutes', 'Pression', 'Enseignement'] },
      { name: 'Scénarios experts', category: 'AUTRES', description: 'Complexes', keyPoints: ['Analyse', 'Décision', 'Exécution'] },
      { name: 'Préparation DIFE', category: 'AUTRES', description: 'Supérieur', keyPoints: ['Perfectionnement', 'Enseignement', 'Mental'] },
    ],
  },
}

async function main() {
  console.log('🌱 Démarrage du seed...')

  await prisma.userTechniqueVideo.deleteMany()
  await prisma.techniqueVideoLink.deleteMany()
  await prisma.videoAsset.deleteMany()
  await prisma.userTechniqueProgress.deleteMany()
  await prisma.technique.deleteMany()
  await prisma.module.deleteMany()
  await prisma.beltContent.deleteMany()
  await prisma.user.deleteMany()
  await prisma.belt.deleteMany()

  console.log('🥋 Création des ceintures...')
  for (const beltData of beltsData) {
    const belt = await prisma.belt.create({
      data: {
        name: beltData.name, color: beltData.color, order: beltData.order,
        description: beltData.description,
        content: { create: { examRequirements: beltData.examRequirements, principles: beltData.principles } },
      },
    })
    console.log(`  ✓ Ceinture ${belt.name}`)

    const modules = modulesData[beltData.name]
    for (const moduleData of modules) {
      const module = await prisma.module.create({
        data: {
          beltId: belt.id, code: moduleData.code, name: moduleData.name,
          description: moduleData.description, order: moduleData.order,
        },
      })

      const techniques = techniquesData[beltData.name]?.[moduleData.code] || []
      for (let i = 0; i < techniques.length; i++) {
        const techData = techniques[i]
        await prisma.technique.create({
          data: {
            moduleId: module.id, name: techData.name, category: techData.category as any,
            description: techData.description, keyPoints: techData.keyPoints, order: i + 1,
          },
        })
      }
      console.log(`    ✓ ${module.code}: ${techniques.length} techniques`)
    }
  }

  // Utilisateur admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const yellowBelt = await prisma.belt.findUnique({ where: { name: 'JAUNE' } })
  
  await prisma.user.create({
    data: {
      email: 'admin@fekm.fr', name: 'Administrateur',
      password: hashedPassword, role: 'ADMIN',
      beltId: yellowBelt?.id,
    },
  })
  console.log('👤 Utilisateur admin créé (admin@fekm.fr / admin123)')

  // Utilisateur test
  await prisma.user.create({
    data: {
      email: 'eleve@fekm.fr', name: 'Élève Test',
      password: await bcrypt.hash('eleve123', 10), role: 'STUDENT',
      beltId: yellowBelt?.id,
    },
  })
  console.log('👤 Utilisateur élève créé (eleve@fekm.fr / eleve123)')

  console.log('✅ Seed terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
