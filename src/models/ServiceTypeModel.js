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
    },
    alias: {
        type: String,
    }
});

planSchema.pre("save", async function (next) {
    this.alias = this.name.replace(/\s/g, '');
    next();
});

module.exports = mongoose.model("service", planSchema);
