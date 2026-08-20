import { PrismaClient } from "@prisma/client";
import { PLAYERS } from "./data/players";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${PLAYERS.length} players...`);
  for (const player of PLAYERS) {
    const id = player.name.toLowerCase().replace(/\s+/g, "-");
    await prisma.player.upsert({
      where: { id },
      update: player,
      create: { id, ...player },
    });
  }
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
