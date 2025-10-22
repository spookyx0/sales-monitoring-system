const auditsService = require('../services/audits.service');

const getAudits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, resource, adminId, search } = req.query;
    const audits = await auditsService.getAudits({ page, limit, action, resource, adminId, search });
    res.json({ success: true, data: audits });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAudits };