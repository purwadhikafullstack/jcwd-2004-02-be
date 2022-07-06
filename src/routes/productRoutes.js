const express = require("express");
const Router = express.Router();

const {
  fetchDaftarProduk,
  fetchUserProduct,
  getLastProduk,
  getCategoryObat,
  getUserCategorySelected,
  addProducts,
  editProducts,
  deleteProducts,
  editProductsPicture,
  editProductsStock,
  deleteProductsStock,
  deleteProductsPicture,
  getComponentObat,
  getSelectedProduct,
  getSelectedProductPicture,
} = require("./../controllers/productControllers");
const upload = require("../lib/upload");

const uploader = upload("/products", "PRODUCT").fields([
  { name: "products", maxCount: 3 },
]);
Router.get("/fetchdaftarproduk", fetchDaftarProduk);
Router.get("/getcategory", getCategoryObat);
Router.post("/addproduct", uploader, addProducts);
Router.patch("/deleteproducts/:id", deleteProducts);
Router.get("/component", getComponentObat);
Router.put("/:id", uploader, editProducts);
Router.post("/pic", uploader, editProductsPicture);
Router.delete("/pic/:id", deleteProductsPicture);
Router.get("/getselectedproduct/:id", getSelectedProduct);
Router.get("/getselectedproductpicture/:id", getSelectedProductPicture);
Router.get("/getlastproduct", getLastProduk);
Router.get("/fetchuserproduct ", fetchUserProduct);
Router.get("/getusercategoryselected/:category_id", getUserCategorySelected);

// Router.put("/:id", uploader, editProducts)
// Router.put("/pic/:product_image_id", uploader, editProductsPicture);
// Router.put("/stock/:stock_id", uploader, editProductsStock);

module.exports = Router;
