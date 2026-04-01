const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Construccion = sequelize.define('Construccion', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  detalle: {
    type: DataTypes.TEXT
  },
  metrosCuadrados: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 }
  },
  valor: {
    type: DataTypes.INTEGER,
    validate: { min: 0 }
  },
  cantidadAmbientes: {
    type: DataTypes.INTEGER,
    validate: { min: 0 }
  },
  cantidadDormitorios: {
    type: DataTypes.INTEGER,
    validate: { min: 0 }
  },
  cantidadBanios: {
    type: DataTypes.INTEGER,
    validate: { min: 0 }
  },
  formaPago: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  condicionesDePago: {
    type: DataTypes.TEXT
  },
  imagenes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  public_ids: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Construccion;
