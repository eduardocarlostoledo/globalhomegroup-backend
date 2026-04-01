const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Propiedad = sequelize.define('Propiedad', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: false },
  operacion: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'VENTA'
  },
  // models/Propiedad.js
zona_provincia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  zona_municipio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  zona_localidad: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  descripcion: { type: DataTypes.TEXT },
  precio: { type: DataTypes.INTEGER },

  // Cambiamos estos dos
  imagenes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  public_ids: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  }
});

module.exports = Propiedad;
