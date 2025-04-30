const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const {
  subirPropiedad,
  listarPropiedades,
  actualizarPropiedad,
  eliminarPropiedad,
  obtenerPropiedadPorId
} = require('../controllers/propiedad.controller');

router.post('/', upload.single('imagen'), subirPropiedad);
router.get('/', listarPropiedades);
router.put('/:id', upload.single('imagen'), actualizarPropiedad);
router.delete('/:id', eliminarPropiedad);
router.get('/:id', obtenerPropiedadPorId);

module.exports = router;
