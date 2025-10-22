const analyticsService = require('../services/analytics.service');

const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getMonthly = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const data = await analyticsService.getMonthly(year, month);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, getMonthly };