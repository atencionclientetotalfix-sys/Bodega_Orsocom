"use client";

import React from 'react';
import { 
  BarChart3, 
  Box, 
  ClipboardList, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const StatCard = ({ title, value, icon, trend, trendValue, color }: any) => (
  <div className="card stat-card">
    <div className="stat-header">
      <div className="stat-title">{title}</div>
      <div className={`stat-icon ${color}`}>{icon}</div>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-footer">
      <span className={`trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </span>
      <span className="trend-label">Desde el último mes</span>
    </div>

    <style jsx>{`
      .stat-card {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .stat-title {
        font-size: 0.875rem;
        color: #7d8590;
        font-weight: 500;
      }
      .stat-icon {
        padding: 0.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .stat-icon.blue { background: rgba(31, 111, 235, 0.1); color: #1f6feb; }
      .stat-icon.orange { background: rgba(210, 153, 34, 0.1); color: #d29922; }
      .stat-icon.green { background: rgba(35, 134, 54, 0.1); color: #238636; }
      .stat-icon.red { background: rgba(218, 54, 51, 0.1); color: #da3633; }
      
      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: white;
      }
      .stat-footer {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
      }
      .trend {
        display: flex;
        align-items: center;
        gap: 2px;
        font-weight: 600;
      }
      .trend-up { color: #3fb950; }
      .trend-down { color: #f85149; }
      .trend-label { color: #7d8590; }
    `}</style>
  </div>
);

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Escritorio Orsocom <span>Cloud</span></h1>
        <p>Bienvenido al sistema de gestión de bodega de materiales eléctricos.</p>
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Stock Crítico" 
          value="12" 
          icon={<AlertTriangle size={20} />} 
          trend="up" 
          trendValue="+2" 
          color="red"
        />
        <StatCard 
          title="Solicitudes Pendientes" 
          value="45" 
          icon={<ClipboardList size={20} />} 
          trend="down" 
          trendValue="-5%" 
          color="orange"
        />
        <StatCard 
          title="Materiales en Tránsito" 
          value="1.2k" 
          icon={<Box size={20} />} 
          trend="up" 
          trendValue="+12%" 
          color="blue"
        />
        <StatCard 
          title="Movimientos Hoy" 
          value="238" 
          icon={<TrendingUp size={20} />} 
          trend="up" 
          trendValue="+18%" 
          color="green"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card main-chart-card">
          <h3>Flujo de Materiales por Proyecto</h3>
          <div className="chart-placeholder">
            <BarChart3 size={48} />
            <p>Visualización de movimientos en tiempo real</p>
          </div>
        </div>
        
        <div className="card recent-activity-card">
          <h3>Actividad Reciente</h3>
          <ul className="activity-list">
            <li className="activity-item">
              <span className="dot blue"></span>
              <div className="activity-info">
                <p className="activity-text">Salida de material para <strong>Proyecto Temuco</strong></p>
                <span className="activity-time">Hace 12 min</span>
              </div>
            </li>
            <li className="activity-item">
              <span className="dot green"></span>
              <div className="activity-info">
                <p className="activity-text">Recepción de OC <strong>#2839</strong> confirmada</p>
                <span className="activity-time">Hace 45 min</span>
              </div>
            </li>
            <li className="activity-item">
              <span className="dot orange"></span>
              <div className="activity-info">
                <p className="activity-text">Nueva solicitud de pedido <strong>#4521</strong></p>
                <span className="activity-time">Hace 1 hora</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .dashboard-header h1 span {
          color: var(--accent);
        }
        .dashboard-header p {
          color: #7d8590;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        .chart-placeholder {
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #30363d;
          gap: 1rem;
        }
        .activity-list {
          list-style: none;
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .activity-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .dot.blue { background: #1f6feb; box-shadow: 0 0 10px rgba(31, 111, 235, 0.4); }
        .dot.green { background: #238636; box-shadow: 0 0 10px rgba(35, 134, 54, 0.4); }
        .dot.orange { background: #d29922; box-shadow: 0 0 10px rgba(210, 153, 34, 0.4); }
        
        .activity-text {
          font-size: 0.9rem;
          color: #e6edf3;
        }
        .activity-time {
          font-size: 0.75rem;
          color: #7d8590;
        }
      `}</style>
    </div>
  );
}
