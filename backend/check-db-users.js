const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema);
    
    const users = await User.find({});
    console.log('\n--- Database Users ---');
    users.forEach(u => {
      console.log(JSON.stringify(u, null, 2));
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
