/**
 * 97th Academy Awards (2025) — real categories, nominees, and winners.
 * Used for the always-available demo pool.
 */

export type DemoNominee = {
  id: string;
  name: string;
  subtitle?: string;
  isWinner: boolean;
};

export type DemoCategory = {
  id: string;
  name: string;
  pointValue: number;
  nominees: DemoNominee[];
};

export const CEREMONY_NAME = "97th Academy Awards (2025)";

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: "best-picture",
    name: "Best Picture",
    pointValue: 15,
    nominees: [
      { id: "bp-anora", name: "Anora", isWinner: true },
      { id: "bp-brutalist", name: "The Brutalist", isWinner: false },
      { id: "bp-complete-unknown", name: "A Complete Unknown", isWinner: false },
      { id: "bp-conclave", name: "Conclave", isWinner: false },
      { id: "bp-dune2", name: "Dune: Part Two", isWinner: false },
      { id: "bp-emilia-perez", name: "Emilia Pérez", isWinner: false },
      { id: "bp-im-still-here", name: "I'm Still Here", isWinner: false },
      { id: "bp-nickel-boys", name: "Nickel Boys", isWinner: false },
      { id: "bp-substance", name: "The Substance", isWinner: false },
      { id: "bp-wicked", name: "Wicked", isWinner: false },
    ],
  },
  {
    id: "best-director",
    name: "Best Director",
    pointValue: 12,
    nominees: [
      { id: "bd-corbet", name: "Brady Corbet", subtitle: "The Brutalist", isWinner: true },
      { id: "bd-audiard", name: "Jacques Audiard", subtitle: "Emilia Pérez", isWinner: false },
      { id: "bd-baker", name: "Sean Baker", subtitle: "Anora", isWinner: false },
      { id: "bd-salles", name: "Walter Salles", subtitle: "I'm Still Here", isWinner: false },
      { id: "bd-coralie", name: "Coralie Fargeat", subtitle: "The Substance", isWinner: false },
    ],
  },
  {
    id: "best-actress",
    name: "Best Actress",
    pointValue: 10,
    nominees: [
      { id: "ba-moore", name: "Demi Moore", subtitle: "The Substance", isWinner: true },
      { id: "ba-erivo", name: "Cynthia Erivo", subtitle: "Wicked", isWinner: false },
      { id: "ba-salgado", name: "Fernanda Torres", subtitle: "I'm Still Here", isWinner: false },
      { id: "ba-madison", name: "Mikey Madison", subtitle: "Anora", isWinner: false },
      { id: "ba-mariatu", name: "Mariatu Copeland", subtitle: "Nickel Boys", isWinner: false },
    ],
  },
  {
    id: "best-actor",
    name: "Best Actor",
    pointValue: 10,
    nominees: [
      { id: "bac-brody", name: "Adrien Brody", subtitle: "The Brutalist", isWinner: true },
      { id: "bac-chalamet", name: "Timothée Chalamet", subtitle: "A Complete Unknown", isWinner: false },
      { id: "bac-fiennes", name: "Ralph Fiennes", subtitle: "Conclave", isWinner: false },
      { id: "bac-washington", name: "Colman Domingo", subtitle: "Sing Sing", isWinner: false },
      { id: "bac-stan", name: "Sebastian Stan", subtitle: "The Apprentice", isWinner: false },
    ],
  },
  {
    id: "best-supporting-actress",
    name: "Best Supporting Actress",
    pointValue: 8,
    nominees: [
      { id: "bsa-saldana", name: "Zoe Saldaña", subtitle: "Emilia Pérez", isWinner: true },
      { id: "bsa-grande", name: "Ariana Grande", subtitle: "Wicked", isWinner: false },
      { id: "bsa-borstein", name: "Felicity Jones", subtitle: "The Brutalist", isWinner: false },
      { id: "bsa-monique", name: "Monica Barbaro", subtitle: "A Complete Unknown", isWinner: false },
      { id: "bsa-isabela", name: "Isabella Rossellini", subtitle: "Conclave", isWinner: false },
    ],
  },
  {
    id: "best-supporting-actor",
    name: "Best Supporting Actor",
    pointValue: 8,
    nominees: [
      { id: "bsac-pearson", name: "Kieran Culkin", subtitle: "A Real Pain", isWinner: true },
      { id: "bsac-norton", name: "Edward Norton", subtitle: "A Complete Unknown", isWinner: false },
      { id: "bsac-pearce", name: "Guy Pearce", subtitle: "The Brutalist", isWinner: false },
      { id: "bsac-yura", name: "Yura Borisov", subtitle: "Anora", isWinner: false },
      { id: "bsac-stanley", name: "Stanley Tucci", subtitle: "Conclave", isWinner: false },
    ],
  },
  {
    id: "best-original-screenplay",
    name: "Best Original Screenplay",
    pointValue: 7,
    nominees: [
      { id: "bos-anora", name: "Anora", subtitle: "Sean Baker", isWinner: false },
      { id: "bos-brutalist", name: "The Brutalist", subtitle: "Brady Corbet & Mona Fastvold", isWinner: true },
      { id: "bos-real-pain", name: "A Real Pain", subtitle: "Jesse Eisenberg", isWinner: false },
      { id: "bos-september5", name: "September 5", subtitle: "Moritz Binder & Tim Fehlbaum", isWinner: false },
      { id: "bos-substance", name: "The Substance", subtitle: "Coralie Fargeat", isWinner: false },
    ],
  },
  {
    id: "best-adapted-screenplay",
    name: "Best Adapted Screenplay",
    pointValue: 7,
    nominees: [
      { id: "bas-complete-unknown", name: "A Complete Unknown", subtitle: "James Mangold & Jay Cocks", isWinner: false },
      { id: "bas-conclave", name: "Conclave", subtitle: "Peter Straughan", isWinner: true },
      { id: "bas-emilia-perez", name: "Emilia Pérez", subtitle: "Jacques Audiard", isWinner: false },
      { id: "bas-nickel-boys", name: "Nickel Boys", subtitle: "RaMell Ross & Joslyn Barnes", isWinner: false },
      { id: "bas-sing-sing", name: "Sing Sing", subtitle: "Clint Bentley & Greg Kwedar", isWinner: false },
    ],
  },
  {
    id: "best-animated",
    name: "Best Animated Feature",
    pointValue: 6,
    nominees: [
      { id: "ban-flow", name: "Flow", isWinner: true },
      { id: "ban-inside-out-2", name: "Inside Out 2", isWinner: false },
      { id: "ban-memoir", name: "Memoir of a Snail", isWinner: false },
      { id: "ban-wallace", name: "Wallace & Gromit: Vengeance Most Fowl", isWinner: false },
      { id: "ban-wild-robot", name: "The Wild Robot", isWinner: false },
    ],
  },
  {
    id: "best-international",
    name: "Best International Feature Film",
    pointValue: 6,
    nominees: [
      { id: "bif-still-here", name: "I'm Still Here", subtitle: "Brazil", isWinner: true },
      { id: "bif-girl-needle", name: "The Girl with the Needle", subtitle: "Denmark", isWinner: false },
      { id: "bif-emilia-perez", name: "Emilia Pérez", subtitle: "France", isWinner: false },
      { id: "bif-seed", name: "The Seed of the Sacred Fig", subtitle: "Germany", isWinner: false },
      { id: "bif-flow", name: "Flow", subtitle: "Latvia", isWinner: false },
    ],
  },
  {
    id: "best-cinematography",
    name: "Best Cinematography",
    pointValue: 5,
    nominees: [
      { id: "bc-brutalist", name: "The Brutalist", subtitle: "Lol Crawley", isWinner: true },
      { id: "bc-dune2", name: "Dune: Part Two", subtitle: "Greig Fraser", isWinner: false },
      { id: "bc-emilia", name: "Emilia Pérez", subtitle: "Paul Guilhaume", isWinner: false },
      { id: "bc-maria", name: "Maria", subtitle: "Ed Lachman", isWinner: false },
      { id: "bc-nosferatu", name: "Nosferatu", subtitle: "Jarin Blaschke", isWinner: false },
    ],
  },
  {
    id: "best-editing",
    name: "Best Film Editing",
    pointValue: 5,
    nominees: [
      { id: "be-anora", name: "Anora", isWinner: true },
      { id: "be-brutalist", name: "The Brutalist", isWinner: false },
      { id: "be-conclave", name: "Conclave", isWinner: false },
      { id: "be-emilia", name: "Emilia Pérez", isWinner: false },
      { id: "be-wicked", name: "Wicked", isWinner: false },
    ],
  },
  {
    id: "best-score",
    name: "Best Original Score",
    pointValue: 5,
    nominees: [
      { id: "bsc-brutalist", name: "The Brutalist", subtitle: "Daniel Blumberg", isWinner: true },
      { id: "bsc-conclave", name: "Conclave", subtitle: "Volker Bertelmann", isWinner: false },
      { id: "bsc-emilia", name: "Emilia Pérez", subtitle: "Clément Ducol & Camille", isWinner: false },
      { id: "bsc-wicked", name: "Wicked", subtitle: "John Powell", isWinner: false },
      { id: "bsc-wild-robot", name: "The Wild Robot", subtitle: "Kris Bowers", isWinner: false },
    ],
  },
  {
    id: "best-song",
    name: "Best Original Song",
    pointValue: 5,
    nominees: [
      { id: "bsn-emilia-journey", name: "El Mal", subtitle: "Emilia Pérez", isWinner: true },
      { id: "bsn-kiss-sky", name: "Kiss the Sky", subtitle: "The Wild Robot", isWinner: false },
      { id: "bsn-like-bird", name: "Mi Camino", subtitle: "Emilia Pérez", isWinner: false },
      { id: "bsn-compress", name: "Compress / Repress", subtitle: "Challengers", isWinner: false },
      { id: "bsn-never-too-late", name: "Never Too Late", subtitle: "Elton John: Never Too Late", isWinner: false },
    ],
  },
  {
    id: "best-production-design",
    name: "Best Production Design",
    pointValue: 4,
    nominees: [
      { id: "bpd-brutalist", name: "The Brutalist", isWinner: false },
      { id: "bpd-conclave", name: "Conclave", isWinner: false },
      { id: "bpd-dune2", name: "Dune: Part Two", isWinner: false },
      { id: "bpd-nosferatu", name: "Nosferatu", isWinner: false },
      { id: "bpd-wicked", name: "Wicked", isWinner: true },
    ],
  },
  {
    id: "best-costume",
    name: "Best Costume Design",
    pointValue: 4,
    nominees: [
      { id: "bcd-complete-unknown", name: "A Complete Unknown", isWinner: false },
      { id: "bcd-conclave", name: "Conclave", isWinner: false },
      { id: "bcd-gladiator2", name: "Gladiator II", isWinner: false },
      { id: "bcd-nosferatu", name: "Nosferatu", isWinner: true },
      { id: "bcd-wicked", name: "Wicked", isWinner: false },
    ],
  },
  {
    id: "best-makeup",
    name: "Best Makeup and Hairstyling",
    pointValue: 4,
    nominees: [
      { id: "bmh-different-man", name: "A Different Man", isWinner: false },
      { id: "bmh-emilia", name: "Emilia Pérez", isWinner: false },
      { id: "bmh-nosferatu", name: "Nosferatu", isWinner: true },
      { id: "bmh-substance", name: "The Substance", isWinner: false },
      { id: "bmh-wicked", name: "Wicked", isWinner: false },
    ],
  },
  {
    id: "best-sound",
    name: "Best Sound",
    pointValue: 4,
    nominees: [
      { id: "bso-complete-unknown", name: "A Complete Unknown", isWinner: true },
      { id: "bso-dune2", name: "Dune: Part Two", isWinner: false },
      { id: "bso-emilia", name: "Emilia Pérez", isWinner: false },
      { id: "bso-wicked", name: "Wicked", isWinner: false },
      { id: "bso-wild-robot", name: "The Wild Robot", isWinner: false },
    ],
  },
  {
    id: "best-vfx",
    name: "Best Visual Effects",
    pointValue: 4,
    nominees: [
      { id: "bvx-alien", name: "Alien: Romulus", isWinner: false },
      { id: "bvx-better-man", name: "Better Man", isWinner: false },
      { id: "bvx-dune2", name: "Dune: Part Two", isWinner: true },
      { id: "bvx-kingdom", name: "Kingdom of the Planet of the Apes", isWinner: false },
      { id: "bvx-wicked", name: "Wicked", isWinner: false },
    ],
  },
  {
    id: "best-documentary",
    name: "Best Documentary Feature",
    pointValue: 5,
    nominees: [
      { id: "bdf-no-other-land", name: "No Other Land", isWinner: true },
      { id: "bdf-black-box", name: "Black Box Diaries", isWinner: false },
      { id: "bdf-porcelain", name: "Porcelain War", isWinner: false },
      { id: "bdf-soundtrack", name: "Soundtrack to a Coup d'Etat", isWinner: false },
      { id: "bdf-sugarcane", name: "Sugarcane", isWinner: false },
    ],
  },
];

/** Total possible points if every first-choice pick is correct */
export const MAX_POSSIBLE_POINTS = DEMO_CATEGORIES.reduce(
  (sum, cat) => sum + cat.pointValue,
  0
);

/** Get the winner for a category */
export function getWinner(category: DemoCategory): DemoNominee {
  return category.nominees.find((n) => n.isWinner)!;
}
