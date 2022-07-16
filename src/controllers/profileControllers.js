const { dbCon } = require("../connections");
const fs = require("fs");

module.exports = {
  editProfile: async (req, res) => {
    const { name, gender, birthdate } = req.body;
    const { id } = req.user;
    let birthDate1 = Date.parse(birthdate) / 1000;

    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = "update users set ? where id = ?";
      let update = {
        name: name,
        gender: gender,
      };
      await conn.query(sql, [update, id]);

      sql = `update users set birthdate = date_add(from_unixtime(0), INTERVAL ? second) where id = ?`;
      await conn.query(sql, [birthDate1, id]);

      sql = `select name, gender, birthdate from users where id = ?`;
      let [result1] = await conn.query(sql, [id]);

      console.log(result1, "berhasil update bio");
      conn.release();
      return res.status(200).send(result1[0]);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },

  editProfilePic: async (req, res) => {
    console.log(req.files);
    let path = "/profile";

    const { profilepic } = req.files;
    const imagepath = profilepic ? `${path}/${profilepic[0].filename}` : null;
    if (!imagepath) {
      return res.status(500).send({ Message: "foto tidak ada" });
    }
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      // get data untuk hapus imagepath foto lama
      sql = "select * from users where id =?";
      let [result] = await conn.query(sql, [req.user.id]);
      // masuk sini kalo gaada usernya
      console.log(result);
      if (!result.length) {
        throw { message: "user tidak ditemukan" };
      }
      sql = "update users set ? where id=?";
      let update = {
        profilepic: imagepath,
      };
      await conn.query(sql, [update, req.user.id]);
      // kalo lewat sini berarti berhasil
      console.log("berhasil update");
      sql = `select profilepic from users where id = ?`;
      let [result1] = await conn.query(sql, [req.user.id]);
      conn.release();
      return res.status(200).send(result1[0]);
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
  getAddress: async (req, res) => {
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `select address.address, address.phonenumber, address.firstname, address.lastname, province.name as province, city.name as city from address left join province on address.province_id= province.id left join city on address.city_id=city.id where user_id=?`;
      [address] = await conn.query(sql, id);

      conn.release();
      return res.status(200).send(address);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
};
