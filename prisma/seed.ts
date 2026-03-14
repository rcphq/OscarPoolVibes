// prisma/seed.ts — Seed Oscar ceremony data
// Run with: npm run seed

import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

interface NomineeInput {
  name: string
  subtitle?: string
}

interface CategoryInput {
  name: string
  displayOrder: number
  pointValue: number
  runnerUpMultiplier: number
  nominees: NomineeInput[]
}

interface CeremonyInput {
  year: number
  name: string
  ceremonyDate: Date
  categories: CategoryInput[]
}

// ─── 97th Academy Awards (2025) ────────────────────────────────────────────────

const ceremony2025: CeremonyInput = {
  year: 2025,
  name: '97th Academy Awards',
  ceremonyDate: new Date('2025-03-02T00:00:00Z'),
  categories: [
    {
      name: 'Best Picture',
      displayOrder: 1,
      pointValue: 180,
      runnerUpMultiplier: 0.6,
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
      pointValue: 180,
      runnerUpMultiplier: 0.6,
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
      pointValue: 180,
      runnerUpMultiplier: 0.6,
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
      pointValue: 180,
      runnerUpMultiplier: 0.6,
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
      pointValue: 180,
      runnerUpMultiplier: 0.6,
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
      pointValue: 180,
      runnerUpMultiplier: 0.6,
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
      pointValue: 90,
      runnerUpMultiplier: 0.6,
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
      pointValue: 90,
      runnerUpMultiplier: 0.6,
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
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Flow' },
        { name: 'Inside Out 2' },
        { name: 'Memoir of a Snail' },
        { name: 'Wallace & Gromit: Vengeance Most Fowl' },
        { name: 'The Wild Robot' },
      ],
    },
    {
      name: 'Best Film Editing',
      displayOrder: 10,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
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
      displayOrder: 11,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'The Brutalist' },
        { name: 'Dune: Part Two' },
        { name: 'Emilia Pérez' },
        { name: 'Maria' },
        { name: 'Nosferatu' },
      ],
    },
    {
      name: 'Best Visual Effects',
      displayOrder: 12,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Alien: Romulus' },
        { name: 'Better Man' },
        { name: 'Dune: Part Two' },
        { name: 'Kingdom of the Planet of the Apes' },
        { name: 'Wicked' },
      ],
    },
    {
      name: 'Best Costume Design',
      displayOrder: 13,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'A Complete Unknown' },
        { name: 'Conclave' },
        { name: 'Gladiator II' },
        { name: 'Nosferatu' },
        { name: 'Wicked' },
      ],
    },
    {
      name: 'Best Production Design',
      displayOrder: 14,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'The Brutalist' },
        { name: 'Conclave' },
        { name: 'Dune: Part Two' },
        { name: 'Nosferatu' },
        { name: 'Wicked' },
      ],
    },
    {
      name: 'Best Makeup and Hairstyling',
      displayOrder: 15,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'A Different Man' },
        { name: 'Emilia Pérez' },
        { name: 'Nosferatu' },
        { name: 'The Substance' },
        { name: 'Wicked' },
      ],
    },
    {
      name: 'Best Original Song',
      displayOrder: 16,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
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
      displayOrder: 17,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'A Complete Unknown' },
        { name: 'Dune: Part Two' },
        { name: 'Emilia Pérez' },
        { name: 'Wicked' },
        { name: 'The Wild Robot' },
      ],
    },
    {
      name: 'Best Animated Short',
      displayOrder: 18,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
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
      displayOrder: 19,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
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
      displayOrder: 20,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Death by Numbers' },
        { name: 'I Am Ready, Warden' },
        { name: 'Incident' },
        { name: 'The Only Girl in the Orchestra' },
        { name: 'Instruments of a Beating Heart' },
      ],
    },
    {
      name: 'Best Documentary Feature',
      displayOrder: 21,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Black Box Diaries' },
        { name: 'No Other Land' },
        { name: 'Porcelain War' },
        { name: "Soundtrack to a Coup d'État" },
        { name: 'Sugarcane' },
      ],
    },
    {
      name: 'Best International Feature',
      displayOrder: 22,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: "I'm Still Here", subtitle: 'Brazil' },
        { name: 'The Girl with the Needle', subtitle: 'Denmark' },
        { name: 'Emilia Pérez', subtitle: 'France' },
        { name: 'The Seed of the Sacred Fig', subtitle: 'Germany' },
        { name: 'Flow', subtitle: 'Latvia' },
      ],
    },
    {
      name: 'Best Original Score',
      displayOrder: 23,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'The Brutalist' },
        { name: 'Conclave' },
        { name: 'Emilia Pérez' },
        { name: 'Wicked' },
        { name: 'The Wild Robot' },
      ],
    },
  ],
}

// ─── 98th Academy Awards (2026) ────────────────────────────────────────────────

const ceremony2026: CeremonyInput = {
  year: 2026,
  name: '98th Academy Awards',
  ceremonyDate: new Date('2026-03-15T00:00:00Z'),
  categories: [
    {
      name: 'Best Picture',
      displayOrder: 1,
      pointValue: 180,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Bugonia' },
        { name: 'F1' },
        { name: 'Frankenstein' },
        { name: 'Hamnet' },
        { name: 'Marty Supreme' },
        { name: 'One Battle after Another' },
        { name: 'The Secret Agent' },
        { name: 'Sentimental Value' },
        { name: 'Sinners' },
        { name: 'Train Dreams' },
      ],
    },
    {
      name: 'Best Director',
      displayOrder: 2,
      pointValue: 180,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Chloé Zhao', subtitle: 'Hamnet' },
        { name: 'Josh Safdie', subtitle: 'Marty Supreme' },
        { name: 'Paul Thomas Anderson', subtitle: 'One Battle after Another' },
        { name: 'Joachim Trier', subtitle: 'Sentimental Value' },
        { name: 'Ryan Coogler', subtitle: 'Sinners' },
      ],
    },
    {
      name: 'Best Actress',
      displayOrder: 3,
      pointValue: 180,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Jessie Buckley', subtitle: 'Hamnet' },
        { name: 'Rose Byrne', subtitle: 'If I Had Legs I\'d Kick You' },
        { name: 'Kate Hudson', subtitle: 'Song Sung Blue' },
        { name: 'Renate Reinsve', subtitle: 'Sentimental Value' },
        { name: 'Emma Stone', subtitle: 'Bugonia' },
      ],
    },
    {
      name: 'Best Actor',
      displayOrder: 4,
      pointValue: 180,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Timothée Chalamet', subtitle: 'Marty Supreme' },
        { name: 'Leonardo DiCaprio', subtitle: 'One Battle after Another' },
        { name: 'Ethan Hawke', subtitle: 'Blue Moon' },
        { name: 'Michael B. Jordan', subtitle: 'Sinners' },
        { name: 'Wagner Moura', subtitle: 'The Secret Agent' },
      ],
    },
    {
      name: 'Best Supporting Actress',
      displayOrder: 5,
      pointValue: 180,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Elle Fanning', subtitle: 'Sentimental Value' },
        { name: 'Inga Ibsdotter Lilleaas', subtitle: 'Sentimental Value' },
        { name: 'Amy Madigan', subtitle: 'Weapons' },
        { name: 'Wunmi Mosaku', subtitle: 'Sinners' },
        { name: 'Teyana Taylor', subtitle: 'One Battle after Another' },
      ],
    },
    {
      name: 'Best Supporting Actor',
      displayOrder: 6,
      pointValue: 180,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Benicio del Toro', subtitle: 'One Battle after Another' },
        { name: 'Jacob Elordi', subtitle: 'Frankenstein' },
        { name: 'Delroy Lindo', subtitle: 'Sinners' },
        { name: 'Sean Penn', subtitle: 'One Battle after Another' },
        { name: 'Stellan Skarsgård', subtitle: 'Sentimental Value' },
      ],
    },
    {
      name: 'Best Original Screenplay',
      displayOrder: 7,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Robert Kaplow', subtitle: 'Blue Moon' },
        { name: 'Jafar Panahi', subtitle: 'It Was Just an Accident' },
        { name: 'Ronald Bronstein & Josh Safdie', subtitle: 'Marty Supreme' },
        { name: 'Eskil Vogt, Joachim Trier', subtitle: 'Sentimental Value' },
        { name: 'Ryan Coogler', subtitle: 'Sinners' },
      ],
    },
    {
      name: 'Best Adapted Screenplay',
      displayOrder: 8,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Will Tracy', subtitle: 'Bugonia' },
        { name: 'Guillermo del Toro', subtitle: 'Frankenstein' },
        { name: 'Chloé Zhao & Maggie O\'Farrell', subtitle: 'Hamnet' },
        { name: 'Paul Thomas Anderson', subtitle: 'One Battle after Another' },
        { name: 'Clint Bentley & Greg Kwedar', subtitle: 'Train Dreams' },
      ],
    },
    {
      name: 'Best Animated Feature',
      displayOrder: 9,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Arco' },
        { name: 'Elio' },
        { name: 'KPop Demon Hunters' },
        { name: 'Little Amélie or the Character of Rain' },
        { name: 'Zootopia 2' },
      ],
    },
    {
      name: 'Best Film Editing',
      displayOrder: 10,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'F1', subtitle: 'Stephen Mirrione' },
        { name: 'Marty Supreme', subtitle: 'Ronald Bronstein and Josh Safdie' },
        { name: 'One Battle after Another', subtitle: 'Andy Jurgensen' },
        { name: 'Sentimental Value', subtitle: 'Olivier Bugge Coutté' },
        { name: 'Sinners', subtitle: 'Michael P. Shawver' },
      ],
    },
    {
      name: 'Best Cinematography',
      displayOrder: 11,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Frankenstein', subtitle: 'Dan Laustsen' },
        { name: 'Marty Supreme', subtitle: 'Darius Khondji' },
        { name: 'One Battle after Another', subtitle: 'Michael Bauman' },
        { name: 'Sinners', subtitle: 'Autumn Durald Arkapaw' },
        { name: 'Train Dreams', subtitle: 'Adolpho Veloso' },
      ],
    },
    {
      name: 'Best Visual Effects',
      displayOrder: 12,
      pointValue: 90,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Avatar: Fire and Ash' },
        { name: 'F1' },
        { name: 'Jurassic World Rebirth' },
        { name: 'The Lost Bus' },
        { name: 'Sinners' },
      ],
    },
    {
      name: 'Best Costume Design',
      displayOrder: 13,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Avatar: Fire and Ash' },
        { name: 'Frankenstein' },
        { name: 'Hamnet' },
        { name: 'Marty Supreme' },
        { name: 'Sinners' },
      ],
    },
    {
      name: 'Best Production Design',
      displayOrder: 14,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Frankenstein' },
        { name: 'Hamnet' },
        { name: 'Marty Supreme' },
        { name: 'One Battle after Another' },
        { name: 'Sinners' },
      ],
    },
    {
      name: 'Best Makeup and Hairstyling',
      displayOrder: 15,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Frankenstein' },
        { name: 'Kokuho' },
        { name: 'Sinners' },
        { name: 'The Smashing Machine' },
        { name: 'The Ugly Stepsister' },
      ],
    },
    {
      name: 'Best Original Song',
      displayOrder: 16,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: '"Dear Me"', subtitle: 'Diane Warren: Relentless' },
        { name: '"Golden"', subtitle: 'KPop Demon Hunters' },
        { name: '"I Lied to You"', subtitle: 'Sinners' },
        { name: '"Sweet Dreams of Joy"', subtitle: 'Viva Verdi!' },
        { name: '"Train Dreams"', subtitle: 'Train Dreams' },
      ],
    },
    {
      name: 'Best Sound',
      displayOrder: 17,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'F1' },
        { name: 'Frankenstein' },
        { name: 'One Battle after Another' },
        { name: 'Sinners' },
        { name: 'Sirāt' },
      ],
    },
    {
      name: 'Best Casting',
      displayOrder: 18,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Hamnet', subtitle: 'Nina Gold' },
        { name: 'Marty Supreme', subtitle: 'Jennifer Venditti' },
        { name: 'One Battle after Another', subtitle: 'Cassandra Kulukundis' },
        { name: 'The Secret Agent', subtitle: 'Gabriel Domingues' },
        { name: 'Sinners', subtitle: 'Francine Maisler' },
      ],
    },
    {
      name: 'Best Animated Short',
      displayOrder: 19,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Butterfly' },
        { name: 'Forevergreen' },
        { name: 'The Girl Who Cried Pearls' },
        { name: 'Retirement Plan' },
        { name: 'The Three Sisters' },
      ],
    },
    {
      name: 'Best Live Action Short',
      displayOrder: 20,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: "Butcher's Stain" },
        { name: 'A Friend of Dorothy' },
        { name: "Jane Austen's Period Drama" },
        { name: 'The Singers' },
        { name: 'Two People Exchanging Saliva' },
      ],
    },
    {
      name: 'Best Documentary Short',
      displayOrder: 21,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'All the Empty Rooms' },
        { name: 'Armed Only with a Camera: The Life and Death of Brent Renaud' },
        { name: 'Children No More: "Were and Are Gone"' },
        { name: 'The Devil Is Busy' },
        { name: 'Perfectly a Strangeness' },
      ],
    },
    {
      name: 'Best Documentary Feature',
      displayOrder: 22,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'The Alabama Solution' },
        { name: 'Come See Me in the Good Light' },
        { name: 'Cutting Through Rocks' },
        { name: 'Mr. Nobody Against Putin' },
        { name: 'The Perfect Neighbor' },
      ],
    },
    {
      name: 'Best International Feature',
      displayOrder: 23,
      pointValue: 15,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'The Secret Agent', subtitle: 'Brazil' },
        { name: 'It Was Just an Accident', subtitle: 'France' },
        { name: 'Sentimental Value', subtitle: 'Norway' },
        { name: 'Sirāt', subtitle: 'Spain' },
        { name: 'The Voice of Hind Rajab', subtitle: 'Tunisia' },
      ],
    },
    {
      name: 'Best Original Score',
      displayOrder: 24,
      pointValue: 30,
      runnerUpMultiplier: 0.6,
      nominees: [
        { name: 'Bugonia', subtitle: 'Jerskin Fendrix' },
        { name: 'Frankenstein', subtitle: 'Alexandre Desplat' },
        { name: 'Hamnet', subtitle: 'Max Richter' },
        { name: 'One Battle after Another', subtitle: 'Jonny Greenwood' },
        { name: 'Sinners', subtitle: 'Ludwig Goransson' },
      ],
    },
  ],
}

// ─── Seed logic ────────────────────────────────────────────────────────────────

async function seedCeremony(ceremony: CeremonyInput, isActive = false) {
  console.log(`Seeding ${ceremony.name} data...`)

  const ceremonyYear = await prisma.ceremonyYear.upsert({
    where: { year: ceremony.year },
    update: {
      name: ceremony.name,
      ceremonyDate: ceremony.ceremonyDate,
      isActive,
    },
    create: {
      year: ceremony.year,
      name: ceremony.name,
      ceremonyDate: ceremony.ceremonyDate,
      isActive,
    },
  })

  console.log(`  CeremonyYear: ${ceremonyYear.name} (id=${ceremonyYear.id})`)

  for (const cat of ceremony.categories) {
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
        runnerUpMultiplier: cat.runnerUpMultiplier,
      },
      create: {
        ceremonyYearId: ceremonyYear.id,
        name: cat.name,
        displayOrder: cat.displayOrder,
        pointValue: cat.pointValue,
        runnerUpMultiplier: cat.runnerUpMultiplier,
      },
    })

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
}

async function main() {
  await seedCeremony(ceremony2025, false)
  await seedCeremony(ceremony2026, true)
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
