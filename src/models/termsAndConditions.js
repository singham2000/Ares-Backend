const mongoose = require('mongoose');

const termsAndConditions = new mongoose.Schema({
    text: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("tandc", termsAndConditions);
