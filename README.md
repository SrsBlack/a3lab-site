# PROOF

**Real people. Real moments. No filter.**

PROOF is a social platform built on one radical idea: what if social media told the truth?

No algorithms deciding what you see. No filters warping how you look. No influencers selling you things. No engagement tricks keeping you scrolling. Just people sharing real moments with people they actually know.

---

## The Philosophy

Social media became a performance. PROOF is the opposite.

We are **anti-AI generated content**, **anti-influencer culture**, and **anti-vanity metrics**. Every post on PROOF is a genuine moment captured in the app, by a real human, shared with people who actually care.

## The Rules

PROOF enforces constraints that make authenticity the default, not the exception:

- **Capture in-app only** -- every photo and video is taken live through PROOF. No uploads from your camera roll.
- **No filters, no edits** -- what the camera sees is what gets posted. Period.
- **No links** -- this is not a marketing channel.
- **No hashtags** -- content is not a commodity to be indexed and optimized.
- **No reshares** -- if you weren't there, you don't repost it.
- **No business accounts** -- PROOF is for people, not brands.
- **150 follow cap** -- based on Dunbar's number. You follow people you actually know. Quality over quantity.

## Trust System

PROOF uses a trust-based reputation system to keep the community authentic:

- **Trust Score** -- a private, internal score that reflects your behavior on the platform. You never see a number; the system uses it to detect bad actors, bots, and manipulative patterns.
- **Verified Badge** -- the only public signal. Earned through consistent, genuine use of the platform. Not bought. Not applied for. Awarded by the system when your behavior proves you're real.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces, Turborepo |
| API | Node.js, Express, TypeScript |
| Database | PostgreSQL 15, Prisma ORM |
| Cache / Queues | Redis 7 |
| Mobile | React Native (Expo) |
| Media Storage | S3-compatible object storage |
| AI Detection | Python microservice for synthetic content detection |
| Infrastructure | Docker, docker-compose |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker and Docker Compose

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/proof-app.git
cd proof-app

# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Start infrastructure (Postgres + Redis)
docker-compose -f infrastructure/docker-compose.yml up -d postgres redis

# Run database migrations
pnpm --filter @proof/api exec prisma migrate dev

# Start the API in dev mode
pnpm --filter @proof/api dev

# Start the mobile app
pnpm --filter @proof/mobile start
```

### Useful Commands

```bash
# Run all tests
pnpm test

# Lint the codebase
pnpm lint

# Format code
pnpm format

# Start everything with Docker
docker-compose -f infrastructure/docker-compose.yml up
```

## Project Structure

```
proof-app/
├── apps/
│   ├── api/              # Express API server
│   │   ├── src/
│   │   │   ├── routes/       # Route handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── middleware/    # Auth, validation, trust scoring
│   │   │   └── index.ts      # Entry point
│   │   └── prisma/           # Database schema and migrations
│   └── mobile/           # React Native app (Expo)
│       └── src/
│           ├── screens/      # App screens
│           ├── components/   # UI components
│           └── services/     # API client, camera, storage
├── packages/
│   └── shared/           # Shared types, constants, validation
├── infrastructure/
│   ├── docker-compose.yml
│   └── Dockerfile.api
├── .env.example
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## The Manifesto

We believe social media broke when it stopped being social.

When likes became currency. When filters became identity. When algorithms decided what was real.

Somewhere along the way, we stopped sharing moments and started performing them. We stopped connecting with friends and started accumulating followers. We stopped being ourselves and started being brands.

**PROOF is the reset.**

One rule: **be real.**

No likes to chase. No algorithm to game. No filter to hide behind. Just you, the people you care about, and the moments that actually happened.

We are not building another attention economy. We are building a place where your worth is not measured in engagement, and your identity is not a content strategy.

This is social media for humans. Nothing more. Nothing less.

---

*PROOF -- because the best version of you is the real one.*
