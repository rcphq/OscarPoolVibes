// prisma/seed.ts — Seed the 97th Academy Awards (2025) data
// Run with: npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface NomineeInput {
  name: string
  subtitle?: string
}

interface CategoryInput {
  name: string
  displayOrder: number
  pointValue: number
  nominees: NomineeInput[]
}

const CEREMONY_YEAR = 2025
const CEREMONY_NAME = '97th Academy Awards'
const CEREMONY_DATE = new Date('2025-03-02T00:00:00Z')

const categories: CategoryInput[] = [
  {
    name: 'Best Picture',
    displayOrder: 1,
    pointValue: 15,
    nominees: [
      { name: 'Anora' },
      { name: 'The Brutalist' },
      { name: 'A Complete Unknown' },
      { name: 'Conclave' },
      { name: 'Dune: Part Two' },
      { name: 'Emilia Pérez' },
      { name: "I'm Still Here" },
      { name: 'Nickel Boys' },
      { name: 'The Substance' },
      { name: 'Wicked' },
    ],
  },
  {
    name: 'Best Director',
    displayOrder: 2,
    pointValue: 10,
    nominees: [
      { name: 'Sean Baker', subtitle: 'Anora' },
      { name: 'Brady Corbet', subtitle: 'The Brutalist' },
      { name: 'James Mangold', subtitle: 'A Complete Unknown' },
      { name: 'Jacques Audiard', subtitle: 'Emilia Pérez' },
      { name: 'Coralie Fargeat', subtitle: 'The Substance' },
    ],
  },
  {
    name: 'Best Actress',
    displayOrder: 3,
    pointValue: 10,
    nominees: [
      { name: 'Cynthia Erivo', subtitle: 'Wicked' },
      { name: 'Karla Sofía Gascón', subtitle: 'Emilia Pérez' },
      { name: 'Mikey Madison', subtitle: 'Anora' },
      { name: 'Demi Moore', subtitle: 'The Substance' },
      { name: 'Fernanda Torres', subtitle: "I'm Still Here" },
    ],
  },
  {
    name: 'Best Actor',
    displayOrder: 4,
    pointValue: 10,
    nominees: [
      { name: 'Adrien Brody', subtitle: 'The Brutalist' },
      { name: 'Timothée Chalamet', subtitle: 'A Complete Unknown' },
      { name: 'Colman Domingo', subtitle: 'Sing Sing' },
      { name: 'Ralph Fiennes', subtitle: 'Conclave' },
      { name: 'Sebastian Stan', subtitle: 'The Apprentice' },
    ],
  },
  {
    name: 'Best Supporting Actress',
    displayOrder: 5,
    pointValue: 10,
    nominees: [
      { name: 'Monica Barbaro', subtitle: 'A Complete Unknown' },
      { name: 'Ariana Grande', subtitle: 'Wicked' },
      { name: 'Felicity Jones', subtitle: 'The Brutalist' },
      { name: 'Isabella Rossellini', subtitle: 'Conclave' },
      { name: 'Zoe Saldaña', subtitle: 'Emilia Pérez' },
    ],
  },
  {
    name: 'Best Supporting Actor',
    displayOrder: 6,
    pointValue: 10,
    nominees: [
      { name: 'Yura Borisov', subtitle: 'Anora' },
      { name: 'Kieran Culkin', subtitle: 'A Real Pain' },
      { name: 'Edward Norton', subtitle: 'A Complete Unknown' },
      { name: 'Guy Pearce', subtitle: 'The Brutalist' },
      { name: 'Jeremy Strong', subtitle: 'The Apprentice' },
    ],
  },
  {
    name: 'Best Original Screenplay',
    displayOrder: 7,
    pointValue: 10,
    nominees: [
      { name: 'Sean Baker', subtitle: 'Anora' },
      { name: 'Brady Corbet, Mona Fastvold', subtitle: 'The Brutalist' },
      { name: 'Jesse Eisenberg', subtitle: 'A Real Pain' },
      { name: 'Moritz Binder, Tim Fehlbaum, Alex David', subtitle: 'September 5' },
      { name: 'Coralie Fargeat', subtitle: 'The Substance' },
    ],
  },
  {
    name: 'Best Adapted Screenplay',
    displayOrder: 8,
    pointValue: 10,
    nominees: [
      { name: 'James Mangold, Jay Cocks', subtitle: 'A Complete Unknown' },
      { name: 'Peter Straughan', subtitle: 'Conclave' },
      { name: 'Jacques Audiard', subtitle: 'Emilia Pérez' },
      { name: 'RaMell Ross, Joslyn Barnes', subtitle: 'Nickel Boys' },
      { name: 'Clint Bentley, Greg Kwedar', subtitle: 'Sing Sing' },
    ],
  },
  {
    name: 'Best Animated Feature',
    displayOrder: 9,
    pointValue: 10,
    nominees: [
      { name: 'Flow' },
      { name: 'Inside Out 2' },
      { name: 'Memoir of a Snail' },
      { name: 'Wallace & Gromit: Vengeance Most Fowl' },
      { name: 'The Wild Robot' },
    ],
  },
  {
    name: 'Best International Feature',
    displayOrder: 10,
    pointValue: 10,
    nominees: [
      { name: "I'm Still Here", subtitle: 'Brazil' },
      { name: 'The Girl with the Needle', subtitle: 'Denmark' },
      { name: 'Emilia Pérez', subtitle: 'France' },
      { name: 'The Seed of the Sacred Fig', subtitle: 'Germany' },
      { name: 'Flow', subtitle: 'Latvia' },
    ],
  },
  {
    name: 'Best Documentary Feature',
    displayOrder: 11,
    pointValue: 10,
    nominees: [
      { name: 'Black Box Diaries' },
      { name: 'No Other Land' },
      { name: 'Porcelain War' },
      { name: "Soundtrack to a Coup d'État" },
      { name: 'Sugarcane' },
    ],
  },
  {
    name: 'Best Film Editing',
    displayOrder: 12,
    pointValue: 10,
    nominees: [
      { name: 'Anora' },
      { name: 'The Brutalist' },
      { name: 'Conclave' },
      { name: 'Emilia Pérez' },
      { name: 'Wicked' },
    ],
  },
  {
    name: 'Best Cinematography',
    displayOrder: 13,
    pointValue: 10,
    nominees: [
      { name: 'The Brutalist' },
      { name: 'Dune: Part Two' },
      { name: 'Emilia Pérez' },
      { name: 'Maria' },
      { name: 'Nosferatu' },
    ],
  },
  {
    name: 'Best Production Design',
    displayOrder: 14,
    pointValue: 10,
    nominees: [
      { name: 'The Brutalist' },
      { name: 'Conclave' },
      { name: 'Dune: Part Two' },
      { name: 'Nosferatu' },
      { name: 'Wicked' },
    ],
  },
  {
    name: 'Best Costume Design',
    displayOrder: 15,
    pointValue: 10,
    nominees: [
      { name: 'A Complete Unknown' },
      { name: 'Conclave' },
      { name: 'Gladiator II' },
      { name: 'Nosferatu' },
      { name: 'Wicked' },
    ],
  },
  {
    name: 'Best Makeup and Hairstyling',
    displayOrder: 16,
    pointValue: 10,
    nominees: [
      { name: 'A Different Man' },
      { name: 'Emilia Pérez' },
      { name: 'Nosferatu' },
      { name: 'The Substance' },
      { name: 'Wicked' },
    ],
  },
  {
    name: 'Best Original Score',
    displayOrder: 17,
    pointValue: 10,
    nominees: [
      { name: 'The Brutalist' },
      { name: 'Conclave' },
      { name: 'Emilia Pérez' },
      { name: 'Wicked' },
      { name: 'The Wild Robot' },
    ],
  },
  {
    name: 'Best Original Song',
    displayOrder: 18,
    pointValue: 10,
    nominees: [
      { name: '"El Mal"', subtitle: 'Emilia Pérez' },
      { name: '"The Journey"', subtitle: 'The Six Triple Eight' },
      { name: '"Like a Bird"', subtitle: 'Sing Sing' },
      { name: '"Mi Camino"', subtitle: 'Emilia Pérez' },
      { name: '"Never Too Late"', subtitle: 'Elton John: Never Too Late' },
    ],
  },
  {
    name: 'Best Sound',
    displayOrder: 19,
    pointValue: 10,
    nominees: [
      { name: 'A Complete Unknown' },
      { name: 'Dune: Part Two' },
      { name: 'Emilia Pérez' },
      { name: 'Wicked' },
      { name: 'The Wild Robot' },
    ],
  },
  {
    name: 'Best Visual Effects',
    displayOrder: 20,
    pointValue: 10,
    nominees: [
      { name: 'Alien: Romulus' },
      { name: 'Better Man' },
      { name: 'Dune: Part Two' },
      { name: 'Kingdom of the Planet of the Apes' },
      { name: 'Wicked' },
    ],
  },
  {
    name: 'Best Animated Short',
    displayOrder: 21,
    pointValue: 10,
    nominees: [
      { name: 'Beautiful Men' },
      { name: 'In the Shadow of the Cypress' },
      { name: 'Magic Candies' },
      { name: 'Wander to Wonder' },
      { name: 'Yuck!' },
    ],
  },
  {
    name: 'Best Live Action Short',
    displayOrder: 22,
    pointValue: 10,
    nominees: [
      { name: 'A Lien' },
      { name: 'Anuja' },
      { name: "I'm Not a Robot" },
      { name: 'The Last Ranger' },
      { name: 'The Man Who Could Not Remain Silent' },
    ],
  },
  {
    name: 'Best Documentary Short',
    displayOrder: 23,
    pointValue: 10,
    nominees: [
      { name: 'Death by Numbers' },
      { name: 'I Am Ready, Warden' },
      { name: 'Incident' },
      { name: 'The Only Girl in the Orchestra' },
      { name: 'Instruments of a Beating Heart' },
    ],
  },
]

async function main() {
  console.log('Seeding 97th Academy Awards (2025) data...')

  // 1. Upsert the ceremony year
  const ceremonyYear = await prisma.ceremonyYear.upsert({
    where: { year: CEREMONY_YEAR },
    update: {
      name: CEREMONY_NAME,
      ceremonyDate: CEREMONY_DATE,
      isActive: true,
    },
    create: {
      year: CEREMONY_YEAR,
      name: CEREMONY_NAME,
      ceremonyDate: CEREMONY_DATE,
      isActive: true,
    },
  })

  console.log(`  CeremonyYear: ${ceremonyYear.name} (id=${ceremonyYear.id})`)

  // 2. Upsert each category and its nominees
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: {
        ceremonyYearId_name: {
          ceremonyYearId: ceremonyYear.id,
          name: cat.name,
        },
      },
      update: {
        displayOrder: cat.displayOrder,
        pointValue: cat.pointValue,
      },
      create: {
        ceremonyYearId: ceremonyYear.id,
        name: cat.name,
        displayOrder: cat.displayOrder,
        pointValue: cat.pointValue,
      },
    })

    // 3. Upsert each nominee in the category
    for (const nom of cat.nominees) {
      await prisma.nominee.upsert({
        where: {
          categoryId_name: {
            categoryId: category.id,
            name: nom.name,
          },
        },
        update: {
          subtitle: nom.subtitle ?? null,
        },
        create: {
          categoryId: category.id,
          name: nom.name,
          subtitle: nom.subtitle ?? null,
        },
      })
    }

    console.log(`  Category: ${cat.name} (${cat.nominees.length} nominees)`)
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
