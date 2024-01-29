const userModel = require('../models/userModel')
const fs = require('fs')
const path = require('path')
// const evaluationModel = require("../models/evaluationModel");
const catchAsyncError = require('../utils/catchAsyncError')
const ErrorHandler = require('../utils/errorHandler')
const baseSchemaPath = path.resolve(__dirname, '../models/evaluationModel')
const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken()

  res.status(statusCode).json({
    user,
    token,
  })
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

  if (user.role !== 'admin')
    return next(new ErrorHandler('Unauthorized user login.', 401))

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401))
  }

  const isPasswordMatched = await user.comparePassword(password)
  if (!isPasswordMatched)
    return next(new ErrorHandler('Invalid email or password!', 401))

  user.password = undefined
  sendData(user, 200, res)
})

exports.evaluationFormMake = catchAsyncError(async (req, res) => {
  const { fieldName, values } = req.body
  try {
    const existingSchemaCode = fs.readFileSync(baseSchemaPath, 'utf-8')

    const updatedSchemaCode = existingSchemaCode.replace(
      /const evaluationModel = new mongoose\.Schema\({/,
      `const evaluationModel = new mongoose.Schema({
                         [${fieldName}]: String,
                         required: true,
                         enum: ${values}`
    )
    fs.writeFileSync(baseSchemaPath, updatedSchemaCode, 'utf-8')
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

exports.prescriptionFormMake = catchAsyncError(async (req, res) => {
  const { fieldName, values } = req.body
  try {
    const existingSchemaCode = fs.readFileSync(basePath, 'utf-8')

    const updatedSchemaCode = existingSchemaCode.replace(
      /const evaluationModel = new mongoose\.Schema\({/,
      `const evaluationModel = new mongoose.Schema({
                         [${fieldName}]: String,
                         required: true,
                         enum: ${values}`
    )
    fs.writeFileSync(basePath, updatedSchemaCode, 'utf-8')
    res.status(200).json({
      success: true,
      message: `Schema updated successfully.`,
    })
  } catch (err) {
    return next(new ErrorHandler(err, 400))
  }
})
