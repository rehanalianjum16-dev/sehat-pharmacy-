import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';
import bcrypt from 'bcrypt';

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        recaptchaToken: { label: 'reCAPTCHA', type: 'string' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('MISSING_CREDENTIALS');
        }

        // 1. Verify reCAPTCHA Mock
        if (credentials.recaptchaToken) {
          const isHuman = credentials.recaptchaToken === 'mock-valid-token' || 
            (await verifyReCAPTCHAv3(credentials.recaptchaToken));
          if (!isHuman) {
            throw new Error('RECAPTCHA_FAILED');
          }
        }

        // 2. Fetch user profile
        const user = await db.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) {
          throw new Error('INVALID_CREDENTIALS');
        }

        // 3. Security Check: Lockout Mechanism
        if (user.lockoutUntil && new Date() < new Date(user.lockoutUntil)) {
          const minutesLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - new Date().getTime()) / 60000);
          throw new Error(`ACCOUNT_LOCKED:${minutesLeft}`);
        }

        // 4. Password validation
        const isValidPassword = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValidPassword) {
          // Increment failed login count
          const attempts = user.loginAttempts + 1;
          const isLockoutThreshold = attempts >= 5;
          await db.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: attempts,
              lockoutUntil: isLockoutThreshold 
                ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
                : null
            }
          });

          if (isLockoutThreshold) {
            throw new Error('ACCOUNT_LOCKED_NOW');
          }
          throw new Error('INVALID_CREDENTIALS');
        }

        // 5. Verification Check: Admin Approval Logic
        if (user.status === 'PENDING_APPROVAL') {
          throw new Error('PENDING_APPROVAL');
        }
        if (user.status === 'REJECTED') {
          throw new Error('ACCOUNT_REJECTED');
        }

        // Reset failed login attempts on success
        await db.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockoutUntil: null }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          branchId: user.branchId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.branchId = (user as any).branchId;
      }
      // Support dynamic updates (e.g. role promotions)
      if (trigger === 'update' && session) {
        token.role = session.role;
        token.status = session.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).branchId = token.branchId;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Check OAuth status approval limits
      if (account?.provider === 'google') {
        const dbUser = await db.user.findUnique({
          where: { email: user.email as string }
        });
        
        // If Google user not registered in system, create one in pending state
        if (!dbUser) {
          await db.user.create({
            data: {
              email: user.email as string,
              name: user.name || 'Google User',
              passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
              status: 'PENDING_APPROVAL',
              role: 'CASHIER'
            }
          });
          return '/approval-pending';
        }

        if (dbUser.status === 'PENDING_APPROVAL') {
          return '/approval-pending';
        }
        if (dbUser.status === 'REJECTED') {
          return false;
        }
      }
      return true;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
} satisfies NextAuthConfig;

// Server reCAPTCHA verification helper
async function verifyReCAPTCHAv3(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return true; // Default fallback for development ease

  try {
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
      method: 'POST'
    });
    const data = await response.json();
    return data.success && data.score >= 0.5; // Accept bot score threshold
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}
