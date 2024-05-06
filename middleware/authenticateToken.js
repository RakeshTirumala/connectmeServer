
const jwt = require('jsonwebtoken');
function authenticateToken(request, response, next){
    const token = request.cookies.token;
    console.log("token", token)
    if (!token) {
        return response.status(401).json({ message: "Authentication token missing" });
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) {
            console.error("JWT verification error:", err.message);
            return response.status(403).json({ message: "Invalid token" });
        }
        console.log("User authenticated:", user);
        next();
    });
};

module.exports = authenticateToken;
