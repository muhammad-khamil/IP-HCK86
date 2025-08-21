const multer = require('multer')

// Memory storage - file disimpan di RAM sementara
const storage = multer.memoryStorage()

// File filter - hanya terima gambar
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('Only image files are allowed'), false)
    }
}

// Multer configuration
const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 // Max 1MB per file
    }
})

// Middleware untuk upload 2 file: imgTiket dan imgBill
const uploadSPPDImages = upload.fields([
    { name: 'imgTiket', maxCount: 1 },
    { name: 'imgBill', maxCount: 1 }
])

// Middleware untuk upload single image
const uploadSingleImage = upload.single('image')

module.exports = { 
    uploadSPPDImages, 
    uploadSingleImage,
    upload 
}
