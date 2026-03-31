import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create a Test User with an automatic $10,000 Wallet
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

  // 2. Create some initial Assets (Stocks/Crypto)
  const assets = [
    { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 180.50 },
    { symbol: 'BTC', name: 'Bitcoin', currentPrice: 65000.00 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', currentPrice: 175.20 },
  ]

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: { currentPrice: asset.currentPrice },
      create: asset,
    })
  }

  console.log('✅ Seeding successful! User and Assets created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })