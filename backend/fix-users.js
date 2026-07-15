const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema);
    
    const users = await User.find({});
    for (const u of users) {
      if (!u.username && u.email) {
        // use the part before @ as the username, or just the email
        const newUsername = u.email.split('@')[0];
        await User.updateOne({ _id: u._id }, { $set: { username: newUsername } });
        console.log(`Updated user ${u.email} to have username: ${newUsername}`);
      }
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
