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
  getSelectedProductStockDetail,
  addProductsStock,
} = require("./../controllers/productControllers");
const upload = require("../lib/upload");

const uploader = upload("/products", "PRODUCT").fields([
  { name: "products", maxCount: 3 },
]);

const { verifyTokenAccess } = require("../lib/verifyToken");

Router.get("/fetchdaftarproduk", getDaftarProductController);
Router.get("/getcategory", getCategoryObat);
Router.post("/addproduct", uploader, verifyTokenAccess, addProducts);
Router.patch("/deleteproducts/:id", deleteProducts);
Router.get("/component", getComponentObat);
Router.get("/getlastproduct", getLastProduct);
Router.get("/fetchuserproduct", getUserProduct);
Router.get("/getusercategoryselected/:category_id", getUserCategorySelected);
Router.get("/getdetailproduct/:product_id", getDetailProductController);
Router.post("/addtocart", verifyTokenAccess, addToCartController);
Router.get("/getprodukterkait", getProdukTerkaitController);

Router.put("/:id", uploader, verifyTokenAccess, editProducts);
Router.post("/pic", uploader, editProductsPicture);
Router.delete("/pic/:id", deleteProductsPicture);
Router.get("/product/:id", getSelectedProduct);
Router.get("/productpic/:id", getSelectedProductPicture);
Router.get("/stock/:id", getSelectedProductStock);
Router.get("/stock/edit/:id", getSelectedProductStockDetail);
Router.delete(
  "/stock/delete/:stock_id",
  verifyTokenAccess,
  deleteProductsStock
);
Router.put("/stock/edit/:stock_id", verifyTokenAccess, editProductsStock);
Router.post("/stock/add/:product_id", verifyTokenAccess, addProductsStock);

module.exports = Router;
