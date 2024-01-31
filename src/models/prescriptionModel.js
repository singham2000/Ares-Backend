const mongoose = require('mongoose')

const prescriptionSchema = new mongoose.Schema({
                         fieldRTwo:{
                            type:String,
                            required: [true, "Required"],
                            enum: []
                         }, 
                         field2:{
                            type:String,
                            required: [true, "Required"],
                            enum: []
                         }, 
                         handle:{
                            type:String,
                            required: [true, "Required"],
                            enum: []
                         }, 
                         handle:{
                            type:String,
                            required: [true, "Required"],
                            enum: []
                         }, 
                         fieldTest:{
                            type:String,
                            required: [true, "Required"],
                            enum: []
                         }, 
                         firstField:{
                            type:String,
                            required: [true, "Required"],
                            enum: ["test1"]
                         }, 
                         firstField:{
                            type:String,
                            required: [true, "Required"],
                            enum: ["test1"]
                         }, 

})
module.exports = mongoose.model('prescription', prescriptionSchema)
