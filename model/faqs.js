const mongoose =  require('mongoose')

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        trim: true,
        required: true
    },
    answer: {
        type: String,
        trim: true,
        required: true
    }

},{
    timestamps: true
})

module.exports = mongoose.model("Faqs", faqSchema)