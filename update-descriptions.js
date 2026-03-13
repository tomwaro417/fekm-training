const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Descriptions détaillées basées sur les standards FEKM
const detailedDescriptions = {
  // UV1
  "Uppercut poing": "Coup de poing montant qui part du bas vers le haut, visant généralement le menton ou le plexus solaire. Le coude reste près du corps, le poing tourne à l'impact.",
  "Crochet poing": "Coup circulaire horizontal qui part du côté, visant la tempe, la mâchoire ou le foie. Rotation des hanches pour plus de puissance.",
  "Direct arrière": "Coup tendu arrière, puissant, utilisant la rotation des hanches. Le bras arrière frappe en ligne droite.",
  "Coup pied pas glissé direct": "Coup de pied direct exécuté en glissant sur le pied de la jambe d'appui pour gagner en portée et puissance.",
  "Coup pied pas glissé circulaire": "Coup de pied circulaire exécuté avec un glissement pour augmenter la puissance de frappe.",
  "Genou circulaire intérieur": "Coup de genou en arc vers l'intérieur, visant les côtes, le foie ou les parties génitales.",
  "Genou circulaire extérieur": "Coup de genou en arc vers l'extérieur, utilisé en corps à corps pour viser les flancs ou les côtes.",
  
  // UV2
  "Dégagement guillotine": "Technique de libération d'une prise d'étranglement avant (guillotine) par saisie de l'avant-bras adverse et coup de paume aux parties génitales. Possibilité de placer l'épaule pour plus d'efficacité.",
  "Dégagement poignet droit": "Rotation du poignet vers l'extérieur combinée à un mouvement de levier pour libérer une saisie de poignet droit.",
  "Dégagement poignet gauche": "Rotation du poignet vers l'intérieur avec levier pour libérer une saisie de poignet gauche.",
  "Dégagement étreinte derrière": "Technique de libération d'une étreinte par derrière utilisant les coudes, les talons ou les saisies de doigts.",
  "Sprawl": "Défense contre une tentative d'amenée au sol par saisie des deux jambes (double leg). Placer les bras au centre pour bloquer, puis se relever vers l'arrière ou sur le côté.",
  "Dégagement deux poignets": "Technique de libération quand les deux poignets sont saisis, utilisant un levier combiné avec le coude.",
  "Dégagement étranglement avant poussé": "Retrait d'un pas en arrière combiné au levage d'un bras pour casser l'étranglement avant, suivi d'une contre-attaque immédiate.",
  "Dégagement étranglement arrière poussé": "Avancée d'un pas pour déséquilibrer l'agresseur, levage d'un bras pour casser l'étranglement arrière.",
  "Dégagement étranglement arrière avec avant-bras": "Saisie du poignet adverse, coup aux parties, demi-tour sous le bras, coup de genou et contrôle au sol en clé.",
  "Projection étranglement poids avant": "Utilisation du poids de l'agresseur qui penche en avant pour projeter par-dessus l'épaule ou sur le côté.",
  
  // UV3
  "Chute hauteur": "Technique de chute depuis une hauteur avec amorti progressif: flexion des genoux, pose des mains, avant-bras, puis chute latérale.",
  "Roulade Judo": "Roulade avant avec amorti du bras en diagonal, utilisée pour absorber l'énergie d'une chute ou d'une projection.",
  "Roulade plombée": "Roulade avec impact au sol sans se relever, utilisée en situation de combat au sol.",
  "Chute arrière demi-tour volte-face": "Chute arrière suivie d'un demi-tour volte-face pour se retrouver face à l'adversaire ou se relever en position défensive.",
  
  // UV4
  "Double leg": "Amenée au sol par saisie des deux jambes de l'adversaire. Penetration profonde, épaule dans l'abdomen, projection par poussée et traction.",
  "Single leg": "Saisie d'une seule jambe avec contrôle de la tête ou du corps pour projeter l'adversaire.",
  "Esquive corps": "Déplacement du buste vers l'arrière ou sur le côté pour éviter un coup direct.",
  "Coup direct poing retourné": "Coup de poing direct avec rotation du poignet à l'impact pour augmenter la pénétration.",
  "Coup poing retourné marteau": "Coup descendant avec le dos du poing, l'avant-bras ou le coude selon la distance.",
  "Coup pied défense en avant": "Coup de pied direct de défense pour créer de la distance, visant généralement le plexus ou les genoux.",
  "Coup pied arrière uppercut": "Coup de pied montant arrière, puissant, visant le menton ou le plexus.",
  "Parade intérieure riposte même main": "Déviation intérieure du coup adverse avec la paume, suivie immédiatement d'une riposte de la même main.",
  "Défense avant-bras avant contre direct": "Blocage du coup de poing adverse avec l'avant-bras, suivi d'une saisie ou d'une riposte.",
  "Défense extérieure paume tournée contre coup de pied": "Déviation extérieure du coup de pied avec la paume vers l'extérieur, en se déplaçant latéralement.",
  "Défense extérieure piquée contre coup de pied": "Déviation du coup de pied avec le bras arrière en mouvement piqué vers le bas.",
  "Esquive buste arrière contre coup de poing": "Retrait du buste vers l'arrière pour faire passer le coup adverse, suivi d'un coup de pied direct.",
  "Esquive buste contre gauche droit simultané": "Esquive du buste suivie d'une contre-attaque simultanée des deux poings (gauche-droite).",
  
  // UV5
  "Garde côté": "Position défensive au sol sur le côté, une main au sol, jambes repliées prêtes à frapper ou contrôler.",
  "Pontage latéral": "Technique de retournement au sol en utilisant le pont (langouste) pour renverser l'adversaire.",
  "Remontée technique": "Technique de remontée depuis le sol vers la position debout en protégeant et en contrôlant l'adversaire.",
  "Replacement pied sur hanches": "Quand l'agresseur debout tente de passer sur le côté, placement du pied sur ses hanches pour contrôler la distance.",
  "Pied hanche pied tête": "Position de garde au sol avec un pied contrôlant la hanche adverse et l'autre protégeant la tête.",
  "Ciseaux au sol": "Technique de contrôle au sol utilisant les jambes croisées pour immobiliser ou retourner l'adversaire.",
  "Contrôle au sol agresseur plaqué": "Techniques de contrôle et de frappe quand l'agresseur est plaqué sur nous: saisies, frappes courtes, sorties.",
  "Saisie chevilles agresseur qui se relève": "Saisie des chevilles pour faire tomber l'agresseur qui tente de se relever depuis la garde au sol.",
  
  // UV6
  "Défense couteau haut 360": "Parade circulaire de l'avant-bras (360°) contre une attaque de couteau de haut en bas, suivie de contre-attaques.",
  "Défense couteau bas 360": "Parade circulaire de l'avant-bras contre une attaque de couteau de bas en haut, avec contrôle du bras armé.",
  "Coup pied direct au corps couteau": "Coup de pied direct au corps comme défense contre une attaque au couteau, sans tenter de désarmer.",
  "Coup pied direct déplacement couteau": "Coup de pied direct combiné à un déplacement latéral pour sortir de la ligne d'attaque du couteau.",
  "Coup pied direct menton couteau bas": "Coup de pied direct au menton contre une attaque de couteau de bas en haut.",
  "Coup pied déplacement couteau bas": "Coup de pied direct avec déplacement latéral contre une attaque de couteau montante.",
  
  // UV7
  "Combat 2x2 minutes": "Combat de démonstration de 2 reprises de 2 minutes avec 30 secondes de repos. Évaluation de l'attitude générale: courage, détermination, lucidité, sang-froid, technique et respect."
};

async function updateDescriptions() {
  console.log('Mise à jour des descriptions détaillées...\n');
  
  for (const [name, description] of Object.entries(detailedDescriptions)) {
    try {
      const updated = await prisma.technique.updateMany({
        where: { name },
        data: { description }
      });
      if (updated.count > 0) {
        console.log(`✅ ${name}`);
      }
    } catch (error) {
      console.error(`❌ ${name}:`, error.message);
    }
  }
  
  console.log('\n✅ Mise à jour des descriptions terminée!');
}

updateDescriptions().catch(console.error).finally(() => prisma.$disconnect());
