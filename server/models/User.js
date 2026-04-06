import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'supervisor', 'operator'], default: 'operator' },
    plan: { type: String, enum: ['starter', 'pro', 'enterprise'], default: 'starter' },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
    enterpriseName: String,
    avatar: String,
    lastLogin: Date,
    savedPaymentMethod: { type: String, default: '' },
    savedBillingCycle: { type: String, enum: ['monthly', 'biannual', 'annual'], default: 'monthly' },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    // Email verification & onboarding fields
    emailVerified: { type: Boolean, default: false },
    isInitialPassword: { type: Boolean, default: true },
    verificationCode: String,
    verificationCodeExpiry: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
