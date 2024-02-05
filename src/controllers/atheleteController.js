const athleteModel = require("../models/athleteModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.register = catchAsyncError(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    city,
    phone,
    state,
    age,
    dob,
    gender,
    height,
    dominatedHand,
    guardianFirstName,
    guardianLastName,
    guardianSuffix,
    organization,
    password
  } = req.body;

  if (!firstName || !lastName || !email || !city || !phone || !state || !age || !dob || !gender || !height, !dominatedHand || !guardianFirstName || !guardianLastName || !guardianSuffix || !organization || !password) {
    return next(new ErrorHandler("Please enter all the fields"));
  }

  let user = await athleteModel.findOne({ email });
  if (user)
    return next(new ErrorHandler("User already exists with this email", 400));
  if (password.length < 8)
    return next(
      new ErrorHandler("Password should have minimum 8 characters", 400)
    );

  user = await athleteModel.create({
    firstName,
    lastName,
    email,
    city,
    phone,
    state,
    age,
    dob,
    gender,
    height,
    dominatedHand,
    guardianFirstName,
    guardianLastName,
    guardianSuffix,
    organization,
    password,
    role: 'athlete'
  });

  await user.save();

  const token = user.getJWTToken();
  res.status(201).json({ user, token });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await athleteModel.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  const token = user.getJWTToken();
  res.status(201).json({ user, token });
});
