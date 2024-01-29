const express = require("express");
const router = express.Router();

//user controllers
const {
  // getUserById,
  signup,
  // signin,
  getdetailsUser,
  removeUser,
  getAllUser,
  getUser,
  choose,
  card,
  changeNumber,
  nearLocation,
  isactive,
  isactiveCategory,
  isdeactiveCategory,
  catesearch,
  roleChangeRequest,
  deleteUser,
  switchUser,
  checkNumber,
  logoutUser,
  addCard,
} = require("../controllers/user");

//checking token
const { isSignedIn, upload } = require("../controllers/adminpanelsignin");

//Cheking ID
// router.param("UserByID", getUserById);

//Signup
router.post("/signup", signup);

//sign in
// router.post("/signin", signin);

//get user details
const uploadSingleImage = upload.single("photo")
router.put(
  "/updateuser",
  isSignedIn,
  function (req, res, next) {
    uploadSingleImage(req, res, function (err) {
      if (err) {
        return res.status(400).json({ status: false, error: err.message })
      }
      next()
    })
  },
  getdetailsUser
);

//vendor or customer
router.patch("/choose", isSignedIn, choose);

//* Switch User
router.patch("/switchUser", isSignedIn, switchUser)

//from app user can delete account
router.delete("/removeuser", isSignedIn, removeUser);

//get details of all user
router.post("/getAllUser", isSignedIn, getAllUser);

//get details of single user
router.post("/getUser", isSignedIn, getUser);

//* user want to change number
router.post("/checkNumber", isSignedIn, checkNumber)
router.patch("/changenumber", isSignedIn, changeNumber);

//Upload vendor cards and address
const uploadArrayImage = upload.array("card", 2)
router.put("/updatecards", isSignedIn,function (req, res, next) {
  uploadArrayImage(req, res, function (err) {
    if (err) {
      return res.status(400).json({ status: false, error: err.message })
    }
    next()
  })
}, card);

//* Add second card for Flutter
router.put("/addCard", isSignedIn, upload.fields([{name:"frontsideCard", maxCount:1},{name:"backsideCard",maxCount:1}]), addCard) 

//User is Active or Not
router.patch("/active", isSignedIn, isactive);

router.post("/nearlocation", isSignedIn, nearLocation);

router.get("/isactive", isSignedIn, isactiveCategory);
router.get("/isdeactive", isSignedIn, isdeactiveCategory);

router.post("/searchCategory", isSignedIn, catesearch);

//* Role Change Request
router.post("/roleChangeRequest", isSignedIn, roleChangeRequest)

//* Delete User Account
router.delete("/deteleuser", isSignedIn, deleteUser)

//* Logout user
router.get("/logout", isSignedIn, logoutUser)

module.exports = router;
