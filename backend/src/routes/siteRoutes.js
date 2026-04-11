const express = require('express');
const {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
} = require('../controllers/siteController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/',    getSites);
router.post('/',   createSite);
router.get('/:id', getSiteById);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);

module.exports = router;
