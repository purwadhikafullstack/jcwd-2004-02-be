const { dbCon } = require("../connections");
const fs = require("fs");

module.exports = {
  // getDaftarProduct
  getDaftarProductService: async (
    search,
    page,
    limit,
    category,
    order_name,
    order_price
  ) => {
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

    let order;
    if (!order_name && !order_price) {
      order = `order by product.id ASC`;
    } else if (order_name && !order_price) {
      order = `order by product.name ${order_name}`;
    } else if (!order_name && order_price) {
      order = `order by product.hargaJual ${order_price}`;
    } else if (order_name && order_price) {
      order = `order by product.name ${order_name}, product.hargaJual ${order_price}`;
    }

    let offset = page * parseInt(limit);
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get tabel product & category & stock
      sql = `select product.id, name, hargaJual, hargaBeli, unit, no_obat, no_BPOM,
        (select sum(stock) from stock where product_id = product.id) as total_stock from product
        inner join category_product on product.id = category_product.product_id
        left join (select name as category_name, id from category) as kategori on category_id = kategori.id
        where true ${search} ${category} and product.is_deleted = 0 group by product.id ${order} LIMIT ${dbCon.escape(
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

      await conn.commit();
      return { data, totalData };
    } catch (error) {
      conn.rollback();
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
