require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const morgan = require("morgan");

morgan.token("date", function (req, res) {
  return new Date().toString();
});

app.use(morgan(":method :url :res[content-length] - :response-time ms :date"));

app.use(express.json());

app.use(
  cors({
    exposedHeaders: ["x-total-product", "x-total-count", "x-token-access"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const { productRoutes } = require("./src/routes");
const { authRoutes } = require("./src/routes");

app.use("/adminproduk", productRoutes);
app.use("/auth", authRoutes);

app.listen(PORT, () => console.log(`app jalan di ${PORT}`));

//! COMMENT ABIS DI MERGE

// const db = require("./src/models");

// // middleware log
// const logMiddleware = (req, res, next) => {
//   console.log(req.method, req.url, new Date().toString());
//   next();
// };
// app.use(logMiddleware);

// buat upload foto dan reserve file
