import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  HiUsers,
  HiCheckCircle,
  HiPauseCircle,
  HiKey,
  HiBuildingOffice2,
} from 'react-icons/hi2';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { getDashboardStats } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';


export default function Dashboard() {
  const { user }         = useAuth();
  const { isSuperAdmin } = useRole();

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-4 text-sm">{error}</div>
      </Layout>
    );
  }

  // Super Admin sees all-site cards including Sites count
  const superAdminCards = [
    { label: 'Total Users',    value: stats.totalUsers,    Icon: HiUsers,           bg: 'bg-indigo-50',  text: 'text-indigo-700'  },
    { label: 'Active Users',   value: stats.activeUsers,   Icon: HiCheckCircle,     bg: 'bg-green-50',   text: 'text-green-700'   },
    { label: 'Inactive Users', value: stats.inactiveUsers, Icon: HiPauseCircle,     bg: 'bg-amber-50',   text: 'text-amber-700'   },
    { label: 'Roles',          value: stats.totalRoles,    Icon: HiKey,             bg: 'bg-purple-50',  text: 'text-purple-700'  },
    { label: 'Sites',          value: stats.totalSites,    Icon: HiBuildingOffice2, bg: 'bg-sky-50',     text: 'text-sky-700'     },
  ];

  // All other roles see site-scoped cards — no Sites count
  const siteCards = [
    { label: 'Total Users',    value: stats.totalUsers,    Icon: HiUsers,       bg: 'bg-indigo-50',  text: 'text-indigo-700'  },
    { label: 'Active Users',   value: stats.activeUsers,   Icon: HiCheckCircle, bg: 'bg-green-50',   text: 'text-green-700'   },
    { label: 'Inactive Users', value: stats.inactiveUsers, Icon: HiPauseCircle, bg: 'bg-amber-50',   text: 'text-amber-700'   },
    { label: 'Roles',          value: stats.totalRoles,    Icon: HiKey,         bg: 'bg-purple-50',  text: 'text-purple-700'  },
  ];

  const cards = isSuperAdmin ? superAdminCards : siteCards;

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isSuperAdmin
            ? "Here's what's happening across all tenants."
            : `Here's what's happening in ${user?.siteId?.name || 'your site'}.`}
        </p>
      </div>

      {/* Stat Cards */}
      <div className={`grid gap-4 mb-8 ${isSuperAdmin ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {cards.map(({ label, value, Icon, bg, text }) => (
          <StatCard key={label} label={label} value={value} Icon={Icon} bg={bg} text={text} />
        ))}
      </div>

      {/* Chart */}
      {isSuperAdmin ? (
        stats.chart?.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Users per Site</h2>
            <p className="text-xs text-gray-400 mb-6">Total user distribution across all tenant sites</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.chart} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f3ff' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={(val) => [val, 'Users']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
            No data yet to display the chart.
          </div>
        )
      ) : (
        stats.usersPerRole?.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Users by Role</h2>
            <p className="text-xs text-gray-400 mb-6">User distribution by role within {user?.siteId?.name || 'your site'}</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.usersPerRole} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="roleName" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f5f3ff' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={(val) => [val, 'Users']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
            No data yet to display the chart.
          </div>
        )
      )}
    </Layout>
  );
}

function StatCard({ label, value, Icon, bg, text }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <Icon className={`w-5 h-5 ${text}`} />
        <span className={`text-2xl font-bold ${text}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-gray-600">{label}</p>
    </div>
  );
}
