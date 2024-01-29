const mongoose = require("mongoose");

const reasonSchema = new mongoose.Schema({
  reason: {
    type: String,
    trim: true,
    required: true,
  },
  type: {
    type: String,
    trim: true,
    required: true
  },
  isactive: {
    type: Boolean,
    default: true
  },
},{
  timestamps: true
});

module.exports = mongoose.model("Reason", reasonSchema);
