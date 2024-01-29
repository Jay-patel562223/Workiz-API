const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    trim: true,
    unique: true,
    required: true,
  },
  isactive: {
    type: Boolean,
    default: true
  },
},{
  timestamps: true
});

module.exports = mongoose.model("Category", categorySchema);
