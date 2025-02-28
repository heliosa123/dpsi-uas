const { db } = require('../config');

class BarangController {

   // New: Add Product Data
   async addProduct(req, res) {
    try {
      const { idbarang, namabarang, deskripsi, kategori, satuan, stock, gudang, date } = req.body;

      // Save the new Barang object to the 'barang' collection
      const barangDoc = db.collection('barang').doc(idbarang);
      await barangDoc.set({ idbarang, namabarang, deskripsi, kategori, satuan, stock, gudang, date, timestamp: new Date() });

      res.status(201).json({ message: 'Product added successfully', product: { idbarang, namabarang, deskripsi, kategori, satuan, stock, gudang, date } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // New: Get Product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const productDoc = await db.collection('barang').doc(id).get();

      if (!productDoc.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.status(200).json(productDoc.data());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // UC1: Penerimaan Barang Masuk
  async terimaBarangMasuk(req, res) {
    try {
      const { idbarang, namabarang, deskripsi, kategori, satuan, stock, gudang, date } = req.body;

      // Validate PO or other business logic as necessary
      const poSnapshot = await db.collection('barang').where('idbarang', '==', idbarang).get();
      if (poSnapshot.empty) {
        return res.status(400).json({ error: 'Invalid idbarang or PO not found' });
      }

      // Save the new Barang object to the 'barang' collection
      const barangDoc = db.collection('logbarang').doc(idbarang);
      await barangDoc.set({ idbarang, namabarang, deskripsi, kategori, satuan, stock, gudang, date, timestamp: new Date() });

      // Update stock with Firestore transaction
      await db.runTransaction(async (t) => {
        const stockRef = db.collection('stock').doc(idbarang);
        const doc = await t.get(stockRef);
        if (!doc.exists) {
          t.set(stockRef, { idbarang, namabarang, deskripsi, kategori, satuan, stock, gudang });
        } else {
          const newQty = doc.data().stock + stock;
          t.update(stockRef, { stock: newQty });
        }
      });

      res.status(201).json({ message: 'Barang berhasil diterima', barang: { idbarang, namabarang, deskripsi, kategori, satuan, stock, gudang, date } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // UC2: Pengeluaran Barang
  async keluarkanBarang(req, res) {
    try {
      const { idbarang, stock, gudang, date } = req.body;

      // Check if the item exists in the stock
      const stockRef = db.collection('stock').doc(idbarang);
      const stockDoc = await stockRef.get();
      if (!stockDoc.exists || stockDoc.data().stock < stock) {
        return res.status(400).json({ error: 'Not enough stock available' });
      }

      // Update stock with Firestore transaction
      await db.runTransaction(async (t) => {
        const doc = await t.get(stockRef);
        const newQty = doc.data().stock - stock;
        t.update(stockRef, { stock: newQty });
      });

      // Record the outgoing item in the 'barangKeluar' collection
      const barangKeluarDoc = db.collection('logbarang').doc();
      await barangKeluarDoc.set({ idbarang, stock, gudang, date, timestamp: new Date() });

      res.status(201).json({ message: 'Barang berhasil dikeluarkan', barang: { idbarang, stock, gudang, date } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // UC3: Pengecekan Stok Barang
  async cekStokBarang(req, res) {
    try {
      const { startDate, endDate } = req.query; // Filter by date range
      let query = db.collection('stock');

      if (startDate) {
        query = query.where('date', '>=', new Date(startDate));
      }
      if (endDate) {
        query = query.where('date', '<=', new Date(endDate));
      }

      const snapshot = await query.get();
      const stokBarang = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(stokBarang);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

// UC4: Pengecekan Stok Barang di Gudang A atau B
// UC4: Pengecekan Stok Barang di Gudang A atau B
// UC4: Pengecekan Stok Barang di Gudang A atau B
async cekStokBarangDiGudang(req, res) {
  try {
    console.log('Request query parameters:', req.query); // Log query parameters

    const { gudang } = req.query; // Filter by gudang
    if (!gudang) {
      return res.status(400).json({ error: 'Gudang query parameter is required' });
    }
    
    const query = db.collection('stock').where('gudang', '==', gudang);

    const snapshot = await query.get();
    const stokBarang = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(stokBarang);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



  // New: Pengecekan Stok Barang pada Tanggal Tertentu
  async cekStokBarangPadaTanggal(req, res) {
    try {
      const { date } = req.query; // Filter by specific date
      if (!date) {
        return res.status(400).json({ error: 'Date query parameter is required' });
      }

      const snapshot = await db.collection('stock')
        .where('date', '==', new Date(date))
        .get();

      const stokBarang = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(stokBarang);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BarangController();
