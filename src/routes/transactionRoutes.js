const express = require("express");
const { verifyTokenAccess } = require("../lib/verifyToken");
const Router = express.Router();
const {
  getObat,
  getPrescription,
  submitPrescription,
} = require("./../controllers/transactionControllers");

Router.get("/product", getObat);
Router.get("/pic/:transaction_id", getPrescription);
Router.put("/submit/:transaction_id", submitPrescription);

module.exports = Router;
