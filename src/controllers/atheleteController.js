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

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await athleteModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));

  const code = generateCode(6);

  await athleteModel.findOneAndUpdate({ email }, { temp_code: code });
  resetPasswordCode(email, user.fullname, code);

  res.status(200).json({ message: "Code sent to your email." });
});

exports.validateForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email, code } = req.body;
  const user = await athleteModel.findOne({ email });

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
  const user = await athleteModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));
  if (!newPassword || !confirmPassword)
    return next(new ErrorHandler("Please fill in all fields", 400));
  if (newPassword !== confirmPassword)
    return next(new ErrorHandler("Password does not match", 400));

  user.password = newPassword;
  await user.save();

  res.status(203).json({ message: "Password Updated Successfully." });
});
