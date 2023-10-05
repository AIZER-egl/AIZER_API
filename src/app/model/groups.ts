import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    uuid: {
        type: String,
        required: true,
    },
    members: {
        type: [],
        required: true,
        default: [],
    },
    membersRequests: {
        type: [String],
        required: true,
        default: [],
    },
    items: {
        type: Array,
        default: [],
        required: true,
    },
    shipments: {
        type: Array,
        default: [],
        required: true,
    },
    campus: {
        type: String,
        required: true,
    },
    logHistory: {
        type: Array,
        default: [],
        required: true,
    },
    lastModified: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Groups = mongoose.model('groups', groupSchema);
export { Groups };
