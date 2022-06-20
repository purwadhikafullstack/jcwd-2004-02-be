const express = require("express");
const { verifyTokenAccess } = require("../lib/verifyToken");
const Router = express.Router();
const { productControllers } = require("../controllers");
const { addProducts, editProducts, deleteProducts } = productControllers;
const upload = require("../lib/upload");
const {
  editProductsPicture,
  editProductsStock,
  deleteProductsStock,
  getComponentObat,
} = require("../controllers/productControllers");

const uploader = upload("/products", "PRODUCT").fields([
  { name: "products", maxCount: 3 },
]);
// const validateAdmin = (req, res, next) => {
//   if (req.user.roles_id === 1) {
//     // admin roles_idnya 1
//     next();
//   } else {
//     return res.status(401).send({ message: "user unauthorized" });
//   }
// };
// const validateUser = (req, res, next) => {
//   if (req.user.roles_id === 2) {
//     // user roles_idnya 2
//     next();
//   } else {
//     return res.status(401).send({ message: "user unauthorized" });
//   }
// };

// Router.post("/", verifyTokenAccess, validateAdmin, uploader, addProducts);
Router.post("/addproduct", uploader, addProducts);
Router.put("/:id", uploader, editProducts);
Router.put("/pic/:product_image_id", uploader, editProductsPicture);
Router.put("/stock/:stock_id", uploader, editProductsStock);
Router.patch("/deleteproducts/:id", deleteProducts);
Router.get("/component", getComponentObat);

module.exports = Router;
