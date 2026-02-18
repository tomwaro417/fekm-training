import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const beltsData = [
  {
    name: 'JAUNE', color: '#FFD700', order: 1,
    description: 'Premier niveau du programme FEKM. Initiation aux bases du Krav Maga : position neutre, frappes de base (tête, coude, poing, marteau, pied, genou), défenses fondamentales et chutes. Ceinture symbolisant le début du parcours.',
    examRequirements: 'Présentation correcte des techniques de base, compréhension des principes de défense et contre-attaque simultanée. Maîtrise des chutes et roulades.',
    principles: 'Défense et contre-attaque simultanée. Simplicité et efficacité. Ne jamais rester sur le sol. Casser la distance et changer de direction.',
  },
  {
    name: 'ORANGE', color: '#FF8C00', order: 2,
    description: 'Consolidation des bases et introduction aux défenses sur saisies et étranglements. Apprentissage des clés de poignet, uppercuts, premières armes blanches et combat en position de garde.',
    examRequirements: 'Techniques du programme + révisions ceinture jaune. Maîtrise des étranglements et saisies. Combat en position de garde.',
    principles: 'Gestion du stress. Défense sur saisisssements. Riposte immédiate. Ne pas reculer sur l\'attaque.',
  },
  {
    name: 'VERTE', color: '#228B22', order: 3,
    description: 'Défenses sur attaques circulaires, saisies complexes et cheveux. Introduction aux projections (inner/outer reap, épaule), clés de poignet avancées et combat au sol (garde, montée, croix).',
    examRequirements: 'Techniques du programme + révisions ceintures précédentes. Maîtrise des projections et défenses au sol.',
    principles: 'Défense sur attaques circulaires. Projection et équilibre. Contrôle au sol. Vision périphérique.',
  },
  {
    name: 'BLEUE', color: '#1E90FF', order: 4,
    description: 'Introduction aux défenses au sol avancées (guillotine, étranglements) et aux attaques avec armes blanches (couteau type rasoir, bâton, baïonnette). Techniques de fauchage et projections avancées.',
    examRequirements: 'Programme complet + révisions. Défenses au sol obligatoires. Maîtrise des armes blanches. Combat corps à corps.',
    principles: 'Combat au sol. Défense contre armes blanches. Fauchages et balayages. Bond en avant.',
  },
  {
    name: 'MARRON', color: '#8B4513', order: 5,
    description: 'Techniques avancées, armes à feu et situations complexes. Coups de pied sautés, double leg takedown, défenses couteau avancées, protections de tiers et combat réel évalué.',
    examRequirements: 'Maîtrise de toutes les techniques. Combat 2x2 minutes évalué. Désarmement armes à feu toutes positions.',
    principles: 'Défense contre armes à feu. Protection de tiers. Combat réel. Défense-contre simultané.',
  },
  {
    name: 'NOIRE_1', color: '#000000', order: 6,
    description: 'Premier grade ceinture noire (1ère Darga). Synthèse, perfectionnement et capacité d\'enseignement. Shadow boxing codifié 3 minutes, défenses contre attaques inconnues, combat expert.',
    examRequirements: 'Examen complet de toutes les techniques du cursus. Shadow 3 minutes avec techniques imposées. Combat 2x2 minutes.',
    principles: 'Maîtrise totale. Capacité d\'enseignement. Réactivité absolue. Aucun mouvement inutile.',
  },
]

const modulesData: Record<string, Array<{ code: string; name: string; description: string; order: number }>> = {
  JAUNE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Coups donnés sans appels, défenses de base', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Étranglements de face, côté et arrière', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Roulades avant/arrière, chutes amorties', order: 3 },
    { code: 'UV4', name: 'Techniques en position de garde', description: 'Base, déplacements, frappes et défenses', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Mouvements de base, défenses, remontée', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Utilisation d\'objets, défenses couteau', order: 6 },
  ],
  ORANGE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Uppercut, coups de pied avancés', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Étranglements avancés, saisies poignets', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Chutes en hauteur, roulades Judo', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Garde, esquives, amenées au sol', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Garde au sol, pontage, remontée', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Défenses couteau haut/bas', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat souple 2x2 minutes', order: 7 },
  ],
  VERTE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Tranchants, gifles, coups sautés', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Cheveux, étreintes, saisies jambes', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Roulades plombées, roulades latérales', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Swing, clés de poignet, enchaînements', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Garde, défenses étranglement, position croix', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Saisies couteau, défenses haut/bas/piqué', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat 2x2 minutes', order: 7 },
  ],
  BLEUE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Tranchant intérieur, défenses coups côté', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Saisies vêtements, épaule, dos', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Chute amortie avant-bras', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Kakato, fauchages, projections', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Défenses guillotine, étranglement, remontée', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Défenses couteau rasoir, bâton', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat corps à corps + 2x2 minutes', order: 7 },
  ],
  MARRON: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Coups de pied sautés, enchaînements', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Nelson, clés coude, saisies complexes', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Toutes les chutes et roulades', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Défenses ripostes non connues', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Déséquilibre, clés, défenses avancées', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Couteau, bâton, baïonnette', order: 6 },
    { code: 'UV7', name: 'Armes à feu', description: 'Neutralisation pistolet toutes positions', order: 7 },
    { code: 'UV8', name: 'Combat', description: 'Combat 2x2 minutes évalué', order: 8 },
  ],
  NOIRE_1: [
    { code: 'UV1', name: 'Frappes sans appel', description: 'Directs, enchaînements pieds-poings', order: 1 },
    { code: 'UV2', name: 'Shadow codifié', description: '3 minutes techniques imposées', order: 2 },
    { code: 'UV3', name: 'Défenses pieds-poings', description: 'Attaques connues et inconnues', order: 3 },
    { code: 'UV4', name: 'Saisies et sol', description: 'Étranglements, saisies, techniques sol', order: 4 },
    { code: 'UV5', name: 'Armes blanches', description: 'Bâton, couteau, 2 adversaires', order: 5 },
    { code: 'UV6', name: 'Armes à feu', description: 'Menaces face, dos, côté', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat 2x2 minutes évalué', order: 7 },
  ],
}

const techniquesData: Record<string, Record<string, Array<{ name: string; category: string; description: string; instructions?: string; keyPoints: string[] }>>> = {
  JAUNE: {
    UV1: [
      { name: 'Coup de tête', category: 'FRAPPE_DE_FACE', description: 'Frappe violente avec le front vers le visage de l\'agresseur. Technique de courte distance très efficace.', instructions: 'Projeter le front vers l\'avant en visant le nez ou le menton. Le mouvement doit être sec et violent.', keyPoints: ['Coup sec et violent', 'Viser le nez ou le menton', 'Ne pas baisser la garde', 'Utiliser le poids du corps'] },
      { name: 'Coude circulaire de face', category: 'FRAPPE_DE_FACE', description: 'Coup de coude horizontal en rotation du corps. Puissant en corps à corps.', instructions: 'Tourner les hanches et les épaules pour générer de la puissance. Le coude reste à hauteur de la cible.', keyPoints: ['Rotation des hanches', 'Impact avec l\'extrémité du coude', 'Protection de la tête', 'Courte distance'] },
      { name: 'Coude remontant', category: 'FRAPPE_DE_FACE', description: 'Coup de coude montant sous le menton. Excellent en très courte distance.', instructions: 'Monter le coude verticalement de bas en haut en visant sous la mâchoire.', keyPoints: ['Mouvement vertical', 'Hanche en extension', 'Impact sous la mâchoire', 'Très courte distance'] },
      { name: 'Direct de poing', category: 'FRAPPE_DE_FACE', description: 'Coup de poing tendu direct en ligne droite. La base de toute frappe de poing.', instructions: 'Tendre le bras rapidement en ligne droite vers la cible. Rotation du poing au moment du contact.', keyPoints: ['Extension complète du bras', 'Rotation du poing à l\'impact', 'Récupération rapide', 'Alignement poing-épaule-hanche'] },
      { name: 'Coup de pied direct', category: 'FRAPPE_DE_FACE', description: 'Coup de pied tendu de face. Technique de base du Krav Maga.', instructions: 'Extension de jambe rapide. Impact avec le dessus du pied ou la pointe. Récupération immédiate.', keyPoints: ['Extension de jambe', 'Impact avec le dessus', 'Récupération rapide', 'Cible: genoux ou tibia'] },
      { name: 'Coup de pied circulaire', category: 'FRAPPE_DE_COTE', description: 'Coup de pied en arc horizontal. Puissant sur le côté.', instructions: 'Rotation sur soi-même, jambe tendue en arc. Impact latéral avec le tibia ou le pied.', keyPoints: ['Rotation sur soi-même', 'Impact latéral', 'Utiliser les hanches', 'Cible: côtes ou cuisses'] },
      { name: '360° défense', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Parade circulaire contre crochet. La défense de base contre les frappes circulaires.', instructions: 'Tourner le corps en parant avec l\'avant-bras. Contre-attaque simultanée obligatoire.', keyPoints: ['Rotation du corps', 'Blocage avant-bras', 'Contre-attaque immédiate', 'Ne pas reculer'] },
      { name: 'Défense direct simultanée', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Parade et contre en même temps. Le principe fondamental du Krav Maga.', instructions: 'Parade intérieure paume d\'une main, contre simultanée de l\'autre. Ne jamais reculer.', keyPoints: ['Parade intérieure paume', 'Contre simultanée', 'Ne pas reculer', 'Explosivité'] },
    ],
    UV2: [
      { name: 'Dégagement étranglement avant', category: 'STRANGULATIONS', description: 'Libération d\'un étranglement de face. Priorité absolue de protection des voies respiratoires.', instructions: 'Crocheter les mains de l\'agresseur avec vos mains, tirer vers le bas. Coup de genou simultané.', keyPoints: ['Crochetage des mains', 'Coup de genou simultané', 'Projection si possible', 'Protéger la gorge'] },
      { name: 'Dégagement étranglement arrière', category: 'STRANGULATIONS', description: 'Libération en reculant en diagonale. Ne jamais rester sur place.', instructions: 'Reculer en diagonale arrière. Attaquer les parties génitales et le menton. Demi-tour rapide.', keyPoints: ['Crochetage en diagonal', 'Attaque parties génitales', 'Demi-tour rapide', 'Ne pas rester sur place'] },
    ],
    UV3: [
      { name: 'Roulade avant droite', category: 'AUTRES', description: 'Roulade par-dessus l\'épaule droite. Technique de réception essentielle.', instructions: 'Courber le dos en arc, poser les mains au sol, rouler sur l\'épaule en diagonale.', keyPoints: ['Courbe du dos', 'Propulsion des mains', 'Remontée rapide', 'Protection de la tête'] },
      { name: 'Chute arrière', category: 'AUTRES', description: 'Réception chute de dos. La chute la plus dangereuse.', instructions: 'Menton rentré vers la poitrine, frapper le sol avec les avant-bras. Jambes fléchies.', keyPoints: ['Menton rentré', 'Frappe sol avec avant-bras', 'Garde maintenue', 'Jambes prêtes'] },
    ],
    UV4: [
      { name: 'Position de garde', category: 'AUTRES', description: 'Garde de combat de base. La fondation de tout combat.', instructions: 'Pieds écartés à la largeur des épaules, genoux fléchis, mains hautes protégeant le visage.', keyPoints: ['Pieds écartés', 'Mains hautes', 'Mouvement constant', 'Équilibre stable'] },
    ],
    UV5: [
      { name: 'Pontage', category: 'ATTAQUES_AU_SOL', description: 'Mouvement de base au sol. Échappement fondamental.', instructions: 'De dos, poser les pieds et la nuque au sol, pousser les hanches vers le haut.', keyPoints: ['Hanches hautes', 'Appui tête et pieds', 'Explosivité', 'Création d\'espace'] },
    ],
    UV6: [
      { name: '360° parade couteau', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Défense circulaire contre couteau. Priorité: ne pas se faire blesser.', instructions: 'Mouvement circulaire avec l\'avant-bras pour dévier la lame. Contrôler le bras armé.', keyPoints: ['Parade avant-bras', 'Contrôle bras armé', 'Fuite si possible', 'Ne pas rester sur place'] },
    ],
  },
  ORANGE: {
    UV1: [
      { name: 'Uppercut de poing', category: 'FRAPPE_DE_FACE', description: 'Coup de poing montant. Puissant en infighting.', instructions: 'Rotation des hanches, montée verticale du poing. Impact sous le menton.', keyPoints: ['Rotation des hanches', 'Montée verticale', 'Impact sous menton', 'Courte distance'] },
      { name: 'Coups de pied pas glissés', category: 'FRAPPE_DE_FACE', description: 'Direct, circulaire et de côté en glissant. Technique avancée de déplacement.', instructions: 'Glissement du pied arrière tout en frappant. Maintien de l\'équilibre.', keyPoints: ['Glissement du pied arrière', 'Maintien équilibre', 'Vitesse d\'exécution', 'Surprise'] },
    ],
    UV2: [
      { name: 'Dégagement guillotine bras autour du cou', category: 'STRANGULATIONS', description: 'Libération d\'étranglement bras autour du cou. Urgent et dangereux.', instructions: 'Saisir l\'avant-bras de l\'agresseur, coup de paume aux parties. Placer l\'épaule sous le menton.', keyPoints: ['Saisie avant-bras', 'Coup paume parties', 'Placer épaule', 'Rotation rapide'] },
      { name: 'Dégagement prise de poignet bras droit', category: 'SAISISSEMENTS', description: 'Libération saisie poignet. Techniques de clé.', instructions: 'Rotation du poignet, levier contre le pouce. Explosivité dans le mouvement.', keyPoints: ['Rotation poignet', 'Levier contre pouce', 'Explosivité', 'Contre-attaque'] },
      { name: 'Sprawl', category: 'SAISISSEMENTS', description: 'Défense contre double leg takedown. Empêcher l\'amener au sol.', instructions: 'Jambes en arrière, hanches basses, bras au centre. Récupération debout immédiate.', keyPoints: ['Jambes en arrière', 'Hanches basses', 'Bras au centre', 'Récupération debout'] },
    ],
    UV3: [
      { name: 'Chute arrière de hauteur', category: 'AUTRES', description: 'Chute de hauteur avec amorti. Technique de réception avancée.', instructions: 'Amorti progressif, roulade si possible. Protection de la tête en priorité.', keyPoints: ['Amorti progressif', 'Roulade si possible', 'Protection tête', 'Contrôle du corps'] },
    ],
    UV4: [
      { name: 'Double Leg', category: 'SAISISSEMENTS', description: 'Saisie des deux jambes pour amenée au sol. Base du wrestling.', instructions: 'Baisse du niveau, tête sur hanche. Conduite au sol avec contrôle.', keyPoints: ['Baisse niveau', 'Tête sur hanche', 'Conduite au sol', 'Contrôle immédiat'] },
    ],
    UV5: [
      { name: 'Garde de côté', category: 'ATTAQUES_AU_SOL', description: 'Position défensive au sol sur le côté. Protection des organes vitaux.', instructions: 'Genou au ventre, coude au sol. Hanche protégée, remontée facile.', keyPoints: ['Genou au ventre', 'Coude au sol', 'Hanche protégée', 'Remontée facile'] },
    ],
    UV6: [
      { name: 'Défense couteau haut 360°', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade circulaire couteau de haut. Pas de désarmement obligatoire.', instructions: 'Parade avant-bras, 2 coups minimum, attraper le bras armé. Pas de désarmement.', keyPoints: ['Parade avant-bras', '2 coups minimum', 'Attraper bras armé', 'Pas de désarmement'] },
    ],
    UV7: [
      { name: 'Combat 2x2 minutes', category: 'AUTRES', description: 'Combat évalué souple. Pas de points, attitude générale.', instructions: 'Combat en position de garde avec contrôles. Respect du partenaire.', keyPoints: ['Courage', 'Détermination', 'Respect partenaire', 'Technique minimum'] },
    ],
  },
  VERTE: {
    UV1: [
      { name: 'Coup du tranchant extérieur', category: 'FRAPPE_DE_COTE', description: 'Coup avec tranchant main/avant-bras latéral', instructions: 'Rotation corps, impact tranchant. Puissance hanche, distance moyenne.', keyPoints: ['Rotation corps', 'Impact tranchant', 'Puissance hanche', 'Distance moyenne'] },
      { name: 'Coup de pied gifle intérieur', category: 'FRAPPE_DE_COTE', description: 'Coup de pied circulaire intérieur', instructions: 'Jambe tendue, impact intérieur pied. Ouverture hanche, vitesse.', keyPoints: ['Jambe tendue', 'Impact intérieur pied', 'Ouverture hanche', 'Vitesse'] },
    ],
    UV2: [
      { name: 'Dégagement prise de cheveux', category: 'SAISISSEMENTS', description: 'Libération prise cheveux tous angles', instructions: 'Protection tête, frappe parties, torsion poignet. Projection possible.', keyPoints: ['Protection tête', 'Frappe parties', 'Torsion poignet', 'Projection possible'] },
    ],
    UV4: [
      { name: 'Swing', category: 'FRAPPE_DE_COTE', description: 'Coup de poing large circulaire', instructions: 'Grand arc, rotation épaule. Impact latéral, puissance.', keyPoints: ['Grand arc', 'Rotation épaule', 'Impact latéral', 'Puissance'] },
      { name: 'Clé de poignet', category: 'SAISISSEMENTS', description: 'Contrôle poignet par levier', instructions: 'Saisie ferme, levier contrôle. Suivre mouvement, projection possible.', keyPoints: ['Saisie ferme', 'Levier contrôle', 'Suivre mouvement', 'Projection possible'] },
    ],
    UV5: [
      { name: 'Position croix', category: 'ATTAQUES_AU_SOL', description: 'Position contrôle à 90 degrés', instructions: 'Genou sur ventre, contrôle épaules. Frapper librement, stabilisation.', keyPoints: ['Genou sur ventre', 'Contrôle épaules', 'Frapper librement', 'Stabilisation'] },
    ],
    UV7: [
      { name: 'Combat évalué', category: 'AUTRES', description: 'Combat 2x2 minutes avec évaluation', instructions: 'Attitude générale, technique variée. Respect règles, sang-froid.', keyPoints: ['Attitude générale', 'Technique variée', 'Respect règles', 'Sang-froid'] },
    ],
  },
  BLEUE: {
    UV4: [
      { name: 'Kakato', category: 'FRAPPE_DE_FACE', description: 'Coup pied talon haut-bas', instructions: 'Talon vers bas, impact puissant. Cible tête/épaules, équilibre.', keyPoints: ['Talon vers bas', 'Impact puissant', 'Cible tête/épaules', 'Équilibre'] },
      { name: 'O-Soto-Gari', category: 'SAISISSEMENTS', description: 'Fauchage jambe extérieur arrière', instructions: 'Crochetage jambe, poussée épaule. Déséquilibre arrière, contrôle chute.', keyPoints: ['Crochetage jambe', 'Poussée épaule', 'Déséquilibre arrière', 'Contrôle chute'] },
    ],
    UV5: [
      { name: 'Défense guillotine sol', category: 'STRANGULATIONS', description: 'Libération clé coude au sol', instructions: 'Protection carotide, saisie bras. Compression cou, évasion latérale.', keyPoints: ['Protection carotide', 'Saisie bras', 'Compression cou', 'Évasion latérale'] },
    ],
    UV6: [
      { name: 'Défense couteau rasoir', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade attaque circulaire aller-retour', instructions: 'Parade deux bras, contrôle bras armé. Désarmement, fuite si possible.', keyPoints: ['Parade deux bras', 'Contrôle bras armé', 'Désarmement', 'Fuite si possible'] },
    ],
  },
  MARRON: {
    UV1: [
      { name: 'Coup de genou sauté direct', category: 'FRAPPE_DE_FACE', description: 'Genou montant avec saut', instructions: 'Élan saut, montée genou. Impact puissant, récupération.', keyPoints: ['Élan saut', 'Montée genou', 'Impact puissant', 'Récupération'] },
      { name: 'Coup de pied sauté circulaire', category: 'FRAPPE_DE_COTE', description: 'Coup pied circulaire avec saut', instructions: 'Rotation saut, jambe tendue. Impact latéral, équilibre.', keyPoints: ['Rotation saut', 'Jambe tendue', 'Impact latéral', 'Équilibre'] },
    ],
    UV7: [
      { name: 'Neutralisation pistolet', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Désarmement arme de poing', instructions: 'Calme, déviation, contrôle. Désarmement rapide, sécurisation.', keyPoints: ['Calme', 'Déviation', 'Contrôle', 'Désarmement'] },
    ],
  },
  NOIRE_1: {
    UV2: [
      { name: 'Shadow codifié', category: 'AUTRES', description: '3 minutes techniques imposées', instructions: 'Déplacements, techniques, fluidité. Respect séquence imposée.', keyPoints: ['Déplacements', 'Techniques', 'Fluidité', 'Codifié'] },
    ],
    UV3: [
      { name: 'Défenses inconnues', category: 'AUTRES', description: 'Attaques non connues à l\'avance', instructions: 'Ne pas reculer, défense-contre. Réactivité, adaptation.', keyPoints: ['Ne pas reculer', 'Défense-contre', 'Réactivité', 'Adaptation'] },
    ],
  },
}

async function main() {
  console.log('🌱 Démarrage du seed FEKM...')

  await prisma.userTechniqueVideo.deleteMany().catch(() => {})
  await prisma.techniqueVideoLink.deleteMany().catch(() => {})
  await prisma.videoAsset.deleteMany().catch(() => {})
  await prisma.userTechniqueProgress.deleteMany().catch(() => {})
  await prisma.technique.deleteMany().catch(() => {})
  await prisma.module.deleteMany().catch(() => {})
  await prisma.beltContent.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})
  await prisma.belt.deleteMany().catch(() => {})

  for (const beltData of beltsData) {
    const belt = await prisma.belt.create({
      data: {
        name: beltData.name,
        color: beltData.color,
        order: beltData.order,
        description: beltData.description,
        content: { create: { examRequirements: beltData.examRequirements, principles: beltData.principles } },
      },
    })
    console.log(`✓ Ceinture ${belt.name}`)

    const modules = modulesData[beltData.name] || []
    for (const moduleData of modules) {
      const module = await prisma.module.create({
        data: {
          beltId: belt.id,
          code: moduleData.code,
          name: moduleData.name,
          description: moduleData.description,
          order: moduleData.order,
        },
      })

      const techniques = techniquesData[beltData.name]?.[moduleData.code] || []
      for (let i = 0; i < techniques.length; i++) {
        const tech = techniques[i]
        await prisma.technique.create({
          data: {
            moduleId: module.id,
            name: tech.name,
            category: tech.category as any,
            description: tech.description,
            instructions: tech.instructions || null,
            keyPoints: tech.keyPoints,
            order: i + 1,
          },
        })
      }
      if (techniques.length > 0) {
        console.log(`  ✓ ${module.code}: ${techniques.length} techniques`)
      }
    }
  }

  const yellowBelt = await prisma.belt.findUnique({ where: { name: 'JAUNE' } })
  
  await prisma.user.create({
    data: {
      email: 'demo@fekm.com',
      name: 'Démo Utilisateur',
      password: await bcrypt.hash('demo123', 10),
      role: 'STUDENT',
      beltId: yellowBelt?.id,
    },
  })
  console.log('👤 demo@fekm.com / demo123')

  await prisma.user.create({
    data: {
      email: 'admin@fekm.fr',
      name: 'Administrateur',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      beltId: yellowBelt?.id,
    },
  })
  console.log('👤 admin@fekm.fr / admin123')

  console.log('✅ Seed terminé!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
