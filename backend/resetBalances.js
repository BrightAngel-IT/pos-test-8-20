const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('sales').deleteMany({});
  await mongoose.connection.collection('purchases').deleteMany({});
  await mongoose.connection.collection('returns').deleteMany({});
  await mongoose.connection.collection('customerinvoices').deleteMany({});
  await mongoose.connection.collection('supplierinvoices').deleteMany({});
  await mongoose.connection.collection('splitpayments').deleteMany({});
  await mongoose.connection.collection('payments').deleteMany({});
  await mongoose.connection.collection('allocations').deleteMany({});
  await mongoose.connection.collection('customerpayments').deleteMany({});
  await mongoose.connection.collection('supplierpayments').deleteMany({});
  await mongoose.connection.collection('invoices').deleteMany({});
  await mongoose.connection.collection('customers').updateMany({}, { $set: { balance: 0 } });
  await mongoose.connection.collection('suppliers').updateMany({}, { $set: { balance: 0 } });
  console.log('All transactions cleared and balances reset permanently');
  process.exit(0);
}).catch(console.error);
