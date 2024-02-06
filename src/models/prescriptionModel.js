const mongoose = require('mongoose')

const prescriptionSchema = new mongoose.Schema({
                         asdasdasd:{
                            type:String,
                            required: [true, "Required"],
                            enum: ["asd","asdasd"]
                         }, 
                         fieldUpdates:{
                            type:String,
                            required: [true, "Required"],
                            enum: ["1","2","3","4"]
                         }, 
                         handle:{
                            type:String,
                            required: [true, "Required"],
                            enum: ["1","3"]
                         }, 
   fieldAdded3: {
      type: String,
      required: [true, "Required"],
      enum: ["1", "2", "3", "4"]
   },
   fieldAdded2: {
      type: String,
      required: [true, "Required"],
      enum: ["1", "a"]
   },
   fieldAdded: {
      type: String,
      required: [true, "Required"],
      enum: ["1", "2", "3"]
   },
   fieldRTwo: {
      type: String,
      required: [true, "Required"],
      enum: []
   },
   field2: {
      type: String,
      required: [true, "Required"],
      enum: []
   },
   handle: {
      type: String,
      required: [true, "Required"],
      enum: []
   },
   fieldTest: {
      type: String,
      required: [true, "Required"],
      enum: []
   },
   firstField: {
      type: String,
      required: [true, "Required"],
      enum: ["test1"]
   },
})

module.exports = mongoose.model('prescription', prescriptionSchema)
