import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, ProductVariant, EquipmentDetail } from '@/types/supabase';
import { differenceInDays, parseISO } from 'date-fns';

export interface ExpirationAlert {
  id: string; // equipment.id
  product_name: string;
  serial_number: string;
  expiry_date: string;
  days_remaining: number;
}

export interface StockAlert {
  id: string; // product.id or variant.id if EPP
  product_name: string;
  size_label?: string;
  current_stock: number;
  min_stock: number;
}

export function useAlerts() {
  const [expirations, setExpirations] = useState<ExpirationAlert[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // 1. Fetch equipment expirations
      const { data: equipData } = await supabase
        .from('equipment_details')
        .select(`
          id,
          serial_number,
          expiry_date,
          status,
          product:products(name)
        `)
        .in('status', ['Operativo', 'Mantención'])
        .order('expiry_date', { ascending: true });

      if (equipData) {
        const today = new Date();
        const activeExpirations = equipData
          .filter(eq => eq.expiry_date)
          .map((eq: any) => {
            const expDate = parseISO(eq.expiry_date);
            const days = differenceInDays(expDate, today);
            return {
              id: eq.id,
              product_name: eq.product?.name || 'Desconocido',
              serial_number: eq.serial_number,
              expiry_date: eq.expiry_date,
              days_remaining: days
            };
          })
          .filter(item => item.days_remaining <= 30); // Alert threshold: 30 days
        setExpirations(activeExpirations);
      }

      // 2. Fetch Stock Alerts
      // a. Base products (materials)
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, stock_actual, min_stock, is_serialized, category:categories(type)')
        .gt('min_stock', 0); // Only care if min_stock > 0

      // b. Variants (EPP)
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select(`
          id,
          size_label,
          stock_actual,
          product:products(id, name, min_stock)
        `);

      const lowStock: StockAlert[] = [];

      // Process standard materials
      if (productsData) {
        productsData.forEach((p: any) => {
          if (p.category?.type !== 'EPP' && !p.is_serialized) {
            if (p.stock_actual <= p.min_stock) {
              lowStock.push({
                id: p.id,
                product_name: p.name,
                current_stock: p.stock_actual,
                min_stock: p.min_stock
              });
            }
          }
        });
      }

      // Process EPP variants
      if (variantsData) {
        variantsData.forEach((v: any) => {
          if (v.product && v.stock_actual <= v.product.min_stock) {
            lowStock.push({
              id: v.id,
              product_name: v.product.name,
              size_label: v.size_label,
              current_stock: v.stock_actual,
              min_stock: v.product.min_stock
            });
          }
        });
      }

      setStockAlerts(lowStock);

    } catch (error) {
      console.error('Error fetching alerts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Setup channel for equipment and product changes
    const channel = supabase.channel('alerts_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_details' }, fetchAlerts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchAlerts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, fetchAlerts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { expirations, stockAlerts, loading, refresh: fetchAlerts };
}
