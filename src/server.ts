import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const app = express()
const PORT = 3000

// Initialize Prisma
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Middleware (CORS is required so Angular running on port 4200 can talk to Node on 3000)
app.use(cors())
app.use(express.json())

// --- API ROUTES ---

// Get user with wallet
app.get('/api/user', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'aditya@test.com' },
      include: { wallet: true }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Get all market assets
app.get('/api/market', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { symbol: 'asc' }
    })
    res.json(assets)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market data' })
  }
})

// Execute a trade (BUY or SELL) — uses Prisma interactive transaction for ACID compliance
app.post('/api/trade', async (req, res) => {
  const { symbol, type, quantity } = req.body

  if (!symbol || !type || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid trade parameters' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the user and wallet
      const user = await tx.user.findUnique({
        where: { email: 'aditya@test.com' },
        include: { wallet: true }
      })
      if (!user || !user.wallet) throw new Error('User or wallet not found')

      // 2. Find the asset
      const asset = await tx.asset.findUnique({ where: { symbol } })
      if (!asset) throw new Error('Asset not found')

      const totalCost = Number(asset.currentPrice) * quantity

      if (type === 'BUY') {
        // Check sufficient funds
        if (Number(user.wallet.balance) < totalCost) {
          throw new Error('Insufficient funds')
        }
        // Deduct from wallet
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { decrement: totalCost } }
        })
        // Add to portfolio (upsert)
        await tx.portfolio.upsert({
          where: { userId_assetId: { userId: user.id, assetId: asset.id } },
          update: { quantity: { increment: quantity } },
          create: { userId: user.id, assetId: asset.id, quantity }
        })
      } else if (type === 'SELL') {
        // Check sufficient holdings
        const holding = await tx.portfolio.findUnique({
          where: { userId_assetId: { userId: user.id, assetId: asset.id } }
        })
        if (!holding || Number(holding.quantity) < quantity) {
          throw new Error('Insufficient holdings')
        }
        // Add to wallet
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { increment: totalCost } }
        })
        // Subtract from portfolio
        const newQty = Number(holding.quantity) - quantity
        if (newQty === 0) {
          await tx.portfolio.delete({
            where: { userId_assetId: { userId: user.id, assetId: asset.id } }
          })
        } else {
          await tx.portfolio.update({
            where: { userId_assetId: { userId: user.id, assetId: asset.id } },
            data: { quantity: newQty }
          })
        }
      } else {
        throw new Error('Invalid trade type. Use BUY or SELL.')
      }

      // 3. Record the transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          type,
          amount: quantity,
          price: asset.currentPrice
        }
      })

      return transaction
    })

    res.json({ success: true, transaction: result })
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Trade failed' })
  }
})

// Get user portfolio with current asset values
app.get('/api/portfolio/:userId', async (req, res) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: req.params.userId },
      include: { asset: true }
    })

    const holdings = portfolios.map(p => ({
      id: p.id,
      assetId: p.assetId,
      symbol: p.asset.symbol,
      name: p.asset.name,
      quantity: Number(p.quantity),
      currentPrice: Number(p.asset.currentPrice),
      currentValue: Number(p.quantity) * Number(p.asset.currentPrice)
    }))

    res.json(holdings)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolio' })
  }
})

// Get user transaction history
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.params.userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    })

    // We need asset info too — fetch all assets for lookup
    const assets = await prisma.asset.findMany()
    const assetMap = new Map(assets.map(a => [a.id, a]))

    const enriched = transactions.map(t => ({
      id: t.id,
      type: t.type,
      symbol: assetMap.get(t.assetId)?.symbol || 'UNKNOWN',
      name: assetMap.get(t.assetId)?.name || 'Unknown',
      amount: Number(t.amount),
      price: Number(t.price),
      total: Number(t.amount) * Number(t.price),
      timestamp: t.timestamp
    }))

    res.json(enriched)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Node.js API Server running on http://localhost:${PORT}`)
})