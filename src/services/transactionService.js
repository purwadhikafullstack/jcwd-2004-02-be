const { dbCon } = require("../connections");
const fs = require("fs");

module.exports = {
  getUserTransactionService: async (id, order, filter, from_date, to_date) => {
    let conn, sql;

    if (!order) {
      order = `order by updated_at DESC`;
    } else if (order == "terlama") {
      order = `order by updated_at ASC`;
    }

    if (filter == "resep") {
      filter = `and prescription_number is not null`;
    } else if (filter == "bebas") {
      filter = `and prescription_number is null`;
    } else if (filter == "" || !filter) {
      filter = ``;
    }

    // let range;
    // if (from_date || to_date) {
    //   range = `and created_at >= ${from_date} and created_at < ${to_date}`;
    // } else {
    //   range = `and created_at >= ${new Date(
    //     new Date().setDate(new Date().getDate() - 7)
    //   )
    //     .toISOString()
    //     .slice(0, 10)} and created_at < ${new Date()
    //     .toISOString()
    //     .slice(0, 10)}`;
    // }

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get user's all transaction
      sql = `select transaction.id, status, expired_at, recipient, payment, courier, address, transaction_number, updated_at, created_at, prescription_number from transaction
            left join (select prescription_number, transaction_id from prescription) as prescription on transaction.id = prescription.transaction_id
            where user_id = ? ${filter} ${order}`;
      let [data] = await conn.query(sql, id);

      // inser transaction detail
      let sql_td = `select id, name, image, quantity, price, unit from transaction_detail where transaction_id = ?`;
      let sql_p = `select id, image, status, prescription_number from prescription where transaction_id = ?`;
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let [products] = await conn.query(sql_td, element.id);
        data[i].products = products;
        let [prescription] = await conn.query(sql_p, element.id);

        // insert prescription if it concludes prescpription
        if (prescription.length) {
          data[i].prescription = prescription;
        }
      }

      // count subtotal for each transaction
      for (let i = 0; i < data.length; i++) {
        if (data[i]["products"].length) {
          let subtotal = 0;
          for (let id = 0; id < data[i]["products"].length; id++) {
            let sub =
              parseInt(data[i].products[id].price) *
              parseInt(data[i].products[id].quantity);
            data[i].products[id].total = sub;
            subtotal += sub;
          }
          data[i].subtotal = subtotal;
        }
      }

      // count user's total transaction
      sql = `select count(*) as total_transaction from transaction where user_id = ?`;
      let [totalData] = await conn.query(sql, id);

      conn.commit();
      return { data, totalData };
    } catch (error) {
      conn.rollback();
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
  getDetailTransactionService: async (transaction_id, id) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get user's transaction
      sql = `select transaction.id, status, created_at, expired_at, recipient, payment, courier, address, transaction_number, updated_at, prescription_number, pr_image, pr_status from transaction
      left join (select prescription_number, transaction_id, image as pr_image, status as pr_status from prescription) as prescription on transaction.id = prescription.transaction_id
      where transaction.id = ?`;
      let [data] = await conn.query(sql, [transaction_id]);
      console.log(sql);

      // insert transaction detail
      sql = `select id, name, image, quantity, price, unit from transaction_detail where transaction_id = ?`;
      let [products] = await conn.query(sql, [transaction_id]);
      data[0].products = products;

      // count subtotal per transaction
      if (data[0].products.length) {
        let subtotal = 0;
        for (let id = 0; id < data[0]["products"].length; id++) {
          subtotal += data[0].products[id].price;
        }
        data[0].subtotal = subtotal;
      }

      conn.commit();
      return { data };
    } catch (error) {
      conn.rollback();
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
  getAllTransactionService: async (
    search,
    sort,
    filter,
    from_date,
    to_date,
    limit,
    page,
    id
  ) => {
    let conn, sql;

    if (filter == "resep") {
      filter = `and prescription_number is not null`;
    } else if (filter == "bebas") {
      filter = `and prescription_number is null`;
    } else if (filter == "" || !filter) {
      filter = ``;
    }

    if (!sort) {
      sort = `order by updated_at DESC`;
    } else if (sort == "terlama") {
      sort = `order by updated_at ASC`;
    }

    if (search) {
      search = `and recipient like '%${search}%'`;
    } else {
      search = ``;
    }

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    let offset = page * parseInt(limit);

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get user's all transaction
      sql = `select transaction.id, status, expired_at, recipient, payment, courier, address, transaction_number, updated_at, created_at, prescription_number, pr_status, pr_image from transaction
            left join (select prescription_number, status as pr_status, image as pr_image, transaction_id from prescription) as prescription on transaction.id = prescription.transaction_id
            where true ${search} ${filter} ${sort} LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [data] = await conn.query(sql);

      sql = `select id, name, image, quantity, price, unit from transaction_detail where transaction_id = ?`;
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let [products] = await conn.query(sql, element.id);
        data[i].products = products;
      }

      // count subtotal for each transaction
      for (let i = 0; i < data.length; i++) {
        if (data[i]["products"].length) {
          let subtotal = 0;
          for (let id = 0; id < data[i]["products"].length; id++) {
            let sub =
              parseInt(data[i].products[id].price) *
              parseInt(data[i].products[id].quantity);
            data[i].products[id].total = sub;
            subtotal += sub;
          }
          data[i].subtotal = subtotal;
        }
      }

      // count user's total transaction
      sql = `select count(*) as total_transaction from (select transaction.id, status, expired_at, recipient, payment, courier, address, transaction_number, updated_at, created_at, prescription_number from transaction
      left join (select prescription_number, transaction_id from prescription) as prescription on transaction.id = prescription.transaction_id
      where true ${filter} ${sort}) as table_data`;
      let [totalData] = await conn.query(sql);

      await conn.commit();
      return { data, totalData };
    } catch (error) {
      conn.rollback();
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
};
