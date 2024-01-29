const express = require("express");
const router = express.Router();
const { isAdminSignedIn, isSignedIn } = require("../controllers/adminpanelsignin");
const { addReason, getReason, updateReason, deleteReason, getAllReason } = require("../controllers/reason");

//*Get reason For user
router.post("/user/getAllReason", isSignedIn, getAllReason)

//* For Admin
router.post("/admin/reason/create", isAdminSignedIn, addReason)
router.get("/admin/reason/show", isAdminSignedIn, getReason)
router.patch("/admin/reason/update/:id", isAdminSignedIn, updateReason)
router.delete("/admin/reason/delete/:id", isAdminSignedIn, deleteReason)

module.exports = router