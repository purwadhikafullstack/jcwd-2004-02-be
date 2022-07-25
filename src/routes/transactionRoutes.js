const express = require("express");
const Router = express.Router();
const { transactionControllers } = require("../controllers");
const {
  getAllAddress,
  defaultAddress,
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
  getObat,
  getPrescription,
  submitPrescription,
  getBank,
  acceptPayment,
  rejectPayment,
  getWaitingPaymentByTransactionId,
  getShippingCost,
  getProductLogController,
  sendOrderController,
  receiveOrderController,
} = transactionControllers;

const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const upload = require("../lib/upload");

const uploader = upload("/payment", "PAYMENT").fields([
  { name: "payment", maxCount: 3 },
]);

Router.post("/addToCart", verifyTokenAccess, addToCart);
Router.delete("/deleteCart/:cart_id", verifyTokenAccess, deleteCart);
Router.get("/getDataCart", verifyTokenAccess, getDataCart);
Router.put("/plusCart/:cart_id", verifyTokenAccess, plusCart);
Router.put("/minCart/:cart_id", verifyTokenAccess, minCart);
Router.get("/getCities/:province_id", getCities);
Router.get("/getProvinces", getProvinces);
Router.post("/addAddress", verifyTokenAccess, addAddress);
Router.get("/getAddress", verifyTokenAccess, getAddress);
Router.get("/getAllAddress", verifyTokenAccess, getAllAddress);
Router.put("/defaultAddress/", verifyTokenAccess, defaultAddress);
Router.post("/userCheckout", verifyTokenAccess, userCheckout);
Router.put("/uploadPayment", verifyTokenAccess, uploader, uploadPayment);

Router.delete("/deleteCart/:cart_id", verifyTokenAccess, deleteCart);
Router.get("/getBank", getBank);
Router.put("/acceptPayment/:transaction_id", acceptPayment);
Router.post("/rejectPayment/:transaction_id", rejectPayment);
Router.get("/getShippingCost", getShippingCost);
Router.get(
  "/waitingPayment/:transaction_id",
  verifyTokenAccess,
  getWaitingPaymentByTransactionId
);

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
Router.get("/getproductlog/:product_id", getProductLogController);
Router.get("/product", getObat);
Router.get("/pic/:transaction_id", getPrescription);
Router.put("/submit/:transaction_id", submitPrescription);
Router.patch(
  "/sendorder/:transaction_id",
  verifyTokenAccess,
  sendOrderController
);
Router.patch(
  "/receiveorder/:transaction_id",
  verifyTokenAccess,
  receiveOrderController
);

module.exports = Router;
