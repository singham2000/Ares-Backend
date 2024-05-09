const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    doctor: {
        type: String,
    },
    service_type: {
        type: String,
    },
    plan: {
        type: String,
    },
    phase: {
        type: String,
    },
    date: {
        type: Date,
        required: true
    },
    payment_status: {
        type: String,
        required: true
    },
    clientId: {
        type: Schema.Types.ObjectId,
        required: true
    }
});

module.exports = mongoose.model('transaction', transactionSchema);
