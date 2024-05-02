const mongoose = require('mongoose');

const activity = new mongoose.Schema({
    day: {
        type: Number
    },
    activityName: {
        type: String
    },
    description: {
        type: String
    },
    fileLinks: {
        type: Array,
        of: String
    },
    form: {
        type: Array
    },
    isComplete: {
        type: Boolean,
        required: true,
        default: false
    }
});

const drillSchema = new mongoose.Schema({
    plan: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        required: true
    },
    week: {
        type: String,
        required: true
    },
    day: {
        type: String,
        required: true
    },
    activities: [activity]
});

module.exports = mongoose.model("drillForm", drillSchema);