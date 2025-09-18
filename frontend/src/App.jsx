import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Usuarios from './components/Usuarios';
import Productos from './components/Productos';
import Pedidos from './components/Pedidos';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container py-4">
        <div className="text-center mb-5">
          <h1 className="display-4">Panel de Administración</h1>
          <p className="lead">Gestiona usuarios, productos y pedidos de forma sencilla</p>
        </div>
        <nav className="mb-4">
          <ul className="nav nav-pills justify-content-center">
            <li className="nav-item">
              <Link className="nav-link" to="/usuarios">Usuarios</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/productos">Productos</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/pedidos">Pedidos</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/" element={<Usuarios />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
