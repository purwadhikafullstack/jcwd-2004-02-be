const jwt = require("jsonwebtoken");

module.exports = {
  createJwtAccess: (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "8h" });
  },
  createJwtEmail: (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "8h" });
  },
};
