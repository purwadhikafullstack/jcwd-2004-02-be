// encrypsi by crypto nodejs
const crypto = require("crypto");

module.exports = (password) => {
  // puripuriprisoner adalah kunci untuk hashing
  let hashing = crypto
    .createHmac("sha256", "puripuriprisoner")
    .update(password)
    .digest("hex");
  return hashing;
};
