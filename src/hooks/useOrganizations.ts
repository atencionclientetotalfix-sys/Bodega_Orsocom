'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CostCenter, Project } from '@/types/supabase';

export function useOrganizations() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch valid cost centers
        const { data: ccData, error: ccErr } = await supabase
          .from('cost_centers')
          .select('*')
          .order('name');
          
        if (!ccErr && ccData) setCostCenters(ccData as CostCenter[]);

        // Fetch valid projects
        const { data: projData, error: projErr } = await supabase
          .from('projects')
          .select('*, cost_center:cost_centers(*)')
          .eq('status', 'Activo')
          .order('name');
          
        if (!projErr && projData) setProjects(projData as Project[]);
      } catch (err) {
        console.error("Error loading organizations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  return { costCenters, projects, loading };
}
