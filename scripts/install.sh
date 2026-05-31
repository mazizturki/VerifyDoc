#!/bin/bash
set -e

echo "╔══════════════════════════════════════════╗"
echo "║       VerifyDoc — Installation           ║"
echo "╚══════════════════════════════════════════╝"

# ─── 1. Copy prisma schema to backend ─────────────────────────────────────────
echo ""
echo "📁 Copie du schéma Prisma..."
cp -r prisma backend/

# ─── 2. Backend dependencies ──────────────────────────────────────────────────
echo ""
echo "📦 Installation des dépendances backend..."
cd backend
npm install
npx prisma generate
cd ..

# ─── 3. Frontend dependencies ─────────────────────────────────────────────────
echo ""
echo "📦 Installation des dépendances frontend..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Dépendances installées."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pour démarrer avec Docker Compose :"
echo "  docker compose up --build -d"
echo ""
echo "Pour le développement local :"
echo "  1. Démarrez PostgreSQL et MinIO"
echo "  2. cd backend && npx prisma migrate dev && npm run start:dev"
echo "  3. cd frontend && npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
