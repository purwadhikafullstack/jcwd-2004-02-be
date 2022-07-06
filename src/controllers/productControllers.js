const { dbCon } = require("../connections");
const db = require("../connections/mysqldb");
const { json } = require("body-parser");
const fs = require("fs");

module.exports = {
  fetchDaftarProduk: async (req, res) => {
    let conn, sql;
    let { search, page, limit, category } = req.query;

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

    let offset = page * parseInt(limit);

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get tabel product & category & stock
      sql = `select product.id, name, hargaJual, hargaBeli, unit, no_obat, no_BPOM,
      (select sum(stock) from stock where product_id = product.id) as total_stock from product
      inner join category_product on product.id = category_product.product_id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id
      where true ${search} ${category} and product.is_deleted = 0 group by product.id LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [result] = await conn.query(sql);

      sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;

      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        let [categories] = await conn.query(sql, element.id);
        result[i].categories = categories;
      }

      // count tabel product & category & stock
      sql = `select count(*) as total_data from (select product.id, name, hargaJual, hargaBeli, unit, no_obat, no_BPOM,
        (select sum(stock) from stock where product_id = product.id) as total_stock from product
        inner join category_product on product.id = category_product.product_id
        left join (select name as category_name, id from category) as kategori on category_id = kategori.id
        where true ${search} ${category} group by product.id) as table_data`;

      let [totalData] = await conn.query(sql);

      await conn.commit();
      conn.release();
      // console.log(result);
      res.set("x-total-product", totalData[0].total_data);
      // console.log(totalData[0].total_data);
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      // console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getLastProduk: async (req, res) => {
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      // get last tabel product & category & stock
      sql = `select product.id, name, hargaJual, hargaBeli, unit, no_obat, no_BPOM,
      (select sum(stock) from stock where product_id = product.id) as total_stock from product
      inner join category_product on product.id = category_product.product_id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id
      group by product.id ORDER BY ID DESC LIMIT 1`;
      let [result] = await conn.query(sql);

      sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;

      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        let [categories] = await conn.query(sql, element.id);
        result[i].categories = categories;
      }

      // count tabel product
      sql = `select count(*) as total_data from product`;
      let [totalData] = await conn.query(sql);

      await conn.commit();
      conn.release();
      res.set("x-total-product", totalData[0].total_data);
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      // console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  getCategoryObat: async (req, res) => {
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `select id, name from category`;
      let [category] = await conn.query(sql);

      await conn.commit();
      return res.status(200).send(category);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getComponentObat: async (req, res) => {
    let conn, sql;
    try {
      conn = dbCon.promise();
      sql = `select id, name from category`;
      let [category] = await conn.query(sql);

      sql = `select id, name from symptom`;
      let [symptom] = await conn.query(sql);

      sql = `select id, name from brand`;
      let [brand] = await conn.query(sql);

      sql = `select id, name from type`;
      let [type] = await conn.query(sql);

      return res.status(200).send({ category, symptom, brand, type });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  addProducts: async (req, res) => {
    console.log("ini req.body", req.body);
    let path = "/products";

    const data = JSON.parse(req.body.data);
    console.log("ini data", data);
    const { products } = req.files;
    console.log("files", req.files);

    // looping filename
    const imagePaths = products
      ? products.map((val) => {
          return `${path}/${val.filename}`;
        })
      : [];

    // Proteksi tidak ada foto
    if (!imagePaths.length) {
      return res.status(500).send({ message: "Foto tidak ada" });
    }

    // console.log(products);
    console.log(imagePaths);

    let conn, sql;
    try {
      conn = dbCon.promise();
      sql = `insert into product set ?`;
      let insertData = {
        name: data.name,
        description: JSON.stringify(data.description),
        warning: JSON.stringify(data.warning),
        usage: JSON.stringify(data.usage),
        // quantity: data.quantity,
        unit: data.unit,
        no_BPOM: data.no_BPOM,
        hargaJual: data.hargaJual,
        hargaBeli: data.hargaBeli,
        no_obat: data.no_obat,

        brand_id: data.brand_id,
        type_id: data.type_id,
      };

      let [resultProd] = await conn.query(sql, insertData);
      let prodId = resultProd.insertId;
      sql = `insert into product_image set ?`;
      for (let i = 0; i < imagePaths.length; i++) {
        let insertDataImage = {
          image: imagePaths[i],
          product_id: prodId,
        };
        await conn.query(sql, insertDataImage);
      }
      sql = `insert into stock set ?`;
      let insertDataStock = {
        stock: data.stock,
        expired: data.expired,
        product_id: prodId,
      };
      await conn.query(sql, insertDataStock);

      sql = `insert into symptom_product set ?`;
      for (let i = 0; i < data.symptom.length; i++) {
        let insertDataSymptom = {
          symptom_id: data.symptom[i],
          product_id: prodId,
        };
        await conn.query(sql, insertDataSymptom);
      }

      sql = `insert into category_product set ?`;
      for (let i = 0; i < data.category.length; i++) {
        let insertDataCategory = {
          category_id: data.category[i],
          product_id: prodId,
        };
        await conn.query(sql, insertDataCategory);
      }

      return res.status(200).send({ message: "Berhasil Upload Obat" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  editProducts: async (req, res) => {
    console.log(req.body, "ini req body");

    const data = req.body;
    const { id } = req.params;

    let conn, sql;
    try {
      conn = dbCon.promise();

      // get ID
      // name, description, warning, usage, brand_id, type_id, no_BPOM, no_obat
      let sql = `select * from product where id = ?`;
      [result] = await conn.query(sql, [id]);
      if (!result.length) {
        throw { message: "id tidak ditemukan" };
      }

      sql = `update product set ? where id = ?`;
      let editDataProducts = {
        name: data.name,
        description: JSON.stringify(data.description),
        warning: data.warning,
        usage: data.usage,

        no_BPOM: data.no_BPOM,
        no_obat: data.no_obat,

        brand_id: data.brand_id,
        type_id: data.type_id,
      };
      await conn.query(sql, [editDataProducts, id]);
      // if (!editData.length) {
      //   throw { message: "id tidak ditemukan" };
      // }

      sql = `delete from symptom_product where product_id = ?`;
      await conn.query(sql, id);
      sql = `insert into symptom_product set ?`;
      for (let i = 0; i < data.symptom.length; i++) {
        let insertDataSymptom = {
          symptom_id: data.symptom[i],
          product_id: id,
        };
        await conn.query(sql, insertDataSymptom);
      }

      sql = `delete from category_product where product_id = ?`;
      await conn.query(sql, id);
      sql = `insert into category_product set ? `;
      for (let i = 0; i < data.category.length; i++) {
        let insertDataCategory = {
          category_id: data.category[i],
          product_id: id,
        };
        await conn.query(sql, insertDataCategory);
      }

      return res.status(200).send({ message: "Berhasil Update Obat" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  editProductsPicture: async (req, res) => {
    console.log("ini req.body", req.body);
    let path = "/products";

    const { products } = req.files;
    console.log("files", req.files);

    const product_id = JSON.parse(req.body.data);

    // looping filename
    const imagePath = products ? `${path}/${products[0].filename}` : null;

    // Proteksi tidak ada foto
    if (!imagePath) {
      return res.status(500).send({ message: "Foto tidak ada" });
    }

    let conn, sql;
    try {
      conn = dbCon.promise();
      // insert foto
      sql = `insert into product_image set ?`;
      let insertImage = { image: imagePath, product_id };
      await conn.query(sql, [insertImage]);

      return res.status(200).send({ message: "Berhasil Update Foto Obat" });
    } catch (error) {
      console.log(error);
      if (imagePath) {
        fs.unlinkSync("./public" + imagePath);
      }
      return res.status(500).send({ message: error.message || error });
    }
  },
  deleteProductsPicture: async (req, res) => {
    let { id } = req.params;
    console.log(id, "id");

    let conn, sql;
    try {
      conn = dbCon.promise();

      // get ID
      sql = `select id, image from product_image where id = ?`;
      let [result] = await conn.query(sql, [id]);
      if (!result.length) {
        throw { message: "id tidak ditemukan" };
      }

      // delete foto
      sql = `delete from product_image where id = ?`;
      await conn.query(sql, [id]);
      // delete photo di server
      if (result[0].image) {
        fs.unlinkSync("./public" + result[0].image);
      }
      console.log("berhasil delet");
      return res.status(200).send({ message: "Berhasil Delete Foto Obat" });
    } catch (error) {
      console.log(error);

      return res.status(500).send({ message: error.message || error });
    }
  },
  fetchUserProduct: async (req, res) => {
    let conn, sql;
    let {
      search,
      page,
      limit,
      category,
      type,
      symptom,
      min_price,
      max_price,
      brand,
    } = req.query;

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 24;
    }

    if (search) {
      search = `and product.name like '%${search}%'`;
    } else {
      search = ``;
    }

    if (category) {
      category = `and category_product.category_id = ${category}`;
    } else {
      category = ``;
    }

    if (symptom) {
      symptom = symptom.split(",").map((val) => parseInt(val));
      symptom = `where symptom_id in (${dbCon.escape(symptom)})`;
    } else {
      symptom = ``;
    }

    if (type) {
      type = `and type_id in (${type})`;
    } else {
      type = ``;
    }

    if (brand) {
      brand = `and brand_id in (${brand})`;
    } else {
      brand = ``;
    }

    let price;
    if (min_price || max_price) {
      price = `and product.hargaJual between ${min_price} and ${max_price}`;
    } else {
      price = ``;
    }

    let offset = page * parseInt(limit);

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // sql = `select product.id, name, hargaJual, unit, no_obat, no_BPOM, type_name, image, brand_name,
      // (select sum(stock) from stock where product_id = product.id) as total_stock from product
      // inner join (select image, product_id from product_image) as img on product.id = img.product_id
      // inner join (select name as type_name, id from type) as type on product.type_id = type.id
      // inner join (select name as brand_name,id from brand) as brand on product.brand_id = brand.id
      // inner join category_product on product.id = category_product.product_id
      // inner join symptom_product on product.id = symptom_product.product_id
      // left join (select name as symptom_name, id from symptom) as symptom on symptom_id = symptom.id
      // left join (select name as category_name, id from category) as kategori on category_id = kategori.id
      // where true ${search} ${category} ${symptom} ${type} ${brand} ${price}
      // and product.is_deleted = 0 group by product.id LIMIT ${dbCon.escape(
      //   offset
      // )}, ${dbCon.escape(limit)}`;

      sql = `select product.id, name, hargaJual, unit, no_obat, no_BPOM, type_name, brand_name, category_name, symptom_name, symptom_id,
      (select sum(stock) from stock where product_id = product.id) as total_stock from product
      inner join (select name as type_name, id from type) as type on product.type_id = type.id
      inner join (select name as brand_name,id from brand) as brand on product.brand_id = brand.id
      inner join category_product on product.id = category_product.product_id
      inner join (select symptom_id,product_id from symptom_product ${symptom}) as symptom_product on product.id = symptom_product.product_id
      left join (select name as symptom_name, id from symptom) as symptom on symptom_id = symptom.id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id
      where true ${search} ${category} ${type} ${brand} ${price} and product.is_deleted = 0 group by product.id  LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;

      let [result] = await conn.query(sql);
      // console.log(result);
      // console.log(sql);

      let sql_cat = `select id, name from category_product cp join category c on cp.category_id = c.id where product_id = ?`;
      let sql_symp = `select id, name from symptom_product sp join symptom s on sp.symptom_id = s.id where product_id = ?`;
      let sql_img = `select id, image from product_image where product_id = ?`;

      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        let [categories] = await conn.query(sql_cat, element.id);
        result[i].categories = categories;
        let [symptoms] = await conn.query(sql_symp, element.id);
        result[i].symptoms = symptoms;
        let [images] = await conn.query(sql_img, element.id);
        result[i].images = images;
      }

      // get img beda query

      // count tabel product & category & stock
      sql = `select count(*) as total_data from (select product.id, name, hargaJual, hargaBeli, unit, no_obat, no_BPOM,
        (select sum(stock) from stock where product_id = product.id) as total_stock from product
        inner join (select name as type_name, id from type) as type on product.type_id = type.id
        inner join (select name as brand_name,id from brand) as brand on product.brand_id = brand.id
        inner join category_product on product.id = category_product.product_id
        inner join (select symptom_id,product_id from symptom_product ${symptom}) as symptom_product on product.id = symptom_product.product_id
        left join (select name as symptom_name, id from symptom) as symptom on symptom_id = symptom.id
        left join (select name as category_name, id from category) as kategori on category_id = kategori.id
        where true ${search} ${category} ${type} ${brand} ${price} and product.is_deleted = 0 group by product.id) as table_data`;

      let [totalData] = await conn.query(sql);

      await conn.commit();
      conn.release();
      // console.log(result);
      res.set("x-total-product", totalData[0].total_data);
      // console.log(totalData[0].total_data);
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      // console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getUserCategorySelected: async (req, res) => {
    let { category_id } = req.params;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `select id, name from category where id = ?`;
      let [category] = await conn.query(sql, category_id);

      await conn.commit();
      return res.status(200).send(category);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  // // edit product stock per tanggal expire
  // editProductsStock: async (req, res) => {
  //   console.log("ini req.body", req.body);

  //   const data = JSON.parse(req.body.data);
  //   const { stock_id } = req.params;

  //   console.log(data);
  //   let conn, sql;
  //   try {
  //     conn = dbCon.promise();

  //     // get ID
  //     let sql = `select * from stock where id = ?`;
  //     let [result] = await conn.query(sql, [stock_id]);
  //     if (!result.length) {
  //       throw { message: "id tidak ditemukan" };
  //     }

  //     sql = `update stock set ? where id = ?`;

  //     // let [result1] = await conn.query(sql, [data, stock_id]);
  //     // if (!result1.length) {
  //     //   throw { message: "id tidak ditemukan" };
  //     // }
  //     let editDataStock = {
  //       stock: data.stock,
  //       expired: data.expired,
  //     };
  //     await conn.query(sql, [editDataStock, stock_id]);

  //     return res.status(200).send({ message: "Berhasil Update Stock Obat" });
  //   } catch (error) {
  //     console.log(error);
  //     return res.status(500).send({ message: error.message || error });
  //   }
  // },

  deleteProducts: async (req, res) => {
    const { id } = req.params;

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      console.log("this is product id", id);

      // get ID

      sql = `update product set is_deleted = 1 where id = ?`;
      await conn.query(sql, id);

      conn.release();

      return res.status(200).send({ message: "Berhasil Menghapus Obat" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  //   deleteProductsStock: async (req, res) => {
  //     console.log("ini req.body", req.body);

  //     const data = JSON.parse(req.body.data);
  //     const { stock_id } = req.params;

  //     console.log(data);
  //     let conn, sql;
  //     try {
  //       conn = dbCon.promise();

  //       // get ID
  //       let sql = `select * from stock where id = ?`;
  //       let [result] = await conn.query(sql, [stock_id]);
  //       console.log("INI", id);
  //       if (!result.length) {
  //         throw { message: "id tidak ditemukan" };
  //       }

  //       sql = `delete stock set ? where id = ?`;
  //       // let [result1] = await conn.query(sql, [data, stock_id]);
  //       // if (!result1.length) {
  //       //   throw { message: "id tidak ditemukan" };
  //       // }
  //       let editDataStock = {
  //         stock: data.stock,
  //         expired: data.expired,
  //       };
  //       await conn.query(sql, [editDataStock, stock_id]);

  //       return res.status(200).send({ message: "Berhasil Delete Stock Obat" });
  //     } catch (error) {
  //       console.log(error);
  //       return res.status(500).send({ message: error.message || error });
  //     }
  getSelectedProduct: async (req, res) => {
    let { id } = req.params;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `select id, name, no_obat, no_BPOM, brand_id, type_id, description, warning, product.usage from product where id = ?`;
      let [product] = await conn.query(sql, id);

      sql = `select type.id, type.name from type inner join product on product.type_id=type.id where product.id=?`;
      let [type] = await conn.query(sql, id);
      product[0].type_id = { value: type[0].id, label: type[0].name };

      sql = `select brand.id, brand.name from brand inner join product on product.brand_id=brand.id where product.id=?`;
      let [brand] = await conn.query(sql, id);
      product[0].brand_id = { value: brand[0].id, label: brand[0].name };

      sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;
      let [category] = await conn.query(sql, id);
      product[0].category = category.map((category) => {
        if (category.id) {
          return { value: category.id, label: category.name };
        }
        return category;
      });

      sql = `select id, name from symptom_product sp inner join symptom s on sp.symptom_id = s.id where product_id = ?`;
      let [symptom] = await conn.query(sql, id);
      product[0].symptom = symptom.map((symptom) => {
        if (symptom.id) {
          return { value: symptom.id, label: symptom.name };
        }
        return symptom;
      });
      console.log(product[0], "produk");
      await conn.commit();
      return res.status(200).send(product[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
  getSelectedProductPicture: async (req, res) => {
    let { id } = req.params;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      sql = `select id, image from product_image where product_id = ?`;
      let [product] = await conn.query(sql, id);

      await conn.commit();
      return res.status(200).send(product);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
};
