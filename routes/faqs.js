const express = require("express");
const { isSignedIn, isAdminSignedIn } = require("../controllers/adminpanelsignin");
const router = express.Router();

//controllers of FAQ's
const {
  addFaqs,
  getAllFaqs,
  faqsByID,
  updateFaqs,
  removeFaqs,
} = require("../controllers/faqs");

//Checking ID
router.param("faqByID", faqsByID);

//Add FAQ's
router.post("/admin/addfaqs", isAdminSignedIn, addFaqs);


//Here get only one question and all question
// router.get("/faqs/:faqByID", isSignedIn, getFaqs);
router.get("/user/getallfaqs", isSignedIn, getAllFaqs);
router.get("/admin/getallfaqs", isAdminSignedIn, getAllFaqs);

//* Update FAQ's Question
router.patch("/admin/faqs/update/:id", isAdminSignedIn, updateFaqs);

//Delete FAQs Question
router.delete("/admin/faqs/:id", isAdminSignedIn, removeFaqs);

module.exports = router;
