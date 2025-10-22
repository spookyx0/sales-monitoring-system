const db = require('../db');

const log = async (adminId, action, resource, resourceId, beforeState, afterState, ipAddress) => {
  await db.query(
    `INSERT INTO audits (admin_id, action, resource, resource_id, before_state, after_state, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      adminId,
      action,
      resource,
      resourceId,
      beforeState ? JSON.stringify(beforeState) : null,
      afterState ? JSON.stringify(afterState) : null,
      ipAddress
    ]
  );
};

const getAudits = async ({ page, limit, action, resource, adminId }) => {
  let query = 'SELECT a.*, ad.username FROM audits a LEFT JOIN admins ad ON a.admin_id = ad.id WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND a.action = ?';
    params.push(action);
  }

  if (resource) {
    query += ' AND a.resource = ?';
    params.push(resource);
  }

  if (adminId) {
    query += ' AND a.admin_id = ?';
    params.push(adminId);
  }

  const offset = (page - 1) * limit;
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [audits] = await db.query(query, params);
  const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM audits WHERE 1=1');

  return { audits, total, page: parseInt(page), limit: parseInt(limit) };
};

module.exports = { log, getAudits };