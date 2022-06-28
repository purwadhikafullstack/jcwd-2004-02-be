const express = require("express");
const { verifyTokenAccess } = require("../lib/verifyToken");
const Router = express.Router();
const { prescriptionControllers } = require("./../controllers");
const upload = require("../lib/upload");

const uploader = upload("/prescription", "PRESCRIPTION").fields([
  { name: "prescription", maxCount: 3 },
]);

// Router.put("/profilepic", verifyTokenAccess, uploader, editProfilePic);
// Router.put("/editprofile", verifyTokenAccess, editProfile);

module.exports = Router;
