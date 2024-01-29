const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
// const { expressjwt: Jwt } = require("express-jwt");

//model declaration
const adminSign = require("../model/adminpanelsignin");
const User = require("../model/user");
const Category = require("../model/categories");
const Block = require("../model/block");
const Message = require("../model/message");
const Rating = require("../model/rating");
const Report = require("../model/report");
const RoleChange_Request = require("../model/roleChange")
const Faqs = require("../model/faqs");
const FeedBack = require("../model/feedback");
const Recent_Activity = require("../model/activity")
const Account_Request = require('../model/requestAccount')

//admin signup page
exports.adminsignup = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (errors.array().length > 0) {
      return res.status(422).json({ error: errors.array()[0].msg });
    }

    const { name, email, phone, password } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(422).json({
        status: false,
        message: "please provide required information",
      });
    }
    if (phone.toString().length > 10 || phone.toString().length < 10) {
      return res.status(422).json({
        status: false,
        Message: "Phone number must be 10 digit ",
      });
    }
    const phoneExist = await adminSign.findOne({ phone });
    if (phoneExist) {
      return res.status(422).json({
        status: false,
        message: "Admin already registered with this phone number, Try another phone number.",
      });
    }
    // const plainpassword = password.toString();
    const hash_password = await bcrypt.hash(password, 10);

    const userData = { name, phone, email, password: hash_password };
    const user = await adminSign.findOne({ email });
    if (user) {
      return res.status(422).json({
        status: false,
        message: "Admin already registered with this email id, Try another email id.",
      });
    } else {
      adminSign.create(userData).then((data, err) => {
        if (err) {
          return res.status(422).json({ err });
        } else {
          res.status(201).json({
            status: true,
            Admin: userData
          }); // change here data : to message
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

//admin signin page
exports.adminsignin = async (req, res) => {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    return res
      .status(422)
      .json({ status: false, error: errors.array()[0].msg });
  }

  try {
    if (!req.body.name || !req.body.password) {
      res.status(422).json({
        status: false,
        message: "Please enter name and password",
      });
    }

    const user = await adminSign.findOne({ name: req.body.name });
    if (!user) {
      return res.status(422).json({
        status: false,
        message: "Please Enter currect name",
      });
    }
    if (user) {
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res
          .status(401)
          .send({ status: false, message: "please enter correct Password!" });
      }

      const token = jwt.sign(
        { _id: user._id },
        process.env.SECRET,
        { expiresIn: '2d' },
        { algorithm: "RS256" }
      );
      const { _id, name, email } = user;
      res.status(200).json({
        status: true,
        message: "Loging Successfully",
        user: { token, _id, name },
      });
    } else {
      res.status(422).json({
        status: false,
        message: "User Not Find",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message
    });
  }
};

//admin update password
exports.updatePassword = async (req, res) => {
  try {
    adminSign.findById(req.user.id, async (error, admin) => {
      if (error) {
        return res.status(401).json({
          status: false,
          error: "Not User Find",
        });
      }

      const { oldpassword, password } = req.body;
      var passwordIsValid = bcrypt.compareSync(oldpassword, req.user.password);

      if (!passwordIsValid) {
        return res
          .status(422)
          .send({ status: false, message: "Invalid Password!" });
      }

      const hash_password = await bcrypt.hashSync(password, 10);
      req.user.password = hash_password;
      res
        .status(200)
        .send({ status: true, message: "Password Updated Successfully" });
      req.user.save();
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

exports.theme = async (req, res) => {
  try {
    adminSign.findById(req.user.id, async (error, theme) => {
      if (error) {
        return res.status(422).json({
          status: false,
          error: "Error in theme",
        });
      }
      req.user.theme = req.body.theme;
      // const themes = theme;
      req.user.save();
      return res.status(200).json({
        status: true,
        message: "Change Theme",
        name: req.user.name,
        email: req.user.email,
        theme: req.user.theme,
        Id: req.user._id,
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
};

//* Get Admin Detail
exports.getAdmin = async (req, res) => {
  try {
    res.status(200).json({
      status: true,
      admin: {
        _id: req.user._id,
        photo: req.user.photo,
        name: req.user.name,
        email: req.user.email,
        theme: req.user.theme,
      },
    });
    // const admin = await adminSign.findById()
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

//* Get User Details
exports.getuser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id).populate('category', {_id: 1, category: 1, isactive: 1})
    if (user) {
      return res.status(200).json({
        status: true,
        user
      })
    }
    return res.status(204).json({
      status: false,
      error: "user not found!"
    })
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
}

//* Get Recent Activity
exports.recentActivity = async (req, res) => {
  try {
    await Recent_Activity.deleteMany({ createdAt: { $lte: new Date(new Date() - 1000 * 86400 * 1) } })
    const activity = await Recent_Activity.find().populate('user', { name: 1 }).populate('sender', { name: 1 }).populate('receiver', { name: 1 }).sort({ createdAt: -1 })
    return res.status(200).json({
      status: true,
      activity
    })
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
}

//* Update Admin Details
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, email } = req.body;
    const folderPath = path.join(__dirname, "../");
    const imag = req.user.photo;
    if (req.file) {
      if (imag.length > 0) {
        fs.exists(folderPath + `${imag}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${imag}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
      await adminSign.findByIdAndUpdate(id, {
        photo: req.file.path.replace(/\\/g, "/"),
      });
    }
    const updateadmin = await adminSign.findByIdAndUpdate(
      id,
      {
        name: name,
        email: email,
      },
      {
        new: true,
      }
    );
    res.status(200).json({
      status: true,
      admin: {
        _id: updateadmin.id,
        name: updateadmin.name,
        email: updateadmin.email,
        photo: updateadmin.photo,
      },
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

exports.getAlluser = async (req, res) => {
  try {
    const userArray = [];
    const user = await User.find({isactive: "Active"}).populate('category', { category: 1, isactive: 1 }).sort({ createdAt: -1 });
    for await (const doc of user) {
      var userTable = {
        _id: doc.id,
        photo: doc.photo,
        name: doc.name,
        phone: doc.phone,
        email: doc.email,
        address: doc.address,
        role: doc.role,
        isactive: doc.isactive,
        category: doc.category,
      };
      userArray.push(userTable);
      userTable = {};
    }
    return res.status(200).json({
      status: true,
      users: userArray,
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

//middlewares

exports.isSignedIn = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (token) {
    const tokens = token.split(" ")[1];
    jwt.verify(tokens, process.env.SECRET, async (err, data) => {
      if (err) {
        return res.status(401).json({
          status: false,
          error: "Please Enter Valid Token",
        });
      } else {
        const user = await User.findById(data._id);
        if (!user) {
          return res.status(401).json({
            status: false,
            error: "User Not Found",
          });
        }
        req.user = user;
        next();
      }
    });
  } else {
    return res.status(422).json({
      status: false,
      error: "Please Enter Token In Headers",
    });
  }
};

exports.isAdminSignedIn = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (token) {
    const tokens = token.split(" ")[1];
    jwt.verify(tokens, process.env.SECRET, async (err, data) => {
      if (err) {
        return res.status(401).json({
          status: false,
          error: "Please Enter Valid Token",
        });
      } else {
        const user = await adminSign.findById(data._id);
        if (!user) {
          return res.status(401).json({
            status: false,
            error: "User Not Found",
          });
        }
        req.user = user;
        next();
      }
    });
  } else {
    return res.status(422).json({
      status: false,
      error: "Please Enter Token In Headers",
    });
  }
};

exports.AdminByID = async (req, res, next, id) => {
  const admin = await adminSign.findById(id);
  if (!admin) {
    return res.status(422).json({
      error: "User Not Found",
    });
  }
  req.admin = admin;
  next();
};

//* Show Role Change Request List
exports.roleChangeRequestList = async (req, res) => {
  try {
    const count = await RoleChange_Request.countDocuments()
    const list = await RoleChange_Request.find().populate('userId', { name: 1, email: 1, phone: 1, current_role: 1,  }).sort({ createdAt: -1 })
    return res.status(200).json({
      status: true,
      total_request: count,
      list
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Update role
exports.updateRole = async (req, res) => {
  try {
    const { id, role } = req.body
    const find_req = await RoleChange_Request.findOne({ userId: id })
    if (!find_req) {
      return res.status(422).json({
        status: false,
        error: "This request already accepted"
      })
    }
    const user = await User.findById(id)
    if (user.isactive == "Deactive") {
      return res.status(422).json({
        status: false,
        error: "This user deleted his account"
      })
    }
    if (user.notification == "on") {
      const token = user.fcm_token
      var notification = {
        'title': "Role Change",
        'body': "Your role change request is approve"
      };
      var fcm_token = [`${token}`];
      var notification_body = {
        'data': {
          'type': 3,
          'title': 'Role Change',
          'body': 'Your role change request is approve',
          'userId': id,
        },
        'registration_ids': fcm_token,
      };
      const send = await fetch('https://fcm.googleapis.com/fcm/send', {
        'method': "POST",
        'headers': {
          'Authorization': "key=" + process.env.NOTIFICATION_KEY,
          'Content-Type': "application/json",
        },
        'body': JSON.stringify(notification_body)
      });
      if (!send) {
        return res.status(400).json({
          status: false,
          error: "Notification not Send",
        });
      }
    }
    if (role == 'customer') {
      await User.findByIdAndUpdate(id, {
        role: {
          customer: true,
          vendor: user.role.vendor
        }
      }, {
        new: true
      })
      await RoleChange_Request.findOneAndDelete({ userId: id })
      return res.status(200).json({
        status: true,
        mess: "User Role change request Approve"
      })
    }
    if (role == 'vendor') {
      await User.findByIdAndUpdate(id, {
        role: {
          customer: user.role.customer,
          vendor: true
        }
      }, {
        new: true
      })
      await RoleChange_Request.findOneAndDelete({ userId: id })
      return res.status(200).json({
        status: true,
        mess: "User Role change request Approve"
      })
    }
    return res.status(304).json({
      status: false,
      error: "Something went to wrong!"
    })
  }
  catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Get All Deactive Users
exports.getUsers = async(req,res)=>{
  try {
    const users = await User.find({isactive: "Deactive"}).sort({updatedAt: -1})
    if(users.length == 0){
      return res.status(204).json({
        status: true,
        users: "Users Not Found"
      })
    }
    return res.status(200).json({
      status: true,
      users
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Get All New Account request
exports.getAllrequest = async (req,res) => {
  try {
    const request = await Account_Request.find().populate('userId').sort({createdAt: -1})
    return res.status(200).json({
      status: true,
      request
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Accept User new Account request
exports.acceptRequest = async (req,res) => {
  try {
    const {id} = req.params
    const find = await Account_Request.findOne({userId: id})
    if(!find){
      return res.status(400).json({
        status: false,
        error: "This request is Alredy accepted"
      });
    }
    const folderPath = path.join(__dirname, "../")
    const user = await User.findByIdAndDelete(id)
    if(!user){
      return res.status(400).json({
        status: false,
        error: "user not found!"
      })
    }
    if (!(user.photo == '')) {
      fs.exists(folderPath + `${user.photo}`, (f) => {
        if (f) {
          fs.unlink(folderPath + `${user.photo}`, (err) => {
            if (err) {
              return res.status(422).json("Something went to wrong");
            }
            // console.log("Delete Successfully");
          });
        }
      });
    }
    if (user.card.length !== 0) {
      for await (const doc of user.card) {
        fs.exists(folderPath + `${doc}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${doc}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
    }

    if (user.customer_chat.length !== 0) {
      for await (const doc of user.customer_chat) {
        const userid = doc;
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { customer_chat: { $in: user.id } }
        })
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { vendor_chat: { $in: user.id } }
        })
      }
    }

    if (user.vendor_chat.length !== 0) {
      for await (const doc of user.vendor_chat) {
        const userid = doc;
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { customer_chat: { $in: user.id } }
        })
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { vendor_chat: { $in: user.id } }
        })
      }
    }

    const mess = await Message.find({ $or: [{ sender: id }, { receiver: id }] })
    for await (const doc of mess) {
      if (!(doc.file == '')) {
        fs.exists(folderPath + `${doc.file}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${doc.file}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong, for deleting files in file folder");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
    }
    await Block.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await Message.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await Rating.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await Report.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await FeedBack.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await RoleChange_Request.deleteMany({userId: id})

    if (user) {
      const token = user.fcm_token
      var notification = {
        'title': "New Account Request",
        'body': "Your new Account request is approve"
      };
      var fcm_token = [`${token}`];
      var notification_body = {
        'data': {
          'type': 4,
          'title': 'New Account Request',
          'body': 'Your new Account request is Approve',
          'userId': id,
        },
        'registration_ids': fcm_token,
      };
      const send = await fetch('https://fcm.googleapis.com/fcm/send', {
        'method': "POST",
        'headers': {
          'Authorization': "key=" + process.env.NOTIFICATION_KEY,
          'Content-Type': "application/json",
        },
        'body': JSON.stringify(notification_body)
      });
      if (!send) {
        return res.status(400).json({
          status: false,
          error: "Notification not Send",
        });
      }
      await User.create({phone: user.phone})
      await Account_Request.deleteOne({userId: id})
      return res.status(200).json({
        status: true,
        message: "User new Account Request Accept"
      })
    }
    return res.status(400).json({
      status: false,
      error: "user not found!"
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Reject user New Account Request
exports.rejectRequest = async (req,res) => {
  try {
    const {id} = req.params
    const find = await Account_Request.findOne({userId: id})
    if(!find){
      return res.status(400).json({
        status: false,
        error: "This request is Alredy Rejected"
      });
    }
    const user = await User.findById(id)
    if(!user){
      return res.status(400).json({
        status: false,
        error: "user not found!"
      })
    }
    await Account_Request.deleteOne({userId: id})
    const token = user.fcm_token
      var notification = {
        'title': "New Account Request",
        'body': "Your new Account request is Reject"
      };
      var fcm_token = [`${token}`];
      var notification_body = {
        'data': {
          'type': 5,
          'title': 'New Account Request',
          'body': 'Your new Account request is Reject',
          'userId': id,
        },
        'registration_ids': fcm_token,
      };
      const send = await fetch('https://fcm.googleapis.com/fcm/send', {
        'method': "POST",
        'headers': {
          'Authorization': "key=" + process.env.NOTIFICATION_KEY,
          'Content-Type': "application/json",
        },
        'body': JSON.stringify(notification_body)
      });
      if (!send) {
        return res.status(400).json({
          status: false,
          error: "Notification not Send",
        });
      }
      return res.status(200).json({
        status: true,
        message: "User new Account Request Reject"
      })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Delete Deactive Users
exports.deleteUser = async(req,res)=>{
  try {
    const { id } = req.params
    const folderPath = path.join(__dirname, "../")
    const user = await User.findByIdAndDelete(id)
    if(!user){
      return res.status(400).json({
        status: false,
        error: "user not found!"
      })
    }
    if (!(user.photo == '')) {
      fs.exists(folderPath + `${user.photo}`, (f) => {
        if (f) {
          fs.unlink(folderPath + `${user.photo}`, (err) => {
            if (err) {
              return res.status(422).json("Something went to wrong");
            }
            // console.log("Delete Successfully");
          });
        }
      });
    }
    if (user.card.length !== 0) {
      for await (const doc of user.card) {
        fs.exists(folderPath + `${doc}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${doc}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
    }

    if (user.customer_chat.length !== 0) {
      for await (const doc of user.customer_chat) {
        const userid = doc;
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { customer_chat: { $in: user.id } }
        })
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { vendor_chat: { $in: user.id } }
        })
      }
    }

    if (user.vendor_chat.length !== 0) {
      for await (const doc of user.vendor_chat) {
        const userid = doc;
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { customer_chat: { $in: user.id } }
        })
        await User.findByIdAndUpdate({ _id: userid }, {
          $pull: { vendor_chat: { $in: user.id } }
        })
      }
    }

    const mess = await Message.find({ $or: [{ sender: id }, { receiver: id }] })
    for await (const doc of mess) {
      if (!(doc.file == '')) {
        fs.exists(folderPath + `${doc.file}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${doc.file}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong, for deleting files in file folder");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
    }
    await Block.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await Message.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await Rating.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await Report.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await FeedBack.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    await RoleChange_Request.deleteMany({userId: id})

    if (user) {
      return res.status(200).json({
        status: true,
        message: "user delete successfully"
      })
    }
    return res.status(400).json({
      status: false,
      error: "user not found!"
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Uploads is the Upload_folder_name
    cb(null, "profile");
  },
  filename: function (req, file, cb) {
    const type = file.mimetype.split("/")[1];
    // console.log(type)
    cb(null, Date.now() + "." + type);
  },
});

exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 50000000, //byte
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
      return cb(new Error("Please upload a Image"));
    }
    cb(undefined, true);
  },
});