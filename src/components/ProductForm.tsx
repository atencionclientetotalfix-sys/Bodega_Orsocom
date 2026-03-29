import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Category, UoM, ProductVariant, EquipmentDetail } from '@/types/supabase';

interface ProductFormProps {
  categories: Category[];
  uoms: UoM[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSaving: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ categories, uoms, onClose, onSubmit, isSaving }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    uom_id: '',
    min_stock: 0,
    is_serialized: false,
  });

  const [selectedCategoryType, setSelectedCategoryType] = useState('');
  
  // Para EPP
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);
  // Para Equipos
  const [equipment, setEquipment] = useState<Partial<EquipmentDetail>>({
    serial_number: '',
    certification_date: '',
    expiry_date: '',
  });

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    const cat = categories.find(c => c.id === catId);
    setFormData({ ...formData, category_id: catId, is_serialized: cat?.type === 'Herramienta' });
    setSelectedCategoryType(cat?.type || '');
    
    // Auto-generate variants if EPP
    if (cat?.type === 'EPP') {
      if (cat.name.includes('Calzado')) {
        setVariants(Array.from({ length: 12 }, (_, i) => ({ size_label: String(35 + i), stock_actual: 0 })));
      } else {
        setVariants(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => ({ size_label: s, stock_actual: 0 })));
      }
    } else {
      setVariants([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      product: formData,
      variants: selectedCategoryType === 'EPP' ? variants.filter(v => typeof v?.stock_actual === 'number' && v.stock_actual > 0) : [],
      equipment: selectedCategoryType === 'Herramienta' ? equipment : null
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nuevo Producto / SKU</h2>
          <button className="close-btn" onClick={onClose} title="Cerrar modal"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>SKU</label>
              <input required type="text" placeholder="Ej: ELE-001" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input required type="text" placeholder="Ej: Interruptor Automático 16A" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción Técnica</label>
            <textarea rows={3} placeholder="Detalles, especificaciones..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="category_id">Categoría (Familia)</label>
              <select id="category_id" required title="Seleccione familia" value={formData.category_id} onChange={handleCategoryChange}>
                <option value="" disabled>Seleccione familia...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="uom_id">Unidad de Medida (UoM)</label>
              <select id="uom_id" required title="Seleccione unidad de medida" value={formData.uom_id} onChange={(e) => setFormData({...formData, uom_id: e.target.value})}>
                <option value="" disabled>Seleccione unidad...</option>
                {uoms.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="min_stock">Stock Crítico (Alerta)</label>
            <input id="min_stock" type="number" min="0" title="Stock Crítico Mínimo" required value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})} />
          </div>

          {/* DYNAMIC FIELDS BASED ON CATEGORY */}
          {selectedCategoryType === 'EPP' && (
            <div className="dynamic-section">
              <h4><AlertCircle size={16}/> Tallas Disponibles (Ingrese Stock Inicial)</h4>
              <div className="variants-grid">
                {variants.map((v, idx) => (
                  <div key={idx} className="variant-item">
                    <label htmlFor={`variant_${idx}`}>{v.size_label}</label>
                    <input 
                      id={`variant_${idx}`}
                      type="number" 
                      min="0" 
                      title={`Stock para talla ${v.size_label}`}
                      placeholder="0"
                      onChange={(e) => {
                        const newVars = [...variants];
                        newVars[idx].stock_actual = parseInt(e.target.value) || 0;
                        setVariants(newVars);
                      }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCategoryType === 'Herramienta' && (
            <div className="dynamic-section">
              <h4>Control de Equipo Serializado</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Número de Serie</label>
                  <input required type="text" placeholder="Ej: SN-900122" value={equipment.serial_number} onChange={(e) => setEquipment({...equipment, serial_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label htmlFor="cert_date">Fecha Certificación</label>
                  <input id="cert_date" type="date" title="Fecha de Certificación" value={equipment.certification_date} onChange={(e) => setEquipment({...equipment, certification_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label htmlFor="exp_date">Fecha Vencimiento Cert.</label>
                  <input id="exp_date" type="date" title="Fecha de Vencimiento de Certificación" value={equipment.expiry_date} onChange={(e) => setEquipment({...equipment, expiry_date: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : <><Save size={16} /> Guardar Producto</>}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(13, 17, 23, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }
        .close-btn {
          background: none; border: none; color: #7d8590; cursor: pointer; border-radius: 6px; padding: 4px;
        }
        .close-btn:hover { background: var(--sidebar-hover); color: white; }
        .modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #c9d1d9;
        }
        input, select, textarea {
          background: #0d1117;
          border: 1px solid var(--border);
          color: #e6edf3;
          padding: 0.6rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--accent);
        }
        .dynamic-section {
          background: rgba(31, 111, 235, 0.05);
          border: 1px solid rgba(31, 111, 235, 0.2);
          border-radius: 8px;
          padding: 1.25rem;
          margin-top: 0.5rem;
        }
        .dynamic-section h4 {
          color: #58a6ff;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .variants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 0.75rem;
        }
        .variant-item { display: flex; flex-direction: column; gap: 4px; align-items: center; }
        .variant-item label { font-size: 0.75rem; font-weight: bold; color: #c9d1d9; }
        .variant-item input { width: 100%; text-align: center; padding: 4px; }
        
        .modal-footer {
          margin-top: 1rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .btn-secondary {
          background: #21262d; border: 1px solid var(--border); color: #c9d1d9; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500;
        }
        .btn-secondary:hover { background: #30363d; }
        .btn-primary {
          background: var(--accent); border: 1px solid var(--accent); color: white; padding: 0.6rem 1.25rem; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;
        }
        .btn-primary:hover { filter: brightness(1.1); }
        .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default ProductForm;
