const jwt = require("jsonwebtoken");

module.exports = {
  verifyTokenAccess: async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    let token;
    console.log("ini auth header", authHeader);

    if (authHeader) {
      token = authHeader.split(" ")[1] ? authHeader.split(" ")[1] : authHeader;
      console.log(token);
    } else {
      token = null;
    }
    console.log("ini token", token);
    let key = process.env.JWT_SECRET;
    try {
      let decode = await jwt.verify(token, key);
      req.user = decode;
      next();
    } catch (error) {
      console.log("ini error ya", error);
      return res.status(401).send({ message: "user unauthorized" });
    }
  },
  verifyTokenEmail: async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    let token;
    console.log(authHeader);
    if (authHeader) {
      token = authHeader.split(" ")[1] ? authHeader.split(" ")[1] : authHeader;
      console.log(token);
    } else {
      token = null;
    }
    let key = process.env.JWT_SECRET;
    try {
      let decode = await jwt.verify(token, key);
      req.user = decode;
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).send({ message: "user unauthorized" });
    }
  },
};
