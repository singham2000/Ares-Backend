const userModel = require("../models/userModel");
const EvalutionsForm = require("../models/EvaluationForms")
const appointmentModel = require("../models/appointmentModel");
const slotModel = require("../models/slotModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { resetPasswordCode, newAccount } = require("../utils/mails");
const generateCode = require("../utils/generateCode");
const { generateAppointmentId } = require("../utils/generateId");
const { calculateTimeDifference, sendData } = require('../utils/functions');
const ServiceTypeModel = require("../models/ServiceTypeModel.js");
const planModel = require("../models/planModel.js");
const moment = require('moment');
const EvalForm = require("../models/FormModel");

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

    if (!user) return next(new ErrorHandler("User Not Found.", 404));

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

    user.password = newPassword;
    await user.save();

    res.status(203).json({ message: "Password Updated Successfully." });
});

exports.login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
        return next(new ErrorHandler("Please enter your email and password", 400));

    const user = await userModel.findOne({ email, role: 'doctor' }).select("+password");

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
    if (!user)
        return next(new ErrorHandler("User does not exists with this email", 400));

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
        app_date: app_date,
        doctor_trainer: doctor_trainer
    };
    const app_id = generateAppointmentId();

    if (!client_id) {
        return next(new ErrorHandler("Please provide a client_id", 400));
    }
    const client = await userModel.findById(client_id);
    if (!client) {
        return next(new ErrorHandler("Client does not exist", 400));
    }

    // const dayAppointments = await appointmentModel.find(query).sort({ createdAt: 'desc' });
    // if (dayAppointments) {
    //     dayAppointments.forEach(appointment => {
    //         if (timeValidate(appointment.service_type, appointment.app_time, app_time)) {
    //             appointmentOnDate = appointmentOnDate + 1;
    //         }
    //     })
    // }
    // if (appointmentOnDate)
    //     return next(new ErrorHandler("Another Appointment is overlapping", 400));
    const appointment = await appointmentModel.create({
        appointment_id: app_id,
        client: client,
        service_type,
        app_date,
        app_time,
        end_time,
        doctor_trainer,
        location,
        status: 'pending'
    });

    await appointment.save();

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

exports.recentPrescriptions = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const date = req.query.date;
    const service_type = req.query.service_type;
    const searchQuery = req.query.searchQuery;
    const query = {
        service_type: { $in: ["MedicalOfficeVisit", "Consultation"] },
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

exports.inQueueRequests = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const service_type = req.query.service_type;
    const date = req.query.date;
    const query = {};

    query.status = 'paid';

    if (service_type) {
        query.service_type = { $in: [service_type] }
    } else {
        query.service_type = { $in: ['ConcussionEval', 'SportsVision'] };
    }
    if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.app_date = { $gte: startDate.toISOString().split('T')[0], $lt: endDate.toISOString().split('T')[0] };
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
        query.service_type = { $nin: ['MedicalOfficeVisit', 'TrainingSession'] }
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

exports.selectPlan = catchAsyncError(async (req, res) => {
    const client_id = req.body.id;
    const plan = req.body.plan;

    if (!client_id) {
        return next(new ErrorHandler("Please provide a client_id", 400));
    }
    const client = await userModel.findOne({ client_id: client_id });
    if (!client) {
        return next(new ErrorHandler("Client does not exist", 400));
    }
    client.plan = plan;
    await client.save();
    res.status(200).json({
        success: true,
        message: `Plan updated, your plan is: ${client.plan}.`,
        client,
    });
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
    const doc = await EvalForm.find()
    if (!doc || doc.length < 1) {
        return res.status(400).json({ success: false, message: "Not found" });
    }
    res
        .status(200)
        .json({ success: true, message: "EvalForm", doc });

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
    let slots;
    const query = {};
    if (date) {
        query.date = date;
    }
    if (doctor) {
        query.doctor = doctor;
    }
    if (date && doctor && service_type) {
        const dayAppointments = await appointmentModel.find({ doctor_trainer: doctor, app_date: date.split('T')[0], location: location });
        const doc = await slotModel.find(query);
        let Calcslots = [];
        if (dayAppointments.length > 1) {
            dayAppointments.map((app, index) => {
                if (index === 0) {
                    Calcslots = [...Calcslots, ...calculateTimeDifference(doc[0].startTime, null, app.app_time, service_type)];
                } else if (index + 1 === dayAppointments.length) {
                    Calcslots = [...Calcslots, ...calculateTimeDifference(app.app_time, app.service_type, doc[0].startTime, service_type)];
                } else {
                    Calcslots = [...Calcslots, ...calculateTimeDifference(app.app_time, app.service_type, dayAppointments[index + 1].app_time, service_type)]
                }
            })
        } else {
            Calcslots = [...Calcslots, ...calculateTimeDifference(doc[0].startTime, null, doc[0].endTime, service_type)]
        }
        slots = Calcslots.map((slot, index) => ([slot, Calcslots[index + 1] == null ? doc[0].endTime : Calcslots[index + 1]]));
        return res.status(200).json({ slots: slots });
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
    const plans = await ServiceTypeModel.find()
    res.status(200).json({
        success: true,
        plans
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

exports.getAllAppointments = catchAsyncError(async (req, res) => {
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

exports.completedReq = catchAsyncError(async (req, res) => {
    const { service_status, payment_status, date } = req.query;
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;
    const searchQuery = req.query.searchQuery;
    const query = {};

    const appointments = appointmentModel.find(query).select('service_type app_date app_time end_time status')
});
