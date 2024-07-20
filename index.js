const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const multer = require('multer');
const cors = require('cors');
const { db } = require('./config'); // Require the config file
const app = express();
const router = express.Router();
const { register, login } = require('./controllers/usercontroller');
const BarangController = require('./controllers/barangcontroller');

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Updated origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
dotenv.config();

// User Routes
router.post('/register', register);
router.post('/login', login);
// Barang Routes
router.post('/terimaBarang', BarangController.terimaBarangMasuk);
router.post('/keluarkanBarang', BarangController.keluarkanBarang);
router.get('/cekstok', BarangController.cekStokBarang);
router.get('/cekstok/gudang', BarangController.cekStokBarangDiGudang);
router.get('/cekstok/tanggal', BarangController.cekStokBarangPadaTanggal);
router.post('/product', BarangController.addProduct);
router.get('/product/:id', BarangController.getProductById);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Example route to demonstrate database connection
router.get('/test', async (req, res) => {
  try {
    const snapshot = await db.collection('testCollection').get();
    const data = snapshot.docs.map(doc => doc.data());
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.use('/api', router);
