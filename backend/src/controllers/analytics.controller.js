const analyticsService = require('../services/analytics.service');

const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getExpenseStats = async (req, res, next) => {
  try {
    const data = await analyticsService.getExpenseStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getExpenseStats,
};