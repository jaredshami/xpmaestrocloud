import { useState, useEffect } from 'react';
import { dashboardService, clientService, instanceService } from '../services/api';
import { BarChart3, Users, Zap, TrendingUp } from 'lucide-react';
import AdminVersions from './AdminVersions';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Clients"
          value={stats?.stats?.totalClients || 0}
          color="blue"
        />
        <StatCard
          icon={Zap}
          title="Total Instances"
          value={stats?.stats?.totalInstances || 0}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Instances"
          value={stats?.stats?.activeInstances || 0}
          color="green"
        />
        <StatCard
          icon={BarChart3}
          title="Uptime"
          value="99.9%"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Clients</h3>
          <div className="space-y-3">
            {stats?.recentClients?.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  ID: {client.customerId}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Instances</h3>
          <div className="space-y-3">
            {stats?.recentInstances?.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900 text-sm truncate">{instance.subdomain}</p>
                  <p className="text-xs text-gray-500">{instance.client.name}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {instance.environment}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Version Management Section */}
      <AdminVersions />
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
