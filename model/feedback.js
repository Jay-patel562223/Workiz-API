const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    feedback : {
        type: String,
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    comment:{
        type: String
    }
},{
    timestamps: true
});

module.exports = mongoose.model("FeedBack",feedbackSchema);