const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const {
  subirPlan,
  listarPlanes,
  actualizarPlan,
  eliminarPlan,
  obtenerPlanPorId,
  
} = require('../controllers/plan.controller');



router.post("/", upload.array("imagenes", 15), subirPlan);
router.get('/', listarPlanes);
router.put('/:id', upload.array("imagenes", 15), actualizarPlan);
router.delete('/:id', eliminarPlan);
router.get('/:id', obtenerPlanPorId);

module.exports = router;
