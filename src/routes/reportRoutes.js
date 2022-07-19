const express = require("express");
const Router = express.Router();
const { reportControllers } = require("../controllers");
const { salesReport, penjualanObat, profit } = reportControllers;

Router.get("/salesreport", salesReport);
Router.get("/penjualanobat", penjualanObat);
Router.get("/profit", profit);

module.exports = Router;
