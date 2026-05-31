#!/bin/bash
# Script démarrage développement local (sans Docker)
set -e

echo "🚀 Démarrage VerifyDoc en mode développement"

# Backend
echo ""
echo "▶ Démarrage du backend..."
cd backend
npx prisma migrate dev --name init 2>/dev/null || true
npx ts-node ../prisma/seed.ts 2>/dev/null || true
npm run start:dev &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
sleep 5

# Frontend
echo ""
echo "▶ Démarrage du frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VerifyDoc est prêt !"
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:4000"
echo "  API Docs : http://localhost:4000/api/docs"
echo "  MinIO    : http://localhost:9001"
echo ""
echo "  Admin    : admin@verifydoc.tn"
echo "  Password : Admin@1234"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

wait $BACKEND_PID $FRONTEND_PID
