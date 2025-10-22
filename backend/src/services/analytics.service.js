const db = require('../db');

const getOverview = async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [[{ monthRevenue }]] = await db.query(
    'SELECT COALESCE(SUM(total_amount), 0) as monthRevenue FROM sales WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?',
    [currentMonth, currentYear]
  );

  const [[{ totalItems }]] = await db.query('SELECT COUNT(*) as totalItems FROM items');

  const [[{ lowStockCount }]] = await db.query(
    'SELECT COUNT(*) as lowStockCount FROM items WHERE qty_in_stock <= reorder_level'
  );

  const [[{ monthExpenses }]] = await db.query(
    'SELECT COALESCE(SUM(amount), 0) as monthExpenses FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?',
    [currentMonth, currentYear]
  );

  const [revenueData] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%b') as month, SUM(total_amount) as revenue 
     FROM sales 
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
     GROUP BY YEAR(created_at), MONTH(created_at)
     ORDER BY created_at ASC`
  );

  const [topItems] = await db.query(
    `SELECT i.name, SUM(si.quantity) as qty 
     FROM sale_items si 
     LEFT JOIN items i ON si.item_id = i.item_id
     WHERE si.sale_id IN (SELECT sale_id FROM sales WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?)
     GROUP BY si.item_id 
     ORDER BY qty DESC 
     LIMIT 5`,
    [currentMonth, currentYear]
  );

  return {
    monthRevenue: parseFloat(monthRevenue) || 0,
    totalItems,
    lowStockCount,
    monthExpenses: parseFloat(monthExpenses) || 0,
    months: revenueData.map(r => r.month),
    revenue: revenueData.map(r => parseFloat(r.revenue)),
    topItems
  };
};

const getMonthly = async (year, month) => {
  const [[{ totalRevenue }]] = await db.query(
    'SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM sales WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?',
    [month, year]
  );

  const [[{ totalExpenses }]] = await db.query(
    'SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?',
    [month, year]
  );

  return {
    year: parseInt(year),
    month: parseInt(month),
    totalRevenue: parseFloat(totalRevenue) || 0,
    totalExpenses: parseFloat(totalExpenses) || 0,
    netProfit: (parseFloat(totalRevenue) || 0) - (parseFloat(totalExpenses) || 0)
  };
};

module.exports = { getOverview, getMonthly };