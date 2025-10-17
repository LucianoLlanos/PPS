// requireRoleId: accepts one or more allowed role ids
function requireRoleId(...allowed) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    const idRol = Number(user.idRol);
    if (allowed.includes(idRol)) return next();
    return res.status(403).json({ error: 'Acceso denegado' });
  };
}

module.exports = { requireRoleId };
