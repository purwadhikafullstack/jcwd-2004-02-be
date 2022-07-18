const express = require("express");
const Router = express.Router();
const { reportControllers } = require("../controllers");
const {
  salesReport,
  penjualanObat,
  profit,
  ringkasanStatistik,
  ringkasanChart,
} = reportControllers;

Router.get("/salesreport", salesReport);
Router.get("/penjualanobat", penjualanObat);
Router.get("/profit", profit);
Router.get("/summary", ringkasanStatistik);
Router.get("/summary/chart", ringkasanChart);

module.exports = Router;
