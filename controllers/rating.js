const Rating = require("../model/rating");
const User = require("../model/user");
const Recent_Activity = require("../model/activity");
const { ObjectId } = require("mongodb");

exports.createRating = async (req, res) => {
  try {
    const { to, rating, comment } = req.body;
    let avg = 0

    const find = await User.findById(to)
    if(!(find.role.customer === true && find.role.vendor === true)){
      if(find.role.customer === true && req.user.current_role == "customer"){
        return res.status(422).json({
          status: "error",
          error: "Can not rating from Customer to Customer"
        })
      }
      if(find.role.vendor === true && req.user.current_role == "vendor"){
        return res.status(422).json({
          status: "error",
          error: "Can not rating from Vendor to Vendor"
        })
      }
    }
    const agg1 = await Rating.aggregate([
      {$match: {receiver:new ObjectId(to), rating: {$gt: 0}}},
      {
        $group: {
          _id: "$receiver",
          avg: { $avg: "$rating" },
        },
      },
    ]);
    if(agg1.length !== 0){
      avg = Math.round(agg1[0].avg * 10) / 10;
    }
    const checkRating = await Rating.findOne({
      sender: req.user._id,
      receiver: to,
    })
    if(!checkRating){
      await Rating.create({
        rating: 0,
        sender: req.user._id,
        receiver: to,
        comment: ""
      });
      return res.status(200).json({
        status: "success",
        rating: 0,
        avgrating: avg,
        comment: ""
      });
    }
    // if (rating < 0 || rating > 5) {
    //   return res.status(422).json({
    //     status: "error",
    //     error: "Please Enter rating from 0 to 5",
    //   });
    // }

    // if (!to || !rating) {
    //   return res.status(422).json({
    //     status: "error",
    //     error: "Enter All Details",
    //   });
    // }

    if(rating == -1 && comment == ""){
      return res.status(200).json({
        status: "success",
        rating: checkRating.rating,
        avgrating: avg,
        comment: checkRating.comment
      });
    }
    const data = await Rating.findOneAndUpdate({
      sender: req.user._id,
      receiver: to
    },{
      rating: rating,
      comment: comment
    },{new: true});

    if (!data) {
      return res.status(422).json({
        status: "error",
        error: "Something went wrong",
      });
    }

    const agg = await Rating.aggregate([
      {$match: {receiver:new ObjectId(to), rating: {$gt: 0}}},
      {
        $group: {
          _id: "$receiver",
          avg: { $avg: "$rating" },
        },
      },
    ]);

    for await (const doc of agg) {
      const id = doc._id;
      const avgrating = Math.round(doc.avg * 10) / 10;
      avg = avgrating
      await User.findByIdAndUpdate(id, { avgrating });
    }
    
    await Recent_Activity.create({
      role: "User",
      sender: req.user._id,
      receiver: to,
      activity: "Rating",
      message: `${req.user.name} rated ${find.name}`
    })
    return res.status(200).json({
      status: "success",
      rating: rating || rating >= 0? rating: checkRating.rating,
      avgrating: avg,
      comment: comment || comment == "" ? comment: checkRating.comment
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
};

exports.showAllRating = async (req, res) => {
  try {
    const rating = await Rating.find({ sender: req.user.id }).sort({ createdAt: -1 });
    if (!rating) {
      return res.status(204).json({
        status: "error",
        error: "Rating Not Found",
      });
    }
    return res.status(200).json({ status: "success", rating });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

exports.showRating = async (req, res) => {
  try {
    const rating = await Rating.find({
      sender: req.user.id,
      receiver: req.body.to,
    });
  
    if (!rating) {
      return res.status(204).json({
        status: "error",
        error: "Rating not found",
      });
    }
    if (rating.length === 0) {
      return res.status(204).json({
        status: "error",
        error: "rating not added for this user",
      });
    }
  
    return res.status(200).json({ status: "success", rating }); 
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};
