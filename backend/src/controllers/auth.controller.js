// controllers/auth.controller.js
const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const { token, admin } = await authService.login(username, password);
    res.json({ success: true, data: { token, admin } });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    // The user object is attached to the request by the authenticateToken middleware
    const admin = await authService.getAdminById(req.user.id);
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe };