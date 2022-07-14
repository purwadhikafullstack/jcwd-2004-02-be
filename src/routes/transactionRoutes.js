const express = require("express");
const Router = express.Router();
const { transactionControllers } = require("../controllers");
const {
  getAllAddress,
  defaultAddress,
} = require("../controllers/transactionControllers");
const {
  addToCart,
  deleteCart,
  getDataCart,
  getCities,
  getProvinces,
  addAddress,
  plusCart,
  minCart,
  getAddress,
  uploadPayment,
  userCheckout,
  getUserTransactionController,
  getDetailTransactionController,
  getAllTransactionController,
} = transactionControllers;
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const upload = require("../lib/upload");

const uploader = upload("/payment", "PAYMENT").fields([
  { name: "payment", maxCount: 3 },
]);

Router.post("/addToCart", verifyTokenAccess, addToCart);
Router.delete("/deleteCart", verifyTokenAccess, deleteCart);
Router.get("/getDataCart", verifyTokenAccess, getDataCart);
Router.put("/plusCart", verifyTokenAccess, plusCart);
Router.put("/minCart", verifyTokenAccess, minCart);
Router.get("/getCities/:province_id", getCities);
Router.get("/getProvinces", getProvinces);
Router.post("/addAddress", verifyTokenAccess, addAddress);
Router.get("/getAddress", verifyTokenAccess, getAddress);
Router.get("/getAllAddress", verifyTokenAccess, getAllAddress);
Router.put("/defaultAddress/", verifyTokenAccess, defaultAddress);
Router.post("/userCheckout", verifyTokenAccess, userCheckout);
Router.put("/uploadPayment", verifyTokenAccess, uploader, uploadPayment);
Router.get(
  "/getusertransaction",
  verifyTokenAccess,
  getUserTransactionController
);
Router.get(
  "/getdetailtransaction/:transaction_id",
  verifyTokenAccess,
  getDetailTransactionController
);
Router.get(
  "/getalltransaction",
  verifyTokenAccess,
  getAllTransactionController
);

module.exports = Router;
