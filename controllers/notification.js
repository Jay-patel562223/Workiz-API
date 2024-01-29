const User = require("../model/user");
const Recent_Activity = require("../model/activity")
const Notification = require('../model/notification')
const fetch = require("node-fetch")
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env" });

//* send perticular Device
exports.sendToDevice = async (req, res) => {
  try {
    const { token } = req.body;
    var notification = {
      'title': "Workiz Notification",
      'body': "Subtitle",
    };

    var fcm_token = [`${token}`];

    var notification_body = {
      'notification': notification,
      'registration_ids': fcm_token,
    };

    fetch('https://fcm.googleapis.com/fcm/send', {
      'method': "POST",
      'headers': {
        'Authorization': "key=" + process.env.NOTIFICATION_KEY,
        'Content-Type': "application/json",
      },
      body: JSON.stringify(notification_body),
    })
      .then(() => {
        res.status(201).json({
          status: "success",
          message: "Notification send successfully",
        });
      })
      .catch((err) => {
        res.status(400).json({
          status: "error",
          error: err.message,
        });
      });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    });
  }
};

//* Send to All Device
exports.sendToAllDevice = async (req, res) => {
  try {
    var fcm_token = []
    const users = await User.find({isactive: "Active", notification: 'on'})
    for await(const token of users){
      if(token.fcm_token.length > 2){
        fcm_token.push(token.fcm_token)
      }
    }
    const {title, body} = req.body
    var notification = {
      'title': title,
      'body': body,
      'image': req.file ? process.env.APP_URL + `/${req.file.path.replace(/\\/g, "/")}` : ""
    };

    var notification_body = {
      'data' : {
        'type': 2,
        'title': title,
        'body': body,
        'image': req.file ? process.env.APP_URL+`/${req.file.path.replace(/\\/g, "/")}` : '',
      },
      'registration_ids': fcm_token,
    };

    fetch('https://fcm.googleapis.com/fcm/send', {
      'method': "POST",
      'headers': {
        'Authorization': "key=" + process.env.NOTIFICATION_KEY,
        'Content-Type': "application/json",
      },
      'body': JSON.stringify(notification_body),
    })
      .then(async () => {
        const notification = await Notification.create({
          title: title,
          body: body,
          image: req.file ? process.env.APP_URL+`/${req.file.path.replace(/\\/g, "/")}` : ""
        })
        res.status(200).json({
          status: true,
          message: "Notification send successfully",
          notification
        });
      })
      .catch((err) => {
        res.status(400).json({
          status: true,
          error: err.message,
        });
      });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
};

//* Update Fcm Token
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    const fcmtoken = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          fcm_token: fcm_token,
        }
      },
      {
        new: true,
      }
    );
    if (fcmtoken) {
      return res.status(200).json({
        status: "success",
        message: "FCM Token update successfully",
      });
    }
    return res.status(304).json({
      status: "error",
      error: "FCM Token Not Update!",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
};

//* Notification On-Off
exports.notification = async (req,res) => {
  try {
    const {button} = req.body
    const user = await User.findByIdAndUpdate(req.user._id, {
      notification: button
    },{
      new: true,
      runValidators: true
    })
    return res.status(200).json({
      status: "success",
      user : {
        id: user.id,
        name: user.name,
        notification: `Notification ${user.notification}`
      }
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    }); 
  }
}

//* Get List of Notification for User
exports.getUserNotification = async (req,res)=>{
  try {
    const notification = await Notification.find().sort({createdAt: -1})
    return res.status(200).json({
      status: "success",
      notification
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}

//* Get List of Notification for Admin
exports.getNotification = async (req,res)=>{
  try {
    const notification = await Notification.find().sort({createdAt: -1})
    return res.status(200).json({
      status: true,
      notification
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Delete Notification
exports.deleteNotification = async (req,res) => {
  try {
    const folderPath = path.join(__dirname, "../")
    const {id} = req.params
    const notification = await Notification.findByIdAndDelete(id)
    if(!(notification.image == '')){
      fs.exists(folderPath + `${notification.image}`, (f) => {
        if (f) {
          fs.unlink(folderPath + `${notification.image}`, (err) => {
            if (err) {
             return res.status(422).json("Something went to wrong");
            }
            // console.log("Delete Successfully");
          });
        }
      });
    }
    return res.status(200).json({
      status: true,
      message: "Notification delete successfully"
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* On-Off notification for Personal User
exports.personalUser = async(req,res)=>{
  try {
    const {to, button} = req.body
    if(button == 'off'){
      const user = await User.updateOne(
        { _id: req.user._id, user_notification_off: { $nin: to } },
        { $push: { user_notification_off: { $each: [to] } } }
      );
      if(user.modifiedCount == 0){
        return res.status(200).json({
          status: "success",
          message: "Notification for this user is already off"
        })
      }
      return res.status(200).json({
        status: "success",
        message: "Notification for this user is off"
      })
    }else{
      const user = await User.updateOne(
        { _id: req.user._id, user_notification_off: { $in: to } },
        { $pull:{user_notification_off:{$in : to}} }
      )
      if(user.modifiedCount == 0){
        return res.status(200).json({
          status: "success",
          message: "Notification for this user is already on"
        })
      }
      return res.status(200).json({
        status: "success",
        message: "Notification for this user is on"
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Uploads is the Upload_folder_name
    cb(null, "profile/notification");
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