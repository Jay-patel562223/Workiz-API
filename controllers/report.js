const Report = require("../model/report");
const Recent_Activity = require("../model/activity")
const User = require("../model/user");

exports.creatReport = async (req, res) => {
  try {
    const { to, reason, description } = req.body;
    if (!to || !reason) {
      return res.status(422).json({
        status: "error",
        error: "please Enter All Fields",
      });
    }
    const report = await Report.create({
      sender: req.user.id,
      receiver: to,
      user_type: req.user.current_role,
      receiver_type: req.user.current_role == "customer" ? "vendor" : "customer",
      reason: reason,
      description: description,
    });
    const find = await User.findById(to)
    await Recent_Activity.create({
      role: "User",
      sender: req.user._id,
      receiver: to,
      activity: "Report",
      message: `${req.user.name} reported to ${find.name}`
    })
    return res.status(201).json({
      status: "success",
      report,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
};

exports.getReport = async (req,res) => {
  try {
    const list = await Report.find().populate('sender', {name: 1, email: 1, phone: 1}).populate('receiver',{name: 1, email: 1, phone: 1}).sort({createdAt: -1})
    return res.status(200).json({
      status: true,
      list
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
}