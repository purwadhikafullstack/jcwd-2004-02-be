const express = require("express");
const Router = express.Router();
const { reportControllers } = require("../controllers");
const {
  salesReport,
  penjualanObat,
  profit,
  ringkasanStatistik,
  ringkasanChart,
  ringkasanProfitLoss,
} = reportControllers;

Router.get("/salesreport", salesReport);
Router.get("/penjualanobat", penjualanObat);
Router.get("/profit", profit);
Router.get("/summary", ringkasanStatistik);
Router.get("/summary/chart", ringkasanChart);
Router.get("/report", ringkasanProfitLoss);

module.exports = Router;
