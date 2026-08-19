# SquadBid

Two players build their best XI by bidding on randomly-popped footballers and slotting them into a chosen formation. Highest average squad rating wins.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma ORM + Neon Postgres (via `@prisma/adapter-neon` driver adapter)
- Tailwind CSS
- NextAuth.js (credentials + optional Google OAuth), Zod, polling for real-time sync

## Getting started

```bash
cp .env.example .env   # fill in DATABASE_URL / DIRECT_URL from your Neon project, and NEXTAUTH_SECRET
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

## Project layout

```
prisma/schema.prisma       Database models (User, Room, Match, MatchRound, Bid, MatchSquad, Player)
prisma/seed.ts             Sample footballer pool for local dev
src/lib/prisma.ts          Prisma client singleton (Neon driver adapter)
src/lib/auth.ts            NextAuth config (credentials provider, optional Google)
src/lib/auth-adapter.ts    Prisma adapter bridged to our `username`-based User model
src/lib/formations.ts      Formation definitions (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 5-3-2) and slot layout
src/lib/positions.ts       Position eligibility rules
src/types/player.ts        Shared FootballPlayer type
src/components/player-card.tsx      Player card (full pop-up variant + compact in-slot variant)
src/components/formation-pitch.tsx  Pitch view rendering a formation's slots and assignments
src/actions/room.ts        Matchmaking + private room server actions
src/actions/match.ts       Formation-selection server action
src/app/(auth)/            Sign in / sign up
src/app/menu/              Main menu (find match, play with friends, links to stats/leaderboard)
src/app/room/[code]/       Lobby — polls room state, ready-check, starts the match once both are ready
src/app/match/[matchId]/formation/  Formation picker — polls until both players have locked in
src/app/match/[matchId]/live/       Placeholder for the live bidding round loop (not built yet)
src/app/preview/           Interactive Formation + PlayerCard component preview (no auth required)
```

Real-time sync (lobby ready-check, formation lock-in) uses client-side polling against small
`GET /api/rooms/[code]` and `GET /api/matches/[id]` route handlers rather than WebSockets — no extra
infra to run, and it's fine at this interaction rate. Revisit if the live bidding round needs
sub-second latency.

## Status

Built: project scaffold, full Prisma schema, auth (sign up / sign in, credentials-based), main menu,
matchmaking (random + friend room codes), the ready-check lobby, and the formation picker — all wired
together end-to-end and polling-synced between both players.

Not built yet: the live match round loop (footballer pop-ups, blind bidding, slot assignment), the
results/comparison screen, and ELO updates on match completion. `src/app/match/[matchId]/live/page.tsx`
is currently a placeholder marking where that picks up.
