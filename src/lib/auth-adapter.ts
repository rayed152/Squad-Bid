import type { Adapter, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

// @auth/prisma-adapter expects a User model with `name` + `emailVerified`
// columns. Ours uses `username` (required, unique, driving the leaderboard
// and match history UI) and has no emailVerified concept, so we translate
// between the two shapes instead of reshaping the domain model around
// NextAuth's defaults.

function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: null,
    name: user.username,
    image: user.image,
  };
}

function usernameFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  return base.slice(0, 20) || "player";
}

async function uniqueUsername(base: string) {
  let candidate = base;
  let suffix = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

export function buildPrismaAdapter(): Adapter {
  const base = PrismaAdapter(prisma);

  return {
    ...base,
    async createUser(data: Omit<AdapterUser, "id">) {
      const username = await uniqueUsername(usernameFromEmail(data.email));
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username,
          image: data.image ?? undefined,
        },
      });
      return toAdapterUser(user);
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount(providerAccountId) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: providerAccountId },
        include: { user: true },
      });
      return account ? toAdapterUser(account.user) : null;
    },
    async updateUser(data) {
      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          email: data.email ?? undefined,
          image: data.image ?? undefined,
        },
      });
      return toAdapterUser(user);
    },
  };
}
