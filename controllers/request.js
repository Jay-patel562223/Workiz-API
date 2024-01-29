const Message = require("../model/message");
const User = require("../model/user");
const fetch = require("node-fetch");
const emitterFile = require('../index')
const myEmitter = emitterFile.emitter

exports.sendRequest = async(req,res)=>{
    try {
        const {to, type, message} = req.body

        if(req.user.current_role == 'vendor'){
            return res.status(401).json({
                status:"error",
                error: "Vendor is not send request to customer"
            })
        }

        for await(const doc of to){
            const user = await User.findOne({_id: doc})
            await Message.create({
                sender: req.user._id,
                receiver: doc,
                type: type,
                message: { text: message },
                user_type: req.user.current_role,
                flag: "pending",
                file: req.file ? req.file.path.replace(/\\/g, "/") : "",
            })
            await User.updateOne(
                { _id: req.user._id, customer_chat: { $in: doc } },
                { $pull:{customer_chat:{$in : doc}} }
              )
        
              await User.updateOne(
                { _id: doc, vendor_chat: { $in: req.user._id.toString() } },
                { $pull: { vendor_chat: { $in : req.user._id.toString() } } }
              )
        
              await User.updateOne(
                { _id: req.user._id, customer_chat: { $nin: doc } },
                { $push: { customer_chat: { $each: [doc] , $position: 0 } } }
              );
        
              await User.updateOne(
                { _id: doc, vendor_chat: { $nin: req.user._id.toString() } },
                { $push: { vendor_chat: { $each: [req.user._id.toString()] , $position: 0 } } }
              );
            const event_data = {
                type: 8,
                notification: user.notification == 'on' ? true : false,
                title: req.user.name,
                body: message,
                image: req.file ? process.env.APP_URL+`/${req.file.path.replace(/\\/g, "/")}` : '',
                senderId: req.user._id.toString(),
                receiverId: doc,
                senderRole: req.user.current_role
            }
            myEmitter.emit('request_event', event_data)
            
            if(user.notification == 'on'){
                const token = user.fcm_token;
                var notification = {
                    'title': req.user.name,
                    'body': message,
                };
                var fcm_token = [`${token}`];
                var notification_body = {
                'data' : {
                    'type': 8,
                    'title': req.user.name,
                    'body': message,
                    'image': req.file ? process.env.APP_URL+`/${req.file.path.replace(/\\/g, "/")}` : '',
                    'senderId' : req.user._id.toString(),
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
        }
        return res.status(201).json({
            status: "success",
            message: message,
            Request: "Request is send"
        })
        
    } catch (error) {
        return res.status(500).json({
            status: "error",
            error: error.message
        })
    }
}

exports.updateFlag = async (req,res) => {
    try {
        const {senderId , flag} = req.body

        if(req.user.current_role == 'customer'){
            return res.status(401).json({
                status:"error",
                error: "Customer is not accept request Interested or not interested"
            })
        }
        const find = await Message.findOne({sender: senderId, receiver: req.user._id, user_type: "customer", flag:"pending"})
        if(!find){
            return res.status(204).json({
                status: "error",
                error: "No request found for this customer"
            })
        }
        await Message.updateOne({sender: senderId, receiver: req.user._id, user_type: "customer", flag:"pending"}, {flag: flag}, {new: true, runValidators: true})
        await User.updateOne(
            { _id: req.user._id, vendor_chat: { $in: senderId } },
            { $pull:{vendor_chat:{$in : senderId}} }
          )
    
          await User.updateOne(
            { _id: senderId, customer_chat: { $in: req.user._id.toString() } },
            { $pull: { customer_chat: { $in : req.user._id.toString() } } }
          )
    
          await User.updateOne(
            { _id: req.user._id, vendor_chat: { $nin: senderId } },
            { $push: { vendor_chat: { $each: [senderId] , $position: 0 } } }
          );
    
          await User.updateOne(
            { _id: senderId, customer_chat: { $nin: req.user._id.toString() } },
            { $push: { customer_chat: { $each: [req.user._id.toString()] , $position: 0 } } }
          );
          const request = await Message.findOne({sender: senderId, receiver: req.user._id, user_type: "customer", $or: [{flag: "accept" }, {flag: "reject" }]},{sender_clear:0,receiver_clear:0,file:0,__v:0})
          const user = await User.findById(senderId)
          
        const event_data = {
            type: flag == "accept" ? 6 : 7,
            notification: user.notification == 'on' ? true : false,
            title: req.user.name,
            body: `Your message request is ${flag} by ${req.user.name}`,
            senderId: req.user._id.toString(),
            receiverId: senderId,
            senderRole: 'vendor'
        }
        myEmitter.emit('action_event', event_data)
          
        if(user.notification == 'on'){
            const token = user.fcm_token;
            var notification = {
                'title': req.user.name,
                'body': `Your message request is ${flag} by ${req.user.name}`,
            };
            var fcm_token = [`${token}`];
            var notification_body = {
            'data' : {
                'type': flag == "accept" ? 6 : 7,
                'title': req.user.name,
                'body': `Your message request is ${flag} by ${req.user.name}`,
                'senderId' : req.user._id.toString(),
                'senderRole': "vendor"
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
        return res.status(200).json({
            status: "success",
            request
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            error: error.message
        })
    }
}

exports.checkStatus = async(req,res) => {
    try {
        let {to} = req.body
        let id = req.user._id
        if(req.user.current_role == 'vendor'){
            id = to
            to = req.user._id
        }
        const request = await Message.findOne({sender: id, receiver: to, user_type: "customer", $or: [{flag: "accept" }, {flag: "reject" }, {flag:"pending"}]})
        if(!request){
            return res.status(204).json({
                status: "error",
                error: "Request Not Found"
            })
        }
        return res.status(200).json({
            status: "success",
            message: request.flag
        })

    } catch (error) {
        return res.status(500).json({
            status: "error",
            error: error.message
        })
    }
}