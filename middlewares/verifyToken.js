import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization; // Récupère le header d'autorisation

  if (!authHeader) {
    return res.status(403).json({ error: 'Token manquant.' });
  }

  // Vérifie si le token commence par "Bearer "
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifie le token
    req.user = decoded; // Stocke les informations décodées du token dans la requête
    console.log(req.user.id); // Affiche l'ID de l'utilisateur (ou d'autres informations si disponibles)
    next(); // Passe au middleware suivant
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expiré.' });
    }
    console.error('Erreur de vérification du token :', err.message);
    return res.status(403).json({ error: 'Token invalide.' });
  }
};
