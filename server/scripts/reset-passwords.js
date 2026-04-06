import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// User Schema (Simplified for script)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isInitialPassword: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

async function resetPasswords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const demoUsers = [
            'admin@geotrack.tn',
            'operator@translogistics.tn',
            'supervisor@geotrack.tn'
        ];

        for (const email of demoUsers) {
            const user = await User.findOne({ email });
            if (user) {
                console.log(`Updating password for ${email}...`);
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash('demo123', salt);
                user.isInitialPassword = false; // Demo users skip onboarding
                await user.save();
                console.log(`Successfully updated ${email}`);
            } else {
                console.log(`User ${email} not found.`);
            }
        }

        console.log('All demo passwords reset to: demo123 (hashed)');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting passwords:', error);
        process.exit(1);
    }
}

resetPasswords();
