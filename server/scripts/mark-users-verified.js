// One-time script to mark existing users as email-verified
import mongoose from 'mongoose';

async function markUsersVerified() {
    await mongoose.connect('mongodb://localhost:27017/geotrack');
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('users').updateMany(
        { emailVerified: { $ne: true } },
        { $set: { emailVerified: true } }
    );

    console.log(`Updated ${result.modifiedCount} users to emailVerified: true`);

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
}

markUsersVerified().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
