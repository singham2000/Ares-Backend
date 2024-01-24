const mongoose = require('mongoose');

const appointmentServiceEnum = ['MedicalOfficeVisit', 'SportsVision', 'Consultation', 'TrainingSessions', 'ConcussionEval'];
const appointmentStatus = ['paid', 'pending', 'failed'];

const appointmentSchema = new mongoose.Schema({
    appointment_id: {
        type: String,
        required: true,
        unique: true,
    },
    service_type: {
        type: String,
        required: true,
        enum: appointmentServiceEnum
    },
    client: {
        type: String,
        required: true,
    },
    app_date: {
        type: String,
        required: true,
    },
    app_time: {
        type: String,
        required: true,
    },
    doctor_trainer: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    status: {
        type: String,
        required: true,
        enum: appointmentStatus
    }
},
    {
        timestamps: true,
    })

module.exports = mongoose.model("appointment", appointmentSchema);