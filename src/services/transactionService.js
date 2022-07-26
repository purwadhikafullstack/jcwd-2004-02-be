const { dbCon } = require("../connections");
const fs = require("fs");
const schedule = require("node-schedule");
const dayjs = require("dayjs");

const rejectTransactionScheduledService = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    // check expired transaction
    sql = `select * from transaction where expired_at <= current_timestamp() and status not in ('dibatalkan','diproses','dikirim','selesai')`;
    let [transactionData] = await conn.query(sql);

    if (transactionData.length) {
      for (let i = 0; i < transactionData.length; i++) {
        const element = transactionData[i];

        // select stock per id
        sql = `select id, stock_id, quantity from log where transaction_id = ?`;
        let [selectedStock] = await conn.query(sql, element.id);

        // restore the quantity back to stock
        for (let id = 0; id < selectedStock.length; id++) {
          sql = `select id, stock from stock where id = ?`;
          let [restoredStock] = await conn.query(
            sql,
            selectedStock[id].stock_id
          );

          let restoredValue =
            Math.abs(parseInt(selectedStock[id].quantity)) +
            parseInt(restoredStock[0].stock);

          let updateQuantityStock = { stock: restoredValue };
          sql = `update stock set ? where id = ?`;
          await conn.query(sql, [
            updateQuantityStock,
            selectedStock[id].stock_id,
          ]);

          let insertDataLog = {
            activity: "transaksi expired",
            quantity: `+${Math.abs(parseInt(selectedStock[id].quantity))}`,
            stock_id: selectedStock[id].stock_id,
            transaction_id: element.id,
            stock: restoredValue,
          };

          sql = `insert into log set ?`;
          await conn.query(sql, insertDataLog);
        }

        sql = `update transaction set ? where id = ?`;
        await conn.query(sql, [{ status: 6 }, element.id]);
        console.log(`Ke update bos yang ini -${element.id}`);

        //Update prescription status if exist
        sql = `select * from prescription where transaction_id = ?`;
        let [prescriptionExist] = await conn.query(sql, element.id);

        if (prescriptionExist.length > 0) {
          for (let k = 0; k < prescriptionExist.length; k++) {
            sql = `update prescription set ? where transaction_id = ?`;
            await conn.query(sql, [{ status: 2 }, element.id]);
            console.log(`resep ke-${prescriptionExist[k].id} ke update jg bos`);
          }
        }
      }
    }

    await conn.commit();
    conn.release();
    return { message: "Transaction rejected by system" };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

const updateSendStatusScheduledService = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    sql = `select * from transaction where expired_at <= current_timestamp and status = 'dikirim'`;
    let [transactionData] = await conn.query(sql);

    if (transactionData.length) {
      for (let i = 0; i < transactionData.length; i++) {
        const element = transactionData[i];

        sql = `update transaction set ? where id = ?`;
        await conn.query(sql, [{ status: 5 }, element.id]);
        console.log(`Transaction ${element.id} status complete by system`);
      }
    }

    await conn.commit();
    conn.release();
    return { message: "Transaction status updated by system" };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

module.exports = {
  getUserTransactionService: async (
    id,
    order,
    filter,
    from_date,
    to_date,
    page,
    limit
  ) => {
    let conn, sql;

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    let offset = page * parseInt(limit);

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

    let transaction_date;
    if (!from_date) {
      transaction_date = ``;
    } else {
      transaction_date = `AND transaction.created_at between '${from_date}' AND '${to_date}'`;
    }

    try {
      conn = await dbCon.promise().getConnection();

      // get user's all transaction
      sql = `select transaction.id, user_id, status, expired_at, recipient, payment, courier, address, transaction_number, updated_at, created_at, prescription_number, pr_status, pr_image from transaction
            left join (select prescription_number, status as pr_status, image as pr_image, transaction_id from prescription) as prescription on transaction.id = prescription.transaction_id
            join (select name as username, id from users) as user on transaction.user_id = user.id
            where user.id = ?  ${filter} ${transaction_date} ${order} LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [data] = await conn.query(sql, id);

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
      where true  ${filter} ${transaction_date} ${order}) as table_data`;
      let [totalData] = await conn.query(sql);

      return { data, totalData };
    } catch (error) {
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
  getDetailTransactionService: async (transaction_id, id) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

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
          let sub =
            parseInt(data[0].products[id].price) *
            parseInt(data[0].products[id].quantity);
          data[0].products[id].total = sub;
          subtotal += sub;
        }
        data[0].subtotal = subtotal;
      }

      return { data };
    } catch (error) {
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
      search = `and transaction.recipient like '%${search}%' or transaction.transaction_number like '%${search}%'`;
    } else {
      search = ``;
    }

    let transaction_date;
    if (!from_date) {
      transaction_date = ``;
    } else {
      transaction_date = `AND transaction.created_at between '${from_date}' AND '${to_date}'`;
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

      // get user's all transaction
      sql = `select transaction.id, status, expired_at, recipient, payment, courier, address, transaction_number, updated_at, created_at, prescription_number, pr_status, pr_image from transaction
            left join (select prescription_number, status as pr_status, image as pr_image, transaction_id from prescription) as prescription on transaction.id = prescription.transaction_id
            where true ${search} ${filter} ${transaction_date} ${sort}  LIMIT ${dbCon.escape(
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
      where true ${search} ${filter} ${transaction_date} ${sort}) as table_data`;
      let [totalData] = await conn.query(sql);

      return { data, totalData };
    } catch (error) {
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
  getProductLogService: async (product_id, limit, page) => {
    let conn, sql;

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

      // get data
      sql = `select log.id, created_at, activity, updated_at, user_id, stock_id, transaction_id, product_id, expired, 
      stock_exp, recipient_name, quantity from log
      join (select id, name as recipient_name from users) as u on u.id = log.user_id
      join (select id, product_id, stock as stock_exp, expired from stock) as s on s.id = log.stock_id where product_id = ? LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [data] = await conn.query(sql, product_id);

      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        data[i] = { ...data[i], no: page * limit + (i + 1) };
      }

      // total stock per product
      sql = `select sum(stock) as total_stock  from stock where product_id = ?`;
      let [totalStock] = await conn.query(sql, product_id);

      // count total log data
      sql = `select count(*) as total_log from (select log.id from log 
        join (select id, product_id from stock) as s on log.stock_id = s.id where product_id = ?) as total_data`;
      let [totalData] = await conn.query(sql, product_id);

      sql = `select name from product where id = ?`;
      let [name] = await conn.query(sql, product_id);

      await conn.commit();
      return { data, totalData, totalStock, name };
    } catch (error) {
      await conn.rollback();
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
  sendOrderService: async (id, transaction_id) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `update transaction set ? where id = ?`;
      let updateTransaction = {
        status: "dikirim",
        expired_at: dayjs(new Date())
          .add(7, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
      await conn.query(sql, [updateTransaction, transaction_id]);

      await conn.commit();
      conn.release();
      return { message: `Transaksi berhasil dikirim` };
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw new Error(error.message || error);
    }
  },
  receiveOrderService: async (transaction_id) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `update transaction set ? where id = ?`;
      let updateTransaction = {
        status: "selesai",
        expired_at: dayjs(new Date())
          .add(7, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
      await conn.query(sql, [updateTransaction, transaction_id]);

      await conn.commit();
      conn.release();
      return { message: `pesanan berhasil diterima` };
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw new Error(error.message || error);
    }
  },
};

schedule.scheduleJob("*/5 * * * * ", () => {
  rejectTransactionScheduledService();
  updateSendStatusScheduledService();
});
