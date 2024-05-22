const mongoose = require('mongoose');

const privacyPolicy = new mongoose.Schema({
    text: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("privacyPolicy", privacyPolicy);
