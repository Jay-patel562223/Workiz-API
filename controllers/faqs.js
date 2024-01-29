const Faqs = require("../model/faqs");
const Recent_Activity = require("../model/activity")

// Add FAQs
exports.addFaqs = async (req, res) => {
  try {
    const faqs = new Faqs(req.body);
    await faqs.save();
    return res.status(201).json({
      status: "success",
      Message: "Successfully added",
      faqs: faqs,
    });
  } catch (error) {
    if(error.name == "ValidationError"){
      return res.status(400).json({ 
        status: false,
        message: "Please enter a valid Question and Answer."
      });
    }
    return res.status(500).json({ status: false, error: error.message });
  }
  
};

//Get All FAQs
exports.getAllFaqs = async (req, res) => {
  try {
    await Faqs.find().sort({ createdAt: -1 }).exec((err, faqs) => {
      if (err) {
        return res.status(204).json({
          status: "error",
          error: "No FAQ's Found",
        });
      }
      return res.status(200).json({ status: "success", faqs });
    }); 
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

//Get only one FAQs
exports.getFaqs = async (req, res) => {
  try {
    const { question, answer } = req.faqs;
    return res.status(200).json({ status: "success", question, answer });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//Update FAQs
exports.updateFaqs = async (req, res) => {
  try {
    const {id} = req.params
    const { question, answer } = req.body;
    const faq = await Faqs.findByIdAndUpdate(id, {
      question: question,
      answer: answer,
    },{
      new: true,
      runValidators: true
    });
    return res.status(200).json({ status: true, faq });
  } catch (error) {
    if(error.name == "ValidationError"){
      return res.status(400).json({ 
        status: false,
        message: "Please enter a valid Question and Answer."
      });
    }
    return res.status(500).json({ status: false, error: error.message });
  }
};
//Remove FAQs
exports.removeFaqs = async (req, res) => {
  try {
    const {id} = req.params;
    const remove = await Faqs.findByIdAndDelete(id)
    if(remove){
      return res.status(200).json({
        status: true,
        Message: "Removed Successfully",
      });
    }
    return res.status(422).json({
      status: false,
      Message: "FAQ's not removed",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }  
}

//Checking ID
exports.faqsByID = async (req, res, next, id) => {
  await Faqs.findById(id).exec((err, faqs) => {
    if (err) {
      res.status(422).json({
        status: "error",
        error: "Not Find FAQ'S",
      });
    }
    req.faqs = faqs;
    next();
  });
};
