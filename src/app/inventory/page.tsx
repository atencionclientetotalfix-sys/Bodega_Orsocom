"use client";

import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductForm from '@/components/ProductForm';
import { Plus, Search, Filter, AlertTriangle, ShieldCheck, Wrench, Package } from 'lucide-react';

export default function InventoryPage() {
  const { products, categories, uoms, loading, createProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateProduct = async (data: any) => {
    setIsSaving(true);
    const { success, error } = await createProduct(data.product, data.variants, data.equipment);
    setIsSaving(false);
    
    if (success) {
      setIsModalOpen(false);
    } else {
      alert(`Error al crear producto: ${error}`);
    }
  };

  const getStatusBadge = (product: any) => {
    if (product.stockActual <= product.min_stock && product.min_stock > 0) {
      return <span className="badge badge-error"><AlertTriangle size={12} /> Stock Crítico</span>;
    }
    if (product.category?.type === 'EPP') {
      return <span className="badge badge-epp"><ShieldCheck size={12} /> Tallas Múltiples</span>;
    }
    if (product.category?.type === 'Herramienta') {
      return <span className="badge badge-tool"><Wrench size={12} /> Serializado</span>;
    }
    return <span className="badge badge-success"><Package size={12} /> OK</span>;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' ? true : p.category?.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Maestro de Productos (SKU)</h1>
          <p>Catálogo centralizado de materiales, EPP y herramientas.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </header>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por SKU o Nombre..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={16} className="text-muted" />
          <select title="Filtrar por familia" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">Todas las Familias</option>
            <option value="Material">Materiales</option>
            <option value="EPP">EPP (Vestuario/Calzado)</option>
            <option value="Herramienta">Equipos y Herramientas</option>
          </select>
        </div>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">Cargando inventario...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Familia</th>
                <th>UoM</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">No se encontraron productos.</td>
                </tr>
              ) : (
                filteredProducts.map(prod => (
                  <tr key={prod.id}>
                    <td className="font-mono text-accent">{prod.sku}</td>
                    <td>
                      <strong>{prod.name}</strong>
                      <div className="text-small text-muted truncate">{prod.description}</div>
                    </td>
                    <td>{prod.category?.name}</td>
                    <td>{prod.uom?.abbreviation}</td>
                    <td>{prod.min_stock}</td>
                    <td>{getStatusBadge(prod)}</td>
                    <td>
                      <button className="btn-icon">Detalle</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <ProductForm 
          categories={categories}
          uoms={uoms}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProduct}
          isSaving={isSaving}
        />
      )}

      <style jsx>{`
        .page-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .page-header h1 { font-size: 1.75rem; color: white; margin-bottom: 0.25rem; }
        .page-header p { color: #7d8590; font-size: 0.9rem; margin: 0; }
        
        .filters-bar {
          display: flex;
          gap: 1rem;
          background: var(--bg-card);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        
        .search-box, .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #0d1117;
          border: 1px solid var(--border);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
        }
        .search-box:focus-within { border-color: var(--accent); }
        .search-box input {
          background: transparent; border: none; color: white; outline: none; width: 300px; font-size: 0.875rem;
        }
        .filter-group select {
          background: transparent; border: none; color: white; outline: none; font-size: 0.875rem; cursor: pointer;
        }
        
        .data-table-container {
          flex-grow: 1;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .data-table th {
          background: #161b22;
          padding: 0.75rem 1rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #7d8590;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
        }
        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .data-table tr:hover { background: rgba(255, 255, 255, 0.02); }
        
        .font-mono { font-family: monospace; }
        .text-accent { color: var(--accent); font-weight: 600; }
        .text-small { font-size: 0.75rem; }
        .text-muted { color: #7d8590; }
        .truncate { max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .badge {
          display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;
        }
        .badge-success { background: rgba(35, 134, 54, 0.15); color: #3fb950; border: 1px solid rgba(35, 134, 54, 0.4); }
        .badge-error { background: rgba(218, 54, 51, 0.15); color: #ff7b72; border: 1px solid rgba(218, 54, 51, 0.4); }
        .badge-epp { background: rgba(163, 113, 247, 0.15); color: #a371f7; border: 1px solid rgba(163, 113, 247, 0.4); }
        .badge-tool { background: rgba(210, 153, 34, 0.15); color: #d29922; border: 1px solid rgba(210, 153, 34, 0.4); }
        
        .empty-state { text-align: center; color: #7d8590; padding: 3rem !important; }
        .loading-state { padding: 3rem; text-align: center; color: #7d8590; }
        
        .btn-primary { background: var(--accent); color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: filter 0.2s;}
        .btn-primary:hover { filter: brightness(1.1); }
        .btn-icon { background: #21262d; border: 1px solid var(--border); color: #c9d1d9; border-radius: 4px; padding: 4px 8px; font-size: 0.75rem; cursor: pointer; }
        .btn-icon:hover { background: #30363d; color: white; }
      `}</style>
    </div>
  );
}
