const express = require("express");
const Router = express.Router();
const { reportControllers } = require("../controllers");
const { salesReport, penjualanObat, profit, ringkasanStatistik } =
  reportControllers;

Router.get("/salesreport", salesReport);
Router.get("/penjualanobat", penjualanObat);
Router.get("/profit", profit);
Router.get("/summary", ringkasanStatistik);

module.exports = Router;
