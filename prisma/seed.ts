import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const movies = [
  { title: "Iron Man", releaseYear: 2008, runtime: 126, prerequisites: [] },
  { title: "Captain America: The First Avenger", releaseYear: 2011, runtime: 124, prerequisites: [] },
  { title: "The Avengers", releaseYear: 2012, runtime: 143, prerequisites: ["Iron Man", "Captain America: The First Avenger"] },
  { title: "Captain America: Civil War", releaseYear: 2016, runtime: 147, prerequisites: ["The Avengers"] },
  { title: "Thor: Ragnarok", releaseYear: 2017, runtime: 130, prerequisites: [] },
  { title: "Avengers: Infinity War", releaseYear: 2018, runtime: 149, prerequisites: ["Captain America: Civil War", "Thor: Ragnarok"] },
  { title: "Avengers: Endgame", releaseYear: 2019, runtime: 181, prerequisites: ["Avengers: Infinity War"] },
  // runtime is placeholder sample data, not the official runtime
  { title: "Avengers: Doomsday", releaseYear: 2026, runtime: 180, prerequisites: ["Avengers: Endgame"] },
];

const cinemas = [
  { name: "Star Cineplex Bashundhara City Complex", bundleSizes: [1, 3, 4] },
  { name: "Star Cineplex Jamuna Future Park", bundleSizes: [2, 5] },
  { name: "Star Cineplex Centerpoint", bundleSizes: [6, 9, 20] },
  { name: "Star Cineplex SKS Tower", bundleSizes: [4, 6] },
];

async function main() {
  // First pass: create/update movies without touching `watched`
  for (const { title, releaseYear, runtime } of movies) {
    await prisma.movie.upsert({
      where: { title },
      update: { releaseYear, runtime },
      create: { title, releaseYear, runtime },
    });
  }

  // Second pass: link prerequisites (set replaces the list, so reruns don't duplicate)
  for (const { title, prerequisites } of movies) {
    await prisma.movie.update({
      where: { title },
      data: { prerequisites: { set: prerequisites.map((t) => ({ title: t })) } },
    });
  }

  for (const { name, bundleSizes } of cinemas) {
    const json = JSON.stringify(bundleSizes);
    await prisma.cinema.upsert({
      where: { name },
      update: { bundleSizes: json },
      create: { name, bundleSizes: json },
    });
  }

  console.log(`Seeded ${movies.length} movies and ${cinemas.length} cinemas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
