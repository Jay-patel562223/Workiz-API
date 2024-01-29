const Privacy = require("../model/privacy")
const Recent_Activity = require("../model/activity")

//* Create Privacy 
exports.createPrivacy = async (req, res) => {
    try {
        const { role, details } = req.body
        const find = await Privacy.findOne({role: role})
        if(find){
            return res.status(422).json({
                status: false,
                message: "Privacy & Policy has already added"
            })
        }
        const privacy = await Privacy.create({
            role: role,
            details: details
        })
        return res.status(201).json({
            status: true,
            privacy
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Show Privacy List
exports.getPrivacy = async (req, res) => {
    try {
        const privacy = await Privacy.find().sort({ createdAt: -1 })
        return res.status(200).json({
            status: true,
            privacy
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Show Privacy List for user
exports.getPrivacyUser = async (req, res) => {
    try {
        const {role} = req.body
        if(role == "customer"){
            const privacy = await Privacy.find({role}).sort({ createdAt: -1 })
            return res.status(200).json({
                status: "success",
                privacy
            })
        }
        if(role == "vendor"){
            const privacy = await Privacy.find({role}).sort({ createdAt: -1 })
            return res.status(200).json({
                status: "success",
                privacy
            })
        }
        if(role == "both"){
            const privacy = await Privacy.find().sort({ createdAt: -1 })
            return res.status(200).json({
                status: "success",
                privacy
            })
        }
        
    } catch (error) {
        return res.status(500).json({
            status: "error",
            error: error.message
        })
    }
}

//* Update Privacy
exports.updatePrivacy = async (req, res) => {
    try {
        const {id} = req.params
        const { role, details } = req.body
        const privacy = await Privacy.findByIdAndUpdate(id,{
            role: role,
            details: details
        },{
            new: true
        })
        return res.status(200).json({
            status: true,
            privacy
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

exports.deletePrivacy = async (req,res) => {
    try {
        const {id} = req.params
        const privacy = await Privacy.findByIdAndDelete(id)
        return res.status(200).json({
            status: true,
            privacy
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}