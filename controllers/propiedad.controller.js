const Propiedad = require("../models/propiedad.model");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { Op } = require("sequelize");

const subirPropiedad = async (req, res) => {
    try {
      // Validación básica
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Debe enviar al menos una imagen" });
      }
  
      // Subir todas las imágenes a Cloudinary
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "propiedades" })
      );
  
      const uploadResults = await Promise.all(uploadPromises);
  
      const urls = uploadResults.map((r) => r.secure_url);
      const public_ids = uploadResults.map((r) => r.public_id);
  
      // Guardar en base de datos
      const nuevaPropiedad = await Propiedad.create({
        titulo: req.body.titulo,
        tipo: req.body.tipo,
        operacion: req.body.operacion,
        zona: req.body.zona,
        descripcion: req.body.descripcion,
        precio: req.body.precio,
        imagenes: urls,
        public_ids: public_ids,
      });
  
      // Eliminar archivos temporales
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
        
      res.status(201).json(nuevaPropiedad);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };
  
  
  const listarPropiedades = async (req, res) => {
    try {
      const {
        tipo,
        operacion,
        zona,
        page = 1,
        limit = 10,
        precioMin,
        precioMax,
      } = req.query;
  
      const offset = (page - 1) * limit;
      const where = {};
  
      // Filtro de precio
      if (precioMin && precioMax) {
        where.precio = {
          [Op.between]: [parseInt(precioMin), parseInt(precioMax)],
        };
      } else if (precioMax) {
        where.precio = { [Op.lte]: parseInt(precioMax) };
      } else if (precioMin) {
        where.precio = { [Op.gte]: parseInt(precioMin) };
      }
  
      // Filtros de tipo, operacion y zona
      if (tipo) {
        where.tipo = { [Op.iLike]: tipo };
      }
  
      if (operacion) {
        where.operacion = operacion;
      }
  
      if (zona) {
        where.zona = { [Op.iLike]: zona };
      }
  
      // Buscar propiedades con paginación
      const { count, rows } = await Propiedad.findAndCountAll({
        where,
        limit,
        offset,
      });
  
      // Formatear cada propiedad con imagen destacada
      const propiedadesFormateadas = rows.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        tipo: p.tipo,
        operacion: p.operacion,
        zona: p.zona,
        descripcion: p.descripcion,
        precio: p.precio,
        imagenDestacada: p.imagenes?.[0] || "",
        imagenes: p.imagenes || [],
      }));
  
      // Filtros únicos para el frontend
      const todasPropiedades = await Propiedad.findAll({
        attributes: ["tipo", "operacion", "zona"],
      });
  
      const tiposUnicos = [...new Set(todasPropiedades.map((p) => p.tipo))];
      const zonasUnicas = [...new Set(todasPropiedades.map((p) => p.zona))];
      const operacionUnicos = [...new Set(todasPropiedades.map((p) => p.operacion))];
  
      res.json({
        propiedades: propiedadesFormateadas,
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
      if (!propiedad) {
        return res.status(404).json({ error: "Propiedad no encontrada" });
      }
  
      // Si se enviaron nuevas imágenes
      if (req.files && req.files.length > 0) {
        // Borrar imágenes anteriores de Cloudinary
        if (propiedad.public_ids && propiedad.public_ids.length > 0) {
          const deletePromises = propiedad.public_ids.map((id) =>
            cloudinary.uploader.destroy(id)
          );
          await Promise.all(deletePromises);
        }
      
        const urls = [];
        const public_ids = [];
      
        for (const file of req.files) {
          const localPath = file.path;
      
          if (!fs.existsSync(localPath)) {
            console.error("⚠️ Archivo no encontrado:", localPath);
            continue;
          }
      
          try {
            const result = await cloudinary.uploader.upload(localPath, {
              folder: "propiedades",
              resource_type: "image",
            });
      
            urls.push(result.secure_url);
            public_ids.push(result.public_id);
          } catch (uploadError) {
            console.error("⛔ Error al subir imagen:", uploadError);
          } finally {
            // Borrado seguro
            try {
              if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
              }
            } catch (unlinkError) {
              console.error("⚠️ Error al borrar archivo temporal:", unlinkError);
            }
          }
        }
      
        if (urls.length === 0) {
          return res.status(400).json({
            error: "No se pudieron subir imágenes.",
          });
        }
      
        propiedad.imagenes = urls;
        propiedad.public_ids = public_ids;
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
      console.error(err);
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
