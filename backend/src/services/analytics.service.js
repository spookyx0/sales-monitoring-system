const db = require('../db');

const generateDateRange = (days) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const fillMissingDates = (data, dateRange, valueField = 'value') => {
  const dataMap = new Map(data.map(d => [d.day, d[valueField]]));
  return dateRange.map(date => parseFloat(dataMap.get(date) || 0));
};

const getOverview = async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevMonthDate.getMonth() + 1;
  const prevMonthYear = prevMonthDate.getFullYear();
  const dateRange30Days = generateDateRange(30);

  const queries = [
    // Current Month Revenue
    db.query('SELECT COALESCE(SUM(total_amount), 0) as value FROM sales WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?', [currentMonth, currentYear]),
    // Previous Month Revenue
    db.query('SELECT COALESCE(SUM(total_amount), 0) as value FROM sales WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?', [prevMonth, prevMonthYear]),
    // Total Items (current)
    db.query("SELECT COUNT(*) as value FROM items WHERE status = 'active'"),
    // New Items This Month
    db.query('SELECT COUNT(*) as value FROM items WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?', [currentMonth, currentYear]),
    // Low Stock Count (current)
    db.query('SELECT COUNT(*) as value FROM items WHERE qty_in_stock <= reorder_level AND status = "active"'),
    // Current Month Expenses
    db.query('SELECT COALESCE(SUM(amount), 0) as value FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?', [currentMonth, currentYear]),
    // Previous Month Expenses
    db.query('SELECT COALESCE(SUM(amount), 0) as value FROM expenses WHERE MONTH(date) = ? AND YEAR(date) = ?', [prevMonth, prevMonthYear]),
    // Revenue Trend (last 6 months)
    db.query(`SELECT DATE_FORMAT(created_at, '%b') as month, SUM(total_amount) as revenue FROM sales WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY month, YEAR(created_at), MONTH(created_at) ORDER BY YEAR(created_at), MONTH(created_at) ASC`),
    // Top Selling Items (current month)
    db.query(`SELECT i.name, SUM(si.quantity) as qty FROM sale_items si LEFT JOIN items i ON si.item_id = i.item_id WHERE si.sale_id IN (SELECT sale_id FROM sales WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?) GROUP BY si.item_id ORDER BY qty DESC LIMIT 5`, [currentMonth, currentYear]),
    // Expense Trend (last 6 months)
    db.query(`SELECT DATE_FORMAT(date, '%b') as month, SUM(amount) as total FROM expenses WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY month, YEAR(date), MONTH(date) ORDER BY YEAR(date), MONTH(date) ASC`),
    // New Items Trend (last 6 months)
    db.query(`SELECT DATE_FORMAT(created_at, '%b') as month, COUNT(*) as total FROM items WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY month, YEAR(created_at), MONTH(created_at) ORDER BY YEAR(created_at), MONTH(created_at) ASC`),
    // Revenue Trend (last 30 days)
    db.query(`SELECT DATE(created_at) as day, SUM(total_amount) as value FROM sales WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY day ORDER BY day ASC`),
    // New Items Trend (last 30 days)
    db.query(`SELECT DATE(created_at) as day, COUNT(*) as value FROM items WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY day ORDER BY day ASC`),
    // Expenses Trend (last 30 days)
    db.query(`SELECT date as day, SUM(amount) as value FROM expenses WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY day ORDER BY day ASC`),
  ];

  const [
    [[{ value: monthRevenue }]],
    [[{ value: prevMonthRevenue }]],
    [[{ value: totalItems }]],
    [[{ value: newItemsThisMonth }]],
    [[{ value: lowStockCount }]],
    [[{ value: monthExpenses }]],
    [[{ value: prevMonthExpenses }]],
    [revenueData],
    [topItems],
    [expenseData],
    [newItemsData],
    [revenueTrend30DaysRaw],
    [newItemsTrend30DaysRaw],
    [expensesTrend30DaysRaw],
  ] = await Promise.all(queries);

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const revenueTrend30Days = fillMissingDates(revenueTrend30DaysRaw, dateRange30Days);
  const newItemsTrend30Days = fillMissingDates(newItemsTrend30DaysRaw, dateRange30Days);
  const expensesTrend30Days = fillMissingDates(expensesTrend30DaysRaw, dateRange30Days);

  return {
    stats: {
      monthRevenue: {
        value: parseFloat(monthRevenue) || 0,
        change: calculatePercentageChange(monthRevenue, prevMonthRevenue),
        trend: revenueTrend30Days,
      },
      totalItems: {
        value: totalItems,
        change: newItemsThisMonth, // Showing new items this month as the 'change'
        trend: newItemsTrend30Days,
      },
      lowStockCount: {
        value: lowStockCount,
        change: null, // Cannot reliably calculate change without historical snapshots
        trend: [],
      },
      monthExpenses: {
        value: parseFloat(monthExpenses) || 0,
        change: calculatePercentageChange(monthExpenses, prevMonthExpenses),
        trend: expensesTrend30Days,
      },
    },
    trends: {
      months: revenueData.map(r => r.month),
      revenue: revenueData.map(r => parseFloat(r.revenue)),
      expenses: expenseData.map(e => parseFloat(e.total)),
      newItems: newItemsData.map(i => i.total),
    },
    topItems,
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

const getExpenseStats = async () => {
  const [[{ today }]] = await db.query(
    'SELECT COALESCE(SUM(amount), 0) as today FROM expenses WHERE date = CURDATE()'
  );

  const [[{ week }]] = await db.query(
    'SELECT COALESCE(SUM(amount), 0) as week FROM expenses WHERE YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)'
  );

  const [[{ month }]] = await db.query(
    'SELECT COALESCE(SUM(amount), 0) as month FROM expenses WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())'
  );

  const [[{ year }]] = await db.query(
    'SELECT COALESCE(SUM(amount), 0) as year FROM expenses WHERE YEAR(date) = YEAR(CURDATE())'
  );

  return {
    today: parseFloat(today) || 0,
    week: parseFloat(week) || 0,
    month: parseFloat(month) || 0,
    year: parseFloat(year) || 0,
  };
};

module.exports = { getOverview, getMonthly, getExpenseStats };