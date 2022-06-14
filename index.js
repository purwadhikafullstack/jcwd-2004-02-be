require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;
// const db = require("./src/models");

// const { products, variaties } = db;

// middleware log
const logMiddleware = (req, res, next) => {
  console.log(req.method, req.url, new Date().toString());
  next();
};

// main();

// buat mengijinkan fronetnd akses backend
app.use(
  cors({
    exposedHeaders: ["x-total-count"],
  })
);
// buat mengaktifkan req.body method post,put,patch
// untuk ngirim data
// app.use : pemasangan middleware global
app.use(express.json());
// buat upload foto dan reserve file
app.use(express.urlencoded({ extended: false }));
app.use(logMiddleware);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.status(200).send({ message: "ini API MATOA 1.0" });
});

const { productsRoutes } = require("./src/routes");

app.use("/products", productsRoutes);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
