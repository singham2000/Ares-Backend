const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
    session_type: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    session_per_month: {
        type: Number,
        required: true,
        min: 1
    }
});

module.exports = mongoose.model('TrainingSessionModel', trainingSessionSchema);
