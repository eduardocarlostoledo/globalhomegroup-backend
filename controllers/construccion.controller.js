const construccion = require("../models/construccion.model.js");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { Op } = require("sequelize");

const subirconstruccion = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Debe enviar al menos una imagen." });
    }

    const requiredFields = [
      "nombre", "descripcion", "detalle", "metrosCuadrados", "valor",
      "cantidadAmbientes", "cantidadDormitorios", "cantidadBanios",
      "formaPago", "condicionesDePago"
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `El campo '${field}' es obligatorio.` });
      }
    }

    const uploadResults = await Promise.all(
      req.files.map(file => cloudinary.uploader.upload(file.path, { folder: "construcciones" }))
    );

    const urls = uploadResults.map((r) => r.secure_url);
    const public_ids = uploadResults.map((r) => r.public_id);

    const nuevaConstruccion = await construccion.create({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      detalle: req.body.detalle,
      metrosCuadrados: req.body.metrosCuadrados,
      valor: req.body.valor,
      cantidadAmbientes: req.body.cantidadAmbientes,
      cantidadDormitorios: req.body.cantidadDormitorios,
      cantidadBanios: req.body.cantidadBanios,
      formaPago: req.body.formaPago,
      condicionesDePago: req.body.condicionesDePago,
      imagenes: urls,
      public_ids,
    });

    req.files.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });

    res.status(201).json(nuevaConstruccion);
  } catch (err) {
    console.error(err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Ya existe una construcción con ese nombre." });
    }
    res.status(500).json({ error: "Error al guardar la construcción. Intente nuevamente." });
  }
};

const actualizarconstruccion = async (req, res) => {
  try {
    const construccionActual = await construccion.findByPk(req.params.id);
    if (!construccionActual) {
      return res.status(404).json({ error: "Construcción no encontrada." });
    }

    if (req.files && req.files.length > 0) {
      if (construccionActual.public_ids?.length) {
        await Promise.all(
          construccionActual.public_ids.map((id) => cloudinary.uploader.destroy(id))
        );
      }

      const uploadResults = await Promise.all(
        req.files.map((file) => cloudinary.uploader.upload(file.path, { folder: "construcciones" }))
      );

      construccionActual.imagenes = uploadResults.map((r) => r.secure_url);
      construccionActual.public_ids = uploadResults.map((r) => r.public_id);

      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    const {
      nombre,
      descripcion,
      detalle,
      metrosCuadrados,
      valor,
      cantidadAmbientes,
      cantidadDormitorios,
      cantidadBanios,
      formaPago,
      condicionesDePago,
    } = req.body;

    Object.assign(construccionActual, {
      nombre,
      descripcion,
      detalle,
      metrosCuadrados,
      valor,
      cantidadAmbientes,
      cantidadDormitorios,
      cantidadBanios,
      formaPago,
      condicionesDePago,
    });

    await construccionActual.save();
    res.json({ mensaje: "Construcción actualizada", construccion: construccionActual });
  } catch (err) {
    console.error(err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Ya existe una construcción con ese nombre." });
    }
    res.status(500).json({ error: "Error al actualizar la construcción. Intente nuevamente." });
  }
};

const eliminarconstruccion = async (req, res) => {
  try {
    const construccionActual = await construccion.findByPk(req.params.id);
    if (!construccionActual) {
      return res.status(404).json({ error: "Construcción no encontrada." });
    }

    if (construccionActual.public_ids?.length) {
      await Promise.all(
        construccionActual.public_ids.map((id) => cloudinary.uploader.destroy(id))
      );
    }

    await construccionActual.destroy();
    res.json({ mensaje: "Construcción eliminada correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar la construcción. Intente nuevamente." });
  }
};

const obtenerconstruccionPorId = async (req, res) => {
  try {
    const construccionEncontrada = await construccion.findByPk(req.params.id);
    if (!construccionEncontrada) {
      return res.status(404).json({ error: "Construcción no encontrada." });
    }
    res.json(construccionEncontrada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la construcción. Intente nuevamente." });
  }
};

const listarconstrucciones = async (req, res) => {
  try {
    const {
      valorMin,
      valorMax,
      metrosMin,
      metrosMax,
      ambientes,
      dormitorios,
      baños,
      page = 1,
      limit = 10,
      ordenValor,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (valorMin && valorMax) {
      where.valor = { [Op.between]: [parseFloat(valorMin), parseFloat(valorMax)] };
    } else if (valorMin) {
      where.valor = { [Op.gte]: parseFloat(valorMin) };
    } else if (valorMax) {
      where.valor = { [Op.lte]: parseFloat(valorMax) };
    }

    if (metrosMin && metrosMax) {
      where.metrosCuadrados = { [Op.between]: [parseFloat(metrosMin), parseFloat(metrosMax)] };
    }

    if (ambientes) where.cantidadAmbientes = ambientes;
    if (dormitorios) where.cantidadDormitorios = dormitorios;
    if (baños) where.cantidadBanios = baños;

    const order = [];
    if (ordenValor === "asc") order.push(["valor", "ASC"]);
    if (ordenValor === "desc") order.push(["valor", "DESC"]);

    const { count, rows } = await construccion.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
    });

    const data = rows.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      detalle: c.detalle,
      metrosCuadrados: c.metrosCuadrados,
      valor: c.valor,
      cantidadAmbientes: c.cantidadAmbientes,
      cantidadDormitorios: c.cantidadDormitorios,
      cantidadBanios: c.cantidadBanios,
      imagenDestacada: c.imagenes?.[0] || "",
      imagenes: c.imagenes,
    }));

    res.json({
      construcciones: data,
      total: count,
      pages: Math.ceil(count / limit),
      page: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar construcciones. Intente nuevamente." });
  }
};

module.exports = {
  subirconstruccion,
  listarconstrucciones,
  actualizarconstruccion,
  eliminarconstruccion,
  obtenerconstruccionPorId,
};