import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const pieColors = {
  taken: '#16a34a',
  missed: '#dc2626',
  pending: '#0ea5a4',
  rescheduled: '#f59e0b',
};

const AdherenceChart = ({ dailyData = [], pieData = [] }) => (
  <div className="grid gap-4 xl:grid-cols-3">
    <article className="card xl:col-span-2">
      <h2 className="mb-3 text-xl font-bold">Daily adherence</h2>
      <div className="h-64 min-h-[240px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={220}>
          <ComposedChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe6f7" />
            <XAxis dataKey="label" tick={{ fill: '#7b90b2', fontSize: 12 }} />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, 'Adherence']} />
            <Bar dataKey="adherence" fill="#ccfbf1" radius={[6, 6, 0, 0]} />
            <Line type="monotone" dataKey="adherence" stroke="#0ea5a4" strokeWidth={3} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>

    <article className="card">
      <h2 className="mb-3 text-xl font-bold">Status distribution</h2>
      <div className="h-64 min-h-[240px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={220}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={58} paddingAngle={2}>
              {pieData.map((entry) => (
                <Cell key={entry.key} fill={pieColors[entry.key] || '#64748b'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  </div>
);

export default AdherenceChart;
