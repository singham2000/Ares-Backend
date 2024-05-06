const { Mobile } = require('aws-sdk');
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    plan: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        required: true
    },
    ClientId: {
        type: mongoose.Types.ObjectId,
    },
    productImages: {
        type: Array,
        of: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    shipmentStatus: {
        status: String,
        startDate: Date,
        endDate: Date
    },
    shippingAddress: {
        name: String,
        address: String,
        mobile: String
    }
});

module.exports = mongoose.model('shipment', shipmentSchema);