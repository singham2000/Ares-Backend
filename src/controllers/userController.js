const userModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const resetPasswordCode = require("../utils/resetPasswordCode");
const generateCode = require("../utils/generateCode");

const sendData = (user, statusCode, res) => {
    const token = user.getJWTToken();

    res.status(statusCode).json({
        "status": "user login successfully",
        "user_data": user,
        token,
    });
};

exports.getProfile = catchAsyncError(async (req, res, next) => {
    const user = await userModel.findById(req.body.userId);
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