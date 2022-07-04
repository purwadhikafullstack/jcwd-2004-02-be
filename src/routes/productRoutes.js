const express = require("express");
const Router = express.Router();

const {
  getDaftarProductController,
  getUserProduct,
  getLastProduct,
  getCategoryObat,
  getUserCategorySelected,
  addProducts,
  editProducts,
  deleteProducts,
  editProductsPicture,
  editProductsStock,
  deleteProductsStock,
  getComponentObat,
  getDetailProductController,
} = require("./../controllers/productControllers");
const upload = require("../lib/upload");

const uploader = upload("/products", "PRODUCT").fields([
  { name: "products", maxCount: 3 },
]);

Router.get("/fetchdaftarproduk", getDaftarProductController);
Router.get("/getcategory", getCategoryObat);
Router.post("/addproduct", uploader, addProducts);
Router.patch("/deleteproducts/:id", deleteProducts);
Router.get("/component", getComponentObat);
Router.get("/getlastproduct", getLastProduct);
Router.get("/fetchuserproduct", getUserProduct);
Router.get("/getusercategoryselected/:category_id", getUserCategorySelected);
Router.get("/getdetailproduct/:product_id", getDetailProductController);
// Router.put("/:id", uploader, editProducts)
// Router.put("/pic/:product_image_id", uploader, editProductsPicture);
// Router.put("/stock/:stock_id", uploader, editProductsStock);

module.exports = Router;
