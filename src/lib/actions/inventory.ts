'use server';

import { db } from '../db';

interface StockTransferInput {
  sourceBranchId: string;
  targetBranchId: string;
  medicineId: string;
  batchId: string;
  quantity: number;
  userId: string;
}

export async function transferStockBetweenBranches(input: StockTransferInput) {
  return db.$transaction(async (tx) => {
    // 1. Fetch user to verify log actions
    const user = await tx.user.findUnique({ where: { id: input.userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      throw new Error('UNAUTHORIZED_ACTION');
    }

    // 2. Fetch source batch to verify active stock level
    const sourceBatch = await tx.batch.findUnique({
      where: { id: input.batchId },
      include: { medicine: true }
    });

    if (!sourceBatch || sourceBatch.branchId !== input.sourceBranchId) {
      throw new Error('SOURCE_BATCH_NOT_FOUND');
    }

    if (sourceBatch.stock < input.quantity) {
      throw new Error(`INSUFFICIENT_STOCK_IN_BATCH: Only ${sourceBatch.stock} units available.`);
    }

    // 3. Deduct stock from source branch batch
    await tx.batch.update({
      where: { id: sourceBatch.id },
      data: {
        stock: { decrement: input.quantity }
      }
    });

    // 4. Find or create target branch batch for this specific batch number
    const targetBatch = await tx.batch.findFirst({
      where: {
        branchId: input.targetBranchId,
        medicineId: input.medicineId,
        batchNumber: sourceBatch.batchNumber
      }
    });

    let activeTargetBatchId: string;

    if (targetBatch) {
      // Increment stock in target branch batch
      await tx.batch.update({
        where: { id: targetBatch.id },
        data: {
          stock: { increment: input.quantity }
        }
      });
      activeTargetBatchId = targetBatch.id;
    } else {
      // Create new batch in target branch mirroring details
      const newBatch = await tx.batch.create({
        data: {
          medicineId: input.medicineId,
          branchId: input.targetBranchId,
          batchNumber: sourceBatch.batchNumber,
          stock: input.quantity,
          purchasePrice: sourceBatch.purchasePrice,
          retailPrice: sourceBatch.retailPrice,
          expiryDate: sourceBatch.expiryDate
        }
      });
      activeTargetBatchId = newBatch.id;
    }

    // 5. Create StockTransfer Record
    const transfer = await tx.stockTransfer.create({
      data: {
        sourceBranchId: input.sourceBranchId,
        targetBranchId: input.targetBranchId,
        medicineId: input.medicineId,
        batchId: activeTargetBatchId,
        quantity: input.quantity,
        status: 'COMPLETED',
        userId: input.userId
      }
    });

    // 6. Write Audit Log
    const srcBranch = await tx.branch.findUnique({ where: { id: input.sourceBranchId } });
    const destBranch = await tx.branch.findUnique({ where: { id: input.targetBranchId } });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        username: user.name,
        action: `Transferred ${input.quantity} units of "${sourceBatch.medicine.name}" (Batch: ${sourceBatch.batchNumber}) from branch "${srcBranch?.name}" to branch "${destBranch?.name}"`
      }
    });

    return transfer;
  });
}

// Log manual stock adjustments (damage/expired write-offs)
interface StockAdjustmentInput {
  branchId: string;
  medicineId: string;
  batchId: string;
  quantity: number; // Negative for write-offs (e.g. -10)
  type: 'DAMAGED' | 'LOST' | 'EXPIRED';
  reason: string;
  userId: string;
}

export async function processStockAdjustment(input: StockAdjustmentInput) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      throw new Error('UNAUTHORIZED_ACTION');
    }

    const batch = await tx.batch.findUnique({
      where: { id: input.batchId },
      include: { medicine: true }
    });

    if (!batch || batch.branchId !== input.branchId) {
      throw new Error('BATCH_NOT_FOUND');
    }

    // If writing off stock, verify we don't adjust past 0
    if (input.quantity < 0 && batch.stock < Math.abs(input.quantity)) {
      throw new Error('ADJUSTMENT_EXCEEDS_STOCK');
    }

    // Adjust batch stock
    await tx.batch.update({
      where: { id: batch.id },
      data: {
        stock: { increment: input.quantity } // Handles signed math (increments negative number correctly)
      }
    });

    // Create adjustment audit log
    const adjustment = await tx.stockAdjustment.create({
      data: {
        branchId: input.branchId,
        medicineId: input.medicineId,
        batchId: input.batchId,
        quantity: input.quantity,
        type: input.type,
        reason: input.reason,
        userId: input.userId
      }
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        username: user.name,
        action: `Logged stock adjustment (${input.type}): Adjusted ${input.quantity} units of "${batch.medicine.name}" (Batch: ${batch.batchNumber}) in branch ID ${input.branchId}. Reason: ${input.reason}`
      }
    });

    return adjustment;
  });
}
