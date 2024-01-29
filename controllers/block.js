const Block = require("../model/block");
const User = require("../model/user");
const Recent_Activity = require("../model/activity")

exports.block = async (req, res) => {
  try {
    const { to } = req.body;
    let receiver_role = ""
    if(req.user.current_role == "customer"){
      receiver_role = "vendor"
    }else{
      receiver_role = "customer"
    }
    const find = await User.findById(to)
    if (!(find.role.customer === true && find.role.vendor === true)) {
      if (find.role.customer === true && req.user.current_role == "customer") {
        return res.status(422).json({
          status: "error",
          error: "Can not block Customer to Customer"
        })
      }
      if (find.role.vendor === true && req.user.current_role == "vendor") {
        return res.status(422).json({
          status: "error",
          error: "Can not block Vendor to Vendor"
        })
      }
    }
    const findUser = await Block.findOne({
      sender: req.user._id,
      receiver: to,
      user_type: req.user.current_role,
      receiver_type: receiver_role
    });
    if (findUser) {
      return res.status(422).json({
        status: "error",
        error: "The user was already blocked",
      });
    }
  
    const user = await Block.create({
      sender: req.user._id,
      receiver: to,
      user_type: req.user.current_role,
      receiver_type: receiver_role
    });
  
    if (!user) {
      return res.status(422).json({
        status: "error",
        error: "Enter All Detailes",
      });
    }
    await Recent_Activity.create({
      role: "User",
      sender: req.user._id,
      receiver: to,
      activity: "Block",
      message: `${req.user.name} blocks ${find.name}`
    })
    return res.status(201).json({ status: "success", user }); 
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

exports.blockList = async (req, res) => {
  try {
    const count = await Block.countDocuments()
    const list = await Block.find().populate('sender', { name: 1, phone: 1 }).populate('receiver', { name: 1, phone:1 }).sort({ createdAt: -1 })
    return res.status(200).json({
      status: true,
      total_block: count,
      list
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

// Unblock from admin side
exports.unblock = async (req, res) => {
  try {
    const { sender, to, user_type } = req.body;
    let receiver_role = ""
    if(req.user.current_role == "customer"){
      receiver_role = "vendor"
    }else{
      receiver_role = "customer"
    }
    const find = await Block.findOne({ sender: sender, receiver: to, user_type: user_type, receiver_type: receiver_role }).populate('receiver', {name: 1})
    if (!find) {
      return res.status(422).json({
        status: false,
        error: "The user was already Unblocked",
      });
    }
    const user = await Block.deleteOne({
      sender: sender,
      receiver: to,
      user_type: user_type,
      receiver_type: receiver_role
    });

    if (!(user.deletedCount === 0)) {
      return res.status(200).json({
        status: true,
        Message: "The user is unblocked",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//Unblock from user side
exports.userUnblock = async (req, res) => {
  try {
    const { to } = req.body;
    let receiver_role = ""
    if(req.user.current_role == "customer"){
      receiver_role = "vendor"
    }else{
      receiver_role = "customer"
    }
    const find = await Block.findOne({ sender: req.user._id, receiver: to, user_type: req.user.current_role, receiver_type: receiver_role}).populate('receiver', {name: 1})
    if (!find) {
      return res.status(422).json({
        status: "error",
        error: "The user was already Unblocked",
      });
    }
    const user = await Block.deleteOne({
      sender: req.user._id,
      receiver: to,
      user_type: req.user.current_role,
      receiver_type: receiver_role
    });

    if (!(user.deletedCount === 0)) {
      await Recent_Activity.create({
        role: "User",
        sender: req.user._id,
        receiver: to,
        activity: "Unblock",
        message: `${req.user.name} Unblock ${find.receiver.name}`
      })
      return res.status(200).json({
        status: "success",
        Message: "The user is unblocked",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}