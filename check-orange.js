const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrangeBelt() {
  const belt = await prisma.belt.findFirst({
    where: { name: 'ORANGE' },
    include: {
      modules: {
        include: {
          techniques: true
        }
      }
    }
  });
  
  console.log('=== CEINTURE ORANGE ===\n');
  
  for (const module of belt.modules) {
    console.log(`\n${module.code} - ${module.name}`);
    console.log(`Description: ${module.description}`);
    console.log(`Techniques (${module.techniques.length}):`);
    for (const tech of module.techniques) {
      console.log(`  - ${tech.name}`);
      if (tech.description) console.log(`    ${tech.description.substring(0, 100)}...`);
    }
  }
  
  // Compter le total
  const totalTechs = belt.modules.reduce((acc, m) => acc + m.techniques.length, 0);
  console.log(`\n\nTOTAL: ${totalTechs} techniques sur 48 attendues`);
}

checkOrangeBelt().catch(console.error).finally(() => prisma.$disconnect());
