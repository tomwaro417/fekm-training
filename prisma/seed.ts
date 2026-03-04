import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const beltsData = [
  {
    name: 'JAUNE', color: '#FFD700', order: 1,
    description: 'Premier niveau du programme FEKM. Initiation aux bases du Krav Maga.',
    examRequirements: 'Présentation correcte des techniques de base, compréhension des principes.',
    principles: 'Défense et contre-attaque simultanée. Simplicité et efficacité.',
  },
  {
    name: 'ORANGE', color: '#FF8C00', order: 2,
    description: 'Consolidation des bases et introduction aux défenses sur saisies.',
    examRequirements: 'Techniques du programme + révisions ceinture jaune.',
    principles: 'Gestion du stress. Riposte immédiate.',
  },
  {
    name: 'VERTE', color: '#228B22', order: 3,
    description: 'Défenses sur attaques circulaires et saisies complexes.',
    examRequirements: 'Techniques du programme + révisions ceintures précédentes.',
    principles: 'Défense sur attaques circulaires. Projection et équilibre.',
  },
  {
    name: 'BLEUE', color: '#1E90FF', order: 4,
    description: 'Défenses au sol avancées et armes blanches.',
    examRequirements: 'Programme complet + révisions.',
    principles: 'Combat au sol. Défense contre armes blanches.',
  },
  {
    name: 'MARRON', color: '#8B4513', order: 5,
    description: 'Techniques avancées, armes à feu et situations complexes.',
    examRequirements: 'Maîtrise de toutes les techniques. Combat évalué.',
    principles: 'Défense contre armes à feu. Protection de tiers.',
  },
  {
    name: 'NOIRE_1', color: '#000000', order: 6,
    description: 'Premier grade ceinture noire (1ère Darga).',
    examRequirements: 'Examen complet de toutes les techniques du cursus.',
    principles: 'Maîtrise totale. Capacité d\'enseignement.',
  },
]

const modulesData: Record<string, Array<{ code: string; name: string; description: string; order: number }>> = {
  JAUNE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Coups donnés sans appels', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Étranglements de face, côté et arrière', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Roulades avant/arrière', order: 3 },
    { code: 'UV4', name: 'Techniques en position de garde', description: 'Base, déplacements', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Mouvements de base', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Défenses couteau', order: 6 },
  ],
  ORANGE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Uppercut, coups de pied avancés', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Étranglements avancés', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Chutes en hauteur', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Garde, esquives', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Garde au sol', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Défenses couteau', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat souple', order: 7 },
  ],
  VERTE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Tranchants, gifles', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Cheveux, étreintes', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Roulades plombées', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Swing, clés', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Garde, défenses', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Saisies couteau', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat 2x2', order: 7 },
  ],
  BLEUE: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Tranchant intérieur', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Saisies vêtements', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Chute amortie', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Kakato, fauchages', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Défenses guillotine', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Couteau, bâton', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat corps à corps', order: 7 },
  ],
  MARRON: [
    { code: 'UV1', name: 'Techniques en position neutre', description: 'Coups de pied sautés', order: 1 },
    { code: 'UV2', name: 'Défenses contre saisies', description: 'Nelson, clés', order: 2 },
    { code: 'UV3', name: 'Chutes et roulades', description: 'Toutes les chutes', order: 3 },
    { code: 'UV4', name: 'Techniques de combat', description: 'Défenses inconnues', order: 4 },
    { code: 'UV5', name: 'Sol', description: 'Déséquilibre, clés', order: 5 },
    { code: 'UV6', name: 'Armes blanches', description: 'Couteau, bâton', order: 6 },
    { code: 'UV7', name: 'Armes à feu', description: 'Neutralisation pistolet', order: 7 },
    { code: 'UV8', name: 'Combat', description: 'Combat évalué', order: 8 },
  ],
  NOIRE_1: [
    { code: 'UV1', name: 'Frappes sans appel', description: 'Directs, enchaînements', order: 1 },
    { code: 'UV2', name: 'Shadow codifié', description: '3 minutes imposées', order: 2 },
    { code: 'UV3', name: 'Défenses pieds-poings', description: 'Attaques inconnues', order: 3 },
    { code: 'UV4', name: 'Saisies et sol', description: 'Étranglements, saisies', order: 4 },
    { code: 'UV5', name: 'Armes blanches', description: 'Bâton, couteau', order: 5 },
    { code: 'UV6', name: 'Armes à feu', description: 'Menaces toutes positions', order: 6 },
    { code: 'UV7', name: 'Combat', description: 'Combat évalué', order: 7 },
  ],
}

const techniquesData: Record<string, Record<string, Array<{ name: string; category: string; description: string; instructions?: string; keyPoints: string[] }>>> = {
  JAUNE: {
    UV1: [
      { name: 'Coup de tête de face', category: 'FRAPPE_DE_FACE', description: 'Frappe avec le front vers le visage.', instructions: 'Projeter le front vers l\'avant.', keyPoints: ['Coup sec', 'Viser nez/menton', 'Ne pas baisser garde'] },
      { name: 'Coude circulaire de face', category: 'FRAPPE_DE_FACE', description: 'Coup de coude horizontal.', instructions: 'Rotation des hanches.', keyPoints: ['Rotation hanches', 'Impact coude', 'Protection tête'] },
      { name: 'Coude remontant', category: 'FRAPPE_DE_FACE', description: 'Coup de coude montant.', instructions: 'Monter le coude verticalement.', keyPoints: ['Mouvement vertical', 'Impact mâchoire', 'Courte distance'] },
      { name: 'Direct de poing', category: 'FRAPPE_DE_FACE', description: 'Coup de poing tendu direct.', instructions: 'Extension rapide du bras.', keyPoints: ['Extension complète', 'Rotation poing', 'Récupération rapide'] },
      { name: 'Coup de pied direct', category: 'FRAPPE_DE_FACE', description: 'Coup de pied tendu de face.', instructions: 'Extension de jambe rapide.', keyPoints: ['Extension jambe', 'Récupération rapide', 'Cible genoux'] },
      { name: 'Coup de pied circulaire', category: 'FRAPPE_DE_COTE', description: 'Coup de pied en arc horizontal.', instructions: 'Rotation sur soi-même.', keyPoints: ['Rotation', 'Impact latéral', 'Cible côtes'] },
      { name: 'Coup de genou direct', category: 'FRAPPE_DE_FACE', description: 'Coup de genou montant.', instructions: 'Monter le genou rapidement.', keyPoints: ['Montée explosive', 'Cible parties', 'Récupération rapide'] },
      { name: 'Marteau de poing', category: 'FRAPPE_DE_FACE', description: 'Coup de poing descendant.', instructions: 'Descendre le poing verticalement.', keyPoints: ['Mouvement vertical', 'Cible nez/nuque', 'Poids du corps'] },
      { name: 'Coup de pied arrière', category: 'FRAPPE_DE_COTE', description: 'Coup de pied donné en arrière.', instructions: 'Pivoter sur le pied avant.', keyPoints: ['Pivot', 'Impact talon', 'Cible genoux'] },
    ],
    UV2: [
      { name: 'Dégagement étranglement avant', category: 'STRANGULATIONS', description: 'Libération étranglement de face.', instructions: 'Crocheter les mains, tirer vers le bas.', keyPoints: ['Crochetage mains', 'Genou simultané', 'Protéger gorge'] },
      { name: 'Dégagement étranglement arrière', category: 'STRANGULATIONS', description: 'Libération en reculant.', instructions: 'Reculer en diagonale, attaquer parties.', keyPoints: ['Recul diagonal', 'Attaque parties', 'Demi-tour'] },
      { name: 'Dégagement étranglement côté droit', category: 'STRANGULATIONS', description: 'Libération étranglement côté droit.', instructions: 'Saisir bras, tourner menton.', keyPoints: ['Saisir bras', 'Tourner menton', 'Pied genou'] },
      { name: 'Dégagement étranglement côté gauche', category: 'STRANGULATIONS', description: 'Libération étranglement côté gauche.', instructions: 'Saisir bras, tourner menton.', keyPoints: ['Saisir bras', 'Tourner menton', 'Pied genou'] },
      { name: 'Dégagement étranglement dos au mur', category: 'STRANGULATIONS', description: 'Libération dos au mur.', instructions: 'Se baisser, frapper parties.', keyPoints: ['Baisser', 'Frapper parties', 'Décaler'] },
      { name: 'Dégagement étreinte par devant bras libres', category: 'SAISISSEMENTS', description: 'Libération étreinte par devant.', instructions: 'Coup de tête, genoux répétés.', keyPoints: ['Tête immédiat', 'Genoux répétés', 'Pousser hanches'] },
      { name: 'Dégagement étreinte par devant bras pris', category: 'SAISISSEMENTS', description: 'Libération étreinte bras pris.', instructions: 'Baisser centre gravité, frapper.', keyPoints: ['Baisser', 'Frapper', 'Retourner'] },
      { name: 'Dégagement saisie poignet deux mains', category: 'SAISISSEMENTS', description: 'Libération saisie deux mains.', instructions: 'Rotation poignet, levier pouces.', keyPoints: ['Rotation', 'Levier pouces', 'Tirer'] },
    ],
    UV3: [
      { name: 'Roulade avant droite', category: 'AUTRES', description: 'Roulade épaule droite.', instructions: 'Courber dos, poser mains.', keyPoints: ['Courbe dos', 'Propulsion mains', 'Remontée'] },
      { name: 'Roulade avant gauche', category: 'AUTRES', description: 'Roulade épaule gauche.', instructions: 'Courber dos, poser mains.', keyPoints: ['Courbe dos', 'Propulsion mains', 'Remontée'] },
      { name: 'Chute arrière', category: 'AUTRES', description: 'Réception chute de dos.', instructions: 'Menton rentré, frapper sol.', keyPoints: ['Menton rentré', 'Frapper sol', 'Garde'] },
      { name: 'Chute latérale droite', category: 'AUTRES', description: 'Réception chute droite.', instructions: 'Poser bras droit, absorber.', keyPoints: ['Bras absorption', 'Protection côtes', 'Remontée'] },
      { name: 'Chute latérale gauche', category: 'AUTRES', description: 'Réception chute gauche.', instructions: 'Poser bras gauche, absorber.', keyPoints: ['Bras absorption', 'Protection côtes', 'Remontée'] },
      { name: 'Roulade arrière', category: 'AUTRES', description: 'Roulade en arrière.', instructions: 'Se laisser aller, rouler.', keyPoints: ['Laisser aller', 'Rouler', 'Remontée'] },
    ],
    UV4: [
      { name: 'Position de garde', category: 'AUTRES', description: 'Garde de combat base.', instructions: 'Pieds écartés, genoux fléchis.', keyPoints: ['Pieds écartés', 'Mains hautes', 'Équilibre'] },
      { name: 'Déplacements avant/arrière', category: 'AUTRES', description: 'Déplacements en ligne.', instructions: 'Glisser pieds sans croiser.', keyPoints: ['Pas glissés', 'Maintien garde', 'Équilibre'] },
      { name: 'Déplacements latéraux', category: 'AUTRES', description: 'Déplacements côté.', instructions: 'Glisser côté, pieds parallèles.', keyPoints: ['Latéral', 'Pas croisement', 'Garde'] },
      { name: '360° défense', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Parade circulaire crochet.', instructions: 'Tourner corps, parer avant-bras.', keyPoints: ['Rotation', 'Blocage', 'Contre-attaque'] },
      { name: 'Défense direct simultanée', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Parade et contre.', instructions: 'Parade paume, contre simultanée.', keyPoints: ['Parade paume', 'Contre', 'Ne pas reculer'] },
      { name: 'Défense crochet simultanée', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Parade crochet et contre.', instructions: 'Parade avant-bras, contre.', keyPoints: ['Parade', 'Contre', 'Rotation'] },
    ],
    UV5: [
      { name: 'Pontage', category: 'ATTAQUES_AU_SOL', description: 'Mouvement base au sol.', instructions: 'Poser pieds et nuque, pousser hanches.', keyPoints: ['Hanches hautes', 'Appui', 'Explosivité'] },
      { name: 'Remontée technique', category: 'ATTAQUES_AU_SOL', description: 'Remontée au sol.', instructions: 'Rouler côté, genou au sol.', keyPoints: ['Rouler', 'Genou', 'Remontée'] },
      { name: 'Défense étranglement au sol', category: 'STRANGULATIONS', description: 'Libération étranglement sol.', instructions: 'Crocheter mains, tourner tête.', keyPoints: ['Crocheter', 'Tourner', 'Remontée'] },
      { name: 'Retournement', category: 'ATTAQUES_AU_SOL', description: 'Retournement au sol.', instructions: 'Utiliser jambes, contrôle hanches.', keyPoints: ['Jambes', 'Hanches', 'Explosivité'] },
    ],
    UV6: [
      { name: '360° parade couteau', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Défense circulaire couteau.', instructions: 'Mouvement circulaire avant-bras.', keyPoints: ['Parade', 'Contrôle bras', 'Fuite'] },
      { name: 'Défense couteau haut', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade couteau haut.', instructions: 'Parade avant-bras, contre.', keyPoints: ['Parade', 'Contre', 'Contrôle'] },
      { name: 'Défense couteau bas', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade couteau bas.', instructions: 'Parade vers bas, contre.', keyPoints: ['Parade bas', 'Contre', 'Contrôle'] },
      { name: 'Utilisation objet arme', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Objet comme arme.', instructions: 'Saisir fermement, frapper.', keyPoints: ['Saisie', 'Frapper', 'Distance'] },
    ],
  },
  ORANGE: {
    UV1: [
      { name: 'Uppercut poing', category: 'FRAPPE_DE_FACE', description: 'Coup poing montant.', instructions: 'Rotation hanches, montée verticale.', keyPoints: ['Rotation', 'Montée', 'Impact menton'] },
      { name: 'Crochet poing', category: 'FRAPPE_DE_COTE', description: 'Coup circulaire horizontal.', instructions: 'Rotation hanches et épaules.', keyPoints: ['Rotation', 'Latéral', 'Coude 90°'] },
      { name: 'Direct arrière', category: 'FRAPPE_DE_FACE', description: 'Coup tendu arrière.', instructions: 'Rotation hanches, extension bras.', keyPoints: ['Rotation', 'Extension', 'Puissant'] },
      { name: 'Coup pied pas glissé direct', category: 'FRAPPE_DE_FACE', description: 'Direct avec glissement.', instructions: 'Glissement pied arrière.', keyPoints: ['Glissement', 'Équilibre', 'Vitesse'] },
      { name: 'Coup pied pas glissé circulaire', category: 'FRAPPE_DE_COTE', description: 'Circulaire avec glissement.', instructions: 'Glissement latéral, circulaire.', keyPoints: ['Glissement', 'Rotation', 'Latéral'] },
      { name: 'Genou circulaire intérieur', category: 'FRAPPE_DE_COTE', description: 'Genou arc intérieur.', instructions: 'Monter genou côté, intérieur.', keyPoints: ['Montée', 'Rotation', 'Côtes'] },
      { name: 'Genou circulaire extérieur', category: 'FRAPPE_DE_COTE', description: 'Genou arc extérieur.', instructions: 'Monter genou côté, extérieur.', keyPoints: ['Montée', 'Rotation', 'Côtes'] },
    ],
    UV2: [
      { name: 'Dégagement guillotine', category: 'STRANGULATIONS', description: 'Libération guillotine.', instructions: 'Saisir avant-bras, coup paume.', keyPoints: ['Saisie', 'Paume', 'Rotation'] },
      { name: 'Dégagement poignet droit', category: 'SAISISSEMENTS', description: 'Libération poignet droit.', instructions: 'Rotation extérieure, levier.', keyPoints: ['Rotation', 'Levier', 'Explosivité'] },
      { name: 'Dégagement poignet gauche', category: 'SAISISSEMENTS', description: 'Libération poignet gauche.', instructions: 'Rotation extérieure, levier.', keyPoints: ['Rotation', 'Levier', 'Explosivité'] },
      { name: 'Dégagement étreinte derrière', category: 'SAISISSEMENTS', description: 'Libération étreinte derrière.', instructions: 'Baisser, frapper talon.', keyPoints: ['Baisser', 'Frapper', 'Retourner'] },
      { name: 'Sprawl', category: 'SAISISSEMENTS', description: 'Défense double leg.', instructions: 'Jambes arrière, hanches basses.', keyPoints: ['Jambes', 'Hanches', 'Récupération'] },
      { name: 'Dégagement deux poignets', category: 'SAISISSEMENTS', description: 'Libération deux poignets.', instructions: 'Baisser, ramener bras, tête.', keyPoints: ['Baisser', 'Ramener', 'Tête'] },
    ],
    UV3: [
      { name: 'Chute hauteur', category: 'AUTRES', description: 'Chute hauteur amortie.', instructions: 'Amorti progressif, roulade.', keyPoints: ['Amorti', 'Tête', 'Contrôle'] },
      { name: 'Roulade Judo', category: 'AUTRES', description: 'Roulade type Judo.', instructions: 'Rouler arc, poser main.', keyPoints: ['Arc', 'Absorption', 'Fluide'] },
      { name: 'Roulade plombée', category: 'AUTRES', description: 'Roulade impact sol.', instructions: 'Roulade frappe sol.', keyPoints: ['Frappe', 'Immobiliser', 'Contrôle'] },
    ],
    UV4: [
      { name: 'Double leg', category: 'SAISISSEMENTS', description: 'Saisie deux jambes.', instructions: 'Baisse niveau, tête hanche.', keyPoints: ['Baisse', 'Tête', 'Conduite'] },
      { name: 'Single leg', category: 'SAISISSEMENTS', description: 'Saisie une jambe.', instructions: 'Baisse, saisie, poussée.', keyPoints: ['Baisse', 'Saisie', 'Poussée'] },
      { name: 'Esquive corps', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Esquive buste.', instructions: 'Décalage buste, retour.', keyPoints: ['Décalage', 'Retour', 'Contre'] },
    ],
    UV5: [
      { name: 'Garde côté', category: 'ATTAQUES_AU_SOL', description: 'Position défensive côté.', instructions: 'Genou ventre, coude sol.', keyPoints: ['Genou', 'Coude', 'Hanche'] },
      { name: 'Pontage latéral', category: 'ATTAQUES_AU_SOL', description: 'Pontage côté.', instructions: 'Rotation côté, poussée hanches.', keyPoints: ['Rotation', 'Poussée', 'Espace'] },
      { name: 'Remontée technique', category: 'ATTAQUES_AU_SOL', description: 'Remontée technique.', instructions: 'Mouvement technique, protection.', keyPoints: ['Technique', 'Protection', 'Défensive'] },
    ],
    UV6: [
      { name: 'Défense couteau haut 360', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade couteau haut.', instructions: 'Parade avant-bras, 2 coups.', keyPoints: ['Parade', '2 coups', 'Attraper'] },
      { name: 'Défense couteau bas 360', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade couteau bas.', instructions: 'Parade bas, contre.', keyPoints: ['Parade bas', 'Contre', 'Contrôle'] },
    ],
    UV7: [
      { name: 'Combat 2x2 minutes', category: 'AUTRES', description: 'Combat évalué.', instructions: 'Combat garde avec contrôles.', keyPoints: ['Courage', 'Détermination', 'Respect'] },
    ],
  },
  VERTE: {
    UV1: [
      { name: 'Tranchant extérieur', category: 'FRAPPE_DE_COTE', description: 'Coup tranchant latéral.', instructions: 'Rotation corps, impact tranchant.', keyPoints: ['Rotation', 'Tranchant', 'Hanche'] },
      { name: 'Gifle intérieur', category: 'FRAPPE_DE_COTE', description: 'Pied circulaire intérieur.', instructions: 'Jambe tendue, impact intérieur.', keyPoints: ['Tendue', 'Intérieur', 'Hanche'] },
      { name: 'Gifle extérieur', category: 'FRAPPE_DE_COTE', description: 'Pied circulaire extérieur.', instructions: 'Jambe tendue, impact extérieur.', keyPoints: ['Tendue', 'Extérieur', 'Rotation'] },
      { name: 'Genou sauté', category: 'FRAPPE_DE_FACE', description: 'Genou avec saut.', instructions: 'Petit saut, montée explosive.', keyPoints: ['Saut', 'Explosif', 'Puissant'] },
    ],
    UV2: [
      { name: 'Dégagement cheveux', category: 'SAISISSEMENTS', description: 'Libération cheveux.', instructions: 'Protection tête, frappe, torsion.', keyPoints: ['Protection', 'Frappe', 'Torsion'] },
      { name: 'Dégagement étreinte devant', category: 'SAISISSEMENTS', description: 'Libération étreinte.', instructions: 'Baisser, frapper, retourner.', keyPoints: ['Baisser', 'Frapper', 'Retourner'] },
      { name: 'Dégagement saisie jambe', category: 'SAISISSEMENTS', description: 'Libération jambe.', instructions: 'Équilibre, frappe, dégagement.', keyPoints: ['Équilibre', 'Frappe', 'Dégagement'] },
    ],
    UV3: [
      { name: 'Roulade plombée', category: 'AUTRES', description: 'Roulade impact.', instructions: 'Roulade frappe sol.', keyPoints: ['Frappe', 'Immobiliser', 'Contrôle'] },
      { name: 'Roulade latérale', category: 'AUTRES', description: 'Roulade côté.', instructions: 'Roulade latérale, absorption.', keyPoints: ['Latérale', 'Absorption', 'Remontée'] },
    ],
    UV4: [
      { name: 'Swing', category: 'FRAPPE_DE_COTE', description: 'Poing large circulaire.', instructions: 'Grand arc, rotation épaule.', keyPoints: ['Arc', 'Rotation', 'Latéral'] },
      { name: 'Clé poignet', category: 'SAISISSEMENTS', description: 'Contrôle poignet.', instructions: 'Saisie ferme, levier.', keyPoints: ['Saisie', 'Levier', 'Contrôle'] },
      { name: 'Clé coude', category: 'SAISISSEMENTS', description: 'Contrôle coude.', instructions: 'Saisie coude, levier.', keyPoints: ['Saisie', 'Levier', 'Contrôle'] },
      { name: 'Enchaînement', category: 'FRAPPE_DE_FACE', description: 'Enchaînement frappes.', instructions: 'Combinaison poing pied.', keyPoints: ['Fluidité', 'Puissance', 'Récupération'] },
    ],
    UV5: [
      { name: 'Position croix', category: 'ATTAQUES_AU_SOL', description: 'Contrôle 90 degrés.', instructions: 'Genou ventre, contrôle épaules.', keyPoints: ['Genou', 'Contrôle', '90°'] },
      { name: 'Défense étranglement sol', category: 'STRANGULATIONS', description: 'Libération étranglement.', instructions: 'Crocheter, tourner, remonter.', keyPoints: ['Crocheter', 'Tourner', 'Remonter'] },
      { name: 'Montée technique', category: 'ATTAQUES_AU_SOL', description: 'Montée au sol.', instructions: 'Technique montée, contrôle.', keyPoints: ['Technique', 'Montée', 'Contrôle'] },
    ],
    UV6: [
      { name: 'Défense couteau haut', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade couteau haut.', instructions: 'Parade, contre, contrôle.', keyPoints: ['Parade', 'Contre', 'Contrôle'] },
      { name: 'Défense couteau bas', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade couteau bas.', instructions: 'Parade bas, contre.', keyPoints: ['Parade', 'Contre', 'Contrôle'] },
      { name: 'Défense couteau piqué', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Parade couteau piqué.', instructions: 'Déviation, contre, contrôle.', keyPoints: ['Déviation', 'Contre', 'Contrôle'] },
    ],
    UV7: [
      { name: 'Combat 2x2', category: 'AUTRES', description: 'Combat évalué.', instructions: 'Combat 2x2 minutes.', keyPoints: ['Courage', 'Technique', 'Endurance'] },
    ],
  },
  BLEUE: {
    UV1: [
      { name: 'Tranchant intérieur', category: 'FRAPPE_DE_COTE', description: 'Tranchant intérieur.', instructions: 'Rotation, impact intérieur.', keyPoints: ['Rotation', 'Intérieur', 'Hanche'] },
      { name: 'Défense coup côté', category: 'DEFENSES_SUR_ATTAQUES_CIRCULAIRES', description: 'Défense crochet.', instructions: 'Parade, contre simultanée.', keyPoints: ['Parade', 'Contre', 'Simultanée'] },
    ],
    UV2: [
      { name: 'Dégagement saisie vêtements', category: 'SAISISSEMENTS', description: 'Libération vêtements.', instructions: 'Saisie main, rotation, levier.', keyPoints: ['Saisie', 'Rotation', 'Levier'] },
      { name: 'Dégagement épaule', category: 'SAISISSEMENTS', description: 'Libération épaule.', instructions: 'Baisser, rotation, frapper.', keyPoints: ['Baisser', 'Rotation', 'Frapper'] },
      { name: 'Dégagement dos', category: 'SAISISSEMENTS', description: 'Libération saisie dos.', instructions: 'Saisie bras, rotation, frapper.', keyPoints: ['Saisie', 'Rotation', 'Frapper'] },
    ],
    UV3: [
      { name: 'Chute amortie avant-bras', category: 'AUTRES', description: 'Chute avant-bras.', instructions: 'Absorption avant-bras, roulade.', keyPoints: ['Absorption', 'Avant-bras', 'Roulade'] },
    ],
    UV4: [
      { name: 'Kakato', category: 'FRAPPE_DE_COTE', description: 'Coup talon arrière.', instructions: 'Rotation, talon arrière.', keyPoints: ['Rotation', 'Talon', 'Arrière'] },
      { name: 'Fauchage intérieur', category: 'ATTAQUES_AU_SOL', description: 'Fauchage intérieur.', instructions: 'Bas niveau, fauchage jambe.', keyPoints: ['Bas', 'Fauchage', 'Intérieur'] },
      { name: 'Fauchage extérieur', category: 'ATTAQUES_AU_SOL', description: 'Fauchage extérieur.', instructions: 'Bas niveau, fauchage jambe.', keyPoints: ['Bas', 'Fauchage', 'Extérieur'] },
      { name: 'Projection épaule', category: 'ATTAQUES_AU_SOL', description: 'Projection épaule.', instructions: 'Saisie, rotation, projection.', keyPoints: ['Saisie', 'Rotation', 'Projection'] },
    ],
    UV5: [
      { name: 'Défense guillotine', category: 'STRANGULATIONS', description: 'Libération guillotine.', instructions: 'Crocheter, tourner, remonter.', keyPoints: ['Crocheter', 'Tourner', 'Remonter'] },
      { name: 'Défense étranglement sol', category: 'STRANGULATIONS', description: 'Libération étranglement.', instructions: 'Protection, crochetage, remontée.', keyPoints: ['Protection', 'Crochetage', 'Remontée'] },
      { name: 'Remontée technique', category: 'ATTAQUES_AU_SOL', description: 'Remontée technique.', instructions: 'Technique, protection, remontée.', keyPoints: ['Technique', 'Protection', 'Remontée'] },
    ],
    UV6: [
      { name: 'Défense couteau rasoir', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Défense rasoir.', instructions: 'Parade, contre, contrôle.', keyPoints: ['Parade', 'Contre', 'Contrôle'] },
      { name: 'Défense bâton', category: 'ATTAQUES_AVEC_BATON', description: 'Défense bâton.', instructions: 'Entrer, contre, contrôle.', keyPoints: ['Entrer', 'Contre', 'Contrôle'] },
    ],
    UV7: [
      { name: 'Combat corps à corps', category: 'AUTRES', description: 'Combat rapproché.', instructions: 'Clinch, genoux, coudes.', keyPoints: ['Clinch', 'Genoux', 'Coudes'] },
    ],
  },
  MARRON: {
    UV1: [
      { name: 'Coup pied sauté', category: 'FRAPPE_DE_FACE', description: 'Pied avec saut.', instructions: 'Saut, extension, impact.', keyPoints: ['Saut', 'Extension', 'Impact'] },
      { name: 'Enchaînement avancé', category: 'FRAPPE_DE_FACE', description: 'Enchaînement complexe.', instructions: 'Combinaison multiple, fluidité.', keyPoints: ['Multiple', 'Fluidité', 'Puissance'] },
    ],
    UV2: [
      { name: 'Dégagement Nelson', category: 'STRANGULATIONS', description: 'Libération Nelson.', instructions: 'Protection, crochetage, fuite.', keyPoints: ['Protection', 'Crochetage', 'Fuite'] },
      { name: 'Clé coude avancée', category: 'SAISISSEMENTS', description: 'Clé coude complexe.', instructions: 'Saisie, levier, projection.', keyPoints: ['Saisie', 'Levier', 'Projection'] },
      { name: 'Dégagement saisie complexe', category: 'SAISISSEMENTS', description: 'Libération complexe.', instructions: 'Analyse, technique, exécution.', keyPoints: ['Analyse', 'Technique', 'Exécution'] },
    ],
    UV3: [
      { name: 'Toutes chutes', category: 'AUTRES', description: 'Toutes les chutes.', instructions: 'Exécution parfaite, contrôle.', keyPoints: ['Parfaite', 'Contrôle', 'Fluidité'] },
    ],
    UV4: [
      { name: 'Défense inconnue', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Réaction inconnue.', instructions: 'Réactivité, adaptation, contre.', keyPoints: ['Réactivité', 'Adaptation', 'Contre'] },
    ],
    UV5: [
      { name: 'Déséquilibre', category: 'ATTAQUES_AU_SOL', description: 'Déséquilibre au sol.', instructions: 'Levier, déséquilibre, contrôle.', keyPoints: ['Levier', 'Déséquilibre', 'Contrôle'] },
      { name: 'Clé avancée', category: 'ATTAQUES_AU_SOL', description: 'Clé complexe.', instructions: 'Position, levier, soumission.', keyPoints: ['Position', 'Levier', 'Soumission'] },
    ],
    UV6: [
      { name: 'Défense couteau avancée', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Défense couteau pro.', instructions: 'Parade, contre, désarmement.', keyPoints: ['Parade', 'Contre', 'Désarmement'] },
      { name: 'Défense bâton avancée', category: 'ATTAQUES_AVEC_BATON', description: 'Défense bâton pro.', instructions: 'Entrer, contre, désarmement.', keyPoints: ['Entrer', 'Contre', 'Désarmement'] },
      { name: 'Défense baïonnette', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Défense baïonnette.', instructions: 'Déviation, contre, contrôle.', keyPoints: ['Déviation', 'Contre', 'Contrôle'] },
    ],
    UV7: [
      { name: 'Désarmement pistolet face', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Désarmement face.', instructions: 'Déviation, saisie, désarmement.', keyPoints: ['Déviation', 'Saisie', 'Désarmement'] },
      { name: 'Désarmement pistolet dos', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Désarmement dos.', instructions: 'Rotation, saisie, désarmement.', keyPoints: ['Rotation', 'Saisie', 'Désarmement'] },
      { name: 'Désarmement pistolet côté', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Désarmement côté.', instructions: 'Déviation, saisie, désarmement.', keyPoints: ['Déviation', 'Saisie', 'Désarmement'] },
    ],
    UV8: [
      { name: 'Combat évalué', category: 'AUTRES', description: 'Combat 2x2 évalué.', instructions: 'Technique, stratégie, endurance.', keyPoints: ['Technique', 'Stratégie', 'Endurance'] },
    ],
  },
  NOIRE_1: {
    UV1: [
      { name: 'Direct avancé', category: 'FRAPPE_DE_FACE', description: 'Direct parfait.', instructions: 'Technique, puissance, récupération.', keyPoints: ['Technique', 'Puissance', 'Récupération'] },
      { name: 'Enchaînement expert', category: 'FRAPPE_DE_FACE', description: 'Enchaînement pro.', instructions: 'Fluidité, puissance, créativité.', keyPoints: ['Fluidité', 'Puissance', 'Créativité'] },
    ],
    UV2: [
      { name: 'Shadow codifié', category: 'AUTRES', description: '3 minutes imposées.', instructions: 'Séquence, fluidité, respect.', keyPoints: ['Séquence', 'Fluidité', 'Respect'] },
    ],
    UV3: [
      { name: 'Défense connue', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Défense technique.', instructions: 'Parade, contre, contrôle.', keyPoints: ['Parade', 'Contre', 'Contrôle'] },
      { name: 'Défense inconnue', category: 'DEFENSES_SUR_ATTAQUES_PONCTUELLES', description: 'Réaction adaptée.', instructions: 'Réactivité, adaptation, efficacité.', keyPoints: ['Réactivité', 'Adaptation', 'Efficacité'] },
    ],
    UV4: [
      { name: 'Étranglement avancé', category: 'STRANGULATIONS', description: 'Libération pro.', instructions: 'Technique, explosivité, contrôle.', keyPoints: ['Technique', 'Explosivité', 'Contrôle'] },
      { name: 'Saisie complexe', category: 'SAISISSEMENTS', description: 'Libération complexe.', instructions: 'Analyse, technique, exécution.', keyPoints: ['Analyse', 'Technique', 'Exécution'] },
      { name: 'Technique sol avancée', category: 'ATTAQUES_AU_SOL', description: 'Technique sol pro.', instructions: 'Position, transition, contrôle.', keyPoints: ['Position', 'Transition', 'Contrôle'] },
    ],
    UV5: [
      { name: 'Défense bâton expert', category: 'ATTAQUES_AVEC_BATON', description: 'Défense bâton pro.', instructions: 'Entrer, contre, désarmement.', keyPoints: ['Entrer', 'Contre', 'Désarmement'] },
      { name: 'Défense couteau expert', category: 'ATTAQUES_AVEC_ARMES_BLANCHES', description: 'Défense couteau pro.', instructions: 'Parade, contre, désarmement.', keyPoints: ['Parade', 'Contre', 'Désarmement'] },
      { name: 'Défense 2 adversaires', category: 'AUTRES', description: 'Gestion multiple.', instructions: 'Positionnement, priorité, fuite.', keyPoints: ['Positionnement', 'Priorité', 'Fuite'] },
    ],
    UV6: [
      { name: 'Désarmement pistolet toutes positions', category: 'ATTAQUES_AVEC_ARMES_A_FEU', description: 'Désarmement complet.', instructions: 'Toutes positions, efficacité.', keyPoints: ['Toutes positions', 'Efficacité', 'Contrôle'] },
    ],
    UV7: [
      { name: 'Combat expert', category: 'AUTRES', description: 'Combat 2x2 expert.', instructions: 'Maîtrise, stratégie, victoire.', keyPoints: ['Maîtrise', 'Stratégie', 'Victoire'] },
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
