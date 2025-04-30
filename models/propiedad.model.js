const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Propiedad = sequelize.define('Propiedad', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: false },
  zona: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  precio: { type: DataTypes.INTEGER },
  public_id: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Propiedad;
