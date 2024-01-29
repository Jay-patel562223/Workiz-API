const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

var adminSignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: Number,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  password: {
    type: String,
  },

  photo: {
    type: String,
    default: "",
  },

  theme: {
    type: String,
    enum: ["Light", "Dark", "light", "dark"],
    default: "Light",
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("adminSign", adminSignSchema);
