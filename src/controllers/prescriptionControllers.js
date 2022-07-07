const { dbCon } = require("../connections");
const fs = require("fs");
// const { nanoid } = require("nanoid");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdef", 10);

module.exports = {
  // insert table transaction (status)
  // insert table prescription where id = transaction_id (foto, no resep, dll)

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
      // get data untuk hapus imagepath foto lama
      // sql = "select * from prescription where id =?";
      // let [result] = await conn.query(sql, [id]);
      // // masuk sini kalo gaada usernya
      // console.log(result);
      // if (!result.length) {
      //   throw { message: "user tidak ditemukan" };
      // }

      sql =
        " SELECT transaction.user_id, transaction.id, transaction.status, transaction.recipient, transaction.transaction_number, transaction.address, address.address, address.firstname  FROM transaction LEFT JOIN address ON transaction.user_id = address.user_id";
      let [resultjoin] = await conn.query(sql, [id]);
      // masuk sini kalo gaada usernya
      // console.log(resultjoin);
      sql = "select * from address where user_id =?";
      let [result] = await conn.query(sql, [id]);
      // masuk sini kalo gaada usernya

      // insert data to transaction table biar bisa isi prescription
      sql = `insert into transaction set ?`;
      console.log(result[0].address, "ini result");
      let insertData = {
        status: 1,
        recipient: result[0].firstname,
        transaction_number: nanoid(),
        address: result[0].address,
        user_id: id,
      };

      let [resultTrans] = await conn.query(sql, insertData);

      console.log(resultTrans, "restrans");
      let transId = resultTrans.insertId;

      // insert data prescription ambil id dari transaction
      sql = `insert into prescription set ?`;
      let insertDataImage = {
        image: imagepath,
        transaction_id: transId,
        prescription_number: nanoid(),
        status: 1,
        user_id: id,
      };
      console.log(insertDataImage, "idi");
      await conn.query(sql, insertDataImage);

      // sql = "insert into prescription set ?";
      // let update = {
      //   image: imagepath,
      //   prescription_number: 1,
      // };
      // await conn.query(sql, [update, id]);
      // kalo lewat sini berarti berhasil
      console.log("berhasil tambah");

      conn.release();
      return res.status(200).send({ message: " berhasil tambah prescription" });
    } catch (error) {
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
