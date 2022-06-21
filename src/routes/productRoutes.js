const express = require("express");
const Router = express.Router();

const {
  fetchDaftarProduk,
  getComponentObat,
} = require("./../controllers/productControllers");

Router.get("/fetchdaftarproduk", fetchDaftarProduk);
Router.get("/component", getComponentObat);
module.exports = Router;
