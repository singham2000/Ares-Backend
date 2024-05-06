const mongoose = require('mongoose');

const ShipmentStatus = new mongoose.Schema({
    status: {
        type: String,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date
    }
})

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
        type: Array,
        of: ShipmentStatus,
    },
    shippingAddress: {
        name: String,
        address: String,
        mobile: String
    }
});

module.exports = mongoose.model('shipment', shipmentSchema);