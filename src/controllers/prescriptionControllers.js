const { dbCon } = require("../connections");
const fs = require("fs");
const { customAlphabet } = require("nanoid");
const dayjs = require("dayjs");
const nanoid = customAlphabet("1234567890ABCDEF", 4);
const { DateConverter } = require("../lib/dateconverter");
const nanoidPres = customAlphabet("1234567890", 5);

module.exports = {
  addPrescriptionPic: async (req, res) => {
    console.log(req.files);
    let path = "/prescription";

    const { prescription } = req.files;
    const imagepath = prescription
      ? `${path}/${prescription[0].filename}`
      : null;
    // if (!imagepath) {
    //   return res.status(500).send({ Message: "foto tidak ada" });
    // }

    const { id } = req.user;
    console.log(id, "id");
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql =
        " select transaction.user_id, transaction.id, transaction.status, transaction.recipient, transaction.transaction_number, transaction.address, address.address, address.firstname  FROM transaction LEFT JOIN address ON transaction.user_id = address.user_id";
      await conn.query(sql, [id]);

      sql = "select * from address where user_id =?";
      let [result] = await conn.query(sql, [id]);

      // insert data to transaction table biar bisa isi prescription
      sql = `insert into transaction set ?`;

      let insertData = {
        status: 1,
        recipient: result[0].firstname,
        transaction_number:
          "HLTM-" + DateConverter(new Date()) + "-" + nanoid(),
        address: result[0].address,
        user_id: id,
        courier: "Grab - Same Day",
        expired_at: dayjs(new Date())
          .add(1, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };

      let [resultTrans] = await conn.query(sql, insertData);

      console.log(resultTrans, "restrans");
      let transId = resultTrans.insertId;

      // insert data prescription ambil id dari transaction
      sql = `insert into prescription set ?`;
      let insertDataImage = {
        image: imagepath,
        transaction_id: transId,
        prescription_number: "PR-" + nanoidPres(),
        status: 1,
        user_id: id,
      };
      if (insertDataImage.length) {
        throw { message: "File ini melebihi 2MB atau format tidak sesuai!" };
      }
      console.log(insertDataImage, "idi");
      await conn.query(sql, insertDataImage);

      console.log("berhasil tambah");

      await conn.commit();
      conn.release();
      return res.status(200).send({ message: " berhasil tambah prescription" });
    } catch (error) {
      await conn.rollback();
      conn.release();
      if (imagepath) {
        // kalo foto terupload dan update sql gagal maka masuk sini
        fs.unlinkSync("./public" + imagepath);
      }
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
};
