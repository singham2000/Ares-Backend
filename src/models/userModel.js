const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const roleEnum = ['admin', 'doctor', 'athlete'];

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    default: '',
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    default: '',
    required: [true, "Email is required"],
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  state: {
    type: String,
    trim: true,
    default: '',
  },
  age: {
    type: Number,
    default: '',
  },
  dob: {
    type: Date,
    default: '',
  },
  gender: {
    type: String,
    trim: true,
    default: '',
  },
  height: {
    type: String,
    trim: true,
    default: '',
  },
  dominatedHand: {
    type: String,
    trim: true,
    default: '',
  },
  guardianFirstName: {
    type: String,
    trim: true,
    default: '',
  },
  guardianLastName: {
    type: String,
    trim: true,
    default: '',
  },
  guardianSuffix: {
    type: String,
    trim: true,
    default: '',
  },
  organization: {
    type: String,
    trim: true,
    default: '',
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
