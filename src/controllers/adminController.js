const userModel = require('../models/userModel');
const clinicModel = require('../models/clinicModel');
const fs = require('fs');
const path = require('path');
const slotModel = require("../models/slotModel");
const catchAsyncError = require('../utils/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const baseSchemaPathEval = path.resolve(__dirname, '../models/evaluationModel.js');
const baseSchemaPathPres = path.resolve(__dirname, '../models/prescriptionModel.js');
const sendData = (user, statusCode, res) => {
    const token = user.getJWTToken()

    res.status(statusCode).json({
        user,
        token,
    })
}

function toCamelCase(inputString) {
    return inputString.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

exports.registerDoctor = catchAsyncError(async (req, res, next) => {
    const { fullname, email, password } = req.body

    if (!fullname || !email || !password) {
        return next(new ErrorHandler('Please fill all fields', 400))
    }

    let user = await userModel.findOne({ email })

    if (user)
        return next(new ErrorHandler('User already exists with this email', 400))
    if (password.length < 8)
        return next(
            new ErrorHandler('Password should have minimum 8 characters', 400)
        )

    user = await userModel.create({
        fullname,
        email,
        password,
        role: 'doctor',
    })

    await user.save()

    user.password = undefined
    sendData(user, 200, res)
})

exports.registerClinic = catchAsyncError(async (req, res, next) => {
    const { name, address } = req.body

    if (!name || !address) {
        return next(new ErrorHandler('Please fill all fields', 400))
    }

    let clinic = await clinicModel.findOne({ name })

    if (clinic)
        return next(new ErrorHandler('Clinic already exists with this name', 400))

    clinic = await clinicModel.create({
        name,
        address
    })

    await clinic.save()
    res.status(200).json({
        success: true,
        message: `${name} is added`,
    })
})

exports.registerAdmin = catchAsyncError(async (req, res, next) => {
    const { fullname, email, password, validator } = req.body
    if (validator != 'ares') {
        return next(new ErrorHandler('Unauthorized!', 400))
    }
    if (!fullname || !email || !password) {
        return next(new ErrorHandler('Please fill all fields', 400))
    }

    let user = await userModel.findOne({ email })

    if (user)
        return next(new ErrorHandler('User already exists with this email', 400))
    if (password.length < 8)
        return next(
            new ErrorHandler('Password should have minimum 8 characters', 400)
        )

    user = await userModel.create({
        fullname,
        email,
        password,
        role: 'admin',
    })

    await user.save()

    user.password = undefined
    sendData(user, 200, res)
})

exports.login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password)
        return next(new ErrorHandler('Please enter your email and password', 400))

    const user = await userModel.findOne({ email }).select('+password')
    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }
    if (user.role !== 'admin')
        return next(new ErrorHandler('Unauthorized user login.', 401))


    const isPasswordMatched = await user.comparePassword(password)
    if (!isPasswordMatched)
        return next(new ErrorHandler('Invalid email or password!', 401))

    user.password = undefined
    sendData(user, 200, res)
})

exports.evaluationFormMake = catchAsyncError(async (req, res, next) => {
    const { fieldName, values } = req.body;
    if (!fieldName) {
        return next(new ErrorHandler('Enter field Name', 400))
    }
    try {
        const existingSchemaCode = fs.readFileSync(baseSchemaPathEval, 'utf-8')

        const updatedSchemaCode = existingSchemaCode.replace(
            /const evaluationSchema = new mongoose\.Schema\({/,
            `const evaluationSchema = new mongoose.Schema({
                ${toCamelCase(fieldName)}:{
                   type:String,
                   required: [true, "Required"],
                   ${values ? `enum: ${JSON.stringify(values)}` : ''}
                }, `)
        fs.writeFileSync(baseSchemaPathEval, updatedSchemaCode, 'utf-8')
        res.status(200).json({
            success: true,
            message: `Schema updated successfully.`,
        })
    } catch (err) {
        return next(new ErrorHandler(err, 400))
    }
})

exports.prescriptionFormMake = catchAsyncError(async (req, res, next) => {
    const { fieldName, values } = req.body;
    if (!fieldName) {
        return next(new ErrorHandler('Enter field Name', 400))
    }
    try {
        const existingSchemaCode = fs.readFileSync(baseSchemaPathPres, 'utf-8')

        const updatedSchemaCode = existingSchemaCode.replace(
            /const prescriptionSchema = new mongoose\.Schema\({/,
            `const prescriptionSchema = new mongoose.Schema({
                         ${toCamelCase(fieldName)}:{
                            type:String,
                            required: [true, "Required"],
                            ${values ? `enum: ${JSON.stringify(values)}` : ''}
                         }, `)
        fs.writeFileSync(baseSchemaPathPres, updatedSchemaCode, 'utf-8')
        res.status(200).json({
            success: true,
            message: `Schema updated successfully.`,
        })
    } catch (err) {
        return next(new ErrorHandler(err, 400))
    }
})

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
        data: doctors,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
    })
})

exports.getAllClinics = catchAsyncError(async (req, res) => {
    const clinics = await clinicModel.find()
    res.status(200).json({
        data: clinics
    })
})

exports.createSlot = catchAsyncError(async (req, res) => {
    const { date, doctor, address } = req.body;
    const [day, month, year] = date.split('-');
    const formattedDate = `${month}-${day}-${year}`;

    if (!date || !doctor || !address)
        return next(new ErrorHandler('Please fill all fields', 400));
    const slot = await slotModel.create({
        date: new Date(formattedDate),
        doctor,
        address
    });

    slot.save()

    res.status(200).json({
        data: slot,
        message: 'Added successfully'
    })
})

exports.getAllSlots = catchAsyncError(async (req, res) => {
    const slots = await slotModel.find()
    res.status(200).json({
        data: slots
    })
})


