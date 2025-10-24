import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function CarouselManager() {
  const [slides, setSlides] = useState([]);
  const [form, setForm] = useState({ title: '', caption: '', link: '' });
  const [file, setFile] = useState(null);

  const fetch = async () => {
    try {
      const res = await api.get('/seller/carousel');
      setSlides(res.data);
  } catch { /* Error silencioso */ }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('caption', form.caption);
      fd.append('link', form.link);
      if (file) fd.append('image', file);
      const res = await api.post('/seller/carousel', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSlides([...slides, res.data]);
      setForm({ title: '', caption: '', link: '' });
      setFile(null);
  } catch { /* Error silencioso */ }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar slide?')) return;
    try {
      await api.delete('/seller/carousel/' + id);
      setSlides(slides.filter(s => s.id !== id));
  } catch { /* Error silencioso */ }
  };

  return (
    <div>
      <h3>Carrusel</h3>
      <form onSubmit={handleCreate}>
        <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
        <input placeholder="Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Agregar slide</button>
      </form>

      <div style={{ marginTop: 10 }}>
        {slides.map(s => (
          <div key={s.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
            <div><strong>{s.title}</strong></div>
            <div>{s.caption}</div>
            {s.image && <img src={api.defaults.baseURL + '/uploads/' + s.image} width={200} alt="slide" />}
            <div><button onClick={() => handleDelete(s.id)}>Eliminar</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
