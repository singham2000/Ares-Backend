const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    doctor: {
        type: String,
        required: true
    },
    service_type: {
        type: String,
        required: true
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
