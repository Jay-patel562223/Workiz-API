const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    message: {
        text: {
            type: String,
            default:""
        },
    },
    type:{
        type:String
    },
    user_type:{
        type:String,
        enum: ["customer", "vendor"],
    },
    sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
    },
    receiver:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
    },
    file: {
        type: String,
        default: ""
    },
    sender_clear: {
        type: Boolean, 
        default: false
    },
    receiver_clear: {
        type: Boolean, 
        default: false
    },
    flag :{
        type:String,
        enum: ["accept", "reject", "pending"],
        default: undefined
    },
    is_read:{
        type: Boolean,
        default: false
    },
    is_block: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
});

module.exports = mongoose.model("Message", messageSchema)