const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.connection.collection('users');
  const Branch = mongoose.connection.collection('branches');
  const branches = await Branch.find({}).toArray();
  for (const b of branches) {
    if (b.manager) {
      await User.updateMany({ name: b.manager }, { $set: { branch: b.name } });
    }
  }
  console.log('Sync complete');
  process.exit(0);
}).catch(console.error);
