const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { ProductsAdminService } = require('../../services/admin/ProductsAdminService');

class ProductsAdminController {
  constructor(service = new ProductsAdminService()) {
    this.service = service;
    this.listarProductos = this.listarProductos.bind(this);
    this.verProductoAdmin = this.verProductoAdmin.bind(this);
    this.crearProducto = this.crearProducto.bind(this);
    this.actualizarProducto = this.actualizarProducto.bind(this);
    this.eliminarProducto = this.eliminarProducto.bind(this);
  }

  async listarProductos(req, res) {
    try {
      const rows = await this.service.listarProductos();
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  }

  async verProductoAdmin(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'ID inválido' });
      const row = await this.service.verProducto(id);
      if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(row);
    } catch {
      res.status(500).json({ error: 'Error al obtener producto' });
    }
  }

  async crearProducto(req, res) {
    try {
      const schema = z.object({
        nombre: z.string().min(1),
        descripcion: z.string().max(1000).optional().nullable(),
        precio: z.coerce.number().positive(),
        stockTotal: z.coerce.number().int().nonnegative().default(0),
        sucursales: z.preprocess((v) => {
          if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
          return v;
        }, z.array(z.coerce.number().int().positive()).optional().default([])),
      });
      const parsed = schema.parse(req.body);
      const { nombre, descripcion, precio, stockTotal, sucursales: sucursalesSelected } = parsed;
      const imagenes = Array.isArray(req.files) ? req.files.map(f => f.filename) : [];
      const id = await this.service.crearProducto({ nombre, descripcion, precio, stockTotal, imagenes, sucursalesSelected });
      res.json({ mensaje: `Producto creado con ${imagenes.length} imagen(es) y stock por sucursal inicializado`, id });
    } catch (e) {
      if (e?.issues) return res.status(400).json({ error: 'Validación fallida', issues: e.issues });
      res.status(e.status || 500).json({ error: e.message || 'Error al crear producto' });
    }
  }

  async actualizarProducto(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const schema = z.object({
        nombre: z.string().min(1),
        descripcion: z.string().max(1000).optional().nullable(),
        precio: z.coerce.number().positive(),
        stockTotal: z.coerce.number().int().nonnegative().default(0),
        removeImages: z.preprocess((v) => {
          if (!v) return [];
          if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
          return v;
        }, z.array(z.string()).optional().default([])),
      });
      const { nombre, descripcion, precio, stockTotal, removeImages } = schema.parse(req.body);
      const nuevasImagenes = Array.isArray(req.files) ? req.files.map(f => f.filename) : [];
      // Intentar borrar del disco las imágenes removidas (best-effort)
      if (Array.isArray(removeImages)) {
        for (const filename of removeImages) {
          const imgPath = path.join(__dirname, '..', '..', 'uploads', filename);
          fs.unlink(imgPath, () => {});
        }
      }
      await this.service.actualizarProducto(id, { nombre, descripcion, precio, stockTotal, nuevasImagenes, removeImages });
      res.json({ mensaje: nuevasImagenes.length ? 'Producto actualizado con nuevas imágenes' : 'Producto actualizado' });
    } catch {
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  }

  async eliminarProducto(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      await this.service.eliminarProducto(id);
      res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'Error al eliminar producto' });
    }
  }
}

module.exports = new ProductsAdminController();