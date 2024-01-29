const mongoose = require("mongoose");
// const ObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: Number,
      trim: true,
      unique: true,
    },

    role: {
      customer: { type: Boolean, default: false },
      vendor: { type: Boolean, default: false },
    },
    current_role: {
      type : String,
      enum: ["customer", "vendor"]
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },

    photo: {
      type: String,
      default: "",
    },

    card: {
      type: [String],
    },

    isactive: {
      type: String,
      enum: ["Active", "Deactive"],
      default: "Active",
    },

    location: {
      type: { type: String },
      coordinates: [],
    },
    avgrating: {
      type: Number,
      default: 0,
    },
    is_online:{
      type:String,
      enum: ["0", "1"],
      default:'0'
    },
    customer_chat: {
      type: Array, 
    },
    vendor_chat: {
      type: Array, 
    },
    fcm_token: {
      type: String,
      default: "",
    },
    notification: {
      type:String,
      enum: ["on", "off"],
      default:"on"
    },
    user_notification_off:{
      type: Array
    },
    reason: {
      customer: { type: String, default: "" },
      vendor: { type: String, default: "" },
    },
    token: {
      type: String
    }
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
