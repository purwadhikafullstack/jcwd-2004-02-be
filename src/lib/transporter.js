const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dinotestes12@gmail.com",
    pass: "pyicxrbtyoskvwep",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;

// let transporter = createTransport({
//   host: "your domain mail server",
//   port: 587, // 465 //587 //mo
//   secure: false,
//   auth: {
//     user: "your email in mail serverd",
//     pass: "password lu",
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });
