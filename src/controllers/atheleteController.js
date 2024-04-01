const appointmentModel = require("../models/appointmentModel");
const catchAsyncError = require("../utils/catchAsyncError");
const userModel = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const { resetPasswordCode, newAccount } = require("../utils/mails");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');
const generateCode = require("../utils/generateCode");
const { s3Uploadv2, s3UpdateImage } = require('../utils/aws.js');


exports.register = catchAsyncError(async (req, res, next) => {
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
    password,
  } = req.body;
  const file = req.file;
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
      !zip,
      !password)
  ) {
    return next(new ErrorHandler("Please enter all the fields"));
  }

  let user = await userModel.findOne({ email });
  if (user)
    return next(new ErrorHandler("User already exists with this email", 400));
  if (password.length < 8)
    return next(
      new ErrorHandler("Password should have minimum 8 characters", 400)
    );
  const result = await s3Uploadv2(file);
  const location = result.Location && result.Location;
  user = await userModel.create({
    firstName,
    lastName,
    profilePic: location,
    suffix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
    password,
    role: "athlete",
  });
  newAccount(email, `${firstName}${lastName}`, password);
  await user.save();

  const token = user.getJWTToken();
  res.status(201).json({ user, token });
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

  const token = user.getJWTToken();
  res.status(201).json({ user, token });
});

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));

  const code = generateCode(6);

  await userModel.findOneAndUpdate({ email }, { temp_code: code });
  resetPasswordCode(email, user.fullname, code);

  res.status(200).json({
    success: true,
    message: "Code sent to your email."
  });
});

exports.validateForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email, code } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));

  if (user.temp_code === code) {
    user.temp_code = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Code Validated Successfully."
    });
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

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req;
  const athlete = await userModel.findById(userId).select("-password");
  res.status(200).json({ athlete });
});

exports.editProfile = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  req.userId = userId;
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
  const athlete = await userModel.findById(userId).select("-password");
  const result = await s3UpdateImage(file, athlete.profilePic);
  const location = result.Location && result.Location;

  firstName && (athlete.firstName = firstName);
  lastName && (athlete.lastName = lastName);
  file && (athlete.profilePic = location);
  suffix && (athlete.suffix = suffix);
  gender && (athlete.gender = gender);
  dob && (athlete.dob = dob);
  address && (athlete.address = address);
  city && (athlete.city = city);
  zip && (athlete.zip = zip);
  state && (athlete.state = state);
  email && (athlete.email = email);
  phone && (athlete.phone = phone);

  await athlete.save();

  res.status(200).json({ athlete });
});

exports.getBookings = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  req.userId = userId;
  const appointments = await appointmentModel.find({ "client._id": new ObjectId(userId) })
    .sort({ createdAt: 'desc' })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("-client");
  res.status(200).json({
    success: true,
    appointments
  });
});

// ==========================APPOINTMENT STUFF =============================================>

exports.getUpcomingAppointments = catchAsyncError(async (req, res, next) => {
  const currentDateTime = new Date();
  const currentDate = currentDateTime.toISOString().split("T")[0];
  const currentTime = currentDateTime.toTimeString().split(" ")[0].slice(0, 5); // we need to remove timezone info so splitting and im getting first element
  // take the first 4 cuz we dont need seconds acoording to schema
  console.log(currentDate);
  console.log(currentTime);
  const upcomingAppointments = await appointmentModel
    .find({
      $or: [
        { app_date: { $gt: currentDate } }, // Future dates
        {
          app_date: currentDate, // Current date
          app_time: { $gte: currentTime }, // Time greater than or equal to current time
        },
      ],
    })
    .select("app_date app_time -client");

  if (!upcomingAppointments) {
    return next(new ErrorHandler("No upcoming appointments found", 404));
  }

  res.status(200).json({ upcomingAppointments });
});
