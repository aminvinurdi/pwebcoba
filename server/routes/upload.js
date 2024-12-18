const upload = require("../middleware/upload");
const express = require("express");
const router = express.Router();

// Endpoint upload file
router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("Anda harus memilih file untuk diunggah.");
    }

    try {
        res.status(201).json({
            message: "File berhasil diupload",
            filename: req.file.filename,  // Nama file yang disimpan
            contentType: req.file.mimetype,  // Tipe media (e.g., image/jpeg)
        });
        const imgUrl = `http://localhost:3000/file/${req.file.filename}`;
        return res.status(201).json({ 
            message: "File berhasil diunggah!", 
            filename: req.file.filename,  // Nama file yang disimpan
            contentType: req.file.mimetype,
            url: imgUrl,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Gagal upload file!" });
    }
});

module.exports = router;