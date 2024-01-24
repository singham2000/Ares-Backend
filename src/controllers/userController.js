const userModel = require("../models/userModel");
const clientModel = require('../models/clientModel');
const appointmentModel = require("../models/appointmentModel");
const evaluationModel = require("../models/evaluationModel");
const evaluationSchema = require("../models/evaluationModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const resetPasswordCode = require("../utils/resetPasswordCode");
const generateCode = require("../utils/generateCode");
const { generateClientId, generateAppointmentId } = require("../utils/generateId");

const sendData = (user, statusCode, res) => {
    const token = user.getJWTToken();

    res.status(statusCode).json({
        "status": "user login successfully",
        "user_data": user,
        token,
    });
};

exports.getProfile = catchAsyncError(async (req, res, next) => {
    console.log(req.query.email);
    const email = req.query.email;
    const user = await userModel.findOne({ email });


    if (!user) {
        return next(new ErrorHandler("User not found.", 400));
    }

    res.status(200).json({
        user,
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

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched)
        return next(new ErrorHandler("Invalid email or password!", 401));

    user.password = undefined;
    sendData(user, 200, res);
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
    const { fullname, email } = req.body;

    let user1 = await userModel.findOne({ email });
    if (user1 && user1._id.toString() !== req.userId.toString()) {
        return next(
            new ErrorHandler(
                "Try with different email. User with this email already exists",
                400
            )
        );
    }

    const user = await userModel.findById(req.userId);
    if (!user) return next(new ErrorHandler("User Not Found.", 404));

    if (email) user.email = email;
    if (fullname) user.fullname = fullname;


    await user.save();
    res.status(200).json({
        success: true,
        message: "Profile Updated Successfully.",
        user,
    });
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
        first_name,
        last_name,
        suffix,
        birthday,
        gender,
        email,
        phone_number,
        address,
        city,
        state,
        zip
    } = req.body;

    let clientid = generateClientId();

    if (!first_name || !last_name || !suffix || !birthday || !gender || !email || !phone_number || !address || !city || !state || !zip) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }

    let client = await clientModel.findOne({ email });
    if (client)
        return next(new ErrorHandler("User already exists with this email", 400));

    client = await clientModel.create({
        first_name,
        last_name,
        suffix,
        birthday,
        gender,
        email,
        phone_number,
        address,
        city,
        state,
        zip,
        client_id: clientid
    });

    await client.save();

    res.status(200).json({
        success: true,
        message: "Client Created Successfully.",
        client,
    });
});

exports.checkClient = catchAsyncError(async (req, res, next) => {
    const {
        email,
    } = req.body;

    if (!email) {
        return next(new ErrorHandler("Please provide a email", 400));
    }

    let user = await clientModel.findOne({ email });
    if (!user)
        return next(new ErrorHandler("User does not exists with this email", 400));

    res.status(200).json({
        success: true,
        client_id: user.client_id
    });
});

exports.bookAppointment = catchAsyncError(async (req, res, next) => {
    const client_id = req.params.id;
    const {
        service_type,
        app_date,
        app_time,
        doctor_trainer,
        location
    } = req.body;

    const app_id = generateAppointmentId();

    if (!client_id) {
        return next(new ErrorHandler("Please provide a client_id", 400));
    }
    const client = await clientModel.findOne({ client_id: client_id });
    if (!client) {
        return next(new ErrorHandler("Client does not exist", 400));
    }
    const appointment = await appointmentModel.create({
        appointment_id: app_id,
        client: client,
        service_type,
        app_date,
        app_time,
        doctor_trainer,
        location,
        status: 'pending'
    });
    await appointment.save();
    res.status(200).json({
        success: true,
        message: `Appointment booked. Your Appointment ID: ${app_id}.`,
        appointment,
    });
});

exports.recentBookings = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;

    const appointments = await appointmentModel.find()
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    const totalRecords = await appointmentModel.countDocuments();

    res.json({
        data: appointments,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    });

});

exports.recentPrescriptions = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;

    const query = {};
    query.status = 'paid';

    const appointments = await appointmentModel.find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    const totalRecords = await appointmentModel.countDocuments(query);

    res.json({
        data: appointments,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    });

});

exports.inQueueRequests = catchAsyncError(async (req, res) => {
    const page = parseInt(req.query.page_no) || 1;
    const limit = parseInt(req.query.per_page_count) || 10;

    const query = {};

    query.status = 'paid';

    query.service_type = { $in: ['ConcussionEval', 'SportsVision'] };
    const appointments = await appointmentModel.find(query)
        .sort({ createdAt: 'desc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    const totalRecords = await appointmentModel.countDocuments(query);

    res.json({
        data: appointments,
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
    const client = await clientModel.findOne({ client_id: client_id });
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

exports.getEvalForm = catchAsyncError(async (req, res) => {
    try {
        const paths = Object.keys(evaluationModel.schema.paths);

        const fieldsAndEnums = paths.reduce((result, path) => {
            const schemaType = evaluationModel.schema.paths[path];
            if (schemaType.enumValues) {
                result.push({ field: path, enumValues: schemaType.enumValues });
            }
            return result;
        }, []);
        res.json(fieldsAndEnums);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

exports.getAppointment = catchAsyncError(async (req, res) => {
    const date = req.params.date;
})

