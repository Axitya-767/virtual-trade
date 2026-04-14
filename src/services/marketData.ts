import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("❌ DATABASE_URL is missing.")
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false } 
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function simulateMarket() {
  console.log('📈 Market Data Service: ONLINE')
  console.log('⚡ Injecting volatility every 3 seconds...')

  setInterval(async () => {
    try {
      const assets = await prisma.asset.findMany()

      for (const asset of assets) {
        // Randomly change price between -0.5% and +0.5%
        const volatility = (Math.random() - 0.5) * 0.01
        const currentPrice = Number(asset.currentPrice)
        const newPrice = currentPrice * (1 + volatility)

        await prisma.asset.update({
          where: { id: asset.id },
          data: { currentPrice: newPrice },
        })
      }
      
      process.stdout.write(`\r🔄 Live Prices Updated: ${new Date().toLocaleTimeString()} `)
    } catch (error) {
      console.error('\n❌ Market simulation error:', error)
    }
  }, 3000) 
}

simulateMarket()