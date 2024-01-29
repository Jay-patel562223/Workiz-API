const { validationResult } = require("express-validator");

//model declaration
const Category = require("../model/categories");
const Recent_Activity = require("../model/activity")
const User = require("../model/user");

// create category
exports.createCategories = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (errors.array().length > 0) {
      return res.status(422).json({
        status: "error",
        error: errors.array()[0].msg
      });
    }

    const category = new Category(req.body);
    await category.save();
    return res.status(201).json({
      status: "success",
      message: "Category created",
      category: category,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

//get all category for User
exports.getAllCategories = (req, res) => {
  try {
    Category.find().sort({ createdAt: -1 }).exec((error, category) => {
      if (error) {
        return res.status(204).json({
          status: "error",
          error: "category not found",
        });
      }
  
      res.status(200).json({ status: "success", category });
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    })
  }
};

//get all category for Admin
exports.getAllAdminCategories = async (req, res) => {
  try {
    let data = []
    const categories = await Category.find().sort({ createdAt: -1 })
    for await(const doc of categories){
      const find = await User.findOne({category: doc.id, "role.vendor": true, isactive: "Active"}).sort({ createdAt: -1 })
      const category = {
        _id: doc.id,
        category: doc.category,
        isactive: doc.isactive,
        flag: find ? true : false,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }
      data.push(category)
    }
    return res.status(200).json({
      status: true,
      category: data
    })
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
}

//get any category using id
exports.getCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const categories = await Category.find({ category: category });
    return res.status(200).json({ status: true, categories });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

// update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { category, isactive } = req.body;

    if(!isactive){
      const findUser = await User.findOne({category: id, isactive: "Active"})
      if(findUser){
        return res.status(405).json({
          status: false,
          message: "User with this category is available, you can't Deactive this category!"
        })
      }
    }
  
    const categorys = await Category.findByIdAndUpdate(
      id,
      {
        category: category,
        isactive: isactive,
      },
      {
        new: true,
      }
    );
    if (!categorys) {
      return res.status(304).json({
        status: false,
        error: "error in update category",
      });
    }
    return res.status(200).json({ status: true, category: categorys }); 
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

// remove category
exports.removeCategory = async (req, res) => {
  try {
    const { id } = req.params
    const findUser = await User.findOne({category: id, isactive: "Active"})
    if(findUser){
      return res.status(405).json({
        status: false,
        message: "User with this category is available, you can't Delete this category!"
      })
    }
    await Category.findByIdAndDelete(id)
      .then(async () => {
        return res.status(200).json({
          status: true,
          message: "Category Remove Successfully",
        });
      })
      .catch((error) => {
        return res.status(500).json({
          status: false,
          error: error.message
        });
      }); 
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    })
  }
};

// for checking id of category
exports.getCategoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, cate) => {
    if (err) {
      res.status(422).json({
        status: "error",
        error: "Not Find Category",
      });
    }
    req.category = cate;
    next();
  });
};
