const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const {
  subirconstruccion,
  listarconstrucciones,
  actualizarconstruccion,
  eliminarconstruccion,
  obtenerconstruccionPorId,
  
} = require('../controllers/construccion.controller');



router.post("/", upload.array("imagenes", 15), subirconstruccion);
router.get('/', listarconstrucciones);
router.put('/:id', upload.array("imagenes", 15), actualizarconstruccion);
router.delete('/:id', eliminarconstruccion);
router.get('/:id', obtenerconstruccionPorId);

module.exports = router;
