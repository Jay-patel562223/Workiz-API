const express = require("express");
const { isSignedIn } = require("../controllers/adminpanelsignin");
const router = express.Router();

//message controllers
const {
  addMessage,
  getAllMessage,
  AllPerson,
  upload,
  deleteMessage,
  checkUser,
  clearChat,
  getMedia,
} = require("../controllers/message");

//add message and show message
const uploadSingleImage = upload.single("file")
router.post("/addmessage", isSignedIn,function (req, res, next) {
  uploadSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).json({ status: false, error: err.message })
    }
    next()
  })
}, addMessage);

//* Get All messages
router.post("/getAllMessage", isSignedIn, getAllMessage);

//* List chat person
router.post("/getAllPerson", isSignedIn, AllPerson);

//* Clear Chat
router.patch("/clearChat", isSignedIn, clearChat)

//* Delete User from chat list
router.delete("/messageList/deleteUser", isSignedIn, deleteMessage)

//* check Deleted User
router.post("/checkUser", isSignedIn, checkUser)

//* Get Media chat for particular user
router.post("/getMedia", isSignedIn, getMedia)

module.exports = router;