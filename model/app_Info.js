const mongoose = require('mongoose');

const appInfoSchema = new mongoose.Schema({
    info:{
        type: String,
        required: true
    }
},{
    timestamps: true
})

module.exports = mongoose.model('AppInfo', appInfoSchema)