const Contact = require("../model/contact");
const Recent_Activity = require("../model/activity")

//Add Contact
exports.addcontact = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    const phones = await Contact.findOne({ phone: req.body.phone });
    if (phones) {
      return res.status(422).json({
        status: false,
        message: "phone already exist",
      });
    }
    const contacts = await contact.save();
    return res.status(201).json({
      status: true,
      Message: "Successfully added",
      contact_Us: contacts 
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

// Show Contact
exports.getcontact = async (req, res) => {
  try {
    Contact.find().sort({ createdAt: -1 }).exec((err, contact_Us) => {
      if (err) {
        return res.status(204).json({
          status: false,
          Message: "Not found",
        });
      }
      return res.status(200).json({ status: true, contact_Us });
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

//Update Mail and Phone number
exports.updatecontact = async (req, res) => {
  try {
    const {id} = req.params
    const { phone, email, address } = req.body;
    const up = await Contact.findByIdAndUpdate(
      id,
      { phone: phone, email: email, address: address },
      { new: true }
    );
    return res.status(200).json({ status: true , message: "Update Successfully", contact_Us: up}); 
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

//* Delete Contact Us
exports.deleteContact = async (req,res)=>{
  try {
    const {id} = req.params
    const find = await Contact.findById(id)
    if(!find){
      return res.status(304).json({
        status: false,
        mess: "Contact Us already deleted"
      })
    }
    await Contact.findByIdAndDelete(id)
    return res.status(200).json({
      status: true,
      mess: "Contact Us delete successfully"
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//Checking ID
exports.getContactById = (req, res, next, id) => {
  Contact.findById(id).exec((err, contact) => {
    if (err) {
      res.status(422).json({
        status: "error",
        error: "Not Find Contact",
      });
    }
    req.contact = contact;
    next();
  });
};
