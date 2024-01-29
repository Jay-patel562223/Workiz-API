const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ResetOTP = require('../model/resetOTP')
const adminSign = require("../model/adminpanelsignin");

exports.sendEmail = async (req,res) => {
    try {
        const {email} = req.body
        const emailExist = await adminSign.findOne({email})
        if(!emailExist){
        return res.status(400).json({
            status: false,
            message: "This email ID is not register, Please enter a valid email ID"
        })
        }
        const otp = Math.floor(100000 + Math.random() * 900000)
        //* create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, //* true for 465, false for other ports
            auth: {
            user: process.env.MAIL_ID, //* generated ethereal user
            pass: process.env.MP, //* generated ethereal password
            },
        });
        //* send mail with defined transport object
        let info = await transporter.sendMail({
            from: `"Workiz " < ${process.env.MAIL_ID}>`, //* sender address
            to: email, //* list of receivers
            subject: "Verify Your Email", //* Subject line
            html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete your reset password process.</p>
                    <p>This code <b>expires in 10 minute</b>.</p>`, //* html body
        });
        const saltRound = 10
        const hashedOTP = await bcrypt.hash(`${otp}`, saltRound)
        await ResetOTP.deleteMany({userId: emailExist.id})
        const verifyOTP = await ResetOTP.create({
            userId: emailExist.id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 600000,
        })
        return res.status(200).json({
            status: true,
            message: `OTP is sent to ${email} email ID`,
            data: {
                userId: emailExist.id,
                email: emailExist.email
            }
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

exports.matchotp = async(req,res)=>{
    try {
       const { userId, otp} = req.body
       if(!userId || !otp){
            return res.status(400).json({
                status: false,
                message: "Empty otp details are not allowed"
            })
       }
       const findUser = await ResetOTP.findOne({userId})
       if(!findUser){
            return res.status(400).json({
                status: false,
                message: "OTP verified already or not sent to email. Please send OTP again!"
            })
       }
       const expiresAt = findUser.expiresAt
       const hashedOTP = findUser.otp
       if(expiresAt < Date.now()){
            await ResetOTP.deleteMany({userId})
            return res.status(401).json({
                status: false,
                message: "Code has expired, Please request again"
            })
       }else{
            const validOTP = await bcrypt.compare(otp, hashedOTP)
            if(!validOTP) {
                return res.status(401).json({
                    status: false,
                    message: "Invalid code, Please check your code"
                })
            }else{
                await ResetOTP.deleteMany({userId})
                return res.status(200).json({
                    status: true,
                    message: "User email verified successfully",
                    data: {
                        userId: userId
                    }
                })
            }
       }
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Reset Password
exports.resetPassword = async (req,res) => {
    try {
      const { id } = req.params
      const { password } = req.body;
      const hash_password = bcrypt.hashSync(password, 10);
      const reset_password = await adminSign.findByIdAndUpdate(id, {password : hash_password}, {new: true})
      if(!reset_password){
        return res.status(400).json({
          status: false,
          message: "Something went wrong, Please try again!"
        })
      }
      return res.status(200).json({
        status: true,
        message: "Password reset successfully.",
        admin: reset_password
      })
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message });
    }
  }