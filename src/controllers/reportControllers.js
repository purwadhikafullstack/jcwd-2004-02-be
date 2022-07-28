const { dbCon } = require("../connections");
const { getDataCart } = require("./transactionControllers");

module.exports = {
  salesReport: async (req, res) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      // get profit hari ini
      // sql = `select sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit
      //       from transaction_detail where DATE(updated_at) = CURDATE() and status = 'selesai'`;
      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun, month(transaction_detail.updated_at) as bulan, weekday(transaction_detail.updated_at) as hari, sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit, transaction.status from transaction_detail inner join transaction on transaction_detail.transaction_id = transaction.id where DATE(transaction_detail.updated_at) = CURDATE() and status='selesai'`;
      let [profit] = await conn.query(sql);

      //get pesanan hari ini
      sql = `select count(id) as pesanan_hari_ini from transaction where DATE(updated_at) = CURDATE()`;
      let [pesananHariIni] = await conn.query(sql);

      // get sisa stock
      sql = `select sum(stock) as sisa_stock from stock`;
      let [sisaStock] = await conn.query(sql);

      //progress bar profit hari ini
      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun, month(transaction_detail.updated_at) as bulan, weekday(transaction_detail.updated_at) as hari, sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit, transaction.status from transaction_detail inner join transaction on transaction_detail.transaction_id = transaction.id where DATE(transaction_detail.updated_at) = CURDATE() and status='selesai'`;
      let [profitToday] = await conn.query(sql);
      console.log("ini profit hari ini", profitToday);

      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun, month(transaction_detail.updated_at) as bulan, weekday(transaction_detail.updated_at) as hari, sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit, transaction.status from transaction_detail inner join transaction on transaction_detail.transaction_id = transaction.id where DATE(transaction_detail.updated_at) = CURDATE() - 1 and status='selesai'`;
      let [profityesterday] = await conn.query(sql);

      progressProfit =
        (profitToday[0].profit - profityesterday[0].profit) /
        profitToday[0].profit;

      selisihProfit = profitToday[0].profit - profityesterday[0].profit;

      //progress pesanan hari ini
      sql = `select count(id) as pesanan_hari_ini from transaction where DATE(updated_at) = CURDATE()`;
      let [progressPesananHariIni] = await conn.query(sql);

      sql = `select count(id) as pesanan_hari_ini from transaction where DATE(updated_at) = CURDATE() - 1`;
      let [progressPesananKemarin] = await conn.query(sql);

      progressPesanan =
        (progressPesananHariIni[0].pesanan_hari_ini -
          progressPesananKemarin[0].pesanan_hari_ini) /
        progressPesananHariIni[0].pesanan_hari_ini;

      selisihPesanan =
        progressPesananHariIni[0].pesanan_hari_ini -
        progressPesananKemarin[0].pesanan_hari_ini;

      // progress sisa stock
      // sql = `select sum(stock) as sisa_stock from stock`;
      // let [sisaStock] = await conn.query(sql);

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
        progressPesanan,
        progressProfit,
        selisihPesanan,
        selisihProfit,
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

      // if (filter == "weekly") {
      //   filter = `group by weekday(updated_at),month(updated_at)
      //             order by weekday(updated_at),month(updated_at); `;
      // } else if (filter == "monthly" || !filter) {
      //   filter = ` group by year(updated_at),month(updated_at)
      //              order by year(updated_at),month(updated_at)`;
      // }
      if (filter == "weekly") {
        filter = `yearweek(transaction_detail.updated_at)= yearweek(now()) and transaction.status = 'selesai'
                  group by weekday(transaction_detail.updated_at),month(transaction_detail.updated_at)
                  order by weekday(transaction_detail.updated_at),month(transaction_detail.updated_at); `;
      } else if (filter == "monthly" || !filter) {
        filter = ` year(transaction_detail.updated_at)=2022 and  transaction.status = 'selesai'
                   group by year(transaction_detail.updated_at),month(transaction_detail.updated_at)
                   order by year(transaction_detail.updated_at),month(transaction_detail.updated_at)`;
      }

      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun, month(transaction_detail.updated_at) as bulan, weekday(transaction_detail.updated_at) as hari, sum(transaction_detail.quantity) as jumlah, transaction.status from transaction_detail inner join transaction on transaction_detail.transaction_id = transaction.id where ${filter}`;
      let [penjualanObat] = await conn.query(sql);

      // chart penjualan obat

      // sql = `select year(updated_at) as tahun ,month(updated_at) as bulan,weekday(updated_at) as hari,sum(quantity) as jumlah_penjualan
      //   from transaction_detail where year(updated_at)=2022 ${filter} `;

      // let [penjualanObat] = await conn.query(sql);

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

      // if (filter == "weekly") {
      //   filter = `group by weekday(updated_at),month(updated_at)
      //             order by weekday(updated_at),month(updated_at); `;
      // } else if (filter == "monthly" || !filter) {
      //   filter = ` group by year(updated_at),month(updated_at)
      //              order by year(updated_at),month(updated_at)`;
      // }

      if (filter == "weekly") {
        filter = `yearweek(transaction_detail.updated_at)= yearweek(now()) and transaction.status = 'selesai'
                  group by weekday(transaction_detail.updated_at),month(transaction_detail.updated_at)
                  order by weekday(transaction_detail.updated_at),month(transaction_detail.updated_at); `;
      } else if (filter == "monthly" || !filter) {
        filter = ` year(transaction_detail.updated_at)=2022 and  transaction.status = 'selesai'
                   group by year(transaction_detail.updated_at),month(transaction_detail.updated_at)
                   order by year(transaction_detail.updated_at),month(transaction_detail.updated_at)`;
      }

      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun, month(transaction_detail.updated_at) as bulan, weekday(transaction_detail.updated_at) as hari, sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit, transaction.status from transaction_detail inner join transaction on transaction_detail.transaction_id = transaction.id where ${filter}`;
      let [profit] = await conn.query(sql);

      // chart profit

      // sql = `select year(updated_at) as tahun ,month(updated_at) as bulan,weekday(updated_at) as hari, sum(price*quantity) as masuk, sum(hargaBeli*quantity) as keluar, sum(price*quantity)-sum(hargaBeli*quantity) as profit
      //       from transaction_detail where year(updated_at)=2022 ${filter}`;
      // let [profit] = await conn.query(sql);

      conn.release();
      return res.status(200).send(profit);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  ringkasanStatistik: async (req, res) => {
    let { filter } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      // filter mingguan dan bulanan
      if (filter == "weekly") {
        filter = `group by weekday(updated_at),month(updated_at)
                  order by weekday(updated_at),month(updated_at); `;
      } else if (filter == "monthly" || !filter) {
        filter = ` group by year(updated_at),month(updated_at)
                   order by year(updated_at),month(updated_at)`;
      }

      // statistik
      // get pesanan baru
      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan, weekday(updated_at) as hari,  count(id) as pesanan_baru from transaction where status = 'menunggu pembayaran' and year(updated_at)=2022 ${filter}`;
      let [pesananBaru] = await conn.query(sql);

      // get siap dikirim
      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan, weekday(updated_at) as hari, count(id) as siap_dikirim from transaction where status = 'diproses' and year(updated_at)=2022 ${filter}`;
      let [siapDikirim] = await conn.query(sql);

      // get sedang dikirim
      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan, weekday(updated_at) as hari, count(id) as sedang_dikirim from transaction where status = 'dikirim' and year(updated_at)=2022 ${filter}`;
      let [sedangDikirim] = await conn.query(sql);

      // get selesai
      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan, weekday(updated_at) as hari, count(id) as selesai from transaction where status = 'selesai' and year(updated_at)=2022 ${filter}`;
      let [selesai] = await conn.query(sql);

      // get dibatalkan
      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan, weekday(updated_at) as hari, count(id) as dibatalkan from transaction where status = 'dibatalkan' and year(updated_at)=2022 ${filter}`;
      let [dibatalkan] = await conn.query(sql);

      // graph
      // penjualan
      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan, weekday(updated_at) as hari, sum(quantity) as jumlah from transaction_detail where year(updated_at)=2022 ${filter}`;
      let [penjualan] = await conn.query(sql);

      // pendapatan
      sql = `select year(updated_at) as tahun ,month(updated_at) as bulan, weekday(updated_at) as hari, sum(quantity*price) as jumlah from transaction_detail where year(updated_at)=2022 ${filter}`;
      let [pendapatan] = await conn.query(sql);

      conn.release();
      return res.status(200).send({
        pesananBaru: pesananBaru[0],
        siapDikirim: siapDikirim[0],
        sedangDikirim: sedangDikirim[0],
        selesai: selesai[0],
        dibatalkan: dibatalkan[0],
        penjualan: penjualan[0],
        pendapatan: pendapatan[0],
      });
    } catch (error) {
      console.log(error);

      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  ringkasanChart: async (req, res) => {
    let { filter } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      // filter mingguan dan bulanan
      if (filter == "weekly") {
        filter = `yearweek(transaction_detail.updated_at)= yearweek(now()) and transaction.status = 'selesai'
                  group by weekday(transaction_detail.updated_at),month(transaction_detail.updated_at)
                  order by weekday(transaction_detail.updated_at),month(transaction_detail.updated_at); `;
      } else if (filter == "monthly" || !filter) {
        filter = ` year(transaction_detail.updated_at)=2022 and  transaction.status = 'selesai'
                   group by year(transaction_detail.updated_at),month(transaction_detail.updated_at)
                   order by year(transaction_detail.updated_at),month(transaction_detail.updated_at)`;
      }
      // graph
      // penjualan
      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun, month(transaction_detail.updated_at) as bulan, weekday(transaction_detail.updated_at) as hari, sum(transaction_detail.quantity) as jumlah, transaction.status from transaction_detail inner join transaction on transaction_detail.transaction_id = transaction.id where ${filter}`;
      let [penjualan] = await conn.query(sql);

      // pendapatan
      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun, month(transaction_detail.updated_at) as bulan, weekday(transaction_detail.updated_at) as hari, sum(transaction_detail.quantity*transaction_detail.price) as jumlah, transaction.status from transaction_detail inner join transaction on transaction_detail.transaction_id = transaction.id where ${filter}`;
      let [pendapatan] = await conn.query(sql);

      // avg bulanan

      let jumlahBulanan = 0;
      for (let i = 0; i < penjualan.length; i++) {
        jumlahBulanan += parseInt(penjualan[i].jumlah);
      }
      console.log(jumlahBulanan, "jumlahBulanan");
      let avgMonth = Math.round(jumlahBulanan / 12);

      // avg mingguan
      let jumlahMingguan = 0;
      for (let i = 0; i < penjualan.length; i++) {
        jumlahMingguan += parseInt(penjualan[i].jumlah);
      }

      let avgWeek = Math.round(jumlahMingguan / 7);

      conn.release();
      return res.status(200).send({
        penjualan,
        pendapatan,
        avgMonth,
        avgWeek,
      });
    } catch (error) {
      console.log(error);

      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  ringkasanProfitLoss: async (req, res) => {
    let { filter, bulan, tahun } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      // filter bulanan dan tahunan
      if (filter == "yearly") {
        filter = ``;
      } else if (filter == "monthly" || !filter) {
        filter = ` and month(transaction_detail.updated_at) = ${bulan} group by year(transaction_detail.updated_at),month(transaction_detail.updated_at)
                   order by year(transaction_detail.updated_at),month(transaction_detail.updated_at)`;
      }

      if (tahun) {
        tahun = `and year(transaction_detail.updated_at)=${tahun}`;
      } else {
        tahun = ``;
      }

      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun ,
      month(transaction_detail.updated_at) as bulan, 
      weekday(transaction_detail.updated_at) as hari, sum(transaction_detail.quantity*transaction_detail.price) as sum, 
      transaction.status from transaction_detail 
      inner join transaction on transaction_detail.transaction_id = transaction.id 
      where true ${tahun} and transaction.status = 'selesai' ${filter}`;
      let [penjualanBarang] = await conn.query(sql);

      sql = `select transaction_detail.id, transaction_detail.updated_at, year(transaction_detail.updated_at) as tahun ,
      month(transaction_detail.updated_at) as bulan, 
      weekday(transaction_detail.updated_at) as hari, sum(transaction_detail.quantity*transaction_detail.hargaBeli) as sum, 
      transaction.status from transaction_detail 
      inner join transaction on transaction_detail.transaction_id = transaction.id 
      where true ${tahun} and transaction.status = 'selesai' ${filter}`;
      let [hargaPokok] = await conn.query(sql);

      conn.release();
      return res.status(200).send({
        penjualanBarang: penjualanBarang[0] || { sum: 0 },
        hargaPokok: hargaPokok[0] || { sum: 0 },
      });
    } catch (error) {
      console.log(error);

      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
};
