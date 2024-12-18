const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");

// URI MongoDB untuk koneksi ke database
const uri = "mongodb+srv://admin:walogger@walogger.wice1.mongodb.net?retryWrites=true&w=majority";

// Konfigurasi GridFsStorage
const storage = new GridFsStorage({
    url: uri,
    file: (req, file) => {
        const allowedTypes = ["image/png", "image/jpeg", "video/mp4", "video/mkv"]; // Tambahkan tipe video yang diizinkan

        if (allowedTypes.indexOf(file.mimetype) === -1) {
            return Promise.reject(new Error("Tipe file tidak diizinkan."));
        }

        return {
            bucketName: "media", // Ubah nama bucket jika ingin memisahkan video dari gambar
            filename: `${Date.now()}-${file.originalname}`, // Nama file di GridFS
        };
    },
});

// Ekspor middleware upload
module.exports = multer({ storage });