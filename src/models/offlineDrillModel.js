const mongoose = require('mongoose');

const formModel = new mongoose.Schema({
    label: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    options: {
        type: Array,
        required: true,
    },
    value: {
        type: String,
        required: true,
    }
});

const drillModel = new mongoose.Schema({
    label: {
        type: String,
        required: true,
    },
    isComplete: {
        type: Boolean,
        required: true,
        default: false
    },
    form: {
        type: Array,
        of: formModel
    },
}, { timestamps: true });

const session = new mongoose.Schema({
    type: Array,
    of: drillModel,
});

const offlineDrillSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    sessions: {
        type: Array,
        of: session,
        required: true
    }
});

module.exports = mongoose.model('OfflineDrill', offlineDrillSchema);
