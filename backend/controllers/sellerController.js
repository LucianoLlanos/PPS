const path = require('path');
const fs = require('fs');
const { SellerService } = require('../services/sellerService');

class SellerController {
  constructor(service = new SellerService()) {
    this.service = service;

    this.createProduct = this.createProduct.bind(this);
    this.listProducts = this.listProducts.bind(this);
    this.getProduct = this.getProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);

    this.createOrder = this.createOrder.bind(this);
    this.listOrders = this.listOrders.bind(this);
    this.updateOrderStatus = this.updateOrderStatus.bind(this);

    this.createSlide = this.createSlide.bind(this);
    this.listSlides = this.listSlides.bind(this);
    this.deleteSlide = this.deleteSlide.bind(this);
  }

  // Helpers
  saveImage(file) {
    if (!file) return null;
    return file.filename;
  }

  async createProduct(req, res) {
    try {
      const { name, description, price, stock } = req.body;
      const image = this.saveImage(req.file);
      const id = await this.service.createProduct({ name, description, price, stock, image });
      res.json({ id, name, description, price, stock, image });
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async listProducts(req, res) {
    try {
      const rows = await this.service.listProducts();
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async getProduct(req, res) {
    try {
      const { id } = req.params;
      const row = await this.service.getProduct(id);
      if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, stock } = req.body;
      const newImage = this.saveImage(req.file);
      // fetch old image to delete if needed
      const prev = await this.service.updateProduct({ id, name, description, price, stock, image: newImage });
      if (newImage && prev && prev.image) {
        const imgPath = path.join(__dirname, '..', 'uploads', prev.image);
        fs.unlink(imgPath, () => {});
      }
      res.json({ id, name, description, price, stock, image: newImage || (prev ? prev.image : null) });
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteProduct(id);
      if (result.notFound) return res.status(404).json({ error: 'Producto no encontrado' });
      if (result.image) {
        const imgPath = path.join(__dirname, '..', 'uploads', result.image);
        fs.unlink(imgPath, () => {});
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async createOrder(req, res) {
    try {
      const { customer_name, items, total, status } = req.body;
      const itemsStr = typeof items === 'string' ? items : JSON.stringify(items || []);
      const id = await this.service.createOrder({ customer_name, items: itemsStr, total, status });
      res.json({ id, customer_name, items: itemsStr, total, status: status || 'pending' });
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async listOrders(req, res) {
    try {
      const rows = await this.service.listOrders();
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await this.service.updateOrderStatus(id, status);
      res.json({ id, status });
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async createSlide(req, res) {
    try {
      const { title, caption, link } = req.body;
      const image = this.saveImage(req.file);
      const id = await this.service.createSlide({ title, caption, link, image });
      res.json({ id, title, caption, link, image });
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async listSlides(req, res) {
    try {
      const rows = await this.service.listSlides();
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }

  async deleteSlide(req, res) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteSlide(id);
      if (result.notFound) return res.status(404).json({ error: 'Slide no encontrado' });
      if (result.image) {
        const imgPath = path.join(__dirname, '..', 'uploads', result.image);
        fs.unlink(imgPath, () => {});
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  }
}

module.exports = new SellerController();
