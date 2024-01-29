const multer = require("multer");
const Test = require('../model/test')

exports.testImage = async(req,res)=>{
    try {
        if(!req.file){
            return res.status(404).json({
                status: "error",
                error: "Please upload a Image"
            })
        }
        const imageUpload = await Test.create({
            image: 'http://181.215.78.241:5000/' + req.file.path.replace(/\\/g, "/")
        })
        return res.status(201).json({
            status:"Success",
            imageUpload
        })
    } catch (error) {
        return res.status(500).json({
            status: "error",
            error: error.message
        })
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Uploads is the Upload_folder_name
      cb(null, "profile/test");
    },
    filename: function (req, file, cb) {
      const type = file.mimetype.split("/")[1];
      // console.log(type)
      cb(null, Date.now() + "." + type);
    },
  });
  
  exports.upload = multer({
    storage: storage,
    limits: {
      fileSize: 50000000, //byte
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
        return cb(new Error("Please upload a Image"));
      }
      cb(undefined, true);
    },
  });