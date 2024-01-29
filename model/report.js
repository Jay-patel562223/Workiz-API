const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_type:{
      type:String,
      enum: ["customer", "vendor"],
    },
    receiver_type:{
      type:String,
      enum: ["customer", "vendor"],
    },
    reason: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
