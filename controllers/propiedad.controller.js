const Propiedad = require("../models/propiedad.model");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { Op } = require("sequelize");

const subirPropiedad = async (req, res) => {
  try {
    // Validaciones mínimas
    if (!req.file) {
      return res.status(400).json({ error: "Debe enviar una imagen" });
    }

    // Subir imagen a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "propiedades",
    });

    // Guardar en DB
    const nuevaPropiedad = await Propiedad.create({
      titulo: req.body.titulo,
      tipo: req.body.tipo,
      operacion: req.body.operacion,
      zona: req.body.zona,
      descripcion: req.body.descripcion,
      precio: req.body.precio,
      public_id: result.public_id,
      url: result.secure_url,
    });

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    res.status(201).json(nuevaPropiedad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listarPropiedades = async (req, res) => {
  try {
    const { tipo, operacion, zona, page = 1, limit = 10, precioMin, precioMax } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    // Agregado correctamente en este orden:
    if (precioMin && precioMax) {
      where.precio = {
        [Op.between]: [parseInt(precioMin), parseInt(precioMax)]
      };
    } else if (precioMax) {
      where.precio = { [Op.lte]: parseInt(precioMax) };
    } else if (precioMin) {
      where.precio = { [Op.gte]: parseInt(precioMin) };
    }
    
    if (tipo) {
        where.tipo = { [Op.iLike]: tipo }; // permite Dúplex, DUPLEX, etc.
      }
          if (operacion) where.operacion = operacion;
    if (zona) {
        where.zona = {
          [Op.iLike]: zona  // permite coincidencia case-insensitive
        };
      }
          
    // luego sigue igual
    

    const { count, rows } = await Propiedad.findAndCountAll({
      where,
      limit,
      offset,
    });

    // Extraer todos los tipos y zonas únicos para filtros
    const todasPropiedades = await Propiedad.findAll({
      attributes: ["tipo", "operacion", "zona"],
    });
    const tiposUnicos = [...new Set(todasPropiedades.map((p) => p.tipo))];
    const zonasUnicas = [...new Set(todasPropiedades.map((p) => p.zona))];
    const operacionUnicos = [
      ...new Set(todasPropiedades.map((p) => p.operacion)),
    ];

    res.json({
      propiedades: rows,
      total: count,
      pages: Math.ceil(count / limit),
      page: parseInt(page),
      filtros: {
        tipos: tiposUnicos,
        zonas: zonasUnicas,
        operacion: operacionUnicos,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar propiedades" });
  }
};

const actualizarPropiedad = async (req, res) => {
  try {
    const propiedad = await Propiedad.findByPk(req.params.id);
    if (!propiedad)
      return res.status(404).json({ error: "Propiedad no encontrada" });

    // Si se envió nueva imagen, subirla y eliminar la anterior
    if (req.file) {
      // Borrar imagen anterior en Cloudinary
      if (propiedad.public_id) {
        await cloudinary.uploader.destroy(propiedad.public_id);
      }

      // Subir nueva imagen
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "propiedades",
      });

      propiedad.public_id = result.public_id;
      propiedad.url = result.secure_url;

      fs.unlinkSync(req.file.path);
    }

    // Actualizar otros campos
    const { titulo, tipo, operacion, zona, descripcion, precio } = req.body;
    Object.assign(propiedad, {
      titulo,
      tipo,
      operacion,
      zona,
      descripcion,
      precio,
    });
    await propiedad.save();

    res.json({ mensaje: "Propiedad actualizada", propiedad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminarPropiedad = async (req, res) => {
  try {
    const propiedad = await Propiedad.findByPk(req.params.id);
    if (!propiedad)
      return res.status(404).json({ error: "Propiedad no encontrada" });

    // Borrar imagen de Cloudinary
    if (propiedad.public_id) {
      await cloudinary.uploader.destroy(propiedad.public_id);
    }

    await propiedad.destroy();
    res.json({ mensaje: "Propiedad eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerPropiedadPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    res.json(propiedad);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener propiedad" });
  }
};

module.exports = {
  subirPropiedad,
  listarPropiedades,
  actualizarPropiedad,
  eliminarPropiedad,
  obtenerPropiedadPorId,
};
