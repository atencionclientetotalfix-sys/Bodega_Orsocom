import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category, UoM, ProductVariant, EquipmentDetail } from '@/types/supabase';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUoms] = useState<UoM[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    setLoading(true);
    
    // Fetch categories
    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) setCategories(catData as Category[]);

    // Fetch UoMs
    const { data: uomData } = await supabase.from('uoms').select('*');
    if (uomData) setUoms(uomData as UoM[]);

    // Fetch Products with relations
    const { data: prodData, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        uom:uoms(*),
        product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && prodData) {
      setProducts(prodData as Product[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInitialData();

    // Set up real-time subscription for changes
    const subscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        console.log('Product change received!', payload);
        fetchInitialData(); // Re-fetch to get nested related data easily (or update cache)
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const createProduct = async (
    product: Omit<Product, 'id' | 'category' | 'uom'>,
    variants?: Omit<ProductVariant, 'id' | 'product_id'>[],
    equipment?: Omit<EquipmentDetail, 'id' | 'product_id'>
  ) => {
    try {
      // 1. Create Base Product
      const { data: newProd, error: prodErr } = await supabase
        .from('products')
        .insert([{
          sku: product.sku,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          uom_id: product.uom_id,
          min_stock: product.min_stock,
          stock_actual: product.stock_actual || 0,
          is_serialized: product.is_serialized
        }])
        .select()
        .single();
        
      if (prodErr) throw prodErr;
      const productId = newProd.id;

      // 2. If it has variants (EPP)
      if (variants && variants.length > 0) {
        const variantsToInsert = variants.map(v => ({
          ...v,
          product_id: productId
        }));
        const { error: varErr } = await supabase.from('product_variants').insert(variantsToInsert);
        if (varErr) throw varErr;
      }

      // 3. If it is Equipment
      if (equipment && product.is_serialized) {
        const { error: eqErr } = await supabase.from('equipment_details').insert([{
          ...equipment,
          product_id: productId
        }]);
        if (eqErr) throw eqErr;
      }

      fetchInitialData(); // Refetch after successful creation
      return { success: true, data: newProd };
    } catch (e: any) {
      console.error("Error creating product: ", e.message);
      return { success: false, error: e.message };
    }
  };

  return {
    products,
    categories,
    uoms,
    loading,
    createProduct,
    refresh: fetchInitialData
  };
}
