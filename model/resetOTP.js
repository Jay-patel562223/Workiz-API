const mongoose = require("mongoose");

const resetOTPSchema = new mongoose.Schema(
  {
    userId :{
        type: String
    },
    otp:{
        type: String
    },
    createdAt: Date,
    expiresAt: Date
  }
);

module.exports = mongoose.model("ResetOTP", resetOTPSchema);
