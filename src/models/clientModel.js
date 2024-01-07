const mongoose = require('mongoose');
const validator = require('validator');


first_name, last_name, suffix, birthday, gender, email, phone_number, address, city, state, zip


const clientScheme = new mongoose.Schema({

    first_name: {
        type: String,
        trim: true,
        required: [true, "Your first name is required"],
    },
    last_name: {
        type: String,
        trim: true,
        required: [true, "Your last name is required"],
    },
    suffix: {
        type: String,
        trim: true,
    },
    birthday: {
        type: Date,
        required: [true, "Your birthday is required"]
    },
    gender: {
        type: String,
        required: [true, "Your gender is required"],
    },
    email: {
        type: String,
        trim: true,
        required: [true, "Email is required"],
        unique: true,
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    phone_number: {
        type: String,
        required: [true, "Your phone number is required"],
    },
    address: {
        type: String,
        required: [true, "Your address is required"],
    },
    city: {
        type: String,
        required: [true, "Your city is required"],
    },
    state: {
        type: String,
        required: [true, "Your State is Required"]
    },
    zip_code: {
        type: String,
        required: [true, "Your zip code is required"],
    }
})

module.exports = mongoose.model("Client", clientScheme);