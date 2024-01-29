const AppInfo = require('../model/app_Info')
const Recent_Activity = require("../model/activity")

//* Create a App Info
exports.create = async (req, res) => {
    try {
        const { info } = req.body
        const find = await AppInfo.findOne()
        if(find){
            return res.status(422).json({
                status: false,
                message: "App information has already added"
            })
        }
        const appinfo = await AppInfo.create({
            info: info
        })
        return res.status(201).json({
            status: true,
            appinfo
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Update App info
exports.update = async (req, res) => {
    try {
        const { id } = req.params
        const { info } = req.body
        const appinfo = await AppInfo.findByIdAndUpdate(id, { info: info }, { new: true, runValidators: true })
        return res.status(200).json({
            status: true,
            appinfo
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Get App Info for addmin
exports.get = async (req,res)=>{
    try {
        const appinfo = await AppInfo.find().sort({ createdAt: -1 })
        return res.status(200).json({
            status: true,
            appinfo
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

//* Get App Info for User
exports.getForUser = async (req,res)=>{
    try {
        const appinfo = await AppInfo.find()
        return res.status(200).json({
            status: "success",
            appinfo
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            error: error.message
        })
    }
}

//* Delete App Info
exports.deleteInfo = async (req, res) =>{
    try {
        const {id} = req.params
        await AppInfo.findByIdAndDelete(id)
        return res.status(200).json({
            status: true,
            appinfo: "App Info delete successfully"
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        })
    }
}