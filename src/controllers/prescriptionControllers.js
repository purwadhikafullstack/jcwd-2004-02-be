const { dbCon } = require("../connections");
const fs = require("fs");

module.exports = {
  addPrescriptionPic: async (req, res) => {
    console.log(req.files);
    let path = "/prescription";

    const { image } = req.files;
    const imagepath = image ? `${path}/${image[0].filename}` : null;
    // if (!imagepath) {
    //   return res.status(500).send({ Message: "foto tidak ada" });
    // }
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      // get data untuk hapus imagepath foto lama
      sql = "select * from prescription where id =?";
      let [result] = await conn.query(sql, [req.user.id]);
      // masuk sini kalo gaada usernya
      console.log(result);
      if (!result.length) {
        throw { message: "user tidak ditemukan" };
      }
      sql = "insert prescription set ? where id=?";
      let update = {
        image: imagepath,
      };
      await conn.query(sql, [update, req.user.id]);
      // kalo lewat sini berarti berhasil
      console.log("berhasil update");

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
