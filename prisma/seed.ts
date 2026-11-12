import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

// Demo data: 25 testimonials in the first user's first space. Every seed row has an
// email ending in SEED_DOMAIN, so a re-run deletes the old seed rows first.
const SEED_DOMAIN = "@seed.example";
const DAYS = 60;

const NAMES = [
  "Ava Johnson", "Liam Carter", "Noah Patel", "Emma Davis", "Olivia Brown", "Mason Lee", "Sophia Martin",
  "Lucas Garcia", "Mia Wilson", "Ethan Moore", "Isabella Clark", "Logan Hall", "Amelia Young", "James King",
  "Harper Scott", "Elijah Green", "Evelyn Adams", "Benjamin Baker", "Abigail Nelson", "Henry Rivera",
  "Ella Campbell", "Jack Mitchell", "Grace Perez", "Owen Roberts", "Chloe Turner",
];
const COMPANIES = ["Acme Co", "Globex", "Initech", "Umbrella", "Hooli", null, null];
const TEXTS = [
  "Setup took five minutes and our customers love the result.",
  "Collecting feedback has never been this painless. Highly recommended!",
  "The embed looks great on our landing page and conversions went up.",
  "Simple, fast and does exactly what it says.",
  "We moved from spreadsheets to this and never looked back.",
  "Support answered within an hour. Great product.",
  "Clean design and the inbox makes curating testimonials easy.",
  "Could use more themes, but the core experience is excellent.",
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // The first user (by signup date) who owns a space, and that user's first space.
    const user = await prisma.user.findFirst({
      where: { spaces: { some: {} } },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true },
    });
    if (!user) {
      console.error("No user with a space found. Sign up and create a space first, then run the seed again.");
      process.exitCode = 1;
      return;
    }
    const space = await prisma.space.findFirst({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, collectRating: true },
    });
    if (!space) {
      console.error("No space found. Create a space first, then run the seed again.");
      process.exitCode = 1;
      return;
    }

    const deleted = await prisma.testimonial.deleteMany({
      where: { spaceId: space.id, email: { endsWith: SEED_DOMAIN } },
    });

    const now = Date.now();
    const data = NAMES.map((name, i) => ({
      spaceId: space.id,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${SEED_DOMAIN}`,
      text: TEXTS[i % TEXTS.length],
      rating: space.collectRating ? [5, 5, 4, 5, 3, 4, 2, 5, 1, 4][i % 10] : null,
      company: COMPANIES[i % COMPANIES.length],
      consentToShare: i % 4 !== 3, // about a quarter are private
      isFavorite: i % 6 === 0,
      isWallOfLove: i % 5 === 0,
      isHidden: i % 8 === 7,
      // Spread evenly over the last 60 days, newest first, with a varying hour.
      createdAt: new Date(now - Math.floor((i * DAYS * 86_400_000) / NAMES.length) - (i % 7) * 3_600_000),
    }));
    await prisma.testimonial.createMany({ data });

    console.log(`Seeded ${data.length} testimonials in "${space.name}" for ${user.email} (replaced ${deleted.count}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
