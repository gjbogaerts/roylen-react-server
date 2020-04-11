const multer = require('multer');
const fs = require('fs');
const uploadURI = '/uploads/pics';
const uploadDir = `${__baseDir}${uploadURI}`;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var d = new Date();
    var dir = uploadDir + '/' + d.getFullYear() + '/' + d.getMonth();
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/gif'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

module.exports = upload;
