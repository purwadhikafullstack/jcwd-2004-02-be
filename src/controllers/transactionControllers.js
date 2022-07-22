const { dbCon } = require("../connections");
const fs = require("fs");
const { customAlphabet } = require("nanoid");
const dayjs = require("dayjs");
const nanoid = customAlphabet("123456789abcdef", 10);
const { default: axios } = require("axios");
const {
  getUserTransactionService,
  getDetailTransactionService,
  getAllTransactionService,
  getProductLogService,
} = require("../services/transactionService");
const { DateConverter } = require("../lib/dateconverter");

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

      // cek user udah ada barang yg sama di cart atu belum kaklau ada
      // tambah quantity saja tp kalu kosong baru masukin data baru ke cart
      sql = `select id, quantityCart from cart where user_id=? and product_id=?`;
      let [resultCart] = await conn.query(sql, [id, product_id]);

      //get total stock perproduct
      sql = `select sum(stock) as total_stock from stock where product_id = ?`;
      let [totalStock] = await conn.query(sql, [product_id]);

      if (resultCart.length) {
        let prevQuantity = resultCart[0].quantityCart;
        let lastQantity = prevQuantity + parseInt(quantityCart);
        // cek lastqty not bigger than total stock
        if (lastQantity > totalStock[0].total_stock) {
          throw `quantity melebihi stok`;
        }
        sql = `update cart set ? where id = ?`;
        let updateCart = {
          quantityCart: lastQantity,
        };
        await conn.query(sql, [updateCart, resultCart[0].id]);
        console.log("ini quantity");
      } else {
        // cek lastqty not bigger than total stock
        if (quantityCart > totalStock[0].total_stock) {
          throw `quantity melebihi stok`;
        }
        sql = `insert into cart set ?`;
        let insertCart = {
          user_id: id,
          product_id,
          quantityCart,
        };
        await conn.query(sql, [insertCart]);

        // sql = `select * from cart where product_id =?`
        // let [resultQty] = await conn.query(sql,[product_id, id])
        // console.log('ini result qty', resultQty)

        // sql = `SELECT * from stock where product_id =? ans stock > 0 order by expired`
        // let [resultStock] = await conn.query(sql, product_id)
        // console.log('ini result stock', resultStock)

        // let sisaStock = resultStock[0].stock - resultQty[0].quantityCart
        // sisaStock = parseInt(sisaStock)

        // sql = `UPDATE stock set ? where product_id =?`
        // let updateStock = {
        //     stock: sisaStock
        // }
        // await conn.query(sql, [updateStock,product_id])
      }

      await conn.commit();
      conn.release();
      return res.status(200).send({ message: "berhasil add to cart" });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  deleteCart: async (req, res) => {
    // const {id} = req.user
    let { cart_id } = req.params;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `select * from cart where id=?`;
      const [result] = await conn.query(sql, cart_id);

      //

      // sql = `select * from cart where product_id =?`
      // let [resultQty] = await conn.query(sql,product_id)
      // console.log('ini result qty', resultQty)

      // sql = `SELECT * from stock where product_id =?`
      // let [resultStock] = await conn.query(sql, product_id)
      // console.log('ini result stock', resultStock)

      // let sisaStock = resultStock[0].stock + resultQty[0].quantityCart
      // sisaStock = parseInt(sisaStock)

      // sql = `UPDATE stock set ? where product_id =?`
      // let updateStock = {
      //     stock: sisaStock
      // }
      // await conn.query(sql, [updateStock,product_id])

      sql = `delete from cart where id=?`;
      await conn.query(sql, [cart_id]);

      // sql = `select * from cart where user_id =?`
      // let [resultdel] = await conn.query(sql,[id])
      // console.log('ini result qty', resultdel)

      await conn.commit();
      conn.release();
      return res.status(200).send({ message: "berhasil delete cart" });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  getDataCart: async (req, res) => {
    const { id } = req.user;
    // let {product_id} = req.query
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      // sql = `select cart.id, product_id, user_id, quantityCart, created_at, updated_at, product_name, hargaJual, unit
      // (select sum(stock) from stock where product_id = cart.product_id) as total_stock from cart
      // join (select name as product_name, id, hargaJual, unit from product) as product on cart.product_id = product.id
      // where user_id =?`
      // let [resultCart] = await conn.query(sql, [id])
      // console.log('ini result cart', resultCart)
      sql = `select cart.id, product_id, user_id, quantityCart, created_at, updated_at, product_name, hargaJual, unit, hargaBeli,
            (select sum(stock) from stock where product_id = cart.product_id) as total_stock from cart
            join (select name as product_name, id, hargaJual,hargaBeli, unit from product) as product on cart.product_id = product.id
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
        let [images] = await conn.query(sql_img, element.product_id);
        resultCart[i].images = images[0] || null;
      }
      console.log("ini result cart ya", resultCart);

      // sql = `select stock from stock where product_id = ?`
      // let [resultQty] = await conn.query(sql, [product_id])
      // console.log('ini result qty', resultQty);

      conn.release();
      return res.status(200).send(resultCart);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  plusCart: async (req, res) => {
    let { id } = req.user;
    // let {product_id} = req.query
    let { cart_id } = req.params;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `select quantityCart,product_id from cart where id=?`;
      let [result] = await conn.query(sql, [cart_id]);
      console.log("ini result", result);

      sql = `select sum(stock) as total_stock from stock where product_id = ?`;
      let [totalStock] = await conn.query(sql, [result[0].product_id]);

      let plus = result[0].quantityCart + 1;

      if (plus > totalStock[0].total_stock) {
        throw "quantity melebihi stok";
      }

      sql = `update cart set ? where id = ? `;
      let updateQty = {
        quantityCart: plus,
      };
      await conn.query(sql, [updateQty, cart_id]);

      // sql = `select * from cart where product_id = ? `
      // let [resultQty] = await conn.query(sql,[product_id])
      // console.log('ini result qty', resultQty);

      // sql = `SELECT * from stock where product_id =?`
      // let [resultStock] = await conn.query(sql, product_id)
      // console.log('ini result stock', resultStock)

      // let sisaStock = resultStock[0].stock - 1
      // sisaStock = parseInt(sisaStock)

      // sql = `UPDATE stock set ? where product_id =?`
      // let updateStock = {
      //     stock: sisaStock
      // }
      // await conn.query(sql, [updateStock,product_id])

      await conn.commit();
      conn.release();
      return res.status(200).send({ message: "plus cart" });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  minCart: async (req, res) => {
    const { id } = req.user;
    // let {product_id} = req.query
    let { cart_id } = req.params;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `select quantityCart from cart where id=?`;
      let [result] = await conn.query(sql, [cart_id]);

      let min = result[0].quantityCart - 1;
      if (min <= 0) {
        throw "tidak boleh 0";
      }

      sql = `update cart set? where id=?`;
      let updateQty = {
        quantityCart: min,
      };
      await conn.query(sql, [updateQty, parseInt(cart_id)]);

      // sql = `SELECT * from stock where product_id =?`
      // let [resultStock] = await conn.query(sql, product_id)
      // console.log('ini result stock', resultStock)

      // let sisaStock = resultStock[0].stock + 1
      // sisaStock = parseInt(sisaStock)

      // sql = `UPDATE stock set ? where product_id =?`
      // let updateStock = {
      //     stock: sisaStock
      // }
      // await conn.query(sql, [updateStock,product_id])

      await conn.commit();
      conn.release();
      return res.status(200).send({ message: "min cart" });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
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
      conn.release();
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
      conn.release();
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
      conn.release();
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
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  // produkTerkait: async (req, res) => {
  //   let { symptom_id } = req.query;
  //   let conn, sql;

  //   try {
  //     conn = await dbCon.promise().getConnection();

  //     sql = `select product_id from symptom_product where symptom_id =?`;
  //     let [resultProd] = await conn.query(sql, symptom_id);

  //     let data = [];
  //     sql = `select id, name, hargaJual, unit from product where id=? and is_deleted= 'no' limit 6`;
  //     for (let i = 0; i < resultProd.length; i++) {
  //       const element = resultProd[i];
  //       let [dataProd] = await conn.query(sql, element.product_id);
  //       data[i] = dataProd[0];
  //     }

  //     let sql = `select id, image from product_image where product_id = ? limit 1`;
  //     for (let i = 0; i < data.length; i++) {
  //       const element = data[i];
  //       let [images] = await conn.query(sql, data[i].id);
  //       data[i].images = images;
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // },
  getAllAddress: async (req, res) => {
    const { id } = req.user;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select address.id, address.address, address.phonenumber, address.firstname, address.lastname, province.name as province, city.name as city, address.city_id, address.province_id from address left join province on address.province_id= province.id left join city on address.city_id=city.id where user_id=? order by is_default desc`;
      let [allAddress] = await conn.query(sql, id);

      conn.release();
      return res.status(200).send(allAddress);
    } catch (error) {
      console.log(error);
      conn.release();
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
      await conn.beginTransaction();

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

      await conn.commit();
      conn.release();
      return res.status(200).send({ result2 });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
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
      await conn.beginTransaction();

      sql = `select transaction.user_id, transaction.id, transaction.status, transaction.recipient, transaction.transaction_number, transaction.address, address.address, address.firstname from transaction left join address on transaction.user_id = address.user_id where transaction.id =?`;
      let [resultTrans] = await conn.query(sql, [id]);

      sql = `update transaction set? where id=? `;
      let updateTransaction = {
        status: "menunggu konfirmasi",
        payment: imagePath,
        expired_at: dayjs(new Date())
          .add(1, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
      await conn.query(sql, [updateTransaction, transaction_id]);
      // let transId = resultPay.insertId
      await conn.commit();
      conn.release();
      return res.status(200).send(resultTrans);
    } catch (error) {
      // conn.release()
      if (imagePath) {
        fs.unlinkSync("./public" + imagePath);
      }
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  userCheckout: async (req, res) => {
    let { address, recipient, bank_id, cart } = req.body;
    const { id } = req.user;
    let conn, sql;

    console.log("ini cart bodynya", cart);

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      // ngecek total stok dulu pake sum kalo misalnya kurang throw error
      // kalo misalnya ada kurangin stok baru jalanin insert
      // ambil stok dari semua tanggal expired di masing2 productid
      // while loop kurangin dari array 0

      // sql = `select cart.id, product_id, user_id, quantityCart, created_at, updated_at, product_name, hargaJual, unit,
      // (select sum(stock) from stock where product_id = cart.product_id) as total_stock from cart
      // join (select name as product_name, id, hargaJual, unit from product) as product on cart.product_id = product.id
      // where user_id =?`
      // let [resultCart] = await conn.query(sql, [id])
      // console.log('ini result cart', resultCart)

      // ambil image product
      // let sql_img = `select id, image from product_image where product_id = ? limit 1`
      // for (let i = 0; i < cart.length; i++) {
      //     const element = cart[i];
      //     let [images] = await conn.query(sql_img, element.id);
      //     cart[i].images = images[0];
      //   }

      //ngitung total stok sm quantity cart < total stok
      sql = `select sum(stock) as total_stock from stock where product_id = ?`;
      for (let i = 0; i < cart.length; i++) {
        const element = cart[i];
        let [totStock] = await conn.query(sql, element.product_id);
        if (element.quantityCart > totStock[0].total_stock) {
          throw `maaf stok ${element.product_name} habis`;
        }
      }

      sql = `insert into transaction set ?`;
      let insertTransaction = {
        status: "menunggu pembayaran",
        recipient,
        transaction_number:
          "HLTM-" + DateConverter(new Date()) + "-" + nanoid(),
        address,
        user_id: id,
        bank_id,
        expired_at: dayjs(new Date())
          .add(1, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
      let [trans_id] = await conn.query(sql, insertTransaction);
      console.log("ini result trasn id", trans_id);

      let transactionId = trans_id.insertId;

      // // looping insert totalHarga per product_id
      // for (let i=0; i <resultCart.length; i++){
      //  let totalHarga = resultCart[i].quantityCart*resultCart[i].hargaJual
      //  resultCart[i].totalHarga = totalHarga
      // }

      // insert transaction_detail
      sql = `insert into transaction_detail set ?`;
      for (let i = 0; i < cart.length; i++) {
        let insertTransactionDetail = {
          name: cart[i].product_name,
          price: cart[i].hargaJual,
          quantity: cart[i].quantityCart,
          transaction_id: transactionId,
          image: cart[i].images.image,
          hargaBeli: cart[i].hargaBeli,
          unit: cart[i].unit,
        };
        await conn.query(sql, insertTransactionDetail);
      }

      sql = ` select id from transaction where id=?`;
      let [resultTrans] = await conn.query(sql, transactionId);

      // ngurangin stock
      for (let i = 0; i < cart.length; i++) {
        let { product_id, quantityCart } = cart[i];
        sql = `select id,stock from stock where product_id = ? and stock > 0 order by expired`;
        let [resStock] = await conn.query(sql, product_id);
        for (let j = 0; j < resStock.length; j++) {
          let sisaStock, x;
          if (parseInt(resStock[j].stock) > parseInt(quantityCart)) {
            sisaStock = parseInt(resStock[j].stock) - parseInt(quantityCart);
            x = quantityCart * -1;
          } else {
            sisaStock = 0;
            x = resStock[j].stock * -1;
          }
          sql = `update stock set ? where id = ?`;
          let updateStock = {
            stock: sisaStock,
          };
          await conn.query(sql, [updateStock, resStock[j].id]);

          // sql = `select stock from stock where id =?`
          // let [lastStock] = await conn.query(sql,resStock[j].id)

          sql = `insert into log set ?`;
          let insertLog = {
            user_id: id,
            activity: "barang diproses",
            quantity: x,
            stock_id: resStock[j].id,
            transaction_id: transactionId,
          };
          await conn.query(sql, insertLog);

          quantityCart = parseInt(quantityCart) - parseInt(resStock[j].stock);
          if (quantityCart < 1) {
            break;
          }
        }
      }

      for (let i = 0; i < cart.length; i++) {
        const element = cart[i];
        sql = `delete from cart where user_id = ? and product_id = ?`;
        await conn.query(sql, [id, element.product_id]);
      }

      await conn.commit();
      conn.release();
      return res.status(200).send(resultTrans);
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  getBank: async (req, res) => {
    // const {bank_id} = req.params
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select * from bank `;
      let [bank] = await conn.query(sql);
      console.log("ini banknya", bank);

      conn.release();
      return res.status(200).send(bank);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  getShippingCost: async (req, res) => {
    let { CityId } = req.query;

    try {
      let response = await axios.post(
        "https://api.rajaongkir.com/starter/cost",
        { origin: "152", destination: CityId, weight: 1000, courier: "jne" },
        {
          headers: { key: "2aa8392bfd96d0b0af0f4f7db657cd8e" },
        }
      );
      let ongkos = response.data.rajaongkir.results[0].costs[0].cost[0].value;

      return res.status(200).send({ ongkos });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  acceptPayment: async (req, res) => {
    // const {id} = req.user
    const { transaction_id } = req.params;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `update transaction set ? where id = ?`;
      let updatePayment = {
        status: "diproses",
        courier: "JNE",
      };
      await conn.query(sql, [updatePayment, transaction_id]);

      sql = `update log set ? where transaction_id = ?`;
      let updateLog = {
        activity: "barang terjual",
      };
      await conn.query(sql, [updateLog, transaction_id]);

      await conn.commit();
      conn.release();
      return res.status(200).send({ message: `berhasil update` });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  rejectPayment: async (req, res) => {
    let { transaction_id } = req.params;
    const { id } = req.user;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `select stock_id, activity, quantity from log where transaction_id = ?`;
      let [resultLog] = await conn.query(sql, [transaction_id]);
      console.log("ini result cart", resultLog);

      sql = `update transaction set ? where id=?`;
      let updateTransaction = {
        status: "dibatalkan",
      };
      await conn.query(sql, [updateTransaction, transaction_id]);

      // mengembalikan stock
      for (let i = 0; i < resultLog.length; i++) {
        let { stock_id, quantity } = resultLog[i];
        sql = `select id,stock from stock where id = ?`;
        let [resStock] = await conn.query(sql, stock_id);
        for (let j = 0; j < resStock.length; j++) {
          let kembalikanStock, x;
          kembalikanStock = parseInt(resStock[j].stock) - parseInt(quantity);
          x = quantity * -1;

          sql = `update stock set ? where id = ?`;
          let updateStock = {
            stock: kembalikanStock,
          };
          await conn.query(sql, [updateStock, resStock[j].id]);

          // sql = `select stock from stock where id =?`
          // let [lastStock] = await conn.query(sql,resStock[j].id)

          sql = `insert into log set ?`;
          let insertLog = {
            user_id: id,
            activity: "dibatalkan",
            quantity: x,
            stock_id: stock_id,
            transaction_id: transaction_id,
          };
          await conn.query(sql, insertLog);
        }
      }

      await conn.commit();
      conn.release();
      return res.status(200).send({ message: `transaksi dibatalkan` });
    } catch (error) {
      console.log(error);
      await conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  getWaitingPaymentByTransactionId: async (req, res) => {
    let { transaction_id } = req.params;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = ` select status from transaction where id = ? and status='menunggu pembayaran'`;
      let [status] = await conn.query(sql, transaction_id);
      if (!status) {
        return res.status(200).send([]);
      }

      sql = `select name, price,image, quantity,unit, transaction.expired_at, transaction.created_at from transaction_detail join transaction on transaction.id = transaction_detail.transaction_id where transaction_id = ?`;

      let [getTransaction] = await conn.query(sql, transaction_id);

      conn.release();
      return res.status(200).send(getTransaction);
    } catch (error) {
      console.log(error);
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
  getUserTransactionController: async (req, res) => {
    const { id } = req.user;
    const { order, filter, from_date, to_date, page, limit } = req.query;

    try {
      const result = await getUserTransactionService(
        id,
        order,
        filter,
        from_date,
        to_date,
        page,
        limit
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
    let { search, sort, filter, from_date, to_date, limit, page } = req.query;

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
      res.set("x-total-transaction", result.totalData[0].total_transaction);
      return res.status(200).send(result.data);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getProductLogController: async (req, res) => {
    let { product_id } = req.params;

    try {
      const result = await getProductLogService(product_id);
      res.set("x-total-count", result.totalData[0].total_log);
      return res.status(200).send({
        name: result.name[0].name,
        total_stock: result.totalStock[0].total_stock,
        data: result.data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getObat: async (req, res) => {
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      sql = `select id, name, hargaJual, hargaBeli, 
      (select sum(stock) from stock where product_id = product.id) as total_stock from product order by name`;
      let [product] = await conn.query(sql);
      sql = "select image from product_image where product_id=?";
      for (let i = 0; i < product.length; i++) {
        let [productImg] = await conn.query(sql, product[i].id);
        let image = productImg[0].image;
        product[i] = { ...product[i], image };
      }
      // sql = "select stock from stock where product_id=?";

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
        status: 2,
      };
      await conn.query(sql, [insertPrescription, transaction_id]);

      sql = "update transaction set ? where id = ?";
      let insertTransaction = {
        status: 2,
        expired_at: dayjs(new Date())
          .add(1, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
      await conn.query(sql, [insertTransaction, transaction_id]);

      conn.release();
      return res.status(200).send({ message: "Berhasil Upload Resep" });
    } catch (error) {
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },
};
