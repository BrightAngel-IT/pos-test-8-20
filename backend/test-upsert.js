require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const BranchStock = require('./src/models/BranchStock');
  try {
    const doc = await BranchStock.findOneAndUpdate(
      { branch: 'test', productId: new mongoose.Types.ObjectId() },
      { $inc: { quantityInStock: 10 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('Success:', doc);
  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit(0);
});
