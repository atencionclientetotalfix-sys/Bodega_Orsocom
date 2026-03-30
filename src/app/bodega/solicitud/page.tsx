'use client';

import { useState } from 'react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Search, Plus, Trash2, PackageSearch, AlertCircle, Building2, Briefcase, Minus, HardHat, Zap, Scissors, Droplet, Box } from 'lucide-react';
import { toast } from 'sonner';
import { Product, ProductVariant } from '@/types/supabase';
import { submitOrderRequest } from './actions';

export default function SolicitudBodega() {
  const { costCenters, projects, loading: orgLoading } = useOrganizations();
  const { products, loading: prodLoading } = useProducts();
  const { items, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCC, setSelectedCC] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  // Local state for EPP size selection before adding to cart
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successFolio, setSuccessFolio] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredProjects = projects.filter(p => p.cost_center_id === selectedCC);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
  };

  const handleAddToCart = (product: Product) => {
    if (product.category?.type === 'EPP') {
      const vId = selectedVariants[product.id];
      if (!vId) {
        alert('Debes seleccionar una talla para este Elemento de Protección Personal.');
        return;
      }
      // find variant details
      // Note: we need product variants from the product object if it was fetched.
      // Wait, in useProducts, does it fetch product_variants?
      // For now, let's assume it doesn't fetch them nested unless we altered useProducts to do so.
      // We will need to make sure variants are available.
    }
    // We'll temporarily assume variants are in product.variants if we fetched them or we'll fetch them.
    // For now, let's pass null variant for non-EPP and a placeholder for EPP to avoid blocking.
    const selectedVariant = (product as any).product_variants?.find((v: ProductVariant) => v.id === selectedVariants[product.id]) || null;
    
    addToCart(product, 1, selectedVariant);
    toast.success(`Agregado: ${product.name}`, { description: selectedVariant ? `Talla: ${selectedVariant.size_label}` : undefined });
    
    // reset selection for this product
    setSelectedVariants(prev => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      setErrorMsg('Debes seleccionar un Proyecto destino.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('El carrito está vacío.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await submitOrderRequest({
      project_id: selectedProject,
      notes,
      items: items.map(i => ({
        product_id: i.product.id,
        variant_id: i.variant?.id || null,
        requested_qty: i.quantity
      }))
    });

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setSuccessFolio(result.folio || 0);
      clearCart();
      setNotes('');
      setSelectedProject('');
    }
    setIsSubmitting(false);
  };

  if (successFolio) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-xl text-center shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">¡Solicitud Generada!</h2>
        <p className="text-slate-400 mb-6">El folio de tu pedido es el <span className="font-bold text-amber-500">#{successFolio}</span></p>
        <p className="text-sm text-slate-500 mb-8">El bodeguero o tu supervisor recibirán la petición para su procesamiento.</p>
        <button 
          onClick={() => setSuccessFolio(null)}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
        >
          Crear nueva Solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nueva Solicitud de Pedido</h1>
          <p className="text-slate-400 mt-1">Requiere materiales o EPP para tus proyectos.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Catálogo Left Pane */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[calc(100vh-200px)]">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por SKU o nombre de material..." 
                className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-slate-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {prodLoading ? (
               <div className="text-center text-slate-500 py-12">Cargando catálogo...</div>
            ) : filteredProducts.length === 0 ? (
               <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-3">
                 <PackageSearch size={48} className="text-slate-700" />
                 <p>No se encontraron productos</p>
               </div>
            ) : (
              filteredProducts.map(product => {
                const isEPP = product.category?.type === 'EPP';
                const variants: ProductVariant[] = (product as any).product_variants || [];

                let CatIcon = Box;
                if (product.category?.type === 'EPP') CatIcon = HardHat;
                else if (product.category?.name?.toLowerCase().includes('eléctric') || product.category?.name?.toLowerCase().includes('electric')) CatIcon = Zap;
                else if (product.category?.name?.toLowerCase().includes('herramienta')) CatIcon = Scissors;
                else if (product.category?.name?.toLowerCase().includes('limpieza') || product.category?.name?.toLowerCase().includes('liquido')) CatIcon = Droplet;

                return (
                  <div key={product.id} className="bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/80 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all flex flex-col sm:flex-row gap-4 sm:items-center justify-between group">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-lg bg-slate-900/80 flex items-center justify-center border border-slate-700/50 text-slate-400 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-colors shrink-0">
                        <CatIcon size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {product.category?.name || 'Item'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Stock Base: {product.stock_actual} {product.uom?.abbreviation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isEPP && variants.length > 0 && (
                        <select 
                          className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded py-1.5 px-2 focus:ring-amber-500 focus:border-amber-500"
                          title="Seleccionar talla"
                          value={selectedVariants[product.id] || ''}
                          onChange={(e) => handleVariantChange(product.id, e.target.value)}
                        >
                          <option value="">-- Talla --</option>
                          {variants.map(v => (
                            <option key={v.id} value={v.id}>{v.size_label} (Stk: {v.stock_actual})</option>
                          ))}
                        </select>
                      )}
                      
                      {isEPP && variants.length === 0 && (
                        <span className="text-red-400 text-xs text-right w-24">Sin tallas config.</span>
                      )}

                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={isEPP && variants.length === 0}
                        className="p-2 bg-slate-800 text-slate-300 rounded-md hover:bg-amber-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Añadir a solicitud"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Formulario y Carrito Right Pane */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6 h-[calc(100vh-100px)]">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               <Building2 size={18} className="text-amber-500" /> Destino
             </h2>
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-medium text-slate-400 mb-1">Centro de Costo</label>
                 <select 
                   className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-amber-500 focus:border-amber-500"
                   title="Selecciona el Centro de Costo"
                   value={selectedCC}
                   onChange={(e) => { setSelectedCC(e.target.value); setSelectedProject(''); }}
                   disabled={orgLoading}
                 >
                   <option value="">Selecciona Unidad/Bodega</option>
                   {costCenters.map(cc => (
                     <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-400 mb-1">Proyecto Asignado</label>
                 <div className="relative">
                   <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                   <select 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                    title="Selecciona el Proyecto"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    disabled={!selectedCC || filteredProjects.length === 0}
                   >
                     <option value="">Selecciona Proyecto...</option>
                     {filteredProjects.map(pr => (
                       <option key={pr.id} value={pr.id}>{pr.code} - {pr.name}</option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-0 flex flex-col flex-1 shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 rounded-t-xl">
               <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                 <ShoppingCart size={18} className="text-amber-500" />
                 Líneas de Solicitud ({items.length})
               </h2>
               {items.length > 0 && (
                 <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                   <Trash2 size={12} /> Limpiar
                 </button>
               )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] custom-scrollbar">
               {items.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-50">
                    <ShoppingCart size={40} />
                    <p className="text-sm">Carrito Vacio</p>
                 </div>
               ) : (
                 items.map(item => (
                   <div key={item.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                      <div className="flex-1 min-w-0 pr-3">
                         <p className="text-sm font-medium text-white truncate" title={item.product.name}>
                           {item.product.name}
                         </p>
                         <div className="flex gap-2 mt-1">
                           <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                           {item.variant && (
                             <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded">
                               Talla: {item.variant.size_label}
                             </span>
                           )}
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} title="Disminuir cantidad" className="text-slate-400 hover:text-white bg-slate-900 p-1.5 rounded">
                            <Minus size={12} />
                          </button>
                          <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} title="Aumentar cantidad" className="text-slate-400 hover:text-white bg-slate-900 p-1.5 rounded">
                            <Plus size={12} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} title="Eliminar ítem" className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-800/30 rounded-b-xl space-y-4">
              <textarea 
                placeholder="Observaciones de la solicitud (Opcional)..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:ring-amber-500 focus:border-amber-500 resize-none h-20"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || items.length === 0 || !selectedProject}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
              >
                {isSubmitting ? 'Procesando...' : 'Enviar Solicitud a Bodega'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
