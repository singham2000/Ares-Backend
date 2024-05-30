const userModel = require("../models/userModel");
const appointmentModel = require("../models/appointmentModel");
const slotModel = require("../models/slotModel");
const catchAsyncError = require("../utils/catchAsyncError");
const mongoose = require('mongoose');
const ErrorHandler = require("../utils/errorHandler");
const { resetPasswordCode, newAccount } = require("../utils/mails");
const generateCode = require("../utils/generateCode");
const jwt = require('jsonwebtoken');
const { generateAppointmentId } = require("../utils/generateId");
const { calculateTimeDifference, sendData } = require('../utils/functions');
const ServiceTypeModel = require("../models/ServiceTypeModel.js");
const planModel = require("../models/planModel.js");
const moment = require('moment');
const EvalForm = require("../models/FormModel");
const EvalutionsForm = require("../models/EvaluationForms");
const PrescriptionsForm = require("../models/PrescriptionForm.js");
const DiagnosisForm = require('../models/DiagnosisForm.js');
const DrillForm = require('../models/DrillFormModel.js');
const DrillFormModel = require("../models/DrillModel.js");
const { createNotification, timeForService } = require('../utils/functions');
const transactionModel = require("../models/transactionModel.js");
const TrainingSessionModel = require("../models/trainingSessionModel.js");


exports.getProfile = catchAsyncError(async (req, res, next) => {
    const email = req.query.email;
    const user = await userModel.findOne({ email: email, role: 'doctor' });

    if (!user) {
        return next(new ErrorHandler("User not found.", 404));
    }

    res.status(200).json({
        user,
    });
});

exports.editClientProfile = catchAsyncError(async (req, res, next) => {
    const { userId } = req.query;
    const {
        firstName,
        lastName,
        suffix,
        email,
        city,
        phone,
        state,
        dob,
        gender,
        address,
        zip,
    } = req.body;
    if (!userId)
        return next(new ErrorHandler("Please send userId.", 404));
    const doctor = await userModel.findById(userId).select("-password");
    if (!doctor) {
        return next(new ErrorHandler("User Not Found.", 404));
    }
    if (doctor.role !== 'athlete') {
        return next(new ErrorHandler("Not a athlete.", 404));
    }

    firstName && (doctor.firstName = firstName);
    lastName && (doctor.lastName = lastName);
    suffix && (doctor.suffix = suffix);
    gender && (doctor.gender = gender);
    dob && (doctor.dob = dob);
    address && (doctor.address = address);
    city && (doctor.city = city);
    zip && (doctor.zip = zip);
    state && (doctor.state = state);
    email && (doctor.email = email);
    phone && (doctor.phone = phone);
    await doctor.save();

    res.status(200).json({
        success: true,
        doctor
    });
});

exports.editDoctorProfile = catchAsyncError(async (req, res, next) => {
    const { userId } = req.query;
    const {
        firstName,
        lastName,
        startTime,
        endTime,
        suffix,
        gender,
        dob,
        address,
        city,
        zip,
        state,
        email,
        phone,
    } = req.body;
    if (!userId)
        return next(new ErrorHandler("Please send userId.", 404));
    const doctor = await userModel.findById(userId).select("-password");
    if (!doctor) {
        return next(new ErrorHandler("User Not Found.", 404));
    }
    if (doctor.role !== 'doctor') {
        return next(new ErrorHandler("Not a doctor.", 404));
    }

    firstName && (doctor.firstName = firstName);
    lastName && (doctor.lastName = lastName);
    startTime && (doctor.startTime = startTime);
    endTime && (doctor.lastName = endTime);
    suffix && (doctor.suffix = suffix);
    gender && (doctor.gender = gender);
    dob && (doctor.dob = dob);
    address && (doctor.address = address);
    city && (doctor.city = city);
    zip && (doctor.zip = zip);
    state && (doctor.state = state);
    email && (doctor.email = email);
    phone && (doctor.phone = phone);
    await doctor.save();

    res.status(200).json({
        success: true,
        doctor
    });
});

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user || user.role !== 'doctor') return next(new ErrorHandler("User Not Found.", 404));

    const code = generateCode(6);

    await userModel.findOneAndUpdate({ email }, { temp_code: code });
    resetPasswordCode(email, user.fullname, code);

    res.status(200).json({ message: "Code sent to your email." });
});

exports.validateForgotPasswordCode = catchAsyncError(async (req, res, next) => {
    const { email, code } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) return next(new ErrorHandler("User Not Found.", 404));

    if (user.temp_code === code) {
        user.temp_code = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ message: "Code Validated Successfully." });
    } else {
        return next(new ErrorHandler("Invalid Code.", 400));
    }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
    const { email, newPassword, confirmPassword } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) return next(new ErrorHandler("User Not Found.", 404));
    if (!newPassword || !confirmPassword)
        return next(new ErrorHandler("Please fill in all fields", 400));
    if (newPassword !== confirmPassword)
        return next(new ErrorHandler("Password does not match", 400));
    if (user.password === newPassword)
        return next(new ErrorHandler("Choose a new password"));
    user.password = newPassword;
    await user.save();

    res.status(203).json({ message: "Password Updated Successfully." });
});

exports.login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
        return next(new ErrorHandler("Please enter your email and password", 400));

    const user = await userModel.findOne({ email: { $regex: new RegExp(email, "i") }, role: 'doctor' }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched)
        return next(new ErrorHandler("Invalid email or password!", 401));

    user.password = undefined;
    sendData(user, 200, res);
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
    const user = await userModel.findById(req.userId).select("+password");
    const { oldPassword, newPassword } = req.body;

    if (!user) return new ErrorHandler("User Not Found.", 404);

    if (!oldPassword || !newPassword)
        return next(new ErrorHandler("Please fill in all fields", 400));

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
        return next(new ErrorHandler("Old Password does not match", 400));
    }

    if (newPassword === oldPassword) {
        return next(
            new ErrorHandler("New Password cannot be same as old password", 400)
        );
    }
    user.password = newPassword;
    await user.save();
    res.status(203).json({ message: "Password Updated Successfully." });
});

exports.registerClient = catchAsyncError(async (req, res, next) => {
    const {
        firstName,
        lastName,
        suffix,
        email,
        city,
        phone,
        state,
        dob,
        gender,
        address,
        zip
    } = req.body;

    if (
        (!firstName ||
            !lastName ||
            !suffix ||
            !address ||
            !email ||
            !city ||
            !phone ||
            !state ||
            !dob ||
            !gender ||
            !zip)
    ) {
        return next(new ErrorHandler("Please enter all the fields", 400));
    }

    let user = await userModel.findOne({ email });
    if (user)
        return next(new ErrorHandler("User already exists with this email", 400))
    user = await userModel.create({
        firstName,
        lastName,
        suffix,
        email,
        city,
        phone,
        state,
        dob,
        gender,
        address,
        zip,
        password: `${phone}${firstName}`,
        role: "athlete",
    });
    newAccount(email, `${firstName}${lastName}`, `${phone}${firstName}`);
    await user.save();
    res.status(200).json({
        success: true,
        user,
        message: "Athlete added successfully",
    });
});

exports.checkClient = catchAsyncError(async (req, res, next) => {
    const {
        email,
    } = req.body;

    if (!email) {
        return next(new ErrorHandler("Please provide a email", 400));
    }

    let user = await userModel.findOne({ email });
    if (!user || user.role === 'admin' || user.role === 'doctor')
        return next(new ErrorHandler("Athlete does not exists with this email", 400));
    if (user.isActive === false) {
        return next(new ErrorHandler("Athlete is inactive with this email", 400));
    }

    res.status(200).json({
        success: true,
        client_details: {
            client_id: user._id,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            phone: user.phone
        }
    });
});

exports.bookAppointment = catchAsyncError(async (req, res, next) => {
    const client_id = req.params.id;
    let appointmentOnDate = 0;
    const {
        service_type,
        app_date,
        app_time,
        end_time,
        doctor_trainer,
        location
    } = req.body;
    let query = {
        service_type,
        app_date: `${app_date.split('T')[0]}T00:00:00.000`,
        app_time,
        end_time,
        doctor_trainer,
        location
    };
    const app_id = generateAppointmentId();

    if (!client_id) {
        return next(new ErrorHandler("Please provide a client_id", 400));
    }
    const client = await userModel.findById(client_id);
    if (!client) {
        return next(new ErrorHandler("Client does not exist", 400));
    }
    if (client.role !== 'athlete') {
        return next(new ErrorHandler('Unauthorized! Access denied', 400));
    }

    const dayAppointments = await appointmentModel.find(query).sort({ createdAt: 'desc' });
    if (dayAppointments.length > 0) {
        return next(new ErrorHandler('Already booked a appointment on this timeline', 400));
    }
    const service = await ServiceTypeModel.findOne({ alias: service_type })
    const appointment = await appointmentModel.create({
        appointment_id: app_id,
        client: client_id,
        service_type,
        app_date: `${app_date.split('T')[0]}T00:00:00.000`,
        app_time,
        end_time,
        doctor_trainer,
        location,
        amount: service.cost,
        status: (service_type === 'Consultation' || service_type === 'ConsultationCall') ? "paid" : 'pending'
    });

    const date = new Date(app_date);
    date.setUTCHours(0, 0, 0, 0);


    await appointment.save();
    const transaction = await transactionModel.create({
        doctor: doctor_trainer,
        service_type,
        date,
        payment_status: (service_type === 'Consultation' || service_type === 'ConsultationCall') ? "paid" : 'pending',
        bookingId: appointment._id,
        clientId: client_id,
        amount: service.cost
    });


    await transaction.save();

    res.status(200).json({
        success: true,
        message: `Appointment booked. Your Appointment ID: ${app_id}.`,
        appointment: appointment,
    });
});

exports.recentBookings = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const status = req.query.status;
    const service_type = req.query.service_type;
    const date = req.query.date;
    const searchQuery = req.query.searchQuery;
    let query = {};

    if (status) {
        query.status = status;
    }
    if (service_type) {
        query.service_type = { $in: service_type.split(',') };
    }
    if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.app_date = { $gte: startDate.toISOString().split('T')[0], $lt: endDate.toISOString().split('T')[0] };
    }
    if (searchQuery) {
        const regex = new RegExp(`^${searchQuery}`, 'i');
        const q = {};
        q.$or = [
            { 'firstName': regex },
            { 'lastName': regex },
            { 'first_name': regex },
            { 'last_name': regex },
            { 'email': regex }
        ];
        const users = await userModel.find(q);
        const ids = users.map(user => user._id.toString());
        query.client = { $in: ids };
    }


    const appointments = await appointmentModel.find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    const totalRecords = await appointmentModel.countDocuments(query);
    res.json({
        appointments: appointments,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    });
});

exports.recentPrescriptions = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const date = req.query.date;
    const service_type = req.query.service_type;
    const searchQuery = req.query.searchQuery;
    let appointments = [];
    const query = {
        service_type: { $in: ["MedicalOfficeVisit", "Consultation", 'Medical/OfficeVisit', 'ConsultationCall'] },
    };
    if (service_type) {
        query.service_type = { $in: [service_type] }
    }
    query.status = 'paid';

    if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.app_date = { $gte: startDate.toISOString().split('T')[0], $lt: endDate.toISOString().split('T')[0] };
    }

    if (searchQuery) {
        const regex = new RegExp(`^${searchQuery}`, 'i');
        const q = {};
        q.$or = [
            { 'firstName': regex },
            { 'lastName': regex },
            { 'first_name': regex },
            { 'last_name': regex },
            { 'email': regex }
        ];
        const users = await userModel.find(q);
        const ids = users.map(user => user._id.toString());
        query.client = { $in: ids };
    }

    const appointmentsArray = await appointmentModel.find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    await Promise.all(appointmentsArray.map(async (appoint) => {
        const Presform = await PrescriptionsForm.find({ appointmentId: appoint._id });
        let appointmentWithEval = {
            ...appoint.toObject(),
            isFilled: Boolean(Presform.length),
            presId: Boolean(Presform.length) ? Presform[0]._id : null
        };
        appointments.push(appointmentWithEval);

    }));

    const totalRecords = await appointmentModel.countDocuments(query);

    res.json({
        appointments: appointments,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    });

});

exports.inQueueRequests = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const service_type = req.query.service_type;
    const date = req.query.date;
    const searchQuery = req.query.searchQuery;
    const query = {};

    query.status = 'paid';

    if (service_type) {
        query.service_type = { $in: [service_type] }
    } else {
        query.service_type = { $in: ['ConcussionEval', 'SportsVision', 'Post-ConcussionEvaluation', 'SportsVisionPerformanceEvaluation'] };
    }
    if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.app_date = { $gte: startDate.toISOString().split('T')[0], $lt: endDate.toISOString().split('T')[0] };
    }
    if (searchQuery) {
        const regex = new RegExp(`^${searchQuery}`, 'i');
        query.$or = [
            { 'client.firstName': regex },
            { 'client.lastName': regex },
            { 'client.first_name': regex },
            { 'client.last_name': regex },
            { 'client.email': regex }
        ];
    }
    const appointmentsArray = await appointmentModel.find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    let appointments = [];
    await Promise.all(appointmentsArray.map(async (appoint) => {
        const Evalform = await EvalutionsForm.find({ appointmentId: appoint._id });
        const Diagform = await DiagnosisForm.find({ appointmentId: appoint._id });
        if (!Boolean(Diagform.length)) {
            let appointmentWithEval = {
                ...appoint.toObject(),
                isFilledPrescription: Boolean(Evalform.length),
                isFilledDiagnosis: Boolean(Diagform.length)
            };
            appointments.push(appointmentWithEval);
        }

    }));

    const totalRecords = await appointments.length;

    res.json({
        appointments: appointments,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    });
});

exports.inQueueEvaluation = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const service_type = req.query.service_type;
    const searchQuery = req.query.searchQuery;
    const date = req.
        query.date;
    const query = {};

    query.status = 'paid';

    if (service_type) {
        query.service_type = { $in: [service_type] }
    } else {
        query.service_type = { $nin: ['MedicalOfficeVisit', 'TrainingSession', "Medical/OfficeVisit", 'AddTrainingSessions'] }
    }
    if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.app_date = { $gte: startDate.toISOString().split('T')[0], $lt: endDate.toISOString().split('T')[0] };
    }

    if (searchQuery) {
        const regex = new RegExp(`^${searchQuery}`, 'i');
        query.$or = [
            { 'client.firstName': regex },
            { 'client.lastName': regex },
            { 'client.first_name': regex },
            { 'client.last_name': regex },
            { 'client.email': regex }
        ];
    }

    const appointments = await appointmentModel.find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    const totalRecords = await appointmentModel.countDocuments(query);

    res.json({
        appointments: appointments,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    });
});

exports.selectPlan = catchAsyncError(async (req, res, next) => {
    const userId = req.query.userId;
    const plan = req.query.plan;
    const planPhase = req.query.planPhase;

    if (!userId || !plan || !planPhase) {
        return next(new ErrorHandler("Please provide a user id", 400));
    }
    const user = await userModel.findById(userId);
    if (user.role !== 'athlete') {
        return next(new ErrorHandler('Unauthorized! Access denied', 400));
    }

    const DrillFormUser = await DrillForm.find(
        {
            $or: [
                { clientId: userId },
                { clientId: new mongoose.Types.ObjectId(userId) }
            ]
        }
    );
    if (DrillFormUser.length === 0) {
        const form = await DrillFormModel.find({
            plan: { $regex: new RegExp(plan, 'i') },
            phase: { $regex: new RegExp(planPhase, 'i') }
        }).select('-_id -__v');
        if (form.length !== 0) {
            const drillForm = await DrillForm.create({
                clientId: userId,
                drill: form
            });
            drillForm.save();
        }
    }

    const appointment = await appointmentModel.updateMany(
        { 'client._id': new mongoose.Types.ObjectId(userId) },
        {
            $set: {
                "client.plan": plan,
                "client.phase": planPhase,
                "client.plan_payment": "pending"
            }
        }
    );
    const dater = new Date();
    const fdate = dater.setUTCHours(0, 0, 0, 0);
    const planCost = await planModel.findOne({
        name: plan
    });
    const basicPhase = planCost.phases.find(phase => phase.name === planPhase);
    const transaction = await transactionModel.create({
        plan: plan,
        phase: planPhase,
        date: fdate,
        payment_status: "pending",
        service_type: "planPurchase",
        clientId: userId,
        amount: basicPhase.cost
    });
    transaction.save();
    if (!user) {
        return next(new ErrorHandler("user does not exist", 400));
    }

    user.plan = plan;
    user.phase = planPhase;
    user.plan_payment = "pending";
    await user.save();
    try {
        const isSend = await createNotification("Doctor has selected your plan ", `A plan has been selected by doctor, your are in ${plan} and phase ${planPhase}`, user);
        if (isSend);
        res.status(200).json({
            success: true,
            message: `Plan updated, plan is: ${user.plan}. Notified to user`,
            user,
            appointment
        });
    } catch (e) {

    }
});

exports.getForm = catchAsyncError(async (req, res) => {
    // // const schemaContent = fs.readFileSync(path.resolve(baseSchemaPathEval), 'utf8');
    // try {
    //     const evaluationModel = require('../models/evaluationModel');
    //     // const dynamicSchema = eval(schemaContent);
    //     const dynamicSchema = evaluationModel;
    //     const paths = Object.keys(dynamicSchema.schema.paths);

    //     const fieldsAndEnums = paths.reduce((result, path) => {
    //         const schemaType = dynamicSchema.schema.paths[path];
    //         if (schemaType.enumValues) {
    //             result.push({ field: path, enumValues: schemaType.enumValues });
    //         }
    //         return result;
    //     }, []);
    //     res.json(fieldsAndEnums);
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).send('Internal Server Error');
    // }
    const name = req.query.name;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, message: "Invalid input" });
    }
    const doc = await EvalForm.findOne({ name });
    if (!doc || doc.length < 1) {
        return res.status(400).json({ success: false, message: "Not found" });
    }
    res
        .status(200)
        .json({ success: true, doc });

});

exports.getAppointment = catchAsyncError(async (req, res) => {
    const date = req.params.date;
    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required.' });
    }
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const appointments = await appointmentModel.find({ app_date: date, app_date: { $gte: startDate.toISOString().split('T')[0], $lt: endDate.toISOString().split('T')[0] } });
    res.status(200).json({
        success: true,
        appointments:
            appointments
    });
});

exports.getSlots = catchAsyncError(async (req, res) => {
    const { doctor, date, service_type, location } = req.query;
    let slots = [];
    const query = {};
    if (date) {
        query.date = date;
    }
    if (doctor) {
        query.doctor = doctor;
    }
    if (date && doctor && service_type) {
        let fdate = `${date.split('T')[0]}T00:00:00.000Z`
        const dayAppointments = await appointmentModel.find({ doctor_trainer: doctor, app_date: fdate });
        const doc = await slotModel.find(query);
        let Calcslots = [];
        if (dayAppointments.length > 2) {
            const promises = dayAppointments.map((app, index) => {
                if (index === 0) {
                    calculateTimeDifference(doc[0].startTime, null, app.app_time, app.service_type).then((data) => {
                        if (data.length > 0) {
                            data.map((slot) => (
                                Calcslots.push(slot)
                            ))
                        }
                    });
                } else if (index + 1 === dayAppointments.length) {
                    calculateTimeDifference(app.app_time, app.service_type, doc[0].startTime, service_type).then((data) => {
                        if (data.length > 0) {
                            data.map((slot) => (
                                Calcslots.push(slot)
                            ))
                        }
                        Calcslots = Calcslots.filter((slot) => slot !== undefined);
                        slots = Calcslots.map((slot, index) => ([slot, Calcslots[index + 1] == null ? doc[0].endTime : Calcslots[index + 1]]));
                        return res.status(200).json({ slots: slots });
                    });
                } else {
                    calculateTimeDifference(app.app_time, app.service_type, dayAppointments[index + 1].app_time, service_type).then((data) => {
                        if (data.length > 0) {
                            data.map((slot) => (
                                Calcslots.push(slot)
                            ))
                        }
                    });
                }
            });
            Calcslots = await Promise.all(promises);
        } if (dayAppointments.length === 2) {
            const promises = dayAppointments.map((app, index) => {
                if (index === 0) {
                    calculateTimeDifference(doc[0].startTime, null, app.app_time, app.service_type).then((data) => {
                        if (data.length > 0) {
                            data.map((slot) => (
                                Calcslots.push(slot)
                            ))
                        }
                    });
                } else if (index + 1 === dayAppointments.length) {
                    calculateTimeDifference(dayAppointments[index - 1].end_time, null, app.app_time, service_type).then((data) => {
                        if (data.length > 0) {
                            data.map((slot) => (
                                Calcslots.push(slot)
                            ))
                        }
                    });

                    calculateTimeDifference(app.end_time, null, doc[0].endTime, service_type).then((data) => {
                        if (data.length > 0) {
                            data.map((slot) => (
                                Calcslots.push(slot)
                            ))
                        }
                        Calcslots = Calcslots.filter((slot) => slot !== undefined);
                        slots = Calcslots.map((slot, index) => ([slot, Calcslots[index + 1] == null ? doc[0].endTime : Calcslots[index + 1]]));
                        return res.status(200).json({ slots: slots });
                    });
                }
            });
            Calcslots = await Promise.all(promises);
        } if (dayAppointments.length === 1) {
            const promises = dayAppointments.map((app, index) => {
                calculateTimeDifference(doc[0].startTime, null, app.app_time, app.service_type).then((data) => {
                    data.map((slot) => (
                        Calcslots.push(slot)
                    ))
                });
                calculateTimeDifference(app.app_time, app.service_type, doc[0].endTime, service_type).then((data) => {
                    data.map((slot) => (
                        Calcslots.push(slot)
                    ));
                    slots = Calcslots.map((slot, index) => ([slot, Calcslots[index + 1] == null ? doc[0].endTime : Calcslots[index + 1]]));
                    return res.status(200).json({ slots: slots });
                });
            });
            await Promise.all(promises);
        } if (dayAppointments.length === 0) {
            calculateTimeDifference(doc[0].startTime, null, doc[0].endTime, service_type).then((data) => {
                data.map((slot) => (
                    Calcslots.push(slot)
                ));
                slots = Calcslots.map((slot, index) => ([slot, Calcslots[index + 1] == null ? doc[0].endTime : Calcslots[index + 1]]));
                return res.status(200).json({ slots: slots });
            });
        }
        return
    }
    if (!doctor && !date) {
        slots = await slotModel.find().select('date address');
        return res.status(200).json({ dates: slots });
    } else {
        let dates = await slotModel.find().select('date address');
        slots = await slotModel.find(query);
        return res.status(200).json({
            location: slots,
            dates: dates
        });
    }
});

exports.getAllDoc = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1
    const limit = parseInt(req.query.per_page_count) || 10
    const query = {}
    query.role = 'doctor'
    const doctors = await userModel
        .find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec()

    const totalRecords = await userModel.countDocuments(query)
    res.json({
        doctors: doctors,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    })
});

exports.getServiceTypes = catchAsyncError(async (req, res, next) => {
    const serviceType = await ServiceTypeModel.find()
    res.status(200).json({
        success: true,
        serviceType
    })
});

exports.getPlans = catchAsyncError(async (req, res, next) => {
    const plans = await planModel.find()
    res.status(200).json({
        success: true,
        plans
    })
});

exports.submitEvaluation = catchAsyncError(async (req, res, next) => {

    const { appointmentId, form } = req.body

    if (!appointmentId || !form) {
        return next(new ErrorHandler("Fields are empty", 404));
    }

    const forms = await EvalutionsForm.find({ appointmentId });

    if (forms.length > 0) {
        return next(new ErrorHandler("Form is already  filled for this", 404));
    }

    const newEvalForm = new EvalutionsForm({
        appointmentId,
        form
    });

    await newEvalForm.save();

    res.status(200).json({
        success: true,
        message: "Form Submitted",
        newEvalForm
    });

});

exports.submitPrescription = catchAsyncError(async (req, res, next) => {

    const { appointmentId, form } = req.body

    if (!appointmentId || !form) {
        return next(new ErrorHandler("Fields are empty", 404));
    }

    const forms = await PrescriptionsForm.find({ appointmentId });

    if (forms.length > 0) {
        return next(new ErrorHandler("Form is already  filled for this", 404));
    }

    const newEvalForm = new PrescriptionsForm({
        appointmentId,
        form
    });

    await newEvalForm.save();

    res.status(200).json({
        success: true,
        message: "Form Submitted",
        newEvalForm
    });

});

exports.submitDiagnosis = catchAsyncError(async (req, res, next) => {

    const { appointmentId, form } = req.body

    if (!appointmentId || !form) {
        return next(new ErrorHandler("Fields are empty", 404));
    }

    const forms = await DiagnosisForm.find({ appointmentId });
    const appointment = await appointmentModel.findById(appointmentId);

    if (forms.length > 0) {
        return next(new ErrorHandler("Form is already  filled for this", 404));
    }

    const newEvalForm = new DiagnosisForm({
        appointmentId,
        form
    });

    await newEvalForm.save();
    appointment.service_status = 'completed';
    await appointment.save();

    res.status(200).json({
        success: true,
        message: "Form Submitted",
        newEvalForm
    });

});

exports.getAllAppointments = catchAsyncError(async (req, res) => {
    const searchQuery = req.query.searchQuery;
    const appointmentsByDate = await appointmentModel.aggregate([
        {
            $addFields: {
                appDate: {
                    $toDate: '$app_date'
                }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$appDate' },
                    month: { $month: '$appDate' },
                    day: { $dayOfMonth: '$appDate' }
                },
                appointments: { $push: '$$ROOT' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]).sort({ createdAt: 'desc' });
    const currentDate = moment().startOf('day');
    const filteredAppointments = appointmentsByDate.filter(dateGroup => {
        if (currentDate.year() <= dateGroup._id.year) {
            if (currentDate.month() + 1 <= dateGroup._id.month) {
                if (currentDate.date() <= dateGroup._id.day) {
                    return true;
                }
            }
        }
        return false;

    });
    const formattedAppointments = filteredAppointments.map(dateGroup => ({
        date: moment({ ...dateGroup._id, month: dateGroup._id.month - 1 }).format('MM-DD-YYYY'),
        appointments: dateGroup.appointments
    }));
    const groupedAppointments = {};
    formattedAppointments.forEach(appointment => {
        const date = appointment.date;
        if (!groupedAppointments[date]) {
            groupedAppointments[date] = [];
        }
        groupedAppointments[date].push(appointment);
    });
    const sortedDates = Object.keys(groupedAppointments).sort();
    const sortedAppointments = sortedDates.flatMap(date => groupedAppointments[date]);
    for (let index = 0; index < sortedAppointments.length; index++) {
        let appointmentsPopulated = [];
        for (const element of sortedAppointments[index].appointments) {
            const client = await userModel.findById(new mongoose.Types.ObjectId(element.client));
            let appointment = {
                ...element
            };
            appointment.client = client;
            appointmentsPopulated.push(appointment);
        }
        sortedAppointments[index].appointments = appointmentsPopulated;
    }
    res.status(200).json({
        success: true,
        appointments: sortedAppointments
    });
});

exports.appointmentStatus = catchAsyncError(async (req, res, next) => {
    const { Id, status } = req.query;

    if (!Id || !status) {
        return next(new ErrorHandler("Fields are empty", 404));
    }
    const appointment = await appointmentModel.findById(Id);
    if (!appointment) {
        return next(new ErrorHandler("No such appointment exists", 404));
    }
    appointment.service_status = status;
    await appointment.save();

    res.status(200).json({
        success: true,
        appointment
    });
});

exports.getPrescription = catchAsyncError(async (req, res, next) => {
    const prescriptionId = req.query.prescriptionId;
    const appointmentId = req.query.appointmentId;

    if (!prescriptionId) {
        return next(new ErrorHandler(" prescriptionId not received ", 404))
    }

    if (appointmentId) {
        const form = await PrescriptionsForm.findOne({ appointmentId: new mongoose.Types.ObjectId(appointmentId) });
        return res.status(200).json({
            success: true,
            form
        });
    }
    const form = await PrescriptionsForm.findById(prescriptionId);

    res.status(200).json({
        success: true,
        form
    });
});

exports.getEvaluation = catchAsyncError(async (req, res, next) => {
    const evaluationId = req.query.evaluationId;

    if (!evaluationId) {
        return next(new ErrorHandler(" evaluationId not received ", 404))
    }
    const form = await EvalutionsForm.findById(evaluationId);
    const diagForm = await DiagnosisForm.findOne({ appointmentId: form.appointmentId });
    res.status(200).json({
        success: true,
        evaluationForm: form,
        diagnosisForm: diagForm
    });
});

exports.completedReq = catchAsyncError(async (req, res) => {

    const { service_status, payment_status, date } = req.query;
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const searchQuery = req.query.searchQuery;
    const query = {};
    query.service_type = { $in: ['ConcussionEval', 'SportsVision', 'Post-ConcussionEvaluation', 'SportsVisionPerformanceEvaluation'] };
    query.status = 'paid';
    if (service_status) {
        query.service_status = service_status;
    }
    if (payment_status) {
        query.payment_status = payment_status;
    }
    if (date) {
        query.date = date;
    }
    let appointments = [];
    if (searchQuery) {
        const regex = new RegExp(`^${searchQuery}`, 'i');
        query.$or = [
            { 'client.firstName': regex },
            { 'client.lastName': regex },
            { 'client.first_name': regex },
            { 'client.last_name': regex },
            { 'client.email': regex }
        ];
    }
    const appointmentsArray = await appointmentModel.find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit).exec();

    await Promise.all(appointmentsArray.map(async (appoint) => {
        const Evalform = await EvalutionsForm.find({ appointmentId: appoint._id });
        const Diagform = await DiagnosisForm.find({ appointmentId: appoint._id });
        if (Evalform.length && Diagform.length) {
            let appointmentWithEval = {
                ...appoint.toObject(),
                evaluationId: Evalform[0]._id
            };
            appointments.push(appointmentWithEval);
        }
    }));

    res.status(200).json({
        success: true,
        appointments
    });
});

exports.getDrillDetails = catchAsyncError(async (req, res, next) => {
    const { clientId, week } = req.query;
    //  complete percentage

    if (!clientId) {
        return next(new ErrorHandler("Client ID is required", 400));
    }

    const drill = await DrillForm.find({
        $or: [
            { clientId },
            { clientId, "drill.week": week }
        ]
    });
    const client = await userModel.findById(clientId);

    const form = await DrillFormModel.find({
        plan: { $regex: new RegExp(client.plan, 'i') },
        phase: { $regex: new RegExp(client.phase, 'i') }
    }).select('-_id -__v');

    if (form.length < 1)
        return next(new ErrorHandler("The required form does not exists", 404))

    const formFull = await DrillFormModel.aggregate([
        {
            $match: {
                plan: { $regex: new RegExp(client.plan, 'i') },
                phase: { $regex: new RegExp(client.phase, 'i') },
                week: { $regex: new RegExp(week, 'i') }
            }
        },
        {
            $group: {
                _id: { week: "$week" },
                week: { $first: "$week" },
                act: { $push: "$$ROOT.activities.isComplete" },
                drills: { $push: "$$ROOT" }
            }
        },
        {
            $group: {
                _id: null,
                totalWeeks: { $sum: 1 },
                weeks: { $push: "$$ROOT" }
            }
        }
    ]);
    const WeekCount = await DrillFormModel.aggregate([
        {
            $match: {
                plan: { $regex: new RegExp(client.plan, 'i') },
                phase: { $regex: new RegExp(client.phase, 'i') },
            }
        },
        {
            $group: {
                _id: { week: "$week" },
                week: { $first: "$week" },
                drills: { $push: "$$ROOT" },
            }
        },
        {
            $group: {
                _id: null,
                totalWeeks: { $sum: 1 },
                weeks: { $push: "$$ROOT" }
            }
        }
    ]);

    if (drill.length < 1) {
        const drillForm = await DrillForm.create({
            clientId: clientId,
            drill: form
        })
        drillForm.save();
        res.status(200).json({
            success: true,
            totalWeeks: WeekCount[0].totalWeeks,
            completePercentage: 0,
            weeks: formFull[0].weeks

        });
    } else {
        const aggregationPipeline = [
            {
                $match: {
                    $or: [
                        {
                            clientId: new mongoose.Types.ObjectId(clientId)
                        },
                        {
                            clientId: new mongoose.Types.ObjectId(clientId),
                        }
                    ]
                }
            },
            {
                $unwind: "$drill"
            },
            {
                $match: week ? { "drill.week": week.toString() } : {}
            },
            {
                $group: {
                    _id: "$drill.week",
                    drills: { $push: "$drill" },
                    totalActivities: { $push: "$drill.activities.isComplete" },
                    totalActivities: { $push: { $cond: { if: "$drill.activities.isComplete", then: "$drill.activities.isComplete", else: false } } }
                }
            },
            {
                $group: {
                    _id: null,
                    totalWeeks: { $sum: 1 },
                    totalActivities: { $push: "$totalActivities" },
                    weeks: { $push: { week: "$_id", drills: "$drills" } }
                }
            }
        ];
        const drill = await DrillForm.aggregate(aggregationPipeline);
        if (drill.length === 0) {
            return next(new ErrorHandler("Drill cannot be found or created", 400))
        }
        const runner = (drill) => {
            const [data] = drill[0].totalActivities;
            let totalActivitiesdone = 0;
            let totalActivities = 0;
            data.forEach((data) => {
                data.forEach((list) => {
                    ++totalActivities;
                    list && ++totalActivitiesdone;
                })
            });
            return percentage = (totalActivitiesdone / totalActivities) * 100;
        }
        res.status(200).json({
            success: true,
            completePercentage: runner(drill),
            weeks: drill[0].weeks,
            totalWeeks: WeekCount[0].totalWeeks,
        });
    }
});

exports.drillUpdate = catchAsyncError(async (req, res, next) => {
    const { id: targetId, user } = req.query;
    let userId = user;
    if (!user) {
        userId = jwt.verify(
            req.headers.authorization.split(" ")[1],
            process.env.JWT_SECRET
        ).userId
    }
    const form = req.body.form;
    try {
        if (form) {
            const result = await DrillForm.updateOne(
                {
                    "drill.activities._id": new mongoose.Types.ObjectId(targetId),
                    "clientId": new mongoose.Types.ObjectId(userId)
                },
                {
                    $set: {
                        "drill.$[].activities.$[elem].form": form,
                        "drill.$[].activities.$[elem].isComplete": true
                    }
                },
                { arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(targetId) }] }
            );
            if (result.matchedCount > 0) {
                res.status(200).json({ success: true, message: "Form updated successfully" });
            } else {
                res.status(404).json({ success: false, message: "Form not found" });
            }
        } else {
            const result = await DrillForm.updateOne(
                {
                    "drill.activities._id": new mongoose.Types.ObjectId(targetId),
                    "clientId": new mongoose.Types.ObjectId(userId)
                },
                { $set: { "drill.$[].activities.$[elem].isComplete": true } },
                { arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(targetId) }] }
            );
            if (result.matchedCount > 0) {
                res.status(200).json({ success: true, message: "Activity updated successfully" });
            } else {
                res.status(404).json({ success: false, message: "Activity not found" });
            }
        }
    } catch (error) {
        console.error("Error updating activity:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

exports.createTrainigSessionModel = catchAsyncError(async (req, req, next) => {
    const { type, cost, session_per_month } = req.body;

    const session = await TrainingSessionModel.find({ type, cost, session_per_month });
    if (session)
        return next(new ErrorHandler('This is already created', 400));
    try {
        const newSession = await TrainingSessionModel.create({
            session_type: type, cost, session_per_month
        });
        await newSession.save();
        return res.status(200).json({
            success: true, message: "Training session Added successfully"
        });
    } catch (error) {
        return next(new ErrorHandler('Internal server error' + error, 400));
    }
});

exports.updateTrainingSessionModel = catchAsyncErrorAsync(async (req, res, next) => {
    const { type, cost, session_per_month } = req.body;
    const { id } = req.query;
    try {
        const session = await TrainingSessionModel.findByIdAndUpdate(id, { type, cost, session_per_month }, { new: true, runValidators: true });

        if (!session) {
            return next(new ErrorHandler('Training session not found', 404));
        }

        return res.status(200).json({
            success: true,
            message: "Successfully updated",
            data: session
        });
    } catch (error) {
        return next(new ErrorHandler('Internal server error: ' + error.message, 500));
    }
});






