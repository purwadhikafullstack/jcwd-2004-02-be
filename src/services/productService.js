const { dbCon } = require("../connections");
const fs = require("fs");
const schedule = require("node-schedule");

const deleteStockScheduledServices = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    sql = `select * from stock where expired = current_date() and stock > 0`;
    let [expiredStock] = await conn.query(sql);

    for (let i = 0; i < expiredStock.length; i++) {
      const element = expiredStock[i];

      // delete expired stock
      sql = `update stock set ? where id = ?`;
      let updateStock = {
        stock: 0,
      };

      await conn.query(sql, [updateStock, element.id]);
      console.log(`expired stock deleted id: ${element.id}`);

      // insert into log
      sql = `insert into log set ?`;
      let insertLog = {
        activity: "stock expired",
        quantity: parseInt(element.stock) * -1,
        stock_id: element.id,
      };

      await conn.query(sql, insertLog);
      console.log(`log ditambahkan stock id: ${element.id}`);
    }

    await conn.commit();
    conn.release();
    return { message: "Deleted Automatically" };
  } catch (error) {
    console.log(error);
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

schedule.scheduleJob("*/5 * * * * *", () => {
  deleteStockScheduledServices();
});

module.exports = {
  // getDaftarProduct
  getDaftarProductService: async (search, page, limit, category, order) => {
    let conn, sql;

    if (category) {
      category = `and category_product.category_id = ${category}`;
    } else {
      category = ``;
    }

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    if (search) {
      search = `and product.name like '%${search}%'`;
    } else {
      search = ``;
    }

    if (order == "name") {
      order = `order by product.name ASC`;
    } else if (order == "price") {
      order = `order by product.hargaJual ASC`;
    } else {
      order = `order by product.id ASC`;
    }

    let offset = page * parseInt(limit);
    try {
      conn = await dbCon.promise().getConnection();

      // get tabel product & category & stock
      sql = `select product.id, name, hargaJual, hargaBeli, unit, no_obat, no_BPOM,
        (select sum(stock) from stock where product_id = product.id) as total_stock from product
        inner join category_product on product.id = category_product.product_id
        left join (select name as category_name, id from category) as kategori on category_id = kategori.id
        where true ${search} ${category} and product.is_deleted = 'no' group by product.id ${order} LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [data] = await conn.query(sql);

      // insert categories on each products
      sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let [categories] = await conn.query(sql, element.id);
        data[i].categories = categories;
      }

      // count tabel product & category & stock
      sql = `select count(*) as total_data from (select product.id, name, hargaJual, hargaBeli, unit, no_obat, no_BPOM,
          (select sum(stock) from stock where product_id = product.id) as total_stock from product
          inner join category_product on product.id = category_product.product_id
          left join (select name as category_name, id from category) as kategori on category_id = kategori.id
          where true ${search} ${category} group by product.id) as table_data`;

      let [totalData] = await conn.query(sql);

      return { data, totalData };
    } catch (error) {
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
  getDetailProductService: async (product_id) => {
    let conn, sql;

    try {
      conn = dbCon.promise();

      sql = `select product.id, name, hargaJual, description, product.usage, warning, brand_name, unit, brand_id,
      (select sum(stock) from stock where product_id = product.id) as total_stock from product
      join (select id, name as brand_name from brand) as b on b.id = brand_id where product.id = ?`;
      let [data] = await conn.query(sql, product_id);

      sql = `select id, image from product_image where product_id = ?`;
      let [images] = await conn.query(sql, product_id);
      data[0].images = images;

      return { data };
    } catch (error) {
      throw new Error(error.message || error);
    }
  },
  addToCartService: async (id, product_id, quantity) => {
    let conn, sql;

    if (!quantity) {
      quantity = 1;
    } else {
      quantity = parseInt(quantity);
    }

    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `select id, quantityCart from cart where user_id = ? and product_id = ?`;
      let [selectedProduct] = await conn.query(sql, [id, product_id]);

      let result;
      if (selectedProduct.length) {
        let cart_id = selectedProduct[0].id;
        let current_quantity = parseInt(selectedProduct[0].quantity);
        quantity = current_quantity + quantity;
        sql = `update cart set quantityCart = ? where id = ?`;
        [result] = await conn.query(sql, [quantity, cart_id]);
      } else {
        sql = `insert into cart set ?`;
        const product_data = {
          user_id: id,
          product_id,
          quantityCart: quantity,
        };
        [result] = await conn.query(sql, product_data);
      }

      await conn.commit();
      return result[0];
    } catch (error) {
      console.log(error);
      await conn.rollback();
      throw new Error(error || "Network error");
    } finally {
      conn.release();
    }
  },
  getProdukTerkaitService: async (brand) => {
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();

      sql = `select product.id, name, hargaJual, unit, no_obat, no_BPOM, type_name, brand_name, category_name, symptom_name, symptom_id,
      (select sum(stock) from stock where product_id = product.id) as total_stock from product
      inner join (select name as type_name, id from type) as type on product.type_id = type.id
      inner join (select name as brand_name,id from brand) as brand on product.brand_id = brand.id
      inner join category_product on product.id = category_product.product_id
      inner join (select symptom_id,product_id from symptom_product) as symptom_product on product.id = symptom_product.product_id
      left join (select name as symptom_name, id from symptom) as symptom on symptom_id = symptom.id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id
      where true and brand_name = '${brand}' and product.is_deleted = 'no' group by product.id LIMIT 0,7`;

      let [data] = await conn.query(sql);

      let sql_img = `select id, image from product_image where product_id = ?`;
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let [images] = await conn.query(sql_img, element.id);
        data[i].images = images;
      }

      return { data };
    } catch (error) {
      throw new Error(error.message || error);
    } finally {
      conn.release();
    }
  },
  // getUserProduct
  // getLastProduct
  // getCategoryObat
  // getUserCategorySelected
};
