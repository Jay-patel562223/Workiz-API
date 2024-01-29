const Message = require("../model/message");
const User = require("../model/user");
const Block = require("../model/block");
const Category = require("../model/categories");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { ObjectId } = require("mongodb");

exports.addMessage = async (req, res) => {
  try {
    const folderPath = path.join(__dirname, "../")
    const { to, type, message } = req.body;
    const block = await Block.findOne({sender: to, receiver: req.user._id, user_type: req.user.current_role == "customer" ? "vendor" : "customer", receiver_type: req.user.current_role})
    const find = await User.findById(to);
    if (!find) {
      return res.status(422).json({
        status: "error",
        error: "Receiver is Not Found",
      });
    }
    if(!(find.role.customer === true && find.role.vendor === true)){
      if(find.role.customer === true && req.user.current_role == "customer"){
        return res.status(422).json({
          status: "error",
          error: "Can not send message from Customer to Customer"
        })
      }
      if(find.role.vendor === true && req.user.current_role == "vendor"){
        return res.status(422).json({
          status: "error",
          error: "Can not send message from Vendor to Vendor"
        })
      }
    }

    if (req.user.id.toString() === to) {
      return res.status(422).json({
        status: "error",
        error: "Same User",
      });
    }

    if(req.user.current_role == "customer"){
      await User.updateOne(
        { _id: req.user._id, customer_chat: { $in: to } },
        { $pull:{customer_chat:{$in : to}} }
      )

      await User.updateOne(
        { _id: to, vendor_chat: { $in: req.user._id.toString() } },
        { $pull: { vendor_chat: { $in : req.user._id.toString() } } }
      )

      await User.updateOne(
        { _id: req.user._id, customer_chat: { $nin: to } },
        { $push: { customer_chat: { $each: [to] , $position: 0 } } }
      );

      await User.updateOne(
        { _id: to, vendor_chat: { $nin: req.user._id.toString() } },
        { $push: { vendor_chat: { $each: [req.user._id.toString()] , $position: 0 } } }
      );
    }else{
      await User.updateOne(
        { _id: req.user._id, vendor_chat: { $in: to } },
        { $pull:{vendor_chat:{$in : to}} }
      )

      await User.updateOne(
        { _id: to, customer_chat: { $in: req.user._id.toString() } },
        { $pull: { customer_chat: { $in : req.user._id.toString() } } }
      )

      await User.updateOne(
        { _id: req.user._id, vendor_chat: { $nin: to } },
        { $push: { vendor_chat: { $each: [to] , $position: 0 } } }
      );

      await User.updateOne(
        { _id: to, customer_chat: { $nin: req.user._id.toString() } },
        { $push: { customer_chat: { $each: [req.user._id.toString()] , $position: 0 } } }
      );
    }

    const data = await Message.create({
      message: { text: message },
      type: type,
      user_type: req.user.current_role,
      sender: req.user._id,
      receiver: to,
      file: req.file ? req.file.path.replace(/\\/g, "/") : "",
      is_block: block ? true : false
    });
    const notification_status = await User.findOne({_id: to, user_notification_off: {$in : req.user._id}})
    if (data) {
      if (!block && find.is_online == "0" && find.notification == "on" && !notification_status) {
        const token = find.fcm_token;
        var notification = {
          'title': req.user.name,
          'body': message,
          'image': req.file ? folderPath + `${data.file}` : ''
        };
        var fcm_token = [`${token}`];
        var notification_body = {
          'data' : {
            'type': 1,
            'title': req.user.name,
            'body':message,
            'image': req.file ? process.env.APP_URL+`/${data.file}` : '',
            'senderId': req.user._id.toString(),
            'senderRole': req.user.current_role
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
            status: "error",
            error: "Notification not Send",
          });
        }
      }
      return res.status(201).json({
        status: "success",
        senderId: data.sender,
        ReceiverId: data.receiver,
        user_type: data.user_type,
        message: data.message.text,
        type: data.type,
        file: data.file,
        date: data.createdAt.toLocaleDateString(),
        time: data.createdAt.toLocaleTimeString()
      });
    }
    return res.status(422).json({ status: "error", error: "Failed to add message" });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
  })
  }
};

exports.getAllMessage = async (req, res) => {
  try {
    var receiver_type = ''
    var message = []
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    const { to } = req.body;
    if(req.user.current_role == "customer"){
      receiver_type = "vendor"
    }else{
      receiver_type = "customer"
    }
    const sender = await Message.find({
      sender: req.user._id,
      receiver: to,
      user_type : req.user.current_role,
      sender_clear: false
    })
    for await (const doc of sender){
      const data = {
        fromSelf: doc.sender.toString() === req.user._id.toString(),
        senderId: doc.sender,
        ReceiverId: doc.receiver,
        user_type : doc.user_type,
        message: doc.message.text,
        type: doc.type,
        file: doc.file,
        date: doc.createdAt.toLocaleDateString(),
        time: doc.createdAt.toLocaleTimeString(),
        createdAt: doc.createdAt
      }
      message.push(data)
    }
    await Message.updateMany({
      sender: to,
      receiver: req.user._id,
      user_type: receiver_type,
      receiver_clear: false
    }, {is_read: true}, {new: true})
    const receiver = await Message.find({
      sender: to,
      receiver: req.user._id,
      user_type: receiver_type,
      receiver_clear: false,
      is_block: false
    })
    for await (const doc of receiver){
      const data = {
        fromSelf: doc.sender.toString() === req.user._id.toString(),
        senderId: doc.sender,
        ReceiverId: doc.receiver,
        user_type : doc.user_type,
        message: doc.message.text,
        type: doc.type,
        file: doc.file,
        date: doc.createdAt.toLocaleDateString(),
        time: doc.createdAt.toLocaleTimeString(),
        createdAt: doc.createdAt
      }
      message.push(data)
    }
    const messages = message.sort(byDate)
    function byDate(a,b){
      return new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
    }
    if(page == 0 && limit == 0){
      return res.status(200).json({ 
        status: "success",
        messages
      });
    }
    if(page > 0 && limit > 0){
      let start = -Number(page*limit)
      let end = -Number((page*limit)-limit) < 0 ? -Number((page*limit)-limit) : undefined 
      const totalPages = Math.ceil(messages.length / limit)
      return res.status(200).json({ 
        status: "success",
        previousPage: page - 1 ? page - 1 : 0,
        currentPage: page,
        nextPage: (totalPages > page) ? page + 1 : 0,
        totalPages: totalPages,
        total_message: messages.length,
        messages: messages.slice(start, end)
      });
    }
    return res.status(200).json({ 
      status: "success",
      messages
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
  })
  }
};

exports.AllPerson = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const search = req.query.search || "";
    const searchExp = new RegExp(search + ".*", "ig");
    const longitude = req?.user?.location?.coordinates[0];
    const latitude = req?.user?.location?.coordinates[1];
    var receiver_type = ''
    if(req.user.current_role == "customer"){
      receiver_type = "vendor"
    }else{
      receiver_type = "customer"
    }
    const user = await User.findById(req.user._id);
    const Data = [];
    let last = []

    if(req.user.current_role == "customer"){
      for await (const doc of user.customer_chat) {
        const id = doc;
        const count = await Message.countDocuments({
          sender: id,
          receiver: req.user._id,
          user_type: receiver_type,
          receiver_clear: false,
          is_read: false,
          is_block: false
        })
        const sender = await Message.findOne({
          sender: req.user._id,
          receiver: id,
          user_type : req.user.current_role,
          sender_clear: false
        }).sort({ createdAt: -1 })
        if(sender){
          last.push(sender)
        }
        const receiver = await Message.findOne({
          sender: id,
          receiver: req.user._id,
          user_type: receiver_type,
          receiver_clear: false
        }).sort({ createdAt: -1 })
        if(receiver){
          last.push(receiver)
        }
        const messages = last.sort(byDate)
        function byDate(a,b){
          return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
        }
        const block = await Block.findOne({ sender: req.user.id, receiver: id, user_type: "customer", receiver_type: "vendor"})
        const self_block = await Block.findOne({ sender: id, receiver: req.user.id, user_type: "vendor", receiver_type: "customer"})
        const users = await User.aggregate([
          {$match: {_id:new ObjectId(id)}},
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category'
            }
          },
          {$unwind: "$category" },
          { $addFields: { phone: { $toString: { $toLong: "$phone" } } } },
          { $match: { $or: [{ 'name': searchExp }, { 'phone': searchExp }, {'category.category': new RegExp("^"+search + ".*", "ig")}] } },
          { $addFields: { phone: { $toDouble: { $toLong: "$phone" } } } },
        ])
        const user_distance = await User.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
              },
              key: "location",
              query: { "role.vendor": true },
              minDistance: 1,
              distanceMultiplier: 0.001,
              distanceField: "dist.calculated",
              spherical: true,
            },
          },
          {$match: {_id:new ObjectId(id)}},
          { $addFields: { Distance: { $round: ["$dist.calculated", 1] } } }
        ])
        // const users = await User.findById(id).populate('category', {category:1,isactive:1})
        if(users.length != 0){
          const final_user = {
            _id: users[0]?._id,
            name: users[0]?.name,
            photo: users[0]?.photo,
            phone: users[0]?.phone.toString(),
            category: users[0]?.category.category,
            avgrating: users[0]?.avgrating,
            distance: user_distance.length > 0 ? user_distance[0]?.Distance : "Not found",
            is_online: users[0]?.is_online,
            is_block: block ? "1" : "0",
            self_block: self_block ? 1 : 0,
            unread_count: block ? undefined :count,
            createdAt: users[0]?.createdAt,
            updatedAt: messages.length > 0 ? messages[0]?.createdAt : users[0]?.updatedAt,
            date: messages.length > 0 ? messages[0]?.createdAt?.toLocaleDateString() : users[0]?.updatedAt?.toLocaleDateString(),
            time: messages.length > 0 ? messages[0]?.createdAt?.toLocaleTimeString() : users[0]?.updatedAt.toLocaleTimeString()
          }
          Data.push(final_user);
        }
        last = []
      }
      const totalPages = Math.ceil(Data.length / limit)
      return res.status(200).json({ 
        status: "success",
        previousPage: page - 1 ? page - 1 : 0,
        currentPage: page,
        nextPage: (totalPages > page) ? page + 1 : 0,
        total_person: Data.length,
        totalPages: totalPages, 
        Data: Data.slice(limit*(page-1), limit*page)
      });
    }else{
      for await (const doc of user.vendor_chat) {
        const id = doc;
        const count = await Message.countDocuments({
          sender: id,
          receiver: req.user._id,
          user_type: receiver_type,
          receiver_clear: false,
          is_read: false,
          is_block: false
        })
        const sender = await Message.findOne({
          sender: req.user._id,
          receiver: id,
          user_type : req.user.current_role,
          sender_clear: false
        }).sort({ createdAt: -1 })
        if(sender){
          last.push(sender)
        }
        const receiver = await Message.findOne({
          sender: id,
          receiver: req.user._id,
          user_type: receiver_type,
          receiver_clear: false
        }).sort({ createdAt: -1 })
        if(receiver){
          last.push(receiver)
        }
        const messages = last.sort(byDate)
        function byDate(a,b){
          return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
        }
        const block = await Block.findOne({ sender: req.user.id, receiver: id, user_type: "vendor", receiver_type: "customer"})
        const self_block = await Block.findOne({ sender: id, receiver: req.user.id, user_type: "customer", receiver_type: "vendor"})
        const users = await User.find({_id: id, $or: [{ name: searchExp }, { $where: `/^${+search}.*/.test(this.phone)` }]})
        const user_distance = await User.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
              },
              key: "location",
              query: { "role.customer": true },
              minDistance: 1,
              distanceMultiplier: 0.001,
              distanceField: "dist.calculated",
              spherical: true,
            },
          },
          {$match: {_id:new ObjectId(id)}},
          { $addFields: { Distance: { $round: ["$dist.calculated", 1] } } }
        ])
        if(users.length != 0){
          const final_user = {
            _id: users[0]?._id,
            name: users[0]?.name,
            photo: users[0]?.photo,
            phone: users[0]?.phone.toString(),
            distance: user_distance.length > 0 ? user_distance[0]?.Distance : "Not found",
            is_online: users[0]?.is_online,
            is_block: block ? "1" : "0",
            self_block: self_block ? 1 : 0,
            unread_count: block ? undefined :count,
            last_message: messages.length > 0 ? messages[0].message.text == 0 ? messages[0].type == 'image' ? 'image' : 'video': messages[0].message.text : '',
            createdAt: users[0]?.createdAt,
            updatedAt: messages.length > 0 ? messages[0]?.createdAt : users[0]?.updatedAt,
            date: messages.length > 0 ? messages[0]?.createdAt?.toLocaleDateString() : users[0]?.updatedAt?.toLocaleDateString(),
            time: messages.length > 0 ? messages[0]?.createdAt?.toLocaleTimeString() : users[0]?.updatedAt.toLocaleTimeString()
          }
          Data.push(final_user);
        }
        last = []
      }
      const totalPages = Math.ceil(Data.length / limit)
      return res.status(200).json({ 
        status: "success",
        previousPage: page - 1 ? page - 1 : 0,
        currentPage: page,
        nextPage: (totalPages > page) ? page + 1 : 0,
        total_person: Data.length,
        totalPages: totalPages,
        Data: Data.slice(limit*(page-1), limit*page)
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//* Delete User from chat List
exports.deleteMessage = async (req, res) => {
  try {
    const {to} = req.body
    if(!to){
      return res.status(406).json({
        status: "error",
        error: "Please pass receiver Id in 'to' field in body section"
      })
    }
    if(req.user.current_role == "customer"){
      const user = await User.updateOne(
        { _id: req.user._id, customer_chat: { $in: to } },
        { $pull:{customer_chat:{$in : to}} }
      )
      if(user.modifiedCount == 0){
        return res.status(304).json({
          status: "error",
          error: "Vendor not remove from chat list"
        })
      }
      return res.status(200).json({
        status: "success",
        mess:"User remove from chat list"
      })
    }else{
      const user = await User.updateOne(
        { _id: req.user._id, vendor_chat: { $in: to } },
        { $pull:{vendor_chat:{$in : to}} }
      )
      if(user.modifiedCount == 0){
        return res.status(304).json({
          status: "error",
          error: "Customer not remove from chat list"
        })
      }
      return res.status(200).json({
        status: "success",
        mess:"User remove from chat list"
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
  })
  }
};

//* Clear Chat
exports.clearChat = async (req,res) => {
  try {
    const folderPath = path.join(__dirname, "../");
    var receiver_type = ''
    const {receiverId} = req.body
    if(req.user.current_role == "customer"){
      receiver_type = "vendor"
    }else{
      receiver_type = "customer"
    }
    await Message.updateMany({
      sender: req.user._id,
      receiver: receiverId,
      user_type: req.user.current_role,
      sender_clear: false,
      flag: undefined
    },{
      sender_clear: true
    },{
      new: true
    })
    await Message.updateMany({
      sender: receiverId,
      receiver: req.user._id,
      user_type: receiver_type,
      receiver_clear: false,
      flag: undefined
    },{
      receiver_clear: true
    },{
      new: true
    })

    const find = await Message.find({
      sender: req.user._id,
      receiver: receiverId,
      user_type: req.user.current_role,
      sender_clear: true,
      receiver_clear: true,
      flag: undefined
    })
    find.map((data) => {
      if (!data.file == "") {
        fs.exists(folderPath + `${data.file}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${data.file}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
    });

    await Message.deleteMany({
      sender: req.user._id,
      receiver: receiverId,
      user_type: req.user.current_role,
      sender_clear: true,
      receiver_clear: true,
      flag: undefined,
    })
    
    const receiver_find = await Message.find({
      sender: receiverId,
      receiver: req.user._id,
      user_type: receiver_type,
      sender_clear: true,
      receiver_clear: true,
      flag: undefined
    })
    receiver_find.map((data) => {
      if (!data.file == "") {
        fs.exists(folderPath + `${data.file}`, (f) => {
          if (f) {
            fs.unlink(folderPath + `${data.file}`, (err) => {
              if (err) {
                return res.status(422).json("Something went to wrong");
              }
              // console.log("Delete Successfully");
            });
          }
        });
      }
    });

    await Message.deleteMany({
      sender: receiverId,
      receiver: req.user._id,
      user_type: receiver_type,
      sender_clear: true,
      receiver_clear: true,
      flag: undefined
    })

    return res.status(200).json({
      status: "success",
      mess: "User Chat clear successfully"
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}

//* Check User Deleted his Account or Not
exports.checkUser = async (req,res) => {
  try {
    const {receiverId} = req.body
    const find = await User.findById(receiverId)
    if(req.user.current_role == "customer" && find.role.vendor == false){
      return res.status(200).json({
        status: "success",
        message: "1"
      })
    }
    if(req.user.current_role == "vendor" && find.role.customer == false){
      return res.status(200).json({
        status: "success",
        message: "1"
      })
    }
    if(find.isactive == "Deactive"){
      return res.status(200).json({
        status: "success",
        message: "1"
      })
    }
    return res.status(200).json({
      status: "success",
      message : "0"
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}

//* Get Media for particular User chat
exports.getMedia = async(req,res)=>{
  try {
    const {to} = req.body
    let media = []
    let role 
    if(req.user.current_role == 'customer'){
      role = 'vendor'
    }else{
      role = 'customer'
    }
    const sender_media = await Message.find({sender: req.user._id, receiver: to, user_type: req.user.current_role, $or: [{type: 'image'}, {type: 'video'}], sender_clear:false, is_block: false},{sender:1,receiver:1,type:1,file:1,createdAt:1,updatedAt:1,user_type:1}).sort({createdAt: -1})
    if(!(sender_media.length == 0)){
      media.push(...sender_media)
    }
    const receiver_media = await Message.find({sender: to, receiver:  req.user._id, user_type: role, $or: [{type: 'image'}, {type: 'video'}], receiver_clear:false, is_block:false},{sender:1,receiver:1,type:1,file:1,createdAt:1,updatedAt:1,user_type:1}).sort({createdAt: -1})
    if(!(receiver_media.length == 0)){
      media.push(...receiver_media)
    }
    if(media.length == 0){
      return res.status(204).json({
        status: "success",
        message: "Media not found"
      })
    }
    media = media.sort(byDate)
      function byDate(a,b){
        return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
      }
    return res.status(200).json({
      status: "success",
      media
    })
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
    cb(null, "profile/file");
  },
  filename: function (req, file, cb) {
    var type = file.mimetype.split("/")[1];
    if (type == "x-matroska") {
      type = "mkv";
    }
    // console.log(type)
    cb(null, Date.now() + "." + type);
  },
});

exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 500000000, //byte
  },
  fileFilter(req, file, cb) {
    if (
      !file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG|MP4|mp4|MKV|mkv)$/)
    ) {
      return cb(new Error("Please upload a Image or Video"));
    }
    cb(undefined, true);
  },
});
