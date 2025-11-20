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
      // Try to handle a full pedido payload (to persist into `pedidos`) when payment info is present.
      const body = req.body || {};

      // Normalize items/products array (accept JSON string or array)
      let items = body.items || body.productos || body.itemsJson || [];
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { items = []; }
      }
      if (!Array.isArray(items)) items = [];

      // Normalize product entries to { idProducto, cantidad, precioUnitario }
      const productos = items.map(it => {
        return {
          idProducto: Number(it.idProducto || it.id || it.productId || it.product_id),
          cantidad: Number(it.cantidad || it.qty || it.quantity || 1),
          precioUnitario: (typeof it.precioUnitario !== 'undefined' ? Number(it.precioUnitario) : (typeof it.precio !== 'undefined' ? Number(it.precio) : undefined))
        };
      }).filter(p => p.idProducto && !isNaN(p.idProducto));

      // If payload includes payment info or cuotas, use the admin crearPedido flow to persist in `pedidos`.
      const hasPayment = typeof body.metodoPago !== 'undefined' || typeof body.cuotas !== 'undefined' || typeof body.interes !== 'undefined' || typeof body.descuento !== 'undefined' || typeof body.totalConInteres !== 'undefined';
      // idUsuarioCliente may be provided as idCliente (frontend uses that name), idUsuario, or customer_id
      const idUsuarioCliente = body.idCliente || body.idUsuario || body.customer_id || body.idUsuarioCliente;

      if (hasPayment && idUsuarioCliente) {
        const { OrdersAdminService } = require('../services/admin/OrdersAdminService');
        const adminService = new OrdersAdminService();
        const estado = body.estado || body.status || 'Pendiente';
        const idSucursalOrigen = body.idSucursalOrigen || body.sucursal || 1;
        const observaciones = body.observaciones || body.note || body.notes || null;
        const metodoPago = body.metodoPago || null;
        const cuotas = body.cuotas != null ? Number(body.cuotas) : 1;
        const interes = body.interes != null ? Number(body.interes) : 0;
        const descuento = body.descuento != null ? Number(body.descuento) : 0;
        const totalConInteres = body.totalConInteres != null ? Number(body.totalConInteres) : (body.total != null ? Number(body.total) : null);

        const result = await adminService.crearPedido({ idUsuarioCliente: Number(idUsuarioCliente), estado, idSucursalOrigen: Number(idSucursalOrigen), productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres });
        return res.json({ mensaje: 'Pedido creado', ...result });
      }
      // If payment info is present but we don't have an idUsuarioCliente, try to resolve/create the usuario by email/name
      if (hasPayment && !idUsuarioCliente) {
        const { Database } = require('../core/database');
        const db = new Database();
        const email = body.email || body.customer_email || null;
        let resolvedUserId = null;
        if (email) {
          const users = await db.query('SELECT idUsuario, idRol FROM usuarios WHERE email = ?', [email]);
          if (users && users.length) resolvedUserId = users[0].idUsuario;
        }
        if (!resolvedUserId && (body.customer_name || body.customer_name_full || body.name)) {
          const nameRaw = body.customer_name || body.customer_name_full || body.name;
          const parts = String(nameRaw).split(' ').filter(Boolean);
          const nombre = parts[0] || 'Cliente';
          const apellido = parts.slice(1).join(' ') || '';
          const genEmail = email || (`guest_${Date.now()}@local.local`);
          const bcrypt = require('bcryptjs');
          const pwd = 'changeMe123!';
          const hash = bcrypt.hashSync(pwd, 10);
          const ins = await db.query('INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES (?, ?, ?, ?, ?)', [nombre, apellido, genEmail, hash, 1]);
          // db.query returns rows; after INSERT we need insertId — use pool directly
          // fallback: fetch the user we just inserted by email
          const created = await db.query('SELECT idUsuario FROM usuarios WHERE email = ? ORDER BY idUsuario DESC LIMIT 1', [genEmail]);
          if (created && created.length) resolvedUserId = created[0].idUsuario;
        }
        if (resolvedUserId) {
          const { OrdersAdminService } = require('../services/admin/OrdersAdminService');
          const adminService = new OrdersAdminService();
          const estado = body.estado || body.status || 'Pendiente';
          const idSucursalOrigen = body.idSucursalOrigen || body.sucursal || 1;
          const observaciones = body.observaciones || body.note || body.notes || null;
          const metodoPago = body.metodoPago || null;
          const cuotas = body.cuotas != null ? Number(body.cuotas) : 1;
          const interes = body.interes != null ? Number(body.interes) : 0;
          const descuento = body.descuento != null ? Number(body.descuento) : 0;
          const totalConInteres = body.totalConInteres != null ? Number(body.totalConInteres) : (body.total != null ? Number(body.total) : null);
          const result = await adminService.crearPedido({ idUsuarioCliente: Number(resolvedUserId), estado, idSucursalOrigen: Number(idSucursalOrigen), productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres });
          return res.json({ mensaje: 'Pedido creado', ...result });
        }
      }

      // Fallback: keep legacy demo behavior (orders table)
      const { customer_name, total, status } = body;
      const itemsStr = JSON.stringify(items || []);
      const id = await this.service.createOrder({ customer_name, items: itemsStr, total, status });
      res.json({ id, customer_name, items: itemsStr, total, status: status || 'pending' });
    } catch (e) {
      console.error('seller.createOrder error:', e);
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
