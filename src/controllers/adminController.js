const userModel = require("../models/userModel");
const fs = require('fs');
const path = require('path');
// const evaluationModel = require("../models/evaluationModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const baseSchemaPath = path.resolve(__dirname, '../models/evaluationModel');
const sendData = (user, statusCode, res) => {
    const token = user.getJWTToken();

    res.status(statusCode).json({
        user,
        token,
    });
};

exports.registerDoctor = catchAsyncError(async (req, res, next) => {
    const {
        fullname, email, password
    } = req.body;

    if (!fullname || !email || !password) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }

    let user = await userModel.findOne({ email });

    if (user)
        return next(new ErrorHandler("User already exists with this email", 400));
    if (password.length < 8)
        return next(
            new ErrorHandler("Password should have minimum 8 characters", 400)
        );

    user = await userModel.create({
        fullname, email, password, role: "doctor"
    });

    await user.save();

    user.password = undefined;
    sendData(user, 200, res);
});

exports.evaluationFormMake = catchAsyncError(async (req, res) => {
    const { fieldName, values } = req.body;
    try {
        const existingSchemaCode = fs.readFileSync(baseSchemaPath, 'utf-8');

        const updatedSchemaCode = existingSchemaCode.replace(
            /const evaluationModel = new mongoose\.Schema\({/,
            `const evaluationModel = new mongoose.Schema({
                         [${fieldName}]: String,
                         required: true,
                         enum: ${values}`
        );
        fs.writeFileSync(baseSchemaPath, updatedSchemaCode, 'utf-8');
        res.status(200).json({
            success: true,
            message: `Schema updated successfully.`,
        });
    } catch (err) {
        return next(new ErrorHandler(err, 400));
    }
});