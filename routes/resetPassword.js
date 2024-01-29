const express = require("express");
const { sendEmail, matchotp, resetPassword } = require("../controllers/resetPassword");
const router = express.Router();

//* Send OTP in Email
router.post("/sendEmail", sendEmail)

//* Verify OTP
router.post("/verifyOTP", matchotp)

//* Reset Password
router.patch("/resetpassword/:id", resetPassword);

module.exports =router