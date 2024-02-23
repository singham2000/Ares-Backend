const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("plan", planSchema);
