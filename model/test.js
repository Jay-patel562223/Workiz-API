const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model("Test", testSchema)