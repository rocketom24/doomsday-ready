// Poster artwork lives in public/posters (sourced from each film's Wikipedia infobox image).
// Keyed by normalized title so "Thor: Ragnarok" and "thor ragnarok" both match.
const posters: Record<string, string> = {
  ironman: "iron-man",
  captainamericathefirstavenger: "captain-america-the-first-avenger",
  theavengers: "the-avengers",
  captainamericacivilwar: "captain-america-civil-war",
  thorragnarok: "thor-ragnarok",
  avengersinfinitywar: "avengers-infinity-war",
  avengersendgame: "avengers-endgame",
  avengersdoomsday: "avengers-doomsday",
};

export function posterFor(title: string): string | null {
  const slug = posters[title.toLowerCase().replace(/[^a-z0-9]/g, "")];
  return slug ? `/posters/${slug}.jpg` : null;
}
