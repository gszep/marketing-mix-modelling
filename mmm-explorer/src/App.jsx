import { Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { loadData } from './utils/dataLoader';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedVertical, setSelectedVertical] = useState('All');
  const [selectedTerritory, setSelectedTerritory] = useState('All Territories');

  useEffect(() => {
    loadData()
      .then((parsedData) => {
        setData(parsedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load data.");
        setLoading(false);
      });
  }, []);

  // Compute unique filter options
  const verticals = useMemo(() => {
    if (!data.length) return [];
    const set = new Set(data.map(d => d.ORGANISATION_VERTICAL).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [data]);

  const territories = useMemo(() => {
    if (!data.length) return [];
    const set = new Set(data.map(d => d.TERRITORY_NAME).filter(Boolean));
    return ['All Territories', ...Array.from(set).filter(t => t !== 'All Territories').sort()];
  }, [data]);

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (selectedVertical !== 'All' && row.ORGANISATION_VERTICAL !== selectedVertical) return false;
      if (selectedTerritory !== 'All Territories' && row.TERRITORY_NAME !== selectedTerritory) return false;
      return true;
    });
  }, [data, selectedVertical, selectedTerritory]);

  // Aggregations for Charts
  // We need to aggregate by Date for the timeline
  const timelineData = useMemo(() => {
    if (!filteredData.length) return [];
    
    // Group by Date
    const grouped = {};
    filteredData.forEach(row => {
        const date = row.DATE_DAY;
        if (!date) return;
        
        if (!grouped[date]) {
            grouped[date] = { 
                date, 
                spend: 0, 
                revenue: 0,
                // Channels
                google: 0,
                meta: 0,
                tiktok: 0
            };
        }
        
        // Sum Spend
        grouped[date].spend += (row.GOOGLE_PAID_SEARCH_SPEND || 0) + (row.GOOGLE_SHOPPING_SPEND || 0) + (row.GOOGLE_PMAX_SPEND || 0) + (row.GOOGLE_DISPLAY_SPEND || 0) + (row.GOOGLE_VIDEO_SPEND || 0) + (row.META_FACEBOOK_SPEND || 0) + (row.META_INSTAGRAM_SPEND || 0) + (row.META_OTHER_SPEND || 0) + (row.TIKTOK_SPEND || 0);
        
        // Sum Revenue (ALL_PURCHASES_ORIGINAL_PRICE - DISCOUNT? Or just ORIGINAL_PRICE? Dictionary says "total value... before discount")
        // Getting actual revenue usually implies Price - Discount. But Gross Revenue is Price.
        // Let's use ALL_PURCHASES_ORIGINAL_PRICE for now as "Gross Revenue"
        grouped[date].revenue += (row.ALL_PURCHASES_ORIGINAL_PRICE || 0);

        // Channel Breakdown
        grouped[date].google += (row.GOOGLE_PAID_SEARCH_SPEND || 0) + (row.GOOGLE_SHOPPING_SPEND || 0) + (row.GOOGLE_PMAX_SPEND || 0) + (row.GOOGLE_DISPLAY_SPEND || 0) + (row.GOOGLE_VIDEO_SPEND || 0);
        grouped[date].meta += (row.META_FACEBOOK_SPEND || 0) + (row.META_INSTAGRAM_SPEND || 0) + (row.META_OTHER_SPEND || 0);
        grouped[date].tiktok += (row.TIKTOK_SPEND || 0);
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

  // Key Metrics
  const metrics = useMemo(() => {
      const totalSpend = timelineData.reduce((acc, curr) => acc + curr.spend, 0);
      const totalRevenue = timelineData.reduce((acc, curr) => acc + curr.revenue, 0);
      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      return { totalSpend, totalRevenue, roas };
  }, [timelineData]);

  if (loading) {
    return <div className="loading-container">Loading Conjura MMM Data...</div>;
  }

  if (error) {
    return <div className="loading-container text-red-500">{error}</div>;
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>MMM Data Explorer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {filteredData.length.toLocaleString()} rows • {timelineData.length} days
        </p>
      </header>

      {/* Controls */}
      <div className="controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 600 }}>Filters:</span>
        </div>
        
        <select value={selectedVertical} onChange={e => setSelectedVertical(e.target.value)}>
          {verticals.map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        <select value={selectedTerritory} onChange={e => setSelectedTerritory(e.target.value)}>
           {territories.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Scorecards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card">
            <h2>Total Spend</h2>
            <div className="metric-value">
                ${metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
        </div>
        <div className="card">
            <h2>Total Revenue</h2>
            <div className="metric-value">
                ${metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
        </div>
        <div className="card">
            <h2>ROAS</h2>
            <div className="metric-value">
                {metrics.roas.toFixed(2)}x
            </div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card" style={{ height: '400px' }}>
            <h2>Spend vs Revenue (Trend)</h2>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={1}>
                  <AreaChart data={timelineData}>
                      <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#373a40" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" scale="log" domain={[1, 'auto']} allowDataOverflow />
                      <Tooltip 
                          contentStyle={{ backgroundColor: '#25262b', border: '1px solid #373a40' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                      <Area type="monotone" dataKey="spend" stroke="#ef4444" fillOpacity={1} fill="url(#colorSpend)" name="Spend" />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="card" style={{ height: '400px' }}>
            <h2>Channel Spend Mix</h2>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={1}>
                  <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#373a40" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" scale="log" domain={[1, 'auto']} allowDataOverflow />
                      <Tooltip contentStyle={{ backgroundColor: '#25262b', border: '1px solid #373a40' }} />
                      <Legend />
                      <Bar dataKey="google" stackId="a" fill="#4285F4" name="Google" />
                      <Bar dataKey="meta" stackId="a" fill="#1877F2" name="Meta" />
                      <Bar dataKey="tiktok" stackId="a" fill="#000000" stroke="#333" name="TikTok" />
                  </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  )
}

export default App
