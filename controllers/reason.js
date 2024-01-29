const Reason = require('../model/reason')
const Recent_Activity = require("../model/activity")

//* Create Reason
exports.addReason = async (req, res) => {
    try {
        const { reason, type } = req.body
        const add_reason = await Reason.create({ reason: reason, type: type })
        if (!add_reason) {
            return res.status(400).json({
                status: false,
                error: "Reason not add"
            })
        }
        return res.status(201).json({
            status: true,
            reason: add_reason
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Get all reason for User
exports.getAllReason = async (req, res) => {
    try {
        const {type} = req.body
        const reason = await Reason.find({type: type, isactive: true})
        if (reason.length == 0) {
            return res.status(204).json({
                status: "success",
                reason: "Reason not found"
            })
        }
        return res.status(200).json({
            status: "success",
            reason
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            error: error.message
        })
    }
}

//* Get all reason for Admin
exports.getReason = async (req, res) => {
    try {
        const reason = await Reason.find().sort({ createdAt: -1 })
        if (reason.length == 0) {
            return res.status(204).json({
                status: true,
                reason: "Reason not found"
            })
        }
        return res.status(200).json({
            status: true,
            reason
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Update Reason
exports.updateReason = async (req, res) => {
    try {
        const {id} = req.params
        const {reason,isactive, type} = req.body
        const update_reason = await Reason.findByIdAndUpdate(id,{
            reason: reason,
            type: type,
            isactive: isactive
        },{new: true, runValidators: true})
        if(!update_reason){
            return res.status(304).json({
                status: false,
                error: "Reason not update"
            })
        }
        return res.status(200).json({
            status: true,
            reason: update_reason
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Delete Reason
exports.deleteReason = async (req,res)=>{
    try {
        const {id} = req.params
        const delete_reason = await Reason.findByIdAndDelete(id)
        if(!delete_reason){
            return res.status(400).json({
                status: false,
                error: "Reason not delete"
            })
        }
        return res.status(200).json({
            status: true,
            message: "Reason delete successfully"
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}