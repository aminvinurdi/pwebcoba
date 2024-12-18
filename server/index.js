const upload = require("./routes/upload");
const express = require('express');
const app = express();
const cors = require("cors");
const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require("fs");
const port = 3000;

// MongoDB Connection
const uri = "mongodb+srv://admin:walogger@walogger.wice1.mongodb.net/?retryWrites=true&w=majority&appName=WALogger";
const client = new MongoClient(uri, {
    serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
    }
});

let gfs;
let db;
let coll; // For collections

// Fungsi untuk mengambil nama dari phonebook
async function getContactName(phoneNumber) {
    try {
        const contact = await client.db("messages").collection("phonebook").findOne({ phone: phoneNumber });
        return contact ? contact.name : phoneNumber; // Jika tidak ada nama, tampilkan nomor telepon
    } catch (error) {
        console.error("Gagal mengambil nama kontak:", error);
        return phoneNumber; // Jika error, tampilkan nomor telepon
    }
}

// Fungsi untuk memuat data awal dari MongoDB
async function loadInitialData() {
    const cursor = coll.find();
    dbdata = []; // Bersihkan data lama sebelum memuat ulang
    for await (const doc of cursor) {
        const stringdata = doc.data;
        dbdata.push(JSON.parse(stringdata)); // Parse data menjadi objek
    }
}

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        const db = client.db("messages");
        coll = db.collection("jsons");

        // Muat data awal
        await loadInitialData();

        const bucket = new GridFSBucket(db, {
            bucketName: 'media'  // Bucket name for storing images
        });

        // Set up GridFS for file storage
        gfs = bucket;

        // Middleware for JSON handling and CORS
        app.use(cors());
        app.use(express.json());

        // ===================================
        // Endpoint Status
        app.get('/status', (req, res) => {
            res.json({
                status: "Backend Jalan",
                uptime: process.uptime(),
            });
        });

        // Endpoint untuk mendapatkan semua kontak
        app.get('/contact', async (req, res) => {
            try {
                const phonebookCursor = await client.db("messages").collection("phonebook").find();
                const phonebook = await phonebookCursor.toArray();

                res.json({
                    data: phonebook,
                });
            } catch (error) {
                console.error("Error fetching contacts:", error);
                res.status(500).json({ error: "Failed to fetch contacts" });
            }
        });
        
        // Endpoint untuk mendapatkan nama kontak berdasarkan nomor telepon
        app.get('/contact/:phoneNumber', async (req, res) => {
            const phoneNumber = req.params.phoneNumber;
            try {
                const contactName = await getContactName(phoneNumber);
                res.json({
                    phoneNumber,
                    name: contactName,
                });
            } catch (error) {
                res.status(500).json({ error: "Gagal mengambil nama kontak." });
            }
        });

        // Endpoint untuk mendapatkan semua chat
        app.get('/chat', (req, res) => {
            res.json({
                data: dbdata,
            });
        });

        // Endpoint untuk mendapatkan chat berdasarkan ID
        app.get('/chat/:id', (req, res) => {
            const id = req.params.id;
            const response = dbdata.find(d => d._data.id._serialized === id);

            if (!response) {
                res.status(404).json({
                    error: "Data tidak ditemukan!",
                });
            } else {
                res.status(200).json({
                    data: response,
                });
            }
        });

        // Endpoint untuk menambahkan pesan baru
        app.post('/chat', async (req, res) => {
            const newMessage = req.body;

            if (!newMessage || !newMessage._data) {
                return res.status(400).json({ error: "Pesan tidak valid!" });
            }

            try {
                // Simpan pesan baru ke database dengan menyimpan objek JSON
                await coll.insertOne({ data: JSON.stringify(newMessage) });
                // Tambahkan ke cache (dbdata) agar real-time
                dbdata.push(newMessage);
                res.status(201).json({ message: "Pesan berhasil disimpan!" });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Gagal menyimpan pesan!" });
            }
        });

        // ===================================
        // Upload file (Image, etc.)
        app.use("/file", upload);

        // Endpoint untuk mendapatkan list file
        app.get("/file", async (req, res) => {
            try {
                const files = await db.collection("media.files").find({}).toArray();
                if (!files.length) {
                    return res.status(404).json({ status: "error", message: "No files found" });
                }
                res.json({ 
                    status: "success",
                    data: files 
                });
            } catch (error) {
                console.error("Failed to fetch files:", error);
                res.status(500).json({ status: "error", message: "Failed to fetch files" });
            }
        });

        // Endpoint untuk mendapatkan file (Download)
        app.get("/file/:filename", async (req, res) => {
            try {
                const downloadStream = gfs.openDownloadStreamByName(req.params.filename);

                downloadStream.on("data", (chunk) => res.write(chunk));
                downloadStream.on("end", () => res.end());
                downloadStream.on("error", (err) => {
                    console.error(err);
                    res.status(404).send("File not found.");
                });
            } catch (error) {
                console.error(error);
                res.status(500).send("An error occurred while retrieving the file.");
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`)
        });

    } catch (err) {
        console.error("Failed to run the server:", err);
    }
}

run().catch(console.dir);