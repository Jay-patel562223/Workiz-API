const mongoose = require('mongoose');

const roleChangeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role :{
        type:String,
        enum: ["customer", "vendor"],
    }
},{
    timestamps: true
});

module.exports = mongoose.model("RoleChange_Request",roleChangeSchema)