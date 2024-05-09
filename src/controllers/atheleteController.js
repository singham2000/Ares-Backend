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
const transactionModel = require('../models/transactionModel');
const DrillFormModel = require("../models/DrillFormModel.js");
const ShipmentModel = require("../models/shipment.js");


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
    is_online,
    password,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !suffix ||
    !email ||
    !city ||
    !phone ||
    !state ||
    !dob ||
    !gender ||
    !address ||
    !zip ||
    !password
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

  user = await userModel.create({
    firstName,
    lastName,
    profilePic: 'picture',
    suffix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
    is_online,
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

  const user = await userModel.findOne({ email: { $regex: new RegExp(email, "i") } }).select("+password");

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
  if (newPassword === user.password)
    return next(new ErrorHandler("Cannot use old password", 400));
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
  const { service_type, status, service_status } = req.query;

  const query = {};

  if (status)
    query.status = status;

  if (service_type)
    query.service_type = service_type;

  if (service_status)
    query.service_status = service_status;

  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  console.log(userId);
  const doctors = await userModel.find({ role: 'doctor' });
  req.userId = userId;
  let sortedAppointments = [];

  const appointments = await appointmentModel.find({
    $or: [
      { "client._id": new ObjectId(userId), ...query },
      { "client": userId, ...query }
    ]
  }).sort({ createdAt: 'desc' })
    .skip((page - 1) * limit)
    .limit(limit)
  appointments.map((app) => {
    let appoint = {
      ...app._doc,
      doctorData: doctors.map((doc) => {
        if (app.doctor_trainer === doc.firstName) {
          return { email: doc.email, profilePic: doc.profilePic }
        }
      })
    }
    appoint && sortedAppointments.push(appoint);
  });
  res.status(200).json({
    success: true,
    sortedAppointments
  });
});

exports.getTransactions = catchAsyncError(async (req, res, next) => {
  const { date, service_type, plan, phase } = req.query;
  const fdate = new Date(date);
  console.log(date, fdate);
  fdate.setUTCHours(0, 0, 0, 0);
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  let query = { clientId: new mongoose.Types.ObjectId(userId) };
  if (date) {
    query.date = fdate;
  }
  if (service_type) {
    query.service_type = service_type;
  }
  if (plan) {
    query.plan = plan;
  }
  if (phase) {
    query.phase = phase;
  }

  const transactions = await transactionModel.find(query);

  res.status(200).json({
    success: true,
    message: 'Fetched transactions',
    transactions: transactions
  });

});

exports.dashboard = catchAsyncError(async (req, res, next) => {
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  const aggregationPipeline = [
    {
      $match: {
        $or: [
          {
            clientId: new mongoose.Types.ObjectId(userId)
          },
          {
            clientId: new mongoose.Types.ObjectId(userId),
          }
        ]
      }
    },
    {
      $unwind: "$drill"
    },
    {
      $group: {
        _id: "$drill.week",
        drills: { $push: "$drill" },
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

  const pipelineForActiveDay = [
    {
      $match: {
        $or: [
          {
            clientId: new mongoose.Types.ObjectId(userId)
          },
          {
            clientId: new mongoose.Types.ObjectId(userId),
          }
        ]
      }
    },
    {
      $unwind: "$drill"
    },
    {
      $unwind: "$drill.activities"
    },
    {
      $group: {
        _id: null,
        activeDay: {
          $push: {
            $cond: {
              if: "$drill.activities.isComplete",
              // then: {  $concat: [{ $toInt: "$drill.week" }, "-", "$drill.day", " for ", { $toString: "$drill.activities.isComplete" }] },
              then: { week: "$drill.week", day: "$drill.day", status: { $toString: "$drill.activities.isComplete" } },
              // then: 'd',
              else: { week: "$drill.week", day: "$drill.day", status: { $toString: "$drill.activities.isComplete" } }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        activeDay: { $push: "$activeDay" },
      }
    }
  ];

  const drillday = await DrillFormModel.aggregate(pipelineForActiveDay);
  const drill = await DrillFormModel.aggregate(aggregationPipeline);

  console.log(drill.length);

  const runner = (drill) => {
    if (drill.length !== 0) {
      const [data] = drill[0].totalActivities;
      let totalActivitiesdone = 0;
      let totalActivities = 0;
      data.forEach((data) => {
        data.forEach((list) => {
          ++totalActivities;
          list && ++totalActivitiesdone;
        })
      });
      return {
        totalDrills: totalActivities,
        completedDrills: totalActivitiesdone,
        drillProgress: (totalActivitiesdone / totalActivities) * 100
      }
    }
    return {
      totalDrills: 0,
      completedDrills: 0,
      drillProgress: 0
    }
  }

  function findFalseStatus(activities) {
    for (const activity of activities) {
      if (activity.status === "false") {
        return { week: parseInt(activity.week), day: parseInt(activity.day) };
      }
    }
    return null;
  }
  const userDetails = await userModel.findById(userId);
  return res.status(200).json({
    success: true,
    userDetails,
    drillActiveStatus: drillday[0] !== undefined ? findFalseStatus(drillday[0].activeDay[0]) : [],
    drillDetails: runner(drill)
  });
});

exports.shipment = catchAsyncError(async (req, res, next) => {
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  const shipment = await ShipmentModel.findOne({ ClientId: new mongoose.Types.ObjectId(userId) });

  if (!shipment) {
    return next(new ErrorHandler("No shipment found", 400));
  }
  return res.status(200).json({
    success: true,
    shipment
  });

});

// ==========================APPOINTMENT STUFF =============================================>

exports.getUpcomingAppointments = catchAsyncError(async (req, res, next) => {
  const currentDateTime = new Date();
  const currentDate = currentDateTime.toISOString().split("T")[0];
  const currentTime = currentDateTime.toTimeString().split(" ")[0].slice(0, 5);
  console.log(currentDate);
  console.log(currentTime);
  const upcomingAppointments = await appointmentModel
    .find({
      app_date: currentDate, // Current date
      app_time: { $gte: currentTime }, // Time greater than or equal to current time
    })
    .select("app_date app_time -client");

  if (!upcomingAppointments) {
    return next(new ErrorHandler("No upcoming appointments found", 404));
  }

  res.status(200).json({ upcomingAppointments });
});
