import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    uuid: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    groups: {
        type: [String],
        required: true,
    },
    schoolInformation: {
        type: Object,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    lastLogin: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Users = mongoose.model('User', userSchema);
export { Users };
