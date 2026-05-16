/**
 * Admin-only authorization middleware.
 * Must be used AFTER the auth middleware.
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
}

module.exports = adminOnly;
