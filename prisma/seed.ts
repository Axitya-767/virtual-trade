import 'dotenv/config' // 👈 THE MISSING PIECE: This loads your .env file
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Initialize the raw Postgres connection pool
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("❌ DATABASE_URL is missing. Check your .env file.")
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false } // 👈 Supabase requires SSL for remote connections
})

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool)

// 3. Pass the adapter to the new Prisma 7 Client
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const user = await prisma.user.upsert({
    where: { email: 'aditya@test.com' },
    update: {},
    create: {
      username: 'aditya_trade',
      email: 'aditya@test.com',
      wallet: {
        create: {
          balance: 10000.00,
        },
      },
    },
  })

  console.log(`👤 User created: ${user.username}`)

  const assets = [
    { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 180.50 },
    { symbol: 'BTC', name: 'Bitcoin', currentPrice: 65000.00 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', currentPrice: 175.20 },
    { symbol: 'ETH', name: 'Ethereum', currentPrice: 3500.00 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 150.10 },
  ]

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: { currentPrice: asset.currentPrice },
      create: asset,
    })
  }

  console.log('✅ Seeding successful! User and 5 Assets created.')
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })