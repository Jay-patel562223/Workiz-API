const TermsCondition = require("../model/terms");
const Recent_Activity = require("../model/activity")

//update Terms And Conditions
exports.updateTC = async (req, res) => {
  try {
    const {id} = req.params
    const { role, tc } = req.body;
    const tcs = await TermsCondition.findByIdAndUpdate(id, { role ,tc }, {new: true})
    return res.status(200).json({ status: "success", tcs });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  } 
};

//* get Terms And Conditions for User
exports.getTCUser = async (req, res) => {
  try {
    const {role} = req.body
    if(role == "customer"){
      const tcs = await TermsCondition.find({role}).sort({ createdAt: -1 })
      if(tcs){
        return res.status(200).json({ status: true, tcs });
      }
      return res.status(204).json({
        status: false,
        error: "T&C not found",
      });
    }
    if(role == "vendor"){
      const tcs = await TermsCondition.find({role}).sort({ createdAt: -1 })
      if(tcs){
        return res.status(200).json({ status: true, tcs });
      }
      return res.status(204).json({
        status: false,
        error: "T&C not found",
      });
    }
    if(role == "both"){
      const tcs = await TermsCondition.find().sort({ createdAt: -1 })
      if(tcs){
        return res.status(200).json({ status: true, tcs });
      }
      return res.status(204).json({
        status: false,
        error: "T&C not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//get Terms And Conditions
exports.getTC = async (req, res) => {
  try {
    const tcs = await TermsCondition.find().sort({ createdAt: -1 })
    if(tcs){
      return res.status(200).json({ status: true, tcs });
    }
    return res.status(204).json({
      status: false,
      error: "T&C not found",
    }); 
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

exports.addTC = async (req, res) => {
  try {
    const { role, tc } = req.body;
    if (!tc) {
      return res.status(422).json({
        status: "error",
        error: "Terms and Condition required",
      });
    }
    const find = await TermsCondition.findOne({role:role})
    if(find){
      return res.status(422).json({
        status: false,
        message: "Terms & Conditions has already added"
      })
    }
    const tcs = await TermsCondition.create({ role: role, tc: tc });
    return res.status(201).json({
      status: true,
      tcs,
    }); 
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

exports.removeTC = async (req,res) =>{
  try {
    const { id} = req.params
    const find = await TermsCondition.findById(id)
    await TermsCondition.findByIdAndDelete(id)
    return res.status(200).json({
      status: true,
      TC: "Delete T&C"
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}