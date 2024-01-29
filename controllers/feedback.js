const FeedBack = require("../model/feedback");
const User = require("../model/user");
const Recent_Activity = require("../model/activity")

exports.addfeedback = async (req, res, next) => {
  try {
    const { to, feedback, comment } = req.body;
    const data = await FeedBack.create({
      feedback: feedback,
      sender: req.user._id,
      receiver: to,
      comment: comment
    });
    if (!data) {
      return res.status(422).json({
        status: "error",
        error: "FeedBack not Added",
      });
    }
    const find = await User.findById(to)
    await Recent_Activity.create({
      role: "User",
      sender: req.user._id,
      receiver: to,
      activity: "Feedback",
      message: `${req.user.name} gave feedback to ${find.name}`
    })
    return res.status(201).json({
      status: "success",
      message: "Feedback Added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message 
    })
  }
};

exports.showfeedback = async (req, res, next) => {
  try {
    const fb = await FeedBack.find({
      sender: req.user.id,
      receiver: req.body.to,
    }).sort({ createdAt: -1 });
    if (fb.length === 0) {
      return res.status(204).json({
        status: "error",
        error: "feedback is not found",
      });
    }
    return res.status(200).json({
      status: "success",
      feedback: fb,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message 
    })
  }
};

exports.feedbackID = async (req, res, next, id) => {
  FeedBack.findById(id).exec((err, fb) => {
    if (err) {
      return res.status(422).json({
        status: "error",
        error: "Something went to wrong with ID",
      });
    }
    req.fb = fb;
    next();
  });
};

exports.showAllFeedback = async (req, res) => {
  try {
    const fb = await FeedBack.find().populate('sender', { name: 1 }).populate('receiver', { name: 1 }).sort({ createdAt: -1 })
    return res.status(200).json({
      status: true,
      feedbacks: fb
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* get Feedback for one user
exports.getFeedback = async (req, res) => {
  try {
    const {id} = req.params
    const feedback = await FeedBack.find({receiver: id}).populate('sender', {name: 1}).populate('receiver', {name: 1}).sort({ createdAt: -1 })
    if(feedback.length == 0){
      return res.status(204).json({
        status: true,
        message: "No one give feedback for this user"
      })
    }
    return res.status(200).json({
      status: true,
      feedback
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}