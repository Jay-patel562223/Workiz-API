const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// admin pannel controllers name
const {
  adminsignup,
  adminsignin,
  updatePassword,
  theme,
  isAdminSignedIn,
  AdminByID,
  getAlluser,
  getAdmin,
  upload,
  updateAdmin,
  getuser,
  roleChangeRequestList,
  recentActivity,
  updateRole,
  getUsers,
  deleteUser,
  acceptRequest,
  rejectRequest,
  getAllrequest
} = require("../controllers/adminpanelsignin");

const { count } = require("../controllers/user");
const { unblock, blockList} = require("../controllers/block");
const { getReport } = require("../controllers/report");

router.param("AdminByID", AdminByID);
//signup page (temporary)
router.post(
  "/adminsignup",
  [
    check("name").notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("valid Email is required"),
    check("password").isLength({ min: 6 }).withMessage("Enter atleast 6 digit"),
  ],
  adminsignup
);

//sign in page
router.post(
  "/adminsignin",
  [
    check("name").notEmpty().withMessage("valid Email is required"),
    check("password").isLength({ min: 6 }).withMessage("Enter atleast 6 digit"),
  ],
  adminsignin
);

//update password
router.patch("/updatepassword", isAdminSignedIn, updatePassword);

router.patch("/theme", isAdminSignedIn, theme);

//* Update admin details
const uploadSingleImage = upload.single("photo")
router.patch("/updateadmin", isAdminSignedIn,function (req, res, next) {
  uploadSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).json({ status: false, error: err.message })
    }
    next()
  })
} , updateAdmin);

//*get admin details
router.get("/getadmin", isAdminSignedIn, getAdmin)

//* Get recent activity
router.get("/recentActivity", isAdminSignedIn, recentActivity)

//* Get user Details
router.get("/getuser/:id", isAdminSignedIn, getuser)

//* Accept and Reject user new Account Request
router.get("/getAllRequest", isAdminSignedIn, getAllrequest)
router.delete("/acceptRequest/:id", isAdminSignedIn, acceptRequest)
router.delete("/rejectRequest/:id", isAdminSignedIn, rejectRequest)

//* For Unblock
router.get("/blockList", isAdminSignedIn, blockList)
router.patch("/unblock", isAdminSignedIn, unblock);

//* For Report
router.get("/report", isAdminSignedIn, getReport)

//* Role Change Request
router.get("/roleChangeRequestList", isAdminSignedIn, roleChangeRequestList)
router.patch("/updateRole", isAdminSignedIn, updateRole)

//customer and vendor count(Admin panel)
router.get("/count", isAdminSignedIn, count);

//customer and vendor filter (Admin panel)
router.get("/filterAll", isAdminSignedIn, getAlluser);

//* Delete User
router.delete("/deleteUser/:id", isAdminSignedIn, deleteUser)

//*Get all Deactive Users
router.get("/getDeactiveUsers", isAdminSignedIn, getUsers)
//* Delete Deactive users
router.delete("/deleteDeactiveUsers/:id", isAdminSignedIn, deleteUser)


//exports router
module.exports = router;
