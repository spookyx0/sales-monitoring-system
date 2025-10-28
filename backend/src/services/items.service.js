// services/items.service.js
const db = require('../db');
const createError = require('http-errors');

const createItem = async (itemData) => {
  const { item_number, name, description, category, sku, barcode, qty_in_stock, reorder_level, purchase_price, selling_price, status, image_url } = itemData;
  const [result] = await db.query(
    `INSERT INTO items (item_number, name, description, category, sku, barcode, qty_in_stock, reorder_level, purchase_price, selling_price, status, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item_number, name, description, category, sku, barcode, qty_in_stock, reorder_level, purchase_price || 0, selling_price, status || 'active', image_url]
  );
  return { item_id: result.insertId, ...itemData };
};

const getItems = async ({ page = 1, limit = 20, search, status, lowStock, sortBy, sortOrder }) => {
  let query = 'SELECT * FROM items WHERE 1=1';
  const params = [];
  let countQuery = 'SELECT COUNT(*) as total FROM items WHERE 1=1';
  const countParams = [];

  if (search) {
    const searchQuery = ' AND (name LIKE ? OR item_number LIKE ? OR sku LIKE ?)';
    query += searchQuery;
    countQuery += searchQuery;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Correctly handle status filtering for both query and countQuery
  if (status && status !== 'all') {
    const statusQuery = ' AND status = ?';
    query += statusQuery;
    countQuery += statusQuery;
    params.push(status);
    countParams.push(status);
  } else if (!status) {
    query += " AND status = 'active'";
    countQuery += " AND status = 'active'";
  } // if status is 'all', we don't add a WHERE clause for it

  if (lowStock === 'true') {
    query += ' AND qty_in_stock <= reorder_level';
    countQuery += ' AND qty_in_stock <= reorder_level';
  }

  // Whitelist columns for sorting to prevent SQL injection
  const allowedSortBy = ['item_number', 'name', 'category', 'qty_in_stock', 'selling_price', 'created_at'];
  const sortColumn = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
  const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;
  // Add secondary sort by item_id for stable sorting
  query += ` ORDER BY ${sortColumn} ${sortDirection}, item_id ${sortDirection}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [items] = await db.query(query, params);
  const [[{ total }]] = await db.query(countQuery, countParams);

  return { items, total, page: parseInt(page), limit: parseInt(limit) };
};

const getItemById = async (id) => {
  const [[item]] = await db.query('SELECT * FROM items WHERE item_id = ?', [id]);
  if (!item) {
    throw createError(404, 'Item not found');
  }
  return item;
};

const updateItem = async (id, itemData) => {
  const originalItem = await getItemById(id);

  // Create a subset of originalItem that matches keys in itemData for the audit log
  const originalData = Object.keys(itemData).reduce((acc, key) => {
    if (originalItem.hasOwnProperty(key)) {
      acc[key] = originalItem[key];
    }
    return acc;
  }, {});

  const [result] = await db.query('UPDATE items SET ? WHERE item_id = ?', [itemData, id]);

  if (result.affectedRows === 0) {
    throw createError(404, 'Item not found or no new data to update');
  }

  const [[updatedItem]] = await db.query('SELECT * FROM items WHERE item_id = ?', [id]);

  return { updatedItem, originalData };
};

const deleteItem = async (id) => {
  // Soft delete by setting status to 'inactive' instead of a hard delete
  const [result] = await db.query("UPDATE items SET status = 'inactive' WHERE item_id = ?", [id]);
  if (result.affectedRows === 0) {
    throw createError(404, 'Item not found');
  }
  return { success: true };
};

const restoreItem = async (id) => {
  // "Un-soft-delete" by setting status to 'active'
  const [result] = await db.query("UPDATE items SET status = 'active' WHERE item_id = ?", [id]);
  if (result.affectedRows === 0) {
    throw createError(404, 'Item not found');
  }
  return { success: true };
};


module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  restoreItem,
};