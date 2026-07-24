/**
 * Module: supplierPaymentService
 * 
 * Core business logic and database queries for the store/application.
 */

const mongoose = require('mongoose');
const SupplierInvoice = require('../models/SupplierInvoice');
const SupplierPayment = require('../models/SupplierPayment');
const Allocation = require('../models/Allocation');

async function getUnpaidSupplierInvoices(supplierId) {
  return await SupplierInvoice.find({
    supplierId,
    status: { $in: ['UNPAID', 'PARTIAL'] },
  }).sort({ date: 1 });
}

async function createSupplierPaymentWithAllocations(paymentData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      supplierId,
      paymentDate,
      totalAmount,
      paymentMethod,
      chequeNumber,
      allocations,
    } = paymentData;

    // Validation
    if (paymentMethod === 'CHEQUE' && !chequeNumber) {
      throw new Error('Cheque number is required for CHEQUE payments.');
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    if (totalAllocated > totalAmount) {
      throw new Error('Total allocated amount cannot exceed payment total amount.');
    }

    // 1. Create Payment
    const paymentNo = `S-PAY-${Date.now()}`;
    const payment = new SupplierPayment({
      paymentNo,
      supplierId,
      paymentDate,
      totalAmount,
      paymentMethod,
      chequeNumber,
    });

    await payment.save({ session });

    // 2. Update Invoices and create Allocations
    for (const alloc of allocations) {
      const invoice = await SupplierInvoice.findById(alloc.invoiceId).session(session);
      if (!invoice) {
        throw new Error(`Invoice ${alloc.invoiceId} not found.`);
      }

      if (alloc.allocatedAmount > invoice.balanceAmount) {
        throw new Error(`Cannot allocate more than balance for invoice ${invoice.invoiceNo}.`);
      }

      // Create Allocation record
      const allocation = new Allocation({
        paymentId: payment._id,
        paymentType: 'SupplierPayment',
        invoiceId: alloc.invoiceId,
        invoiceType: 'SupplierInvoice',
        allocatedAmount: alloc.allocatedAmount,
        allocationDate: paymentDate || new Date(),
      });
      await allocation.save({ session });

      invoice.balanceAmount = Number((invoice.balanceAmount - alloc.allocatedAmount).toFixed(2));
      
      if (invoice.balanceAmount === 0) {
        invoice.status = 'PAID';
      } else {
        invoice.status = 'PARTIAL';
      }

      await invoice.save({ session });
    }

    await session.commitTransaction();
    return payment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function getSupplierPaymentDetails(paymentId) {
  const payment = await SupplierPayment.findById(paymentId).populate('supplierId').lean();
  if (!payment) return null;

  const allocations = await Allocation.find({ paymentId }).populate('invoiceId').lean();
  return { ...payment, allocations };
}

async function getSupplierPaymentsWithAllocations(filter = {}) {
  const payments = await SupplierPayment.find(filter)
    .populate('supplierId')
    .sort({ paymentDate: -1 })
    .lean();

  const paymentIds = payments.map(p => p._id);
  const allAllocations = await Allocation.find({ paymentId: { $in: paymentIds } })
    .populate('invoiceId')
    .lean();

  return payments.map(p => ({
    ...p,
    allocations: allAllocations.filter(a => String(a.paymentId) === String(p._id))
  }));
}

module.exports = {
  getUnpaidSupplierInvoices,
  createSupplierPaymentWithAllocations,
  getSupplierPaymentDetails,
  getSupplierPaymentsWithAllocations,
};
