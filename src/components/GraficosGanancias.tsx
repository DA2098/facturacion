// ═══════════════════════════════════════════════════════════════
// GraficosGanancias — Gráficos de ingresos/ganancias por período
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';

interface PeriodoData {
  periodo: string;
  ganancia: number;
  perdida: number;
  advertencia: number;
}

export default function GraficosGanancias() {
  const [data, setData] = useState<PeriodoData[]>([]);
  const [loading, setLoading] = useState(true);
async function loadData() {
    try {
      const API = (import.meta as any).env?.VITE_API_URL || 'https://facturacion-api-w7ai.onrender.com/api';
      const res = await fetch(`${API}/api/dashboard/ganancias-periodo`);
      if (res.ok) {
        const json = await res.json();
        setData([
          json.dia,
          json.semana,
          json.mes,
          json.anio,
        ]);
      }
    } catch (err) {
      console.error('Error cargando ganancias:', err);
    }
  }

  useEffect(() => {
    const load = async () => {
      await loadData();
      setLoading(false);
    };
    void load();
  }, []);

  // Refrescar en tiempo real cuando hay cambios en facturas
  useRealtimeRefresh(() => {
    void loadData();
  }, true);

  if (loading) return <div className="dash-box"><p>Cargando gráficos...</p></div>;

  return (
    <div className="dash-box">
      <h2 className="box-title">Ganancias por Período</h2>
      <p className="box-subtitle">Verde: Pagadas | Rojo: Anuladas | Amarillo: Pendientes</p>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periodo" />
          <YAxis />
          <Tooltip
            formatter={(value: any) => {
              const num = typeof value === 'number' ? value : parseFloat(value);
              return isNaN(num) ? 'S/ 0.00' : `S/ ${num.toFixed(2)}`;
            }}
            contentStyle={{ backgroundColor: '#f0f2f5', border: '1px solid #e2e8f0' }}
          />
          <Legend />
          <Bar dataKey="ganancia" fill="#16a34a" name="Ganancias (Pagadas)" />
          <Bar dataKey="perdida" fill="#dc2626" name="Pérdidas (Anuladas)" />
          <Bar dataKey="advertencia" fill="#d97706" name="Pendiente de Cobro" />
        </BarChart>
      </ResponsiveContainer>

      <div className="grafico-info">
        <div className="info-box info-green">
          <p className="info-label">Ganancias (Pagadas)</p>
          <p className="info-desc">Facturas completadas y pagadas. Dinero real en caja.</p>
        </div>
        <div className="info-box info-red">
          <p className="info-label">Pérdidas (Anuladas)</p>
          <p className="info-desc">Facturas canceladas o anuladas. Dinero que no se cobró.</p>
        </div>
        <div className="info-box info-yellow">
          <p className="info-label">Pendiente de Cobro</p>
          <p className="info-desc">Facturas emitidas pero aún no pagadas. Dinero en espera.</p>
        </div>
      </div>
    </div>
  );
}
