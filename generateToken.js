const jwt = require("jsonwebtoken");

// Usa el mismo secreto que tienes en tu .env
const secret = "supersecreto123";
// Datos de usuario de prueba
const payload = {
  id: 1,
  email: "admin@email.com",
  role: "admin"
};

const token = jwt.sign(payload, secret, { expiresIn: "1h" });
console.log(token);