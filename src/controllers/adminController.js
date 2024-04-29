const userModel = require("../models/userModel");
const clinicModel = require("../models/clinicModel");
const appointmentModel = require("../models/appointmentModel");
const slotModel = require("../models/slotModel");
const fs = require("fs");
const { newAccount } = require("../utils/mails");
const path = require("path");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const baseSchemaPathEval = path.resolve(
  __dirname,
  "../models/evaluationModel.js",
);
const baseSchemaPathPres = path.resolve(
  __dirname,
  "../models/prescriptionModel.js",
);
const PrescriptionModel = require("../models/prescriptionModel");
const EvaluationModel = require("../models/evaluationModel");
const ServiceTypeModel = require("../models/ServiceTypeModel");
const PlanModel = require("../models/planModel");
const EvalForm = require("../models/FormModel");
const DrillModel = require("../models/DrillModel");

const EvalationModel = require("../models/EvaluationForms");
const DiagnosisForm = require("../models/DiagnosisForm");
const PrescriptionForm = require("../models/PrescriptionForm");

const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    user,
    token,
  });
};

function generateDateRange(startDate, endDate) {
  let dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function toCamelCase(inputString) {
  return inputString
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

exports.registerDoctor = catchAsyncError(async (req, res, next) => {
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
    password,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !startTime ||
    !endTime
  ) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  let user = await userModel.findOne({ email });

  if (user)
    return next(new ErrorHandler("User already exists with this email", 400));
  if (password.length < 8)
    return next(
      new ErrorHandler("Password should have minimum 8 characters", 400),
    );

  user = await userModel.create({
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
    password,
    role: "doctor",
  });
  newAccount(email, `${firstName}${lastName}`, password);
  await user.save();
  const users = await userModel.find({ role: ["doctor", "athlete"] });
  res.status(200).json({
    success: true,
    users,
    message: "Doctor added successfully",
  });
});

exports.registerAthlete = catchAsyncError(async (req, res, next) => {
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

  if (
    !firstName ||
    !lastName ||
    !suffix ||
    !address ||
    !email ||
    !city ||
    !phone ||
    !state ||
    !dob ||
    !gender ||
    !zip
  ) {
    return next(new ErrorHandler("Please enter all the fields", 400));
  }

  let user = await userModel.findOne({ email });
  if (user)
    return next(new ErrorHandler("User already exists with this email", 400));
  if (password.length < 8)
    return next(
      new ErrorHandler("Password should have minimum 8 characters", 400),
    );

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
  const users = await userModel.find({ role: ["doctor", "athlete"] });
  res.status(200).json({
    success: true,
    users,
    message: "Athlete added successfully",
  });
});

exports.registerClinic = catchAsyncError(async (req, res, next) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  let clinic = await clinicModel.findOne({ name });

  if (clinic)
    return next(new ErrorHandler("Clinic already exists with this name", 400));

  clinic = await clinicModel.create({
    name,
    address,
  });

  const clinics = await clinicModel.find();

  await clinic.save();
  res.status(200).json({
    success: true,
    data: clinics,
    message: `${name} is added`,
  });
});

exports.registerAdmin = catchAsyncError(async (req, res, next) => {
  const { fullname, email, password, validator } = req.body;
  if (validator != "ares") {
    return next(new ErrorHandler("Unauthorized!", 400));
  }
  if (!fullname || !email || !password) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  let user = await userModel.findOne({ email });

  if (user)
    return next(new ErrorHandler("User already exists with this email", 400));
  if (password.length < 8)
    return next(
      new ErrorHandler("Password should have minimum 8 characters", 400),
    );

  user = await userModel.create({
    fullname,
    email,
    password,
    role: "admin",
  });

  await user.save();

  user.password = undefined;
  sendData(user, 200, res);
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  if (user.role !== "admin")
    return next(new ErrorHandler("Unauthorized user login.", 401));

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  user.password = undefined;
  sendData(user, 200, res);
});

exports.evaluationFormMake = catchAsyncError(async (req, res, next) => {
  const { fieldName, values } = req.body;
  if (!fieldName) {
    return next(new ErrorHandler("Enter field Name", 400));
  }
  try {
    const existingSchemaCode = fs.readFileSync(baseSchemaPathEval, "utf-8");

    const updatedSchemaCode = existingSchemaCode.replace(
      /const evaluationSchema = new mongoose\.Schema\({/,
      `const evaluationSchema = new mongoose.Schema({
                ${toCamelCase(fieldName)}:{
                    type:String,
                    required: [true, "Required"],
                    ${values ? `enum: ${JSON.stringify(values)}` : ""}
                }, `,
    );
    fs.writeFileSync(baseSchemaPathEval, updatedSchemaCode, "utf-8");
    EvaluationModel.schema.add(
      values
        ? {
          [toCamelCase(fieldName)]: {
            type: String,
            required: [true, "Required"],
            enum: values,
          },
        }
        : {
          [toCamelCase(fieldName)]: {
            type: String,
            required: [true, "Required"],
          },
        },
    );
    res.status(200).json({
      success: true,
      message: `Schema updated successfully.`,
    });
  } catch (err) {
    return next(new ErrorHandler(err, 400));
  }
});

exports.prescriptionFormMake = catchAsyncError(async (req, res, next) => {
  const { fieldName, values } = req.body;
  if (!fieldName) {
    return next(new ErrorHandler("Enter field Name", 400));
  }
  try {
    const existingSchemaCode = fs.readFileSync(baseSchemaPathPres, "utf-8");

    const updatedSchemaCode = existingSchemaCode.replace(
      /const prescriptionSchema = new mongoose\.Schema\({/,
      `const prescriptionSchema = new mongoose.Schema({
                         ${toCamelCase(fieldName)}:{
                            type:String,
                            required: [true, "Required"],
                            ${values ? `enum: ${JSON.stringify(values)}` : ""}
                         }, `,
    );
    fs.writeFileSync(baseSchemaPathPres, updatedSchemaCode, "utf-8");
    PrescriptionModel.schema.add(
      values
        ? {
          [toCamelCase(fieldName)]: {
            type: String,
            required: [true, "Required"],
            enum: values,
          },
        }
        : {
          [toCamelCase(fieldName)]: {
            type: String,
            required: [true, "Required"],
          },
        },
    );
    res.status(200).json({
      success: true,
      message: `Schema updated successfully.`,
    });
  } catch (err) {
    return next(new ErrorHandler(err, 400));
  }
});

exports.getAllDoc = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const query = {};
  query.role = "doctor";
  const doctors = await userModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  const totalRecords = await userModel.countDocuments(query);
  res.json({
    data: doctors,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.getAllClinics = catchAsyncError(async (req, res) => {
  const clinics = await clinicModel.find();
  res.status(200).json({
    data: clinics,
  });
});

exports.addSlot = catchAsyncError(async (req, res, next) => {
  let { startDate, endDate, doctor, address, startTime, endTime } = req.body;
  let cdate = startDate.split('/')[0].length;

  let stimeF = startTime.split(':')[0].length;
  let stimeS = startTime.split(':')[1].length;

  let etimeF = endTime.split(':')[0].length;
  let etimeS = endTime.split(':')[1].length;

  if (stimeF === 1) {
    startTime = `0${startTime.split(':')[0]}:${startTime.split(':')[1]}`;
  }
  if (stimeS === 1) {
    startTime = `${startTime.split(':')[0]}:0${startTime.split(':')[1]}`;
  }
  if (etimeF === 1) {
    endTime = `0${endTime.split(':')[0]}:${endTime.split(':')[1]}`;
  }
  if (etimeS === 1) {
    endTime = `${endTime.split(':')[0]}:0${endTime.split(':')[1]}`;
  }
  if (cdate === 1) {
    startDate = `0${startDate}`;
    endDate = `0${endDate}`;
  }
  const [day, month, year] = startDate.split("/");
  const formattedDate = new Date(
    `${year}-${month < 10 && "0"}${month}-${day}T00:00:00.000Z`.toString(),
  );
  formattedDate.setUTCHours(0);
  formattedDate.setUTCMinutes(0);
  formattedDate.setUTCSeconds(0);
  formattedDate.setUTCMilliseconds(0);
  let slot;
  if (!startDate || !doctor || !address)
    return next(new ErrorHandler("Please fill all fields", 400));

  const availablecheck = await slotModel.find({
    date: formattedDate,
    doctor,
    address
  });
  if (availablecheck.length > 0) {
    return next(new ErrorHandler("Already created a slot", 400));
  }
  if (startDate === endDate) {
    slot = await slotModel.create({
      date: formattedDate,
      doctor,
      address,
      startTime,
      endTime,
    });
    slot.save();
    res.status(200).json({
      slots: slot,
      message: "Added successfully",
    });
  } else {
    let slots = [];
    const [day, month, year] = startDate.split("/");
    const [day1, month1, year1] = endDate.split("/");
    let startDates = new Date(year, month + 1, day);
    let endDates = new Date(year1, month1 + 1, day1);
    let dateRange = generateDateRange(startDates, endDates);
    dateRange.map(async (date, index) => {
      slot = await slotModel.create({
        date,
        doctor,
        address,
        startTime,
        endTime,
      });
      slot.save();
      slots.push({ [`${index + 1}`]: slot });
    });
    res.status(200).json({
      slots,
      message: "Added successfully",
    });
  }
});

exports.getAllSlots = catchAsyncError(async (req, res) => {
  const { date } = req.query;
  const filter = {};

  if (date) {
    const formattedDate = new Date(date);
    formattedDate.setUTCHours(0);
    formattedDate.setUTCMinutes(0);
    formattedDate.setUTCSeconds(0);
    formattedDate.setUTCMilliseconds(0);
    const endDate = new Date(formattedDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0);
    endDate.setMinutes(0);
    filter.date = { $gte: formattedDate, $lt: endDate };
  }

  const slots = await slotModel.find(filter).sort("desc");
  res.status(200).json({
    data: slots,
  });
});

exports.delDoc = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;

  try {
    const deletedUser = await userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      return next(new ErrorHandler("User not found!", 404));
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    return next(error);
  }
});

exports.delUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;
  try {
    const deletedUser = await userModel.findByIdAndDelete(id);
    const allUser = await userModel.find({ role: ["doctor", "athlete"] });
    if (!deletedUser) {
      return next(new ErrorHandler("User not found!", 404));
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      users: allUser,
    });
  } catch (error) {
    return next(error);
  }
});

exports.editDoc = catchAsyncError(async (req, res, next) => {
  const formdata = req.body.formdata;
  const { id } = req.query;
  let user = await userModel.findById(id);
  if (!user)
    return next(new ErrorHandler("User does not exists", 400));

  if (fullname) user.fullname = fullname;

  await user.save();
  sendData(user, 200, res);
});

exports.addplan = catchAsyncError(async (req, res, next) => {
  const { name, phases } = req.body;

  if (!name || !phases) {
    return next(new ErrorHandler("All fields are required !", 400));
  }
  let plan = await PlanModel.find({ name: name });
  if (plan > 0) {
    return next(new ErrorHandler("Plan already created !", 400));
  }

  plan = await PlanModel.create({
    name,
    phases
  });
  plan.save();
  res.status(200).json({
    success: true,
    message: `Plan added successfully.`,
    plan,
  });
});

exports.addService = catchAsyncError(async (req, res, next) => {
  const { name, cost, duration } = req.body;

  if (!name || !cost || !duration) {
    return next(new ErrorHandler("All fields are required !", 400));
  }
  let plan = await ServiceTypeModel.find({ name: name });
  if (plan > 0) {
    return next(new ErrorHandler("Plan already created !", 400));
  }

  plan = await ServiceTypeModel.create({
    name,
    cost,
    duration,
  });
  plan.save();
  res.status(200).json({
    success: true,
    message: `Plan added successfully.`,
    plan,
  });
});

exports.editService = catchAsyncError(async (req, res, next) => {
  const { name, cost, duration } = req.body;
  const { id } = req.query;

  const plan = await ServiceTypeModel.findById(id);
  if (!plan) {
    return next(new ErrorHandler("Plan is not created yet!", 400));
  }

  if (name) {
    plan.name = name;
  }
  if (cost) {
    plan.cost = cost;
  }
  if (duration) {
    plan.duration = duration;
  }

  plan.save();
  res.status(200).json({
    success: true,
    message: `Plan updated successfully.`,
    plan,
  });
});

exports.getService = catchAsyncError(async (req, res, next) => {
  const plans = await ServiceTypeModel.find();
  res.status(200).json({
    success: true,
    plans,
  });
});

exports.delService = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;

  try {
    const deletedUser = await ServiceTypeModel.findByIdAndDelete(id);
    if (!deletedUser) {
      return next(new ErrorHandler("Not found!", 404));
    }
    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 8;
  const searchQuery = req.query.searchQuery;

  let query = { role: ["doctor", "athlete"] };
  if (searchQuery) {
    const regex = new RegExp(`^${searchQuery}`, "i");
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { first_name: regex },
      { last_name: regex },
      { email: regex },
      { role: regex },
    ];
  }
  const users = await userModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  const totalRecords = await userModel.countDocuments(query);

  res.json({
    users,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.activateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;
  let page = 1;
  const limit = 8;
  try {
    const activateUser = await userModel.findById(id);
    activateUser.isActive = !activateUser.isActive;
    await activateUser.save();
    if (!activateUser) {
      return next(new ErrorHandler("Not found!", 404));
    }
    const users = await userModel
      .find({ role: ["doctor", "athlete"] })
      .sort({ createdAt: "desc" })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalRecords = await userModel.countDocuments({
      role: ["doctor", "athlete"],
    });

    res.status(200).json({
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
      success: true,
      users: users,
      message: "Activated successfully",
    });
  } catch (error) {
    return next(error);
  }
});

exports.activateClinic = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;
  try {
    const activateClinic = await clinicModel.findById(id);
    activateClinic.isActive = !activateClinic.isActive;
    await activateClinic.save();
    if (!activateClinic) {
      return next(new ErrorHandler("Not found!", 404));
    }
    const clinics = await clinicModel.find();

    res.status(200).json({
      success: true,
      data: clinics,
      message: "Activated successfully",
    });
  } catch (error) {
    return next(error);
  }
});

exports.getBookingsByDoctor = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const status = req.query.status;
  const service_type = req.query.service_type;
  const date = req.query.date;
  const doctor = req.query.doctor;
  const type = req.query.type;
  let query = {};
  if (!doctor) {
    return next(new ErrorHandler("Doctor is required", 404));
  }
  if (doctor) {
    if (type === 'doctor') {
      query.doctor_trainer = doctor;
    }
  }

  if (status) {
    query = {
      ...query,
      status: status,
    };
  }
  if (service_type) {
    query = {
      ...query,
      service_type: { $in: service_type.split(",") },
    };
  }
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.app_date = {
      $gte: startDate.toISOString().split("T")[0],
      $lt: endDate.toISOString().split("T")[0],
    };
  }
  const appointments = await appointmentModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();
  const totalRecords = await appointmentModel.countDocuments(query);

  let fapp = appointments.filter((appoint) => appoint?.client?.role === 'athlete' || appoint.client === null)
  if (type === 'athlete') {
    fapp = appointments.filter((appoint) => (appoint?.client?.role === 'athlete' && appoint?.client?.firstName === doctor))
  }
  res.json({
    appointments: fapp,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.fetchForm = catchAsyncError(async (req, res, next) => {
  const name = req.query.name;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }


  const doc = await EvalForm.find({ name })

  if (!doc || doc.length < 1) {
    return res.status(400).json({ success: false, message: "Not found" });
  }
  res
    .status(200)
    .json({ success: true, message: "EvalForm", doc });
});

exports.saveForm = catchAsyncError(async (req, res, next) => {
  const name = req.body.name;
  const obj = req.body.obj;

  try {
    let doc = await EvalForm.findOne({ name });
    if (!doc) {
      doc = new EvalForm({ name, obj });
      await doc.save();
      res.status(200).json({ success: true, message: "saved successfully" });
    } else {
      doc.name = name;
      doc.obj = obj;
      await doc.save();
      res.status(200).json({ success: true, message: "updated successfully" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save EvalForm" });
  }
});

exports.createDrillForm = catchAsyncError(async (req, res, next) => {
  const formdata = req.body.formdata;

  if (!formdata) {
    return next(new ErrorHandler("Empty field", 404))
  }
  const form = DrillModel.find({
    plan: formdata.plan,
    phase: formdata.phase,
    day: formdata.day,
    week: formdata.week
  });
  if (form.length < 1)
    return next(new ErrorHandler("Already created", 404))

  const formNew = await DrillModel.create({
    plan: formdata.plan,
    phase: formdata.phase,
    day: formdata.day,
    week: formdata.week,
    activities: formdata.activities,
  });

  formNew.save();

  res.status(200).json({
    success: true,
    message: `Form added successfully.`,
    formNew,
  });
});

exports.getPlan = catchAsyncError(async (req, res, next) => {

  const plans = await PlanModel.find();
  res.status(200).json({
    success: true,
    plans
  })

});

exports.updatePlan = catchAsyncError(async (req, res, next) => {
  const planId = req.query.planId;
  const data = req.body.data;

  const plan = await PlanModel.findByIdAndUpdate(planId, data);
  if (!plan) {
    return next(new ErrorHandler("Plan not found or updated", 400));
  } else {
    const plans = await PlanModel.find();
    res.status(200).json({
      success: true,
      plans
    })
  }


});

exports.updateUser = catchAsyncError(async (req, res, next) => {
  const id = req.query.id;
  const formdata = req.body;
  const user = await userModel.findByIdAndUpdate(id, formdata);
  if (!user) {
    return next(new ErrorHandler("Plan not found or updated", 400));
  } else {
    res.status(200).json({
      success: true,
      user
    })
  }
});

exports.getForms = catchAsyncError(async (req, res, next) => {

  const appointmentId = req.query.appointmentId;
  console.log(appointmentId);
  if (!appointmentId) {
    return next(new ErrorHandler(" appointmentId not received ", 404))
  }

  const evalForm = await EvalationModel.findOne({ appointmentId: appointmentId });
  const diagForm = await DiagnosisForm.findOne({ appointmentId: appointmentId });
  const presForm = await PrescriptionForm.findOne({ appointmentId: appointmentId });

  res.status(200).json({
    success: true,
    evalForm,
    diagForm,
    presForm
  })

});

exports.delSlot = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;
  try {
    const deletedSlot = await slotModel.findByIdAndDelete(id);
    if (!deletedSlot) {
      return next(new ErrorHandler("Not found!", 404));
    }
    res.status(200).json({
      success: true,
      message: "Slot deleted successfully",
      data: deletedSlot,
    });
  } catch (error) {
    return next(error);
  }
});

exports.getDrillDetails = catchAsyncError(async (req, res, next) => {
  const { plan } = req.query;
  //  complete percentage
  console.log(plan);

  if (!plan) {
    res.status(404).json({
      success: false,
      message: "Send plan parameter"
    })
  }

  // const drill = await DrillModel.find({ plan });
  const drill = await DrillModel.aggregate([
    {
      $match: {
        plan: { $regex: new RegExp(plan, 'i') },
      }
    },
    {
      $group: {
        _id: { week: "$week" },
        week: { $first: "$week" },
        drills: { $push: "$$ROOT" }
      }
    },
    {
      $group: {
        _id: null,
        totalWeeks: { $sum: 1 },
        weeks: { $push: "$$ROOT" }
      }
    }
  ]);

  if (!drill) {
    res.status(404).json({
      success: false,
      message: "Plan not found"
    })
  }

  res.status(200).json({
    success: true,
    drill: drill
  })

});