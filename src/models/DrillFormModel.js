const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const drillSchema = new mongoose.Schema({
    appointmentId: {
        type: ObjectId,
    },
    clientId: {
        type: ObjectId,
    },
    drill: {
        type: Object,
        required: true
    }
})

module.exports = mongoose.model("drill", drillSchema);