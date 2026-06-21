'use server';

import { db } from '../db';
import { Prisma } from '@prisma/client';

interface POSItemCheckout {
  medicineId: string;
  quantity: number;
}

interface SplitPaymentInput {
  method: string;
  amount: number;
}

interface POSCheckoutInput {
  branchId: string;
  cashierId: string;
  customerId?: string; // Nullable for Walk-in Customer
  items: POSItemCheckout[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string; // "Cash", "Card", "Split"
  splitPayments?: SplitPaymentInput[];
}

export async function processPOSCheckout(input: POSCheckoutInput) {
  return db.$transaction(async (tx) => {
    // 1. Validate Cashier
    const cashier = await tx.user.findUnique({
      where: { id: input.cashierId }
    });
    if (!cashier) throw new Error('CASHIER_NOT_FOUND');

    // 2. Generate unique invoice number
    const count = await tx.sale.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${100000 + count + 1}`;

    // 3. FIFO Batch Allocation Queue
    const allocatedSaleItems: Array<{
      medicineId: string;
      batchId: string;
      quantity: number;
      retailPrice: number;
      total: number;
    }> = [];

    for (const cartItem of input.items) {
      let remainingQtyToDeduct = cartItem.quantity;

      // Query active batches of this medicine in this branch sorted by expiry date (FIFO)
      const activeBatches = await tx.batch.findMany({
        where: {
          medicineId: cartItem.medicineId,
          branchId: input.branchId,
          stock: { gt: 0 }
        },
        orderBy: { expiryDate: 'asc' }
      });

      const totalAvailableStock = activeBatches.reduce((sum, b) => sum + b.stock, 0);
      if (totalAvailableStock < cartItem.quantity) {
        const med = await tx.medicine.findUnique({ where: { id: cartItem.medicineId } });
        throw new Error(`INSUFFICIENT_STOCK:${med?.name || 'Unknown Medicine'}`);
      }

      for (const batch of activeBatches) {
        if (remainingQtyToDeduct <= 0) break;

        const quantityFromThisBatch = Math.min(batch.stock, remainingQtyToDeduct);
        
        // Deduct stock from this batch in DB
        await tx.batch.update({
          where: { id: batch.id },
          data: {
            stock: { decrement: quantityFromThisBatch }
          }
        });

        // Record line allocation item
        allocatedSaleItems.push({
          medicineId: cartItem.medicineId,
          batchId: batch.id,
          quantity: quantityFromThisBatch,
          retailPrice: Number(batch.retailPrice),
          total: Number(batch.retailPrice) * quantityFromThisBatch
        });

        remainingQtyToDeduct -= quantityFromThisBatch;
      }
    }

    // 4. Create Sale Record
    const sale = await tx.sale.create({
      data: {
        branchId: input.branchId,
        invoiceNumber,
        subtotal: new Prisma.Decimal(input.subtotal),
        taxAmount: new Prisma.Decimal(input.taxAmount),
        discountAmount: new Prisma.Decimal(input.discountAmount),
        grandTotal: new Prisma.Decimal(input.grandTotal),
        cashierId: input.cashierId,
        customerId: input.customerId || null,
        paymentMethod: input.paymentMethod,
        items: {
          create: allocatedSaleItems.map(item => ({
            medicineId: item.medicineId,
            batchId: item.batchId,
            quantity: item.quantity,
            retailPrice: new Prisma.Decimal(item.retailPrice),
            total: new Prisma.Decimal(item.total)
          }))
        }
      }
    });

    // 5. Handle Split Payments if applicable
    if (input.paymentMethod === 'Split' && input.splitPayments) {
      for (const pay of input.splitPayments) {
        await tx.salePaymentSplit.create({
          data: {
            saleId: sale.id,
            method: pay.method,
            amount: new Prisma.Decimal(pay.amount)
          }
        });
      }
    }

    // 6. Customer Loyalty Points Calculations
    if (input.customerId && input.customerId !== 'walk-in') {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (customer) {
        // Award points: 1 point per 100 Rs spent
        const pointsEarned = Math.floor(input.grandTotal / 100);
        
        await tx.customer.update({
          where: { id: input.customerId },
          data: {
            loyaltyPoints: { increment: pointsEarned }
          }
        });

        // Log transaction points
        await tx.customerLoyaltyTransaction.create({
          data: {
            customerId: input.customerId,
            saleId: sale.id,
            pointsEarned,
            pointsRedeemed: 0
          }
        });
      }
    }

    // 7. Write Audit Log
    await tx.auditLog.create({
      data: {
        userId: input.cashierId,
        username: cashier.name,
        action: `Processed POS Checkout ${invoiceNumber} (Total: Rs. ${input.grandTotal})`
      }
    });

    return sale;
  });
}
