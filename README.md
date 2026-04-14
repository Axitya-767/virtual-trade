# 🚀 VirtualTrade Engine

A premium, full-stack stock and crypto trading simulator built with **Angular 21**, **Node.js/Express**, and **PostgreSQL (Supabase)**. This project was designed to demonstrate advanced **DBMS concepts** like ACID transitions, relational integrity, and real-time data persistence.

![Dashboard Preview](https://img.shields.io/badge/Aesthetics-Glassmorphic-teal)
![DBMS](https://img.shields.io/badge/DBMS-ACID%20Compliant-blue)
![Stack](https://img.shields.io/badge/Stack-Angular%20%2B%20Express%20%2B%20Prisma-orange)

---

## 🏗️ Technical Architecture

### **Frontend**
- **Framework**: Angular 21 (Standalone Components, Signals-ready).
- **Design**: Premium glassmorphic theme with **Tailwind CSS**.
- **Visualizations**: Professional-grade **Chart.js** implementations with gradient fills and smooth animations.
- **Routing**: Multi-page architecture (Dashboard, Trade, Portfolio, History).

### **Backend**
- **Server**: Node.js & Express.
- **ORM**: Prisma 7 (using Interactive Transactions).
- **Database**: PostgreSQL hosted on **Supabase**.
- **Market Service**: A dedicated background service simulating live price volatility every 3 seconds.

---

## 💎 Key Features

- **Live Market Dashboard**: Real-time price tracking for assets like BTC, ETH, AAPL, TSLA, and GOOGL.
- **Interactive Trading**: Buy and sell interface with real-time cost calculation and confirmation modals.
- **ACID Transactions**: Trade execution is fully atomic. Wallet updates, portfolio upserts, and transaction logs are wrapped in a single database transaction.
- **Portfolio Analytics**: Visual breakdown of asset allocation using doughnut charts and performance tracking.
- **Transaction Ledger**: Filterable history of all past trades with data persisting in PostgreSQL.

---

## 📊 DBMS Design Highlights

- **Normalization**: Database is fully normalized (BCNF) to prevent data anomalies.
- **Referential Integrity**: Strict foreign key constraints between Users, Wallets, Assets, Portfolios, and Transactions.
- **Atomic Trades**: Uses `prisma.$transaction` to ensure financial data remains consistent even if a process fails mid-trade.
- **Views & Stored Logic**: Includes SQL views for portfolio valuation and triggers for audit logging.

---

## 🚀 Getting Started

### **1. Prerequisites**
- Node.js (v18+)
- A Supabase Project (PostgreSQL)

### **2. Installation**
```bash
# Clone the repository
git clone <your-repo-url>
cd virtual-trade

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
```

### **3. Environment Setup**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:[password]@db.[id].supabase.co:5432/postgres"
```

### **4. Run the Application**

**Terminal 1: Start API Server**
```bash
npx tsx src/server.ts
```

**Terminal 2: Start Market Simulator**
```bash
npx tsx src/services/marketData.ts
```

**Terminal 3: Start Frontend**
```bash
cd client
npx ng serve
```
Visit **http://localhost:4200** to start trading!

---

## 📜 Project Report
A complete **DBMS Project Report** including ER diagrams, Relational Models, and 25 comprehensive SQL queries is included in the root directory:
- [DBMS_Report_VirtualTrade.docx](./DBMS_Report_VirtualTrade.docx)

---

Developed as a showcase for **Web Programming & Database Management Systems**.
