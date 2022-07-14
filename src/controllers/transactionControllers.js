const { dbCon } = require("../connections");
const fs = require("fs");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("123456789abcdef", 10);
const {
  getUserTransactionService,
  getDetailTransactionService,
  getAllTransactionService,
} = require("../services/transactionService");

module.exports = {
  addToCart: async (req, res) => {
    const { id } = req.user;
    let { product_id } = req.query;
    const { quantityCart } = req.body;
    product_id = parseInt(product_id);
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = "select * from product where id=?";
      let [result] = await conn.query(sql, [product_id, id]);
      console.log("ini result", result);

      sql = `select * from users where id=?`;
      let [result2] = await conn.query(sql, [id]);
      console.log("ini result 2", result2);

      sql = `insert into cart set ?`;
      let insertCart = {
        user_id: id,
        product_id,
        quantityCart,
      };
      let [resultCart] = await conn.query(sql, [insertCart, id]);
      console.log("ini result cart", resultCart);

      sql = `select * from cart where product_id =?`;
      let [resultQty] = await conn.query(sql, [product_id, id]);
      console.log("ini result qty", resultQty);

      sql = `SELECT * from stock where product_id =?`;
      let [resultStock] = await conn.query(sql, product_id);
      console.log("ini result stock", resultStock);

      let sisaStock = resultStock[0].stock - resultQty[0].quantityCart;
      sisaStock = parseInt(sisaStock);

      sql = `UPDATE stock set ? where product_id =?`;
      let updateStock = {
        stock: sisaStock,
      };
      await conn.query(sql, [updateStock, product_id]);

      conn.commit();
      conn.release();
      return res.status(200).send({ message: "berhasil add to cart" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  deleteCart: async (req, res) => {
    const { id } = req.user;
    let { product_id } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select * from cart where id=?`;
      const [result] = await conn.query(sql, id);

      sql = `select * from cart where product_id =?`;
      let [resultQty] = await conn.query(sql, product_id);
      console.log("ini result qty", resultQty);

      sql = `SELECT * from stock where product_id =?`;
      let [resultStock] = await conn.query(sql, product_id);
      console.log("ini result stock", resultStock);

      let sisaStock = resultStock[0].stock + resultQty[0].quantityCart;
      sisaStock = parseInt(sisaStock);

      sql = `UPDATE stock set ? where product_id =?`;
      let updateStock = {
        stock: sisaStock,
      };
      await conn.query(sql, [updateStock, product_id]);

      sql = `delete from cart where product_id=? and user_id=?`;
      await conn.query(sql, [product_id, id]);

      sql = `select * from cart where user_id =?`;
      let [resultdel] = await conn.query(sql, [id]);
      console.log("ini result qty", resultdel);

      conn.release();
      return res.status(200).send({ message: "berhasil delete cart" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getDataCart: async (req, res) => {
    const { id } = req.user;
    // let {product_id} = req.query
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      sql = `select cart.id, product_id, user_id, quantityCart, created_at, updated_at, product_name, hargaJual, unit,
            (select sum(stock) from stock where product_id = cart.product_id) as total_stock from cart
            join (select name as product_name, id, hargaJual, unit from product) as product on cart.product_id = product.id
            where user_id =?`;
      let [resultCart] = await conn.query(sql, [id]);
      console.log("ini result cart", resultCart);

      // looping insert totalHarga per product_id
      for (let i = 0; i < resultCart.length; i++) {
        let totalHarga = resultCart[i].quantityCart * resultCart[i].hargaJual;
        resultCart[i].totalHarga = totalHarga;
      }

      let sql_img = `select id, image from product_image where product_id = ? limit 1`;
      for (let i = 0; i < resultCart.length; i++) {
        const element = resultCart[i];
        let [images] = await conn.query(sql_img, element.id);
        resultCart[i].images = images;
      }

      // sql = `select stock from stock where product_id = ?`
      // let [resultQty] = await conn.query(sql, [product_id])
      // console.log('ini result qty', resultQty);

      conn.release();
      return res.status(200).send(resultCart);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  plusCart: async (req, res) => {
    let { id } = req.user;
    let { product_id } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select quantityCart from cart where product_id=? and user_id=?`;
      let [result] = await conn.query(sql, [product_id, id]);
      console.log("ini result", result);

      let plus = result[0].quantityCart + 1;

      sql = `update cart set? where product_id =? and user_id=? `;
      let updateQty = {
        quantityCart: plus,
      };
      await conn.query(sql, [updateQty, product_id, id]);

      sql = `select * from cart where product_id=? `;
      let [resultQty] = await conn.query(sql, [product_id]);
      console.log("ini result qty", resultQty);

      sql = `SELECT * from stock where product_id =?`;
      let [resultStock] = await conn.query(sql, product_id);
      console.log("ini result stock", resultStock);

      let sisaStock = resultStock[0].stock - 1;
      sisaStock = parseInt(sisaStock);

      sql = `UPDATE stock set ? where product_id =?`;
      let updateStock = {
        stock: sisaStock,
      };
      await conn.query(sql, [updateStock, product_id]);

      conn.release();
      return res.status(200).send({ message: "plus cart" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  minCart: async (req, res) => {
    const { id } = req.user;
    let { product_id } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select quantityCart from cart where product_id=? and user_id=?`;
      let [result] = await conn.query(sql, [product_id, id]);

      let min = result[0].quantityCart - 1;

      sql = `update cart set? where product_id =? and user_id=?`;
      let updateQty = {
        quantityCart: min,
      };
      await conn.query(sql, [updateQty, product_id, id]);

      sql = `SELECT * from stock where product_id =?`;
      let [resultStock] = await conn.query(sql, product_id);
      console.log("ini result stock", resultStock);

      let sisaStock = resultStock[0].stock + 1;
      sisaStock = parseInt(sisaStock);

      sql = `UPDATE stock set ? where product_id =?`;
      let updateStock = {
        stock: sisaStock,
      };
      await conn.query(sql, [updateStock, product_id]);

      conn.release();
      return res.status(200).send({ message: "min cart" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  addAddress: async (req, res) => {
    const { id } = req.user;
    const { address, province_id, city_id, firstname, lastname, phonenumber } =
      req.body;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `insert into address set?`;
      let insertData = {
        user_id: id,
        address,
        province_id,
        city_id,
        firstname,
        lastname,
        phonenumber,
      };
      let [userAddress] = await conn.query(sql, [insertData, id]);

      conn.release();
      return res.status(200).send(userAddress);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getProvinces: async (req, res) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select id,name from province`;
      let [province] = await conn.query(sql);

      conn.release();
      return res.status(200).send(province);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getCities: async (req, res) => {
    let { province_id } = req.params;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select id, name from city where province_id = ?`;
      let [cities] = await conn.query(sql, province_id);

      conn.release();
      return res.status(200).send(cities);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getAddress: async (req, res) => {
    const { id } = req.user;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select id,address,province_id,city_id,firstname,lastname,phonenumber,is_default from address where user_id =? and is_default="yes"`;
      let [getAddress] = await conn.query(sql, [id]);
      console.log("ini get address", getAddress);

      conn.release();
      return res.status(200).send(getAddress);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  produkTerkait: async (req, res) => {
    let { symptom_id } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select product_id from symptom_product where symptom_id =?`;
      let [resultProd] = await conn.query(sql, symptom_id);

      let data = [];
      sql = `select id, name, hargaJual, unit from product where id=? and is_deleted= 'no' limit 6`;
      for (let i = 0; i < resultProd.length; i++) {
        const element = resultProd[i];
        let [dataProd] = await conn.query(sql, element.product_id);
        data[i] = dataProd[0];
      }

      let sql = `select id, image from product_image where product_id = ? limit 1`;
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let [images] = await conn.query(sql, data[i].id);
        data[i].images = images;
      }
    } catch (error) {
      console.log(error);
    }
  },
  getAllAddress: async (req, res) => {
    const { id } = req.user;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select * from address where user_id=?`;
      let [allAddress] = await conn.query(sql, id);

      conn.release();
      return res.status(200).send(allAddress);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  defaultAddress: async (req, res) => {
    const { id } = req.user;
    let { address_id } = req.query;
    console.log(address_id);
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select id from address where user_id=? and is_default='yes'`;
      let [result1] = await conn.query(sql, id);

      sql = `update address set? where id=? and is_default='yes'`;
      let updateNo = {
        is_default: "no",
      };
      await conn.query(sql, [updateNo, result1[0].id]);

      sql = `update address set? where id=? and is_default='no'`;
      let updateYes = {
        is_default: "yes",
      };
      await conn.query(sql, [updateYes, address_id]);

      sql = `select * from address where user_id=? and is_default='yes'`;
      let [result2] = await conn.query(sql, id);

      conn.release();
      return res.status(200).send({ result2 });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  uploadPayment: async (req, res) => {
    let path = "/payment";
    const { payment } = req.files;

    const imagePath = payment ? `${path}/${payment[0].filename}` : null;

    const { id } = req.user;
    const { transaction_id } = req.query;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select transaction.user_id, transaction.id, transaction.status, transaction.recipient, transaction.transaction_number, transaction.address, address.address, address.firstname from transaction left join address on transaction.user_id = address.user_id where transaction.id =?`;
      await conn.query(sql, [id]);

      sql = `select * from address where user_id=? and is_default='yes'`;
      let [result] = await conn.query(sql, [id]);

      sql = `update transaction set? where id=? `;
      let updateTransaction = {
        status: "diproses",
        payment: imagePath,
      };
      await conn.query(sql, [updateTransaction, transaction_id, id]);
      // let transId = resultPay.insertId
      conn.release();
      return res
        .status(200)
        .send({ message: "berhasil upload bukti pembayaran" });
    } catch (error) {
      // conn.release()
      if (imagePath) {
        fs.unlinkSync("./public" + imagePath);
      }
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  userCheckout: async (req, res) => {
    // let path = "/payment"
    // const {payment} = req.files

    // const imagePath = payment ? `${path}/${payment[0].filename}`:null

    const { id } = req.user;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select transaction.user_id, transaction.id, transaction.status, transaction.recipient, transaction.transaction_number, transaction.address, address.address, address.firstname from transaction left join address on transaction.user_id = address.user_id`;
      await conn.query(sql, [id]);

      sql = `select * from address where user_id=? and is_default='yes'`;
      let [result] = await conn.query(sql, [id]);

      sql = `insert into transaction set?`;
      let insertTransaction = {
        status: "menunggu pembayaran",
        recipient: result[0].firstname,
        transaction_number: nanoid(),
        address: result[0].address,
        user_id: id,
      };
      await conn.query(sql, insertTransaction);
      // let transId = resultPay.insertId
      conn.release();
      return res.status(200).send({ message: "berhasil checkout" });
    } catch (error) {
      // conn.release()
      // if(imagePath){
      //     fs.unlinkSync('./public' + imagePath)
      // }
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getUserTransactionController: async (req, res) => {
    const { id } = req.user;
    const { order, filter, from_date, to_date } = req.query;

    try {
      const result = await getUserTransactionService(
        id,
        order,
        filter
        // from_date,
        // to_date
      );
      res.set("x-total-transaction", result.totalData[0].total_transaction);
      return res.status(200).send(result.data);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getDetailTransactionController: async (req, res) => {
    const { id } = req.user;
    const { transaction_id } = req.params;

    try {
      const result = await getDetailTransactionService(transaction_id, id);
      return res.status(200).send(result.data[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getAllTransactionController: async (req, res) => {
    const { id } = req.user;
    let { sort, filter, search, from_date, to_date, limit, page } = req.query;

    try {
      const result = await getAllTransactionService(
        search,
        sort,
        filter,
        from_date,
        to_date,
        limit,
        page,
        id
      );
      res.set("x-total-transaction", result.totalData[0].total_data);
      return res.status(200).send(result.data);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
};
