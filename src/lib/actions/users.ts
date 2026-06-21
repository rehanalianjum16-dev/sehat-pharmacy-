'use server';

import { db } from '../db';
import type { Role } from '@prisma/client';

// ==========================================
// 1. ADMIN APPROVAL & ROLE ACTIONS
// ==========================================

export async function approveUser(
  adminId: string,
  userId: string,
  role: Role,
  branchId?: string
) {
  // Verify admin authorization
  const admin = await db.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'APPROVED') {
    throw new Error('UNAUTHORIZED_ACTION');
  }

  // Update user profile status & role
  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      status: 'APPROVED',
      role,
      branchId: branchId || null
    }
  });

  // Log action to audits
  await db.auditLog.create({
    data: {
      userId: adminId,
      username: admin.name,
      action: `Approved user "${updatedUser.name}" (${updatedUser.email}) with role: ${role} and branch: ${branchId || 'Global'}`
    }
  });

  return updatedUser;
}

export async function rejectUser(adminId: string, userId: string) {
  const admin = await db.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== 'ADMIN' || admin.status !== 'APPROVED') {
    throw new Error('UNAUTHORIZED_ACTION');
  }

  const rejectedUser = await db.user.update({
    where: { id: userId },
    data: { status: 'REJECTED' }
  });

  await db.auditLog.create({
    data: {
      userId: adminId,
      username: admin.name,
      action: `Rejected user registration: "${rejectedUser.name}" (${rejectedUser.email})`
    }
  });

  return rejectedUser;
}

// ==========================================
// 2. ACTIVE SESSION MANAGEMENT
// ==========================================

export async function trackSession(
  userId: string,
  sessionToken: string,
  ipAddress?: string,
  userAgent?: string,
  location?: string
) {
  // Upsert or log active session details
  return db.session.upsert({
    where: { sessionToken },
    update: {
      lastActive: new Date(),
      ipAddress,
      userAgent,
      location,
      isValid: true
    },
    create: {
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      location
    }
  });
}

export async function invalidateSession(sessionToken: string) {
  return db.session.deleteMany({
    where: { sessionToken }
  });
}

export async function logoutAllDevices(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  const username = user ? user.name : 'Unknown User';

  // Wipe all session keys in DB for this user
  const deleted = await db.session.deleteMany({
    where: { userId }
  });

  await db.auditLog.create({
    data: {
      userId,
      username,
      action: `Logged out from all active devices (Cleared ${deleted.count} sessions)`
    }
  });

  return { success: true, count: deleted.count };
}

export async function getActiveSessions(userId: string) {
  return db.session.findMany({
    where: { userId, isValid: true },
    orderBy: { lastActive: 'desc' }
  });
}

// ==========================================
// 3. MASTER AUDIT LOGS DISPLAY
// ==========================================

export async function getAuditLogs(adminId: string, limit = 100) {
  const admin = await db.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED_ACTION');
  }

  return db.auditLog.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
}
