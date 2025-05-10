const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
  plan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  detalle: {
    type: DataTypes.TEXT
  },
  valorNeto: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  valorCuota: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  tipoPlan: { // ✅ renombrado para estilo camelCase
    type: DataTypes.STRING,
    allowNull: false
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
  duracionMeses: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true // ✅ para createdAt y updatedAt
});

module.exports = Plan;
