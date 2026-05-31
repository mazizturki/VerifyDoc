#!/bin/bash
# Post-Docker seed script
set -e

echo "🌱 Seeding de la base de données..."
cd /app
npx ts-node ../prisma/seed.ts
echo "✅ Seed terminé"
