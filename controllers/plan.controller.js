const Plan = require("../models/plan.model.js");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { Op } = require("sequelize");

const subirPlan = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Debe enviar al menos una imagen" });
    }

    const uploadResults = await Promise.all(
      req.files.map((file) => cloudinary.uploader.upload(file.path, { folder: "Planes" }))
    );

    const imagenes = uploadResults.map((r) => r.secure_url);
    const public_ids = uploadResults.map((r) => r.public_id);

    const nuevoPlan = await Plan.create({
      plan: req.body.plan,
      codigo: req.body.codigo,
      descripcion: req.body.descripcion,
      detalle: req.body.detalle,
      valorNeto: req.body.valorNeto,
      valorCuota: req.body.valorCuota,
      tipoPlan: req.body.tipoPlan,
      duracionMeses: req.body.duracionMeses,
      imagenes,
      public_ids,
    });

    req.files.forEach((file) => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });

    res.status(201).json(nuevoPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const listarPlanes = async (req, res) => {
  try {
    const Planes = await Plan.findAll({
      where: { activo: true },
      order: [['createdAt', 'DESC']],
    });

    const formateadas = Planes.map((p) => ({
      id: p.id,
      plan: p.plan,
      codigo: p.codigo,
      descripcion: p.descripcion,
      detalle: p.detalle,
      valorNeto: p.valorNeto,
      valorCuota: p.valorCuota,
      tipoPlan: p.tipoPlan,
      duracionMeses: p.duracionMeses,
      imagenDestacada: p.imagenes?.[0] || "",
      imagenes: p.imagenes,
    }));

    res.json({ planes: formateadas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar planes" });
  }
};

const actualizarPlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });

    if (req.files && req.files.length > 0) {
      await Promise.all(plan.public_ids.map((id) => cloudinary.uploader.destroy(id)));

      const uploadResults = await Promise.all(
        req.files.map((file) => cloudinary.uploader.upload(file.path, { folder: "Planes" }))
      );

      plan.imagenes = uploadResults.map((r) => r.secure_url);
      plan.public_ids = uploadResults.map((r) => r.public_id);

      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    const { plan: nombre, codigo, descripcion, detalle, valorNeto, valorCuota, tipoPlan, duracionMeses } = req.body;

    Object.assign(plan, {
      plan: nombre,
      codigo,
      descripcion,
      detalle,
      valorNeto,
      valorCuota,
      tipoPlan,
      duracionMeses,
    });

    await plan.save();
    res.json({ mensaje: "Plan actualizado", plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const eliminarPlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });

    await Promise.all(plan.public_ids.map((id) => cloudinary.uploader.destroy(id)));
    await plan.destroy();

    res.json({ mensaje: "Plan eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerPlanPorId = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan no encontrado" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  subirPlan,
  listarPlanes,
  actualizarPlan,
  eliminarPlan,
  obtenerPlanPorId,
};
