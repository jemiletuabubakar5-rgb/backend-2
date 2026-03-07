const multer = require("multer");
const storage = multer.memoryStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads"); 
    },
    filename: (req, file, cb) => {
        let file_name = Date.now() + '_' + file.originalname 
        cb(null, file_name);
    },
});




const upload = multer({ storage: storage });
module.exports = upload;