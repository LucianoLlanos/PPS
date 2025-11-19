const multer = require('multer');
const path = require('path');

function makeDiskStorage(subfolder = '.') {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const dest = path.join(__dirname, '..', 'uploads', subfolder);
      cb(null, dest);
    },
    filename: function (req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, unique + ext);
    },
  });
}

module.exports = { makeDiskStorage };
