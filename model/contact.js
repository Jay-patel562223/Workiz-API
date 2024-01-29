const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: Number,
        trim: true
    },
    address: {
        type: String,
        trim: true
    }

},{
    timestamps: true
});

module.exports = mongoose.model("Contact", contactSchema);