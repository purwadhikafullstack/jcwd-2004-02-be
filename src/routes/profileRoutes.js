const express = require("express");
const { verifyTokenAccess } = require("../lib/verifyToken");
const Router = express.Router();
const { profileControllers } = require("./../controllers");
const { editProfilePic, editProfile, getAddress } = profileControllers;
const upload = require("../lib/upload");

const uploader = upload("/profile", "PROFILE").fields([
  { name: "profilepic", maxCount: 3 },
]);
Router.put("/profilepic", verifyTokenAccess, uploader, editProfilePic);
Router.put("/editprofile", verifyTokenAccess, editProfile);
Router.get("/address", verifyTokenAccess, getAddress);

module.exports = Router;
