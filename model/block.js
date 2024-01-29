const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    user_type:{
        type:String,
        enum: ["customer", "vendor"],
    },
    receiver_type:{
        type:String,
        enum: ["customer", "vendor"],
    }
},{
    timestamps: true
});

module.exports = mongoose.model("Block",blockSchema)