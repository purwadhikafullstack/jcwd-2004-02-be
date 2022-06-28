const { dbCon } = require("../connections");
const fs = require("fs");

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

      // insert data to transaction table biar bisa isi prescription
      sql = `insert into transaction set ?`;
      let insertData = {
        status: 1,
        recipient: "me",
        transaction_number: "12345",
        address: "kutilang 1",
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
        prescription_number: 1,
        quantity: 10,
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
