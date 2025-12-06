import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./db"
import bcrypt from "bcryptjs"
import { z } from "zod"

declare module "next-auth" {
  interface Session {
    user: {
      id: number
      userLevel: number
      fio: string
      avatarUrl: string | null
    } & DefaultSession["user"]
  }
  
  interface User {
    id: number
    userLevel: number
    fio: string
    avatarUrl: string | null
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials)
        
        if (!validated.success) {
          return null
        }

        const { email, password } = validated.data

        const user = await prisma.allowedUser.findFirst({
          where: { eMail: email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)

        if (!passwordMatch) {
          return null
        }

        if (user.isActive !== 1) {
          return null
        }

        return {
          id: user.userId,
          email: user.eMail || '',
          name: user.fio || '',
          userLevel: user.userLevel || 0,
          fio: user.fio || '',
          avatarUrl: user.avatarUrl || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.userLevel = (user as any).userLevel
        token.fio = (user as any).fio
        token.avatarUrl = (user as any).avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as number;
        (session.user as any).userLevel = token.userLevel as number;
        (session.user as any).fio = token.fio as string;
        (session.user as any).avatarUrl = token.avatarUrl as string | null;
      }
      return session
    },
  },
})
