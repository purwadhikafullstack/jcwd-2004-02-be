const express = require("express");
const { verifyTokenAccess } = require("../lib/verifyToken");
const Router = express.Router();
const {
  addPrescriptionPic,
} = require("./../controllers/prescriptionControllers");
const upload = require("../lib/upload");

const uploader = upload("/prescription", "PRESCRIPTION").fields([
  { name: "prescription", maxCount: 3 },
]);

Router.post(
  "/prescriptionpic",
  verifyTokenAccess,
  uploader,
  addPrescriptionPic
);

module.exports = Router;
