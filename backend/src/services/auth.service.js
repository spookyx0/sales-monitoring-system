// services/auth.service.js
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const login = async (username, password) => {
  const [[admin]] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

  if (!admin) {
    throw createError(401, 'Invalid username or password');
  }

  const isPasswordMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordMatch) {
    throw createError(401, 'Invalid username or password');
  }

  // Don't include the password hash in the token or response
  delete admin.password_hash;

  const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  return { token, admin };
};

const getAdminById = async (id) => {
  const [[admin]] = await db.query('SELECT id, username, email, full_name, role, created_at FROM admins WHERE id = ?', [id]);

  if (!admin) {
    throw createError(404, 'Admin not found');
  }

  return admin;
};

module.exports = { login, getAdminById };