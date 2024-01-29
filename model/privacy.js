const mongoose = require('mongoose');

const privacySchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["customer", "vendor"]
    },
    details: {
        type: String,
        required: true
    }
},{
    timestamps:true
})

module.exports = mongoose.model("Privacy", privacySchema)