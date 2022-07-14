const { dbCon } = require("../connections");
const fs = require("fs");

module.exports = {
  getObat: async (req, res) => {
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      sql = "select id, name, hargaJual, hargaBeli from product order by name";
      let [product] = await conn.query(sql);
      sql = "select image from product_image where product_id=?";
      for (let i = 0; i < product.length; i++) {
        let [productImg] = await conn.query(sql, product[i].id);
        let image = productImg[0].image;
        product[i] = { ...product[i], image };
      }
      conn.release();
      return res.status(200).send({ product });
    } catch (error) {
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  getPrescription: async (req, res) => {
    // nanti id nya dapet dari klik di pesanan  baru -> buat salinan resep
    const { transaction_id } = req.params;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql =
        "select image, prescription_number, created_at from prescription where transaction_id=? ";
      let [prescription] = await conn.query(sql, transaction_id);

      conn.release();
      return res.status(200).send(prescription);
    } catch (error) {
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  submitPrescription: async (req, res) => {
    const data = req.body;
    const { transaction_id } = req.params;

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `insert into transaction_detail set ?`;
      for (let i = 0; i < data.dataResep.length; i++) {
        let insertData = {
          transaction_id: transaction_id,
          name: data.dataResep[i].name,
          quantity: data.dataResep[i].quantity,
          price: data.dataResep[i].hargaJual,
          hargaBeli: data.dataResep[i].hargaBeli,
          image: data.dataResep[i].image,
          unit: data.dataResep[i].unit,
          dosis: data.dataResep[i].dosis,
        };
        await conn.query(sql, insertData);
      }

      sql = "update prescription set ? where transaction_id = ?";
      let insertPrescription = {
        nama_dokter: data.nama_dokter,
        nama_pasien: data.nama_pasien,
        status: "terkonfimasi",
      };
      await conn.query(sql, [insertPrescription, transaction_id]);

      conn.release();
      return res.status(200).send({ message: "Berhasil Upload Resep" });
    } catch (error) {
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
};
