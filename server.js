const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const propiedadRoutes = require('./routes/propiedades.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/propiedades', propiedadRoutes);

// Test DB y sincronización Sincronizá el modelo no forzando la tabla 
// sequelize.sync({ force: false })
// Test DB y sincronización Sincronizá el modelo forzando la tabla   Borra y recrea todas las tablas
// sequelize.sync({ force: true  })
//Sincronizá el modelo para no borrar: (no recomendado en producción):
sequelize.sync({ alter: true })

.then(() => {
  console.log('🟢 DB sincronizada');
  app.listen(3001, () => console.log('Servidor corriendo en http://localhost:3001'));
}).catch(err => {
  console.error('🔴 Error al conectar la DB:', err);
});
