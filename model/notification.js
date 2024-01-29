const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        default: "",
        required: true
    },
    image: {
        type: String
    }
},{
    timestamps: true
})

module.exports = mongoose.model('Notification', notificationSchema)