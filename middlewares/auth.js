// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para autenticar o utilizador
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Utilizador não encontrado' });
    }

    req.user = user; // adiciona o user ao request
    next();
  } catch (err) {
    console.error('Erro de autenticação:', err);
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin,
};
