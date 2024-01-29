const User = require("../model/user");
const Category = require("../model/categories");
const jwt = require("jsonwebtoken");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const Block = require("../model/block");
const RoleChange_Request = require("../model/roleChange")
const Recent_Activity = require("../model/activity")
const Report = require("../model/report");
const Account_Request = require('../model/requestAccount')

// Sign Up API

exports.signup = async (req, res) => {
  try {
    let { phone } = req.body;
    if (phone.toString().length > 10 || phone.toString().length < 10) {
      return res.status(422).json({
        status: "error",
        error: "Phone number must be 10 digit ",
      });
    }

    const phoneExist = await User.findOne({ phone }).populate('category', {category: 1, isactive: 1});
    if (phoneExist) {
      const token = jwt.sign(
        { _id: phoneExist._id },
        process.env.SECRET,
        { expiresIn: "365d" },
        { algorithm: "RS256" }
      );
      if(phoneExist.isactive == "Deactive"){
        const find = await Account_Request.findOne({userId: phoneExist.id})
        if(find){
          return res.status(200).json({
            status: "success",
            message: "You have already requested for create a new account with this number"
          });
        }
        const request = await Account_Request.create({userId: phoneExist.id})
        if(!request){
          return res.status(400).json({
            status: "error",
            error: "Your new account request not send"
          })
        }
        return res.status(200).json({
          status: "success",
          message: "Your new account request is send with this number"
        })
      }
      await User.findByIdAndUpdate(phoneExist._id, {token: token})
      return res.status(200).json({
        status: "success",
        message: 1,
        data: {
          token,
          user: phoneExist,
        },
      });
    } else {
      const createUser = new User({
        phone,
      });

      // save user

      const user = await createUser.save();

      const token = jwt.sign(
        { _id: user._id },
        process.env.SECRET,
        { expiresIn: "365d" },
        { algorithm: "RS256" }
      );
      await User.findByIdAndUpdate(user._id, {token: token})
      await Recent_Activity.create({
        role: "User",
        user: user.id,
        activity: "New User",
        message: "Someone create a new account"
      })
      return res.status(201).json({
        status: "success",
        message: 2,
        data: {
          token,
          user: user,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    });
  }
};

//Choose Vendor Or Customer
exports.choose = async (req, res) => {
  try {
    const { choice } = req.body;

    if (!choice) {
      return res.status(422).json({
        status: "error",
        error: "Enter Your Choice ",
      });
    }

    const role = {
      customer: choice.includes("customer"),
      vendor: choice.includes("vendor"),
    };
    if(role.customer === true && role.vendor === false){
      await User.findByIdAndUpdate(req.user._id, { role: role , current_role: "customer" },{new: true, runValidators: true});
    }else if(role.customer === false && role.vendor === true){
      await User.findByIdAndUpdate(req.user._id, { role: role , current_role: "vendor" }, {new: true, runValidators: true});
    }else{
      await User.findByIdAndUpdate(req.user._id, { role: role , current_role: "vendor" }, {new: true, runValidators: true});
    }
    const user = await User.findById(req.user.id);
    if(user.role){
      await Recent_Activity.create({
        role: "User",
        user: req.user._id,
        activity: "Update Role",
        message: `${req.user.name} update Role`
      })
      return res.status(200).json({
        status: "success",
        Message: "Success",
        user: user.role,
        current_role: user.current_role
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//* Switch User
exports.switchUser = async (req,res) => {
  try {
    const {current_role} = req.body
    const user = await User.findOneAndUpdate({_id: req.user._id , role: {customer: true, vendor: true} },
      { current_role: current_role},
      {new:true , runValidators: true})
      if(user){
        return res.status(200).json({
          status: "success",
          message: `User Role switch to ${user.current_role}`,
          current_role: user.current_role
        })
      }
      return res.status(304).json({
        status: "error",
        error: "This User has only one role"
      })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}

//Update User Details

exports.getdetailsUser = async (req, res) => {
  try {
    const folderPath = path.join(__dirname, "../");
    const { name, email, category, address, latitude, longitude} = req.body;
    if(email){
      const find_email = await User.findOne({_id : {$ne: req.user._id}, email: email})
      if(find_email){
        return res.json({
          status: "error",
          error: "Email already exit, Please enter new Email"
        })
      }
    }
    locations = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
    const imag = req.user.photo;
    await User.findByIdAndUpdate(req.user.id, {
      name: name,
      email: email,
      address: address,
      location: locations
    },{runValidators: true});
    
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
      await User.findByIdAndUpdate(req.user.id, {
        photo: req.file.path.replace(/\\/g, "/"),
      });
    }

    if (category) {
      if(req?.user?.vendor_chat.length !== 0){
        return res.status(400).json({
          status: "error",
          error: "You can't change the category if the customer joined"
        })
      }
      const cate = await Category.findOne({category})
      if(!cate){
        return res.status(404).json({
          status: "error",
          error: "Please Enter valid category"
        })
      }
      await User.findByIdAndUpdate(req.user.id, {
        category: cate.id
      });
    }
    const user = await User.findById(req.user.id).populate('category');
    await Recent_Activity.create({
      role: "User",
      user: req.user._id,
      activity: "Update Details",
      message: `${name} update details`
    })
    return res.status(200).json({
      status: "success",
      name: user.name,
      email: user.email,
      category: category ? {
        _id: user.category._id,
        category: user.category.category,
        isactive: user.category.isactive
      }: undefined,
      address: user.address,
      photo: user.photo,
      location: user.location
    });
  } catch (error) {
    if(error.code == 16755){
      return res.status(500).json({
        status: "error",
        error: "Please, Enter a valid location"
      })
    }
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//* Add card for Flutter
exports.addCard = async (req,res) => {
  try {
    if(!req.files){
      return res.status(400).json({
        status: "error",
        error: "Please, select image!"
      })
    }
    const folderPath = path.join(__dirname, "../");
    let cards = []
    if(req.files.frontsideCard && req.files.backsideCard){
      await req.user.card.map((file) =>
        fs.exists(folderPath + `${file}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${file}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        })
      );
      cards = [req.files.frontsideCard[0].path.replace(/\\/g, "/"), req.files.backsideCard[0].path.replace(/\\/g, "/")]
    }else if(req.files.frontsideCard){
      if(req.user.card[0]){
        fs.exists(folderPath + `${req.user.card[0]}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${req.user.card[0]}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
      cards = [req.files.frontsideCard[0].path.replace(/\\/g, "/"), req.user.card[1]]
    }else if(req.files.backsideCard){
      if(req.user.card[1]){
        fs.exists(folderPath + `${req.user.card[1]}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${req.user.card[1]}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
      cards = [req.user.card[0], req.files.backsideCard[0].path.replace(/\\/g, "/")]
    }

    const user = await User.findByIdAndUpdate(req.user.id, {
      card: cards
    },{new: true});

    await Recent_Activity.create({
      role: "User",
      user: req.user._id,
      activity: "Update details",
      message: `${req.user.name} update Vendor Cards`
    })

    return res.status(200).json({
      status: "success",
      data:{
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        card: user.card
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}

//Remove User
exports.removeUser = async (req, res) => {
  try {
    const user = req.user;
    await user.remove((err, user) => {
      if (err) {
        return res.status(422).json({
          status: "error",
          error: "User does not remove",
        });
      }
      res.status(200).json({ status: "success", user });
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//get All Users
exports.getAllUser = async (req, res) => {
  const Data = [];
  const { user } = req.body;
  if (user.includes("customer")) {
    try {
      const user = await User.find({
        "role.customer": true,
        _id: { $ne: req.user.id },
      }).populate('category', {category: 1, isactive: 1})
      if (user) {
        for await (const doc of user) {
          const blockUser = await Block.findOne({
            sender: req.user.id,
            receiver: doc._id,
          });
          if (!blockUser) {
            Data.push(doc);
          }
        }
      }
      return res.status(201).json({ status: "success", Data });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        error: error.message
      });
    }
  } else if (user.includes("vendor")) {
    try {
      const user = await User.find({
        "role.vendor": true,
        _id: { $ne: req.user.id },
      }).populate('category', {category: 1, isactive: 1})
      if (user) {
        for await (const doc of user) {
          const blockUser = await Block.findOne({
            sender: req.user.id,
            receiver: doc._id,
          });
          if (!blockUser) {
            Data.push(doc);
          }
        }
      }
      return res.status(201).json({ status: "success", Data });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        error: error.message
      });
    }
  } else if (user.includes("both")) {
    try {
      const user = await User.find({
        "role.customer": true,
        "role.vendor": true,
        _id: { $ne: req.user.id },
      }).populate('category', {category: 1, isactive: 1})
      if (user) {
        for await (const doc of user) {
          const blockUser = await Block.findOne({
            sender: req.user.id,
            receiver: doc._id,
          });
          if (!blockUser) {
            Data.push(doc);
          }
        }
      }
      return res.status(201).json({ status: "success", Data });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        error: error.message
      });
    }
  } else {
    return res.status(422).json({
      status: "error",
      error: "user not found",
    });
  }
};

//get only one user
exports.getUser = async (req, res) => {
  try {
    const { id } = req.body;
    const block = await Block.findOne({sender: req.user._id, receiver: id, user_type: req.user.current_role, receiver_type: req.user.current_role == "customer" ? "vendor" : "customer"})
    const user = await User.findById(id).populate('category',{category: 1, isactive:1});
    return res.status(200).json({ 
      status: "success", 
      is_block: block ? "1" : "0",
      user 
    }); 
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//Checking User ID
exports.getUserById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err) {
      res.status(422).json({
        status: "error",
        error: "Not Find User",
      });
    }
    req.user = user;
    next();
  });
};

//* Check Number is exit or not
exports.checkNumber = async (req, res) => {
  try {
    const { phone } = req.body
    const phoneExist = await User.findOne({phone:phone})
    if(phoneExist){
      return res.status(200).json({
        status: "success",
        message: 1
      })
    }
    return res.status(200).json({
      status: "success",
      message: 0
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}
//Change User Number
exports.changeNumber = async (req, res) => {
  try {
    const { phone } = req.body;
    if (phone.toString().length !== 10) {
      return res.status(422).json({
        status: "error",
        error: "Number must be 10 digit",
      });
    }
    if (req.user.phone == phone) {
      return res.status(422).json({
        status: "error",
        error: "You are login with same number",
      });
    }
    const users = await User.findByIdAndUpdate(req.user, { phone: phone }, {new: true});
    await Recent_Activity.create({
      role: "User",
      user: req.user._id,
      activity: "Update Number",
      message: `${req.user.name} change Number`
    })
    return res.status(200).json({
      status: "success",
      message: "Successfull",
      phone: users.phone,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//Take Vendor Address and Cards

exports.card = async (req, res) => {
  try {
    if(!req.files){
      return res.status(400).json({
        status: "error",
        error: "Please, select image!"
      })
    }
    const folderPath = path.join(__dirname, "../");
    const images = req.files.map((file) => file.path.replace(/\\/g, "/"));

    if (images.length > 0) {
      await req.user.card.map((file) =>
        fs.exists(folderPath + `${file}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${file}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        })
      );
    }
 
    const user = await User.findByIdAndUpdate(req.user.id, {
      card: images
    },{new: true});

    await Recent_Activity.create({
      role: "User",
      user: req.user._id,
      activity: "Update details",
      message: `${req.user.name} update Vendor Cards`
    })
    return res.status(200).json({
      status: "success",
      data:{
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        card: user.card
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

exports.nearLocation = async (req, res) => {
  try {
    const longitude = req.user.location.coordinates[0];
    const latitude = req.user.location.coordinates[1];
    const maxDistance = req.body.maxDistance;
    const rating = req.body.rating;

    const user = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          key: "location",
          query: { avgrating: rating, "role.vendor": true },
          maxDistance: maxDistance,
          distanceMultiplier: 0.001,
          distanceField: "dist.calculated",
          spherical: true,
        },
      },
      {$addFields: { Distance : { $round: [ "$dist.calculated", 1 ] } }},
      {$project: {dist: 0, __v: 0, fcm_token: 0, is_online: 0, notification: 0, vendor_chat: 0, customer_chat: 0}}
    ]);

    return res.status(200).json({ status: "success", user });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    });
  }
};

//Count How Many Total User
exports.count = async (req, res) => {
  try {
    const totaluser = await User.countDocuments({isactive: "Active"})
    const totalCustomer = await User.countDocuments({ "role.customer": true, "role.vendor": false })
    const totalVendor = await User.countDocuments({ "role.customer": false, "role.vendor": true })
    const totalCustomer_Vedor = await User.countDocuments({ "role.customer": true, "role.vendor": true })
    const totalRequest = await RoleChange_Request.countDocuments()
    const totalBlock = await Block.countDocuments()
    const totalReport = await Report.countDocuments()
    return res.status(200).json({
      status: true,
      User : totaluser,
      Customer : totalCustomer,
      Vendor : totalVendor,
      Customer_Vendor : totalCustomer_Vedor,
      totalReport: totalReport,
      totalRequest: totalRequest,
      totalBlock: totalBlock
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
};

exports.isactive = async (req, res) => {
  try {
    const active = req.body.isactive;
    req.user.isactive = active;

    req.user.save();
    const user = req.user;
    await Recent_Activity.create({
      role: "User",
      user: req.user._id,
      activity: "Update active status",
      message: `${req.user.name} update active status`
    })
    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

exports.isactiveCategory = async (req, res) => {
  try {
    await Category.find({ isactive: true})
    .then((data) => {
      return res.status(200).json({ status: "success", data });
    })
    .catch((error) => {
      return res.status(500).json({
        status: "error",
        error: error.message
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

exports.isdeactiveCategory = async (req, res) => {
  try {
    await Category.find({ isactive: false})
    .then((data) => {
      return res.status(200).json({ status: "success", data });
    })
    .catch((error) => {
      return res.status(500).json({
        status: "error",
        error: error.message,
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

exports.catesearch = async (req, res) => {
  try {
    const { find } = req.body;
    const user = await User.find({ category: find, _id: { $ne: req.user.id } });

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};


exports.roleChangeRequest = async (req,res) => {
  try {
    const {role} = req.body
    if(role == undefined || role == ""){
      return res.status(400).json({
        status: "error",
        error: "Request role is required!"
      })
    }
    if(req.user.role.customer == true && req.user.role.vendor == true){
      return res.status(422).json({
        status: "error",
        error: "User was already Customer and Vendor",
      });
    }
    const find = await RoleChange_Request.findOne({ userId: req.user._id })
    if(find){
      return res.status(422).json({
        status: "error",
        error: "You have already requested",
      });
    }
    const request = await RoleChange_Request.create({
      userId: req.user._id,
      role: role
    })
    await Recent_Activity.create({
      role: "User",
      user: req.user._id,
      activity: "Role",
      message: `${req.user.name} send request for become a ${role}`
    })
    return res.status(201).json({
      status: "success",
      request
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    });
  }
}

//* Delete User Account
exports.deleteUser = async (req,res)=>{
  try {
    const {reason} = req.body
    async function DeleteAccount(id,customer,vendor,current_role,isactive,reason_customer,reason_vendor){
      return await User.findByIdAndUpdate(id,
        {
          role: {customer: customer, vendor: vendor}, current_role: current_role, isactive: isactive, reason:{customer:reason_customer, vendor:reason_vendor}
        }, {new: true, runValidators: true})
    }
    async function recent_activity(id,name,role){
      return await Recent_Activity.create({
        role: "User",
        user: id,
        activity: "Delete Account",
        message: `${name} delete its ${role} Account`
      })
    }
    function response(role){
      return res.status(200).json({
        status: "success",
        message: `Your ${role} account delete successfully`
      })
    }
    if(req.user.current_role == "customer" && req.user.role.vendor == true){
      DeleteAccount(req.user._id,false,true,"vendor","Active",reason,req.user.reason.vendor)
        recent_activity(req.user._id, req.user.name, req.user.current_role)
        return response(req.user.current_role)
    }else if(req.user.current_role == "customer" && req.user.role.vendor == false){
      DeleteAccount(req.user._id,false,false,"customer","Deactive",reason,req.user.reason.vendor)
        recent_activity(req.user._id, req.user.name, req.user.current_role)
        return response(req.user.current_role)
    }else if(req.user.current_role == "vendor" && req.user.role.customer == true){
      DeleteAccount(req.user._id,true,false,"customer","Active",req.user.reason.customer,reason)
        recent_activity(req.user._id, req.user.name, req.user.current_role)
        return response(req.user.current_role)
    }else if(req.user.current_role == "vendor" && req.user.role.customer == false){
      DeleteAccount(req.user._id,false,false,"vendor","Deactive",req.user.reason.customer,reason)
        recent_activity(req.user._id, req.user.name, req.user.current_role)
        return response(req.user.current_role)
    }else{
      return res.status(500).json({ status: "error", error: "something went wrong" });
    }
  } catch (error) {
    return res.status(500).json({ status: "error", error: error.message });
  }
}

//* Logout User
exports.logoutUser = async (req,res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, {fcm_token: "" , token: ""},{new: true})
    if(!user){
      return res.status(404).json({
        status: "error",
        error: "Not find a user",
        user
      })
    }
    return res.status(200).json({
      status: "success",
      user
    })
  } catch (error) {
    return res.status(500).json({ status: "error", error: error.message });
  }
}