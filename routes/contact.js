const express = require("express");
const {
  isSignedIn,
  isAdminSignedIn,
} = require("../controllers/adminpanelsignin");
const router = express.Router();
const {
  addcontact,
  getcontact,
  updatecontact,
  getContactById,
  deleteContact,
} = require("../controllers/contact");

//Checking ID
// router.param("ContactByID", getContactById);

//Add Contact
router.post("/admin/addcontact", isAdminSignedIn, addcontact);

//Update Contact
router.patch("/admin/updatecontact/:id", isAdminSignedIn, updatecontact);

//Get Contact for user
router.get("/user/getcontact", isSignedIn, getcontact);

//* Get Contact us for admin
router.get("/admin/getcontact", isAdminSignedIn, getcontact);

//* Delete Contact us
router.delete("/admin/deletecontact/:id", isAdminSignedIn, deleteContact)

module.exports = router;
