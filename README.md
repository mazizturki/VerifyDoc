# VerifyDoc — Plateforme de vérification de rapports académiques

> Authentification et traçabilité de rapports académiques (PFE, mémoires, rapports de stage)

---

## 🚀 Démarrage rapide (Docker — recommandé)

### Prérequis
- Docker Desktop ou Docker + Docker Compose
- Git

### 1. Cloner et configurer
```bash
git clone <votre-repo> verifydoc
cd verifydoc

# Copier les variables d'environnement
cp .env .env.local
# Modifier .env avec vos valeurs si besoin
```

### 2. Copier le schéma Prisma dans le backend
```bash
cp -r prisma backend/
```

### 3. Démarrer avec Docker Compose
```bash
docker compose up --build -d
```

### 4. Créer le premier admin
```bash
docker exec verifydoc-backend npx ts-node prisma/seed.ts
```

### 5. Accéder à l'application
| Service        | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:3000        |
| Admin Login    | http://localhost:3000/admin/login |
| Backend API    | http://localhost:4000/api    |
| Swagger Docs   | http://localhost:4000/api/docs |
| MinIO Console  | http://localhost:9001        |

**Identifiants admin par défaut :**
- Email : `admin@verifydoc.tn`
- Mot de passe : `Admin@1234`

---

## 🛠️ Développement local (sans Docker)

### Prérequis
- Node.js 20+
- PostgreSQL 15+ (local ou via Docker)
- MinIO (local ou via Docker)

### 1. Démarrer PostgreSQL et MinIO uniquement
```bash
docker compose up postgres minio -d
```

### 2. Installer les dépendances
```bash
bash scripts/install.sh
```

### 3. Configurer l'environnement backend
```bash
cd backend
cp ../.env .env
# Modifier DATABASE_URL si besoin
```

### 4. Migrer la base de données
```bash
cd backend
npx prisma migrate dev --name init
npx ts-node ../prisma/seed.ts
```

### 5. Démarrer backend et frontend
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

---

## 📁 Structure du projet

```
verifydoc/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── main.ts             # Point d'entrée
│   │   ├── app.module.ts       # Module racine
│   │   ├── prisma/             # Service Prisma
│   │   ├── auth/               # Authentification JWT
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── dto/
│   │   ├── reports/            # Gestion des rapports
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts
│   │   │   └── dto/
│   │   └── files/              # Service MinIO
│   │       └── files.service.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx  # Sidebar admin
│   │   │   │   ├── login/      # Page connexion
│   │   │   │   ├── dashboard/  # Tableau de bord
│   │   │   │   └── reports/    # Gestion rapports
│   │   │   └── verify/
│   │   │       └── r/[id]/     # Page vérification publique
│   │   ├── lib/api.ts          # Client Axios
│   │   └── types/index.ts      # Types TypeScript
│   ├── Dockerfile
│   └── package.json
│
├── prisma/
│   ├── schema.prisma           # Schéma base de données
│   └── seed.ts                 # Données initiales
│
├── scripts/
│   ├── install.sh
│   ├── dev.sh
│   └── seed.sh
│
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🔌 API REST

### Auth
| Méthode | Endpoint          | Auth  | Description         |
|---------|-------------------|-------|---------------------|
| POST    | /api/auth/login   | Non   | Connexion admin     |
| POST    | /api/auth/admin   | Non   | Créer un admin      |
| GET     | /api/auth/profile | JWT   | Profil courant      |

### Reports (Admin)
| Méthode | Endpoint                      | Auth | Description          |
|---------|-------------------------------|------|----------------------|
| POST    | /api/reports                  | JWT  | Créer rapport + PDF  |
| GET     | /api/reports                  | JWT  | Liste paginée        |
| PUT     | /api/reports/:id              | JWT  | Modifier rapport     |
| DELETE  | /api/reports/:id              | JWT  | Supprimer rapport    |
| POST    | /api/reports/:id/versions     | JWT  | Ajouter une version  |
| GET     | /api/reports/:id/qrcode       | JWT  | Télécharger QR code  |

### Reports (Public)
| Méthode | Endpoint                                    | Auth | Description          |
|---------|---------------------------------------------|------|----------------------|
| GET     | /api/reports/public/:id                     | Non  | Info rapport public  |
| POST    | /api/reports/public/:id/verify              | Non  | Vérifier un PDF      |
| GET     | /api/reports/public/version/:id/download    | Non  | Télécharger PDF      |

---

## 🔐 Sécurité
- JWT avec expiration
- Rate limiting (100 req/min)
- Helmet (headers HTTP)
- Validation entrées (class-validator)
- Filtrage type fichier (PDF only)
- Limite taille fichier (50 MB)
- Hash SHA-256 automatique

---

## 📱 QR Code

Le QR code généré contient l'URL :
```
https://votre-domaine.com/verify/r/{uuid}
```

Formats disponibles : **PNG** et **SVG**

---

## 🌍 Production

Modifier `.env` :
```env
POSTGRES_PASSWORD=mot-de-passe-fort
JWT_SECRET=secret-tres-long-et-aleatoire
MINIO_SECRET_KEY=mot-de-passe-minio-fort
FRONTEND_URL=https://votre-domaine.com
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com/api
```

```bash
docker compose up --build -d
```
