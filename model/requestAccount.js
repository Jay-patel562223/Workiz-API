const mongoose = require('mongoose');

const accountRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
},{
    timestamps: true
});

module.exports = mongoose.model("Account_Request", accountRequestSchema)