const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const roleEnum = ['admin', 'doctor', 'athlete'];

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,

  },
  lastName: {
    type: String,
    trim: true,

  },
  suffix: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,

    required: [true, "Email is required"],
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  city: {
    type: String,
    trim: true,

  },
  zip: {
    type: Number,
    trim: true,

  },
  phone: {
    type: Number,
    trim: true,
  },
  startTime: {
    type: String,
    trim: true,
  },
  endTime: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,

  },
  address: {
    type: String,
    trim: true,

  },
  age: {
    type: Number,

  },
  dob: {
    type: Date,

  },
  gender: {
    type: String,
    trim: true,

  },
  height: {
    type: String,
    trim: true,

  },
  dominatedHand: {
    type: String,
    trim: true,

  },
  guardianFirstName: {
    type: String,
    trim: true,

  },
  guardianLastName: {
    type: String,
    trim: true,

  },
  guardianSuffix: {
    type: String,
    trim: true,

  },
  organization: {
    type: String,
    trim: true,

  },
  password: {
    type: String,
    trim: true,
    required: [true, "Password is required"],
    minlength: [8, "Password should have minimum 8 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: roleEnum,
    default: "athlete",
  },
  temp_code: {
    type: String,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRE,
  });
};

module.exports = mongoose.model("User", userSchema);
