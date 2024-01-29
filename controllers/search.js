const mongoose = require('mongoose')
//* Models
const User = require("../model/user");
const Category = require("../model/categories");
const Block = require("../model/block");
const Report = require("../model/report");
const RoleChange_Request = require("../model/roleChange")
const Faqs = require("../model/faqs");
const FeedBack = require("../model/feedback");
const Contact = require("../model/contact")
const TermsCondition = require("../model/terms");
const Privacy = require("../model/privacy")
const Recent_Activity = require("../model/activity");
const { ObjectId } = require('mongodb');

exports.searchUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    let select = req.query.select || "null"
    const search = req.query.search || "";
    const searchExp = new RegExp("^" + search + ".*", "ig");
    let cat = req.query.category || "All";
    const category = await Category.find({ isactive: true }, { _id: 1})
    let categories = []
    for await (const doc of category) {
      categories.push(doc.id)
    }
    cat === "All" ? (cat = [...categories]) : (cat = req.query.category.split(","))
    select === "null" ? (select = "null") : (select = req.query.select.split(","))
    let user_chat_id = []
    const user = await User.findById(req.user._id)
    for await (const doc of user.customer_chat){
      user_chat_id.push(doc)
    }
    const map_id = user_chat_id.map((id)=>{
      return mongoose.Types.ObjectId(id)
    })
    // Map cat data for search a category by object id in aggregate
    const map_cat = cat.map((el)=>{
      return mongoose.Types.ObjectId(el)
    })
    const longitude = req.user.location.coordinates[0];
    const latitude = req.user.location.coordinates[1];
    const user_distance = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          key: "location",
          query: { "role.vendor": true },
          minDistance: 1,
          distanceMultiplier: 0.001,
          distanceField: "dist.calculated",
          spherical: true,
        },
      },
      { $match: { _id: {$nin: map_id}, category: { $in: map_cat } } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {$unwind: "$category" },
      { $addFields: { Distance: { $round: ["$dist.calculated", 1] }, phone: { $toString: { $toLong: "$phone" } } } },
      { $project: { dist: 0, __v: 0, fcm_token: 0, is_online: 0, notification: 0, vendor_chat: 0, customer_chat: 0, "category.createdAt": 0, "category.__v" : 0, "category.updatedAt": 0 } },
      { $match: { $or: [{ 'name': searchExp }, { 'email': searchExp }, { 'address': searchExp }, { 'phone': searchExp }] } },
      { $addFields: { phone: { $toDouble: { $toLong: "$phone" } } } },
    ])
    if (req.user.current_role == "customer") {
      if (select.includes('distance')) {
        const totalPages = Math.ceil(user_distance.length / limit)
        return res.status(200).json({ 
          status: "success",
          previousPage: page - 1 ? page - 1 : 0,
          currentPage: page,
          nextPage: (totalPages > page) ? page + 1 : 0,
          total_user: user_distance.length,
          totalPages: totalPages,
          user: user_distance.slice(limit*(page-1), limit*page)
        });
      }
      let users = []
      user_chat_id.push(req.user._id.toString())
      const user = await User.find({
        _id : {$nin: user_chat_id},
        "role.vendor": true,
        $or: [{ name: searchExp }, { email: searchExp }, { $where: `/^${+search}.*/.test(this.phone)` }, { address: searchExp }]
      }).where("category").in([...cat]).sort(select.includes('rating') ? { avgrating: -1 } : "").populate('category', {category: 1, isactive: 1})
      for await (const doc of user){
        const result = user_distance.find(({_id})=>_id == doc.id)
        users.push({
          ...doc._doc,
          Distance: result ? result.Distance : 0
        })
      }
      const totalPages = Math.ceil(users.length / limit)
      return res.status(200).json({
        status: "success",
        previousPage: page - 1 ? page - 1 : 0,
        currentPage: page,
        nextPage: (totalPages > page) ? page + 1 : 0,
        total_user: users.length,
        totalPages: totalPages,
        user: users.slice(limit*(page-1), limit*page)
      })
    }
    let chat = []
    for await (const doc of user.vendor_chat) {
      chat.push(doc)
    }
    const users = await User.find({
      "role.customer": true,
      $or: [{ name: searchExp }, { email: searchExp }, { $where: `/^${+search}.*/.test(this.phone)` }, { address: searchExp }]
    }).where("_id").in([...chat])
    return res.status(200).json({
      status: "success",
      user: users
    })
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
}

//* search user from admin side
exports.search = async (req, res) => {
  try {
    const { find } = req.body;
    const searchExp = new RegExp(find + ".*", "i");
    const user = await User.aggregate([
      {$match: {isactive: "Active"}},
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
      { $addFields: { phone: { $toString: { $toLong: "$phone" } }}},
      { $project: {"category.createdAt": 0, "category.updatedAt": 0, "category.__v": 0}},
      { $match: {$or: [{ 'name': searchExp }, {'phone': searchExp}, { 'email': searchExp }, {'address': searchExp}, {'category.category': searchExp}]}},
      { $addFields: { phone: { $toDouble: { $toLong: "$phone" } } } }
    ])
    return res.status(200).json({
      status: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

//* Category search
exports.catesearch = async (req, res) => {
  try {
    const { find } = req.body;
    const searchExp = new RegExp(find + ".*", "i");
    const user = await Category.find({
      $or: [{ category: searchExp }],
    });
    return res.status(200).json({
      status: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

//* Block List Search
exports.blockSearch = async (req, res) => {
  try {
    const { find } = req.body;
    const searchExp = new RegExp(find + ".*", "ig");
    const block = await Block.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      { $unwind: "$sender" },
      { $unwind: "$receiver" },
      { $addFields: { "sender.phone": { $toString: { $toLong: "$sender.phone" } }, "receiver.phone": { $toString: { $toLong: "$receiver.phone" } }}},
      { $project: { "_id": 1, "sender._id": 1, "sender.name": 1, "sender.phone": 1, "receiver._id": 1, "receiver.name": 1, "receiver.phone": 1, "user_type": 1, "receiver_type": 1, "createdAt": 1 } },
      { $match: { $or: [{ 'sender.name': searchExp }, { 'receiver.name': searchExp }, {"sender.phone": searchExp}, {"receiver.phone": searchExp}, { 'user_type': searchExp }, {'receiver_type': searchExp}] } },
      { $addFields: { "sender.phone": { $toDouble: { $toLong: "$sender.phone" } }, "receiver.phone": { $toDouble: { $toLong: "$receiver.phone" } } } },
      { $sort: { createdAt: -1 } }
    ])
    return res.status(200).json({
      status: true,
      block,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Report List Search
exports.reportSearch = async (req, res) => {
  try {
    const { find } = req.body;
    const searchExp = new RegExp(find + ".*", "ig");
    const report = await Report.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      { $unwind: "$sender" },
      { $unwind: "$receiver" },
      { $addFields: { "sender.phone": { $toString: { $toLong: "$sender.phone" } }, "receiver.phone": { $toString: { $toLong: "$receiver.phone" } }}},
      { $project: { "_id": 1, "sender._id": 1, "sender.name": 1, "sender.phone": 1, "receiver._id": 1, "receiver.name": 1, "receiver.phone": 1, "user_type": 1, "reason": 1, "createdAt": 1 } },
      { $match: { $or: [{ 'sender.name': searchExp }, { 'sender.phone': searchExp }, { 'receiver.name': searchExp }, { 'receiver.phone': searchExp }, { 'user_type': searchExp }, { 'reason': searchExp }] } },
      { $addFields: { "sender.phone": { $toDouble: { $toLong: "$sender.phone" } }, "receiver.phone": { $toDouble: { $toLong: "$receiver.phone" } } } },
      { $sort: { createdAt: -1 } }
    ])
    return res.status(200).json({
      status: true,
      report,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Feedback List Search
exports.feedbackSearch = async (req, res) => {
  try {
    const { find } = req.body;
    const searchExp = new RegExp(find + ".*", "ig");
    const feedback = await FeedBack.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      { $unwind: "$sender" },
      { $unwind: "$receiver" },
      { $project: { "_id": 1, "sender._id": 1, "sender.name": 1, "receiver._id": 1, "receiver.name": 1, "feedback": 1, "comment": 1, "createdAt": 1 } },
      { $match: { $or: [{ 'sender.name': searchExp }, { 'receiver.name': searchExp }, { 'feedback': searchExp }, { 'comment': searchExp }] } },
      { $sort: { createdAt: -1 } }
    ])
    return res.status(200).json({
      status: true,
      feedback,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Search FAQ's
exports.faqSearch = async (req, res) => {
  try {
    const { find } = req.body;
    const searchExp = new RegExp(find + ".*", "ig");
    const faq = await Faqs.find({
      $or: [{ question: searchExp }, { answer: searchExp }]
    }).sort({ createdAt: -1 })
    return res.status(200).json({
      status: true,
      faq
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* Search Role Change request
exports.roleSearch = async (req, res) => {
  try {
    const { find } = req.body;
    const searchExp = new RegExp(find + ".*", "ig");
    const rolechange_request = await RoleChange_Request.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: "$userId" },
      { $addFields: { "userId.phone": { $toString: { $toLong: "$userId.phone" } }}},
      { $project: { "_id": 1, "userId._id": 1, "userId.name": 1, "userId.email": 1, "userId.phone": 1, "user.current_role": 1, "role": 1, "createdAt": 1 } },
      { $match: { $or: [{ 'userId.name': searchExp }, { 'userId.email': searchExp }, { 'userId.phone': searchExp }, { 'reason': searchExp }, { 'role': searchExp }] } },
      { $addFields: { "userId.phone": { $toDouble: { $toLong: "$userId.phone" } } } },
      { $sort: { createdAt: -1 } }
    ])
    return res.status(200).json({
      status: true,
      rolechange_request,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//* General search for admin
exports.generalSearch = async (req, res) => {
  try {
    let data = []
    const { find } = req.body;
    let searchExp = new RegExp("^"+find + ".*", "ig");
    if (find) {
      const user = await User.find({
        $or: [{ name: searchExp }, { email: searchExp }, { $where: `/^${+find}.*/.test(this.phone)` }, { $where: `/^${+find}.*/.test(this.avgrating)` }, { address: searchExp }]
      })
      if (!(user.length == 0)) {
        for await (const doc of user) {
          data.push(doc)
        }
      }
      const category = await Category.find({
        $or: [{ category: searchExp }],
      })
      if (!(category.length == 0)) {
        for await (const doc of category) {
          data.push(doc)
        }
      }
      const block = await Block.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'receiver',
            foreignField: '_id',
            as: 'receiver'
          }
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" },
        { $project: { "_id": 1, "sender._id": 1, "sender.name": 1, "receiver._id": 1, "receiver.name": 1, "user_type": 1, "reason": 1, "createdAt": 1 } },
        { $match: { $or: [{ 'sender.name': searchExp }, { 'receiver.name': searchExp }, { 'user_type': searchExp }, { 'reason': searchExp }] } },
        { $sort: { createdAt: -1 } }
      ])
      if (!(block.length == 0)) {
        for await (const doc of block) {
          data.push(doc)
        }
      }
      const role = await Report.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'receiver',
            foreignField: '_id',
            as: 'receiver'
          }
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" },
        { $project: { "_id": 1, "sender._id": 1, "sender.name": 1, "receiver._id": 1, "receiver.name": 1, "type": 1, "topic": 1, "description": 1, "createdAt": 1 } },
        { $match: { $or: [{ 'sender.name': searchExp }, { 'receiver.name': searchExp }, { 'type': searchExp }, { 'topic': searchExp }, { 'description': searchExp }] } },
        { $sort: { createdAt: -1 } }
      ])
      if (!(role.length == 0)) {
        for await (const doc of role) {
          data.push(doc)
        }
      }
      const feedback = await FeedBack.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'receiver',
            foreignField: '_id',
            as: 'receiver'
          }
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" },
        { $project: { "_id": 1, "sender._id": 1, "sender.name": 1, "receiver._id": 1, "receiver.name": 1, "feedback": 1, "comment": 1, "createdAt": 1 } },
        { $match: { $or: [{ 'sender.name': searchExp }, { 'receiver.name': searchExp }, { 'feedback': searchExp }, { 'comment': searchExp }] } },
        { $sort: { createdAt: -1 } }
      ])
      if (!(feedback.length == 0)) {
        for await (const doc of feedback) {
          data.push(doc)
        }
      }
      const faqs = await Faqs.find({
        $or: [{ question: searchExp }, { answer: searchExp }]
      }).sort({ createdAt: -1 })
      if (!(faqs.length == 0)) {
        for await (const doc of faqs) {
          data.push(doc)
        }
      }
      const contact = await Contact.find({
        $or: [{email: searchExp},{ $where: `/^${+find}.*/.test(this.phone)` }, {address: searchExp}]
      })
      if(!(contact.length == 0)){
        for await(const doc of contact){
          data.push(doc)
        }
      }
      const rolechange_request = await RoleChange_Request.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userId'
          }
        },
        { $unwind: "$userId" },
        { $project: { "_id": 1, "userId._id": 1, "userId.name": 1, "role": 1, "createdAt": 1 } },
        { $match: { $or: [{ 'userId.name': searchExp }, { 'reason': searchExp }, { 'role': searchExp }] } },
        { $sort: { createdAt: -1 } }
      ])
      if(!(rolechange_request.length == 0)){
        for await(const doc of rolechange_request){
          data.push(doc)
        }
      }
      const terms = await TermsCondition.find({
        $or: [{role: searchExp}, {tc: searchExp}]
      })
      if(!(terms.length == 0)){
        for await(const doc of terms){
          data.push(doc)
        }
      }
      const privacy = await Privacy.find({
        $or: [{role: searchExp}, {title: searchExp}, {details: searchExp}]
      })
      if(!(privacy.length == 0)){
        for await(const doc of privacy){
          data.push(doc)
        }
      }
      const recent = await Recent_Activity.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'receiver',
            foreignField: '_id',
            as: 'receiver'
          }
        },
        { $unwind: {path: "$sender", preserveNullAndEmptyArrays: true} },
        { $unwind: {path: "$receiver", preserveNullAndEmptyArrays: true} },
        { $unwind: {path : "$user", preserveNullAndEmptyArrays: true} },
        { $project: { "_id": 1, "user._id": 1, "user.name": 1, "sender._id": 1, "sender.name": 1, "receiver._id": 1, "receiver.name": 1, "role": 1, "activity": 1, "message": 1, "createdAt": 1 } },
        { $match: { $or: [{ 'user.name': searchExp }, { 'sender.name': searchExp }, { 'receiver.name': searchExp }, { 'role': searchExp }, { 'activity': searchExp }, {'message': searchExp}] } },
        { $sort: { createdAt: -1 } }
      ])
      if(!(recent.length == 0)){
        for await(const doc of recent){
          data.push(doc)
        }
      }
      data = data.sort(byDate)
      function byDate(a,b){
        return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
      }
      return res.status(200).json({
        status: true,
        data
      }) 
    } else {
      return res.status(204).json({
        status: true,
        data
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}