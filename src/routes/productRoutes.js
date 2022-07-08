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
  getSelectedProductStock,
  editProductsStock,
  deleteProductsStock,
  deleteProductsPicture,
  getComponentObat,
  getDetailProductController,
  addToCartController,
  getProdukTerkaitController,
  getSelectedProduct,
  getSelectedProductPicture,
} = require("./../controllers/productControllers");
const upload = require("../lib/upload");

const uploader = upload("/products", "PRODUCT").fields([
  { name: "products", maxCount: 3 },
]);

const { verifyTokenAccess } = require("../lib/verifyToken");

Router.get("/fetchdaftarproduk", getDaftarProductController);
Router.get("/getcategory", getCategoryObat);
Router.post("/addproduct", uploader, addProducts);
Router.patch("/deleteproducts/:id", deleteProducts);
Router.get("/component", getComponentObat);
Router.get("/getlastproduct", getLastProduct);
Router.get("/fetchuserproduct", getUserProduct);
Router.get("/getusercategoryselected/:category_id", getUserCategorySelected);
Router.get("/getdetailproduct/:product_id", getDetailProductController);
Router.post("/addtocart", verifyTokenAccess, addToCartController);
Router.get("/getprodukterkait", getProdukTerkaitController);
Router.put("/:id", uploader, editProducts);
Router.post("/pic", uploader, editProductsPicture);
Router.delete("/pic/:id", deleteProductsPicture);
Router.get("/getselectedproduct/:id", getSelectedProduct);
Router.get("/getselectedproductpicture/:id", getSelectedProductPicture);
Router.get("/getlastproduct", getLastProduct);
// Router.get("/fetchuserproduct ", fetchUserProduct);
Router.get("/getusercategoryselected/:category_id", getUserCategorySelected);
Router.get("/stock/:id", getSelectedProductStock);
Router.delete("/stock/edit/:id", deleteProductsStock);
Router.put("/stock/edit/:id", editProductsStock);

module.exports = Router;
