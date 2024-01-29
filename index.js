const express = require("express");
const mongoose = require("mongoose");
const app = express();
const socket = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: ".env" });
const User = require("./model/user");
const Block = require("./model/block")
const fetch = require("node-fetch");
const Message = require("./model/message");
const EventEmitter = require('events').EventEmitter
const myEmitter = new EventEmitter()
exports.emitter = myEmitter

//Routes allocation for adminpanel
const adminRoute = require("./routes/adminpanelsignin");
const categoryRoute = require("./routes/categories");
const privacyRoute = require("./routes/privacy")

//* Search
const searchRoute = require('./routes/search')

//Routes allocation for application
const userRoute = require("./routes/user");
const messageRoute = require("./routes/message");
const contactRoute = require("./routes/contact");
const termsRoute = require("./routes/terms");
const faqsRoute = require("./routes/faqs");
const feedbackRoute = require("./routes/feedback");
const ratingRoute = require("./routes/rating");
const blockRoute = require("./routes/block");
const reportRoute = require("./routes/report");
const notificationRoute = require("./routes/notification");
const appInfoRoute = require('./routes/appInfo')
const resetPasswordRoute = require('./routes/resetPassword')
const requestRoute = require('./routes/request')
const testRoute = require('./routes/test')
const reasonRoute = require('./routes/reason')

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/profile", express.static("profile"));

//routes
app.use("/admin", adminRoute);
app.use("/admin", resetPasswordRoute);
app.use("/", categoryRoute);
app.use("/", privacyRoute)
app.use("/", appInfoRoute)
app.use("/", reasonRoute)

//routes for application
app.use("/user", userRoute);
app.use("/user", messageRoute);
app.use("/user", requestRoute);
app.use("/", contactRoute);
app.use("/", termsRoute);
app.use("/", faqsRoute);
app.use("/", feedbackRoute);
app.use("/user", ratingRoute);
app.use("/user", blockRoute);
app.use("/user", reportRoute);
app.use("/notification", notificationRoute)

//* Search Router
app.use("/", searchRoute)

//* For Image test
app.use("/", testRoute)

//database connection
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connected");
  }).catch((error)=>{
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  })

app.get("/", (req, res) => {
  return res.status(200).send("Hello");
});

//port connection

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Port : ${port}`);
});

//start socket part for chat
const io = socket(server, {
  cors: {
    origin: process.env.APP_URL,
    credentials: true,
  },
});

global.onlineUsers = new Map();

//Request emit
myEmitter.on('request_event', function (data) {
  const receiverSocketId = onlineUsers.get(data.receiverId);
  io.to(receiverSocketId).emit("notification_event_vendor", data);
})

//Request accept or reject emit
myEmitter.on('action_event', function(data) {
  const receiverSocketId = onlineUsers.get(data.receiverId);
  io.to(receiverSocketId).emit("notification_event", data)
})

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", async (userId) => {
    await User.findByIdAndUpdate( userId, { is_online:'1'})
    onlineUsers.set(userId, socket.id);
    const Users = Array.from(onlineUsers.keys())
    io.emit("onlineUsers", Users)
  });

  socket.on("send-msg", async (data) => {
    const block = await Block.findOne({sender: data.to, receiver: data.from, user_type: data.current_role.toLowerCase() == "customer" ? "vendor" : "customer", receiver_type: data.current_role.toLowerCase()})
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket && !block) {
      socket.to(sendUserSocket).emit("msg-receive", data);
    }
    if(data.type == "text"){
      const sender = await User.findById(data.from)
      const receiver = await User.findById(data.to)
      if(sender.current_role == "customer"){
        await User.updateOne(
          { _id: sender._id, customer_chat: { $in: data.to } },
          { $pull:{customer_chat:{$in : data.to}} }
        )

        await User.updateOne(
          { _id: data.to, vendor_chat: { $in: sender._id.toString() } },
          { $pull: { vendor_chat: { $in : sender._id.toString() } } }
        )

        await User.updateOne(
          { _id: sender._id, customer_chat: { $nin: data.to } },
          { $push: { customer_chat: { $each: [data.to] , $position: 0 } } }
        );

        await User.updateOne(
          { _id: data.to, vendor_chat: { $nin: sender._id.toString() } },
          { $push: { vendor_chat: { $each: [sender._id.toString()] , $position: 0 } } }
        );
      }else{
        await User.updateOne(
          { _id: sender._id, vendor_chat: { $in: data.to } },
          { $pull:{vendor_chat:{$in : data.to}} }
        )

        await User.updateOne(
          { _id: data.to, customer_chat: { $in: sender._id.toString() } },
          { $pull: { customer_chat: { $in : sender._id.toString() } } }
        )

        await User.updateOne(
          { _id: sender._id, vendor_chat: { $nin: data.to } },
          { $push: { vendor_chat: { $each: [data.to] , $position: 0 } } }
        );

        await User.updateOne(
          { _id: data.to, customer_chat: { $nin: sender._id.toString() } },
          { $push: { customer_chat: { $each: [sender._id.toString()] , $position: 0 } } }
        );
      }
      await Message.create({
        message: { text: data.message },
        type: data.type,
        user_type: sender.current_role,
        sender: sender._id,
        receiver: data.to,
        is_block: block ? true : false
      });
      const notification_status = await User.findOne({_id: receiver._id, user_notification_off: {$in : data.from}})
      if (!block && !sendUserSocket && receiver.notification == "on" && !notification_status) {
        const token = receiver.fcm_token;
        var fcm_token = [`${token}`];
        var notification_body = {
          'data' : {
            'type': 1,
            'title': sender.name,
            'body':data.message,
            'image': '',
            'senderId': sender._id.toString(),
            'senderRole': sender.current_role
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
      }
    }
  });

  socket.on('disconnect', async function(){
    let userId = [...onlineUsers.entries()]
    .filter(({ 1: v }) => v === socket.id)
    .map(([k]) => k);
    await User.updateOne( {_id: userId[0]}, {$set:{ is_online:'0'}})
    await onlineUsers.delete(...userId)
    const Users = Array.from(onlineUsers.keys())
    io.emit("onlineUsers", Users)
  })
});
