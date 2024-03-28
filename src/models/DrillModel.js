const mongoose = require('mongoose');

const activity = new mongoose.Schema({
    day: {
        type: Number
    },
    videoLink: {
        type: String
    },
    form: {
        type: Array
    }
});
const activityDay = new mongoose.Schema({
    activites: [activity]
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
    weeks: [activityDay]
});


module.exports = mongoose.model("drill", drillSchema);