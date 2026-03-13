const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingTechniques() {
  // Récupérer les IDs des modules
  const modules = await prisma.module.findMany({
    where: { belt: { name: 'ORANGE' } },
    select: { id: true, code: true }
  });
  
  const moduleMap = {};
  modules.forEach(m => moduleMap[m.code] = m.id);
  
  console.log('Modules trouvés:', moduleMap);
  
  // Techniques manquantes à ajouter
  const missingTechniques = [
    // UV2 - Défenses contre saisies (4 manquantes)
    {
      moduleId: moduleMap['UV2'],
      name: "Dégagement étranglement avant poussé",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Retrait d'un pas en levant un bras pour dégager un étranglement avant poussé.",
      instructions: "1. Retirer rapidement un pas en arrière\n2. Lever simultanément un bras pour casser l'étranglement\n3. Contre-attaquer immédiatement",
      keyPoints: ["Retrait rapide", "Lever le bras", "Contre-attaque immédiate"],
      order: 7
    },
    {
      moduleId: moduleMap['UV2'],
      name: "Dégagement étranglement arrière poussé",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Avancée d'un pas en levant un bras pour dégager un étranglement arrière poussé.",
      instructions: "1. Avancer d'un pas pour déséquilibrer l'agresseur\n2. Lever un bras pour casser l'étranglement\n3. Contrôler et contre-attaquer",
      keyPoints: ["Avancée décisive", "Lever le bras", "Déséquilibre"],
      order: 8
    },
    {
      moduleId: moduleMap['UV2'],
      name: "Dégagement étranglement arrière avec avant-bras",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Prise du poignet, coup aux parties, demi-tour sous le bras, coup de genou et contrôle au sol.",
      instructions: "1. Saisir le poignet de l'agresseur\n2. Coup de paume aux parties génitales\n3. Demi-tour sous le bras de l'agresseur\n4. Coup de genou\n5. Contrôle de l'agresseur en clé au sol",
      keyPoints: ["Saisie ferme du poignet", "Coup aux parties", "Demi-tour rapide", "Contrôle au sol"],
      order: 9
    },
    {
      moduleId: moduleMap['UV2'],
      name: "Projection étranglement poids avant",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Projection immédiate quand tout le poids vient sur le haut et en avant.",
      instructions: "1. Profiter du poids de l'agresseur\n2. Pivoter les hanches\n3. Projeter l'agresseur par-dessus\n4. Contrôler la chute",
      keyPoints: ["Utiliser le poids adverse", "Pivot des hanches", "Projection fluide"],
      order: 10
    },
    
    // UV3 - Chutes et roulades (1 manquante)
    {
      moduleId: moduleMap['UV3'],
      name: "Chute arrière demi-tour volte-face",
      category: "AUTRES",
      description: "Chute arrière avec demi-tour volte-face pour amortir et se repositionner.",
      instructions: "1. Chuter en arrière\n2. Effectuer un demi-tour volte-face\n3. Amortir avec les bras\n4. Se repositionner rapidement",
      keyPoints: ["Demi-tour rapide", "Amorti des bras", "Repositionnement"],
      order: 4
    },
    
    // UV4 - Techniques de combat (10 manquantes)
    {
      moduleId: moduleMap['UV4'],
      name: "Coup direct poing retourné",
      category: "FRAPPE_DE_FACE",
      description: "Coup direct avec le poing retourné.",
      instructions: "1. Position de garde\n2. Rotation du poignet\n3. Extension du bras\n4. Impact avec les deux premiers phalanges",
      keyPoints: ["Rotation poignet", "Extension bras", "Impact précis"],
      order: 4
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Coup poing retourné marteau",
      category: "FRAPPE_DE_FACE",
      description: "Coup de poing retourné en marteau, avec l'avant-bras ou le coude selon la distance.",
      instructions: "1. Adapter la technique selon la distance\n2. Court: coude\n3. Moyen: avant-bras\n4. Long: marteau poing fermé",
      keyPoints: ["Adapter la distance", "Coup descendant", "Impact puissant"],
      order: 5
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Coup pied défense en avant",
      category: "FRAPPE_DE_FACE",
      description: "Coup de pied de défense en position de garde.",
      instructions: "1. Lever le genou\n2. Extension de la jambe\n3. Impact avec le talon ou le pied\n4. Retour rapide",
      keyPoints: ["Genou haut", "Extension rapide", "Retour garde"],
      order: 6
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Coup pied arrière uppercut",
      category: "FRAPPE_DE_COTE",
      description: "Coup de pied arrière en uppercut.",
      instructions: "1. Rotation des hanches\n2. Lever la jambe en arc\n3. Impact sous la cible\n4. Retour position",
      keyPoints: ["Rotation hanches", "Trajectoire arc", "Impact sous cible"],
      order: 7
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Parade intérieure riposte même main",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Parade intérieure et riposte immédiate de la même main.",
      instructions: "1. Contre un direct droit: défense paume gauche, riposte direct gauche\n2. Contre un direct gauche: défense paume droite, riposte direct droit\n3. Enchaînement fluide",
      keyPoints: ["Parade intérieure", "Riposte même main", "Enchaînement fluide"],
      order: 8
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Défense avant-bras avant contre direct",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Défense avec l'avant-bras avant contre coup de poing direct.",
      instructions: "1. Contre direct droit: défense avant-bras gauche, contre-attaque direct droit\n2. Possibilité d'attraper et baisser le bras adverse\n3. Contre direct gauche: défense avant-bras gauche, riposte gauche poing retourné",
      keyPoints: ["Blocage avant-bras", "Contrôle bras adverse", "Riposte immédiate"],
      order: 9
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Défense extérieure paume tournée contre coup de pied",
      category: "DEFENSES_SUR_ATTAQUES_CIRCULAIRES",
      description: "Défense extérieure avec la paume tournée vers l'extérieur en se déplaçant.",
      instructions: "1. Déplacement latéral\n2. Défense extérieure paume tournée\n3. Contre-attaque immédiate",
      keyPoints: ["Déplacement", "Déviation extérieure", "Contre-attaque"],
      order: 10
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Défense extérieure piquée contre coup de pied",
      category: "DEFENSES_SUR_ATTAQUES_CIRCULAIRES",
      description: "Défense extérieure en piqué avec le bras arrière et contre-attaque.",
      instructions: "1. Bras arrière en piqué\n2. Déviation du coup de pied\n3. Contre-attaque rapide",
      keyPoints: ["Bras arrière", "Mouvement piqué", "Contre rapide"],
      order: 11
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Esquive buste arrière contre coup de poing",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Esquive du buste vers l'arrière et contre-attaque en coup de pied direct.",
      instructions: "1. Esquive du buste vers l'arrière\n2. Éviter le coup de poing\n3. Contre-attaque coup de pied direct",
      keyPoints: ["Esquive buste", "Timing", "Contre pied direct"],
      order: 12
    },
    {
      moduleId: moduleMap['UV4'],
      name: "Esquive buste contre gauche droit simultané",
      category: "DEFENSES_SUR_ATTAQUES_PONCTUELLES",
      description: "Esquive du buste et contre du gauche/droit simultané.",
      instructions: "1. Esquive du buste\n2. Contre simultanée des deux bras\n3. Enchaînement puissant",
      keyPoints: ["Esquive", "Contre simultanée", "Puissance"],
      order: 13
    },
    
    // UV5 - Sol (5 manquantes)
    {
      moduleId: moduleMap['UV5'],
      name: "Replacement pied sur hanches",
      category: "ATTAQUES_AU_SOL",
      description: "Replacement avec le pied sur les hanches quand l'agresseur debout tente de passer sur le côté.",
      instructions: "1. Défenseur au sol\n2. Agresseur debout tente de passer\n3. Placement du pied sur les hanches de l'agresseur\n4. Création d'espace et contrôle",
      keyPoints: ["Placement pied", "Contrôle hanches", "Création espace"],
      order: 4
    },
    {
      moduleId: moduleMap['UV5'],
      name: "Pied hanche pied tête",
      category: "ATTAQUES_AU_SOL",
      description: "Technique de garde au sol avec pied hanche et pied tête.",
      instructions: "1. Position garde côté\n2. Un pied contrôle la hanche adverse\n3. L'autre pied protège la tête\n4. Maintien de la distance",
      keyPoints: ["Contrôle hanche", "Protection tête", "Maintien distance"],
      order: 5
    },
    {
      moduleId: moduleMap['UV5'],
      name: "Ciseaux au sol",
      category: "ATTAQUES_AU_SOL",
      description: "Technique des ciseaux en garde de côté au sol.",
      instructions: "1. Position garde côté\n2. Croisement des jambes\n3. Saisie ou contrôle de l'agresseur\n4. Retournement ou maintien",
      keyPoints: ["Position ciseaux", "Croisement jambes", "Contrôle adverse"],
      order: 6
    },
    {
      moduleId: moduleMap['UV5'],
      name: "Contrôle au sol agresseur plaqué",
      category: "ATTAQUES_AU_SOL",
      description: "Contrôle quand l'agresseur est plaqué sur le défenseur au sol.",
      instructions: "1. Saisir un bras et la tête de l'agresseur\n2. Frapper: doigts dans les yeux, coups de poing, paume, coude, talon\n3. Sortie: doigts dans les yeux pour repousser, pied hanche/tête ou garde côté",
      keyPoints: ["Saisie bras et tête", "Frappes multiples", "Sortie rapide"],
      order: 7
    },
    {
      moduleId: moduleMap['UV5'],
      name: "Saisie chevilles agresseur qui se relève",
      category: "ATTAQUES_AU_SOL",
      description: "Saisie des chevilles et faire tomber l'agresseur qui se relève depuis la garde.",
      instructions: "1. Agresseur se relève depuis la garde\n2. Saisie des chevilles\n3. Monter le bassin\n4. Faire tomber l'agresseur\n5. Alternative: si l'agresseur recule une jambe, saisir la cheville proche et crochetage derrière le genou",
      keyPoints: ["Saisie chevilles", "Montée bassin", "Déséquilibre", "Crochetage genou"],
      order: 8
    },
    
    // UV6 - Armes blanches (4 manquantes)
    {
      moduleId: moduleMap['UV6'],
      name: "Coup pied direct au corps couteau",
      category: "ATTAQUES_AVEC_ARMES_BLANCHES",
      description: "Coup de pied direct au corps contre attaque au couteau. Pas de désarmement.",
      instructions: "1. Identifier l'attaque au couteau\n2. Coup de pied direct au corps\n3. Avec ou sans avancée selon distance\n4. Suite selon situation",
      keyPoints: ["Coup pied direct", "Corps comme cible", "Pas de désarmement", "Adaptation distance"],
      order: 3
    },
    {
      moduleId: moduleMap['UV6'],
      name: "Coup pied direct déplacement couteau",
      category: "ATTAQUES_AVEC_ARMES_BLANCHES",
      description: "Coup de pied direct au corps en se déplaçant du côté opposé au couteau.",
      instructions: "1. Se déplacer simultanément du côté opposé au couteau\n2. Coup de pied direct au corps\n3. Sortie de la ligne d'attaque\n4. Suite selon besoin",
      keyPoints: ["Déplacement latéral", "Sortie ligne attaque", "Coup pied direct", "Pas de désarmement"],
      order: 4
    },
    {
      moduleId: moduleMap['UV6'],
      name: "Coup pied direct menton couteau bas",
      category: "ATTAQUES_AVEC_ARMES_BLANCHES",
      description: "Coup de pied direct au menton ou corps sans avancée contre couteau bas en haut.",
      instructions: "1. Attaque couteau de bas en haut\n2. Coup de pied direct au menton ou corps\n3. Sans avancée\n4. Suite selon situation",
      keyPoints: ["Coup pied direct", "Menton ou corps", "Sans avancée", "Pas de désarmement"],
      order: 5
    },
    {
      moduleId: moduleMap['UV6'],
      name: "Coup pied déplacement couteau bas",
      category: "ATTAQUES_AVEC_ARMES_BLANCHES",
      description: "Coup de pied direct au menton ou corps en se déplaçant du côté opposé au couteau bas en haut.",
      instructions: "1. Se déplacer du côté opposé au couteau\n2. Coup de pied direct au menton ou corps\n3. Sortie ligne attaque\n4. Suite selon situation et besoin",
      keyPoints: ["Déplacement latéral", "Coup pied direct", "Sortie ligne attaque", "Pas de désarmement"],
      order: 6
    }
  ];
  
  console.log(`\nAjout de ${missingTechniques.length} techniques manquantes...\n`);
  
  for (const tech of missingTechniques) {
    try {
      const created = await prisma.technique.create({
        data: tech
      });
      console.log(`✅ Ajouté: ${tech.name}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${tech.name}:`, error.message);
    }
  }
  
  console.log('\n✅ Ajout des techniques terminé!');
}

addMissingTechniques().catch(console.error).finally(() => prisma.$disconnect());
