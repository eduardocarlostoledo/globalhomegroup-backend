const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const {
  subirPropiedad,
  listarPropiedades,
  actualizarPropiedad,
  eliminarPropiedad,
  obtenerPropiedadPorId,
  listarTodasLasPropiedades,
  listarTodasLasPropiedadesConFiltros,
} = require('../controllers/propiedad.controller');


router.post("/", upload.array("imagenes", 15), subirPropiedad);
router.get('/', listarPropiedades);
router.get("/todas", listarTodasLasPropiedades);
router.get("/filtros", listarTodasLasPropiedadesConFiltros);
router.put('/:id', upload.array("imagenes", 15), actualizarPropiedad);

router.delete('/:id', eliminarPropiedad);
router.get('/:id', obtenerPropiedadPorId);

module.exports = router;
