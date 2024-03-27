const mongoose = require('mongoose');

const activitesSchema = new mongoose.Schema({
    week: [activityDay]
});

const activityDay = new mongoose.Schema({
    day: { course }
});

const course = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    videoLink: {
        type: String,
        required: true
    },
    form: {
        type: Array
    }
})

const drillSchema = new mongoose.Schema({
    plan: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        required: true
    },
    activities: {
        activitesSchema
    }
});


module.exports = mongoose.model("drill", drillSchema);