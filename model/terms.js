const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["customer", "vendor"]
    },
    tc: {
        type: String,
        trim: true,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model("TermsCondition", termSchema)