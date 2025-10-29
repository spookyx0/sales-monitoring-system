// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);

// --- Password Reset ---
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const db = require('../db');

router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;

  try {
    const userResult = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      // For security, don't reveal if the user exists or not
      return res.status(200).json({ data: { message: 'If an account with that email exists, a password reset link has been sent.' } });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // Token expires in 10 minutes

    await db.query(
      'UPDATE admins SET password_reset_token = $1, password_reset_expires = $2 WHERE admin_id = $3',
      [passwordResetToken, passwordResetExpires, user.admin_id]
    );

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // This must be a Google App Password
      },
    });

    const mailOptions = {
      from: `"ProfitPulse" <${process.env.EMAIL_USERNAME}>`,
      to: user.email,
      subject: 'Password Reset Request for ProfitPulse',
      html: `<p>You are receiving this email because you (or someone else) have requested to reset the password for your account.</p><p>Please click on the following link, or paste it into your browser to complete the process:</p><p><a href="${resetURL}">${resetURL}</a></p><p>This link will expire in 10 minutes.</p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ data: { message: 'If an account with that email exists, a password reset link has been sent.' } });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still send a generic success message to prevent user enumeration
    res.status(200).json({ data: { message: 'If an account with that email exists, a password reset link has been sent.' } });
  }
});

router.post('/reset-password', async (req, res, next) => {
  const { token, password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const userResult = await db.query('SELECT * FROM admins WHERE password_reset_token = $1 AND password_reset_expires > NOW()', [hashedToken]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: { message: 'Password reset token is invalid or has expired.' } });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query('UPDATE admins SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE admin_id = $2', [hashedPassword, user.admin_id]);

    res.status(200).json({ data: { message: 'Password has been reset successfully.' } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;