const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importar routers
const userRoutes = require('./routes/userRoutes');
const flatRoutes = require('./routes/flatRoutes'); // <-- ADICIONADO

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Usar routers
app.use('/users', userRoutes);
app.use('/flats', flatRoutes); // <-- ADICIONADO

// Ligação à base de dados
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Arrancar servidor
app.listen(5000, () => console.log("Server running on port 5000"));
