const express = require('express');
const cors = require('cors');
const app = express();
const adminRoutes = require('./routes/adminRoutes');

app.use(cors());
app.use(express.json());
app.use('/', adminRoutes);

app.listen(3000, () => {
  console.log('Servidor backend escuchando en puerto 3000');
});
