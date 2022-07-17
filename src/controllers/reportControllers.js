const { dbCon } = require("../connections");
const { getDataCart } = require("./transactionControllers");

module.exports = {
  salesReport: async (req, res) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      // get profit hari ini
      sql = `select sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit
            from transaction_detail where DATE(updated_at) = CURDATE();`;
      let [profit] = await conn.query(sql);

      //get pesanan hari ini
      sql = `select count(id) as pesanan_hari_ini from transaction where DATE(updated_at) = CURDATE()`;
      let [pesananHariIni] = await conn.query(sql);

      // get sisa stock
      sql = `select sum(stock) as sisa_stock from stock`;
      let [sisaStock] = await conn.query(sql);

      // get pesanan baru
      sql = `select count(id) as pesanan_baru from transaction where status = 'menunggu pembayaran' and DATE(updated_at) = CURDATE()`;
      let [pesananBaru] = await conn.query(sql);

      // get siap dikirim
      sql = `select count(id) as siap_dikirim from transaction where status = 'diproses' and DATE(updated_at) = CURDATE()`;
      let [siapDikirim] = await conn.query(sql);

      // get sedang dikirim
      sql = `select count(id) as sedang_dikirim from transaction where status = 'dikirim' and DATE(updated_at) = CURDATE()`;
      let [sedangDikrim] = await conn.query(sql);

      // get selesai
      sql = `select count(id) as selesai from transaction where status = 'selesai' and DATE(updated_at) = CURDATE()`;
      let [selesai] = await conn.query(sql);

      // get dibatalkan
      sql = `select count(id) as dibatalkan  from transaction where status = 'dibatalkan' and DATE(updated_at) = CURDATE()`;
      let [dibatalkan] = await conn.query(sql);

      //   // get telah expired
      sql = `select sum(stock) as telah_expired from stock where expired > curdate()`;
      let [telahExpired] = await conn.query(sql);

      // get expired this month
      sql = `select sum(stock) as thismonth_expired from stock where expired between curdate() AND curdate() + 30`;
      let [expiredThisMonth] = await conn.query(sql);

      // get expired 3 month later
      sql = `select sum(stock) as latermonth_expired from stock where expired between curdate() AND curdate() + 90`;
      let [expired3Month] = await conn.query(sql);

      conn.release();
      return res.status(200).send({
        profit,
        pesananHariIni,
        sisaStock,
        pesananBaru,
        siapDikirim,
        sedangDikrim,
        selesai,
        dibatalkan,
        telahExpired,
        expiredThisMonth,
        expired3Month,
      });
    } catch (error) {
      console.log(error);

      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  penjualanObat: async (req, res) => {
    let { filter } = req.query;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      if (filter == "weekly") {
        filter = `group by weekday(updated_at),month(updated_at)
                  order by weekday(updated_at),month(updated_at); `;
      } else if (filter == "monthly" || !filter) {
        filter = ` group by year(updated_at),month(updated_at)
                   order by year(updated_at),month(updated_at)`;
      }

      // chart penjualan obat

      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan,weekday(updated_at) as hari,sum(quantity) as jumlah_penjualan
        from transaction_detail where year(updated_at)=2022 ${filter} `;

      let [penjualanObat] = await conn.query(sql);

      conn.release();
      return res.status(200).send(penjualanObat);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  profit: async (req, res) => {
    let { filter } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      if (filter == "weekly") {
        filter = `group by weekday(updated_at),month(updated_at)
                  order by weekday(updated_at),month(updated_at); `;
      } else if (filter == "monthly" || !filter) {
        filter = ` group by year(updated_at),month(updated_at)
                   order by year(updated_at),month(updated_at)`;
      }

      // chart profit

      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan,weekday(updated_at) as hari, sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit
            from transaction_detail where year(updated_at)=2022 ${filter}`;
      let [profit] = await conn.query(sql);

      conn.release();
      return res.status(200).send(profit);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
};
