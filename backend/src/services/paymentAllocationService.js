/**
 * Module: paymentAllocationService
 * 
 * Core business logic and database queries for the store/application.
 */

const mongoose = require('mongoose');
const CustomerInvoice = require('../models/CustomerInvoice');
const CustomerPayment = require('../models/CustomerPayment');
const Allocation = require('../models/Allocation');

async function getUnpaidInvoices(customerId) {
  return await CustomerInvoice.find({
    customerId,
    status: { $in: ['UNPAID', 'PARTIAL'] },
  }).sort({ date: 1 });
}

async function createPaymentWithAllocations(paymentData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
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
    const paymentNo = `C-PAY-${Date.now()}`;
    const payment = new CustomerPayment({
      paymentNo,
      customerId,
      paymentDate,
      totalAmount,
      paymentMethod,
      chequeNumber,
    });

    await payment.save({ session });

    // 2. Update Invoices and create Allocations
    for (const alloc of allocations) {
      const invoice = await CustomerInvoice.findById(alloc.invoiceId).session(session);
      if (!invoice) {
        throw new Error(`Invoice ${alloc.invoiceId} not found.`);
      }

      if (alloc.allocatedAmount > invoice.balanceAmount) {
        throw new Error(`Cannot allocate more than balance for invoice ${invoice.invoiceNo}.`);
      }

      // Create Allocation record
      const allocation = new Allocation({
        paymentId: payment._id,
        paymentType: 'CustomerPayment',
        invoiceId: alloc.invoiceId,
        invoiceType: 'CustomerInvoice',
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

async function getPaymentDetails(paymentId) {
  const payment = await CustomerPayment.findById(paymentId).populate('customerId').lean();
  if (!payment) return null;

  const allocations = await Allocation.find({ paymentId }).populate('invoiceId').lean();
  return { ...payment, allocations };
}

async function getPaymentsWithAllocations(filter = {}) {
  const payments = await CustomerPayment.find(filter)
    .populate('customerId')
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
  getUnpaidInvoices,
  createPaymentWithAllocations,
  getPaymentDetails,
  getPaymentsWithAllocations,
};
