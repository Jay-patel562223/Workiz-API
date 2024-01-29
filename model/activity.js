const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var activitySchema = new mongoose.Schema({
    role: {
        type: String,
        default: undefined
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: undefined
    },
    activity: {
        type: String,
    },
    message: {
        type: String
    }
},{
    timestamps: true
});

//Export the model
module.exports = mongoose.model('Recent_Activity', activitySchema);