const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// category controllers name
const {
  createCategories,
  getAllCategories,
  getCategoryById,
  getCategory,
  updateCategory,
  removeCategory,
  getAllAdminCategories,
} = require("../controllers/categories");

// token check
const {isSignedIn, isAdminSignedIn} = require('../controllers/adminpanelsignin')

//Checking Id
// router.param("categoryId", getCategoryById);


//get All category
router.get("/user/category", isSignedIn,getAllCategories);
router.get("/admin/category", isAdminSignedIn, getAllAdminCategories);

//get category 
router.get("/admin/getcategory", isAdminSignedIn,getCategory);

//create category
router.post(
  "/admin/category/create",
  [check("category").notEmpty().withMessage("Please add Category name")],
  isAdminSignedIn,
  createCategories
);

//update category
router.patch("/admin/updatecategory/:id", isAdminSignedIn, updateCategory);

//remove cateogry
router.delete("/admin/deletecategory/:id", isAdminSignedIn, removeCategory);


//router export
module.exports = router;
