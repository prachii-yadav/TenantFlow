import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import {
  HiSquares2X2,
  HiUsers,
  HiKey,
  HiBuildingOffice2,
  HiUser,
} from 'react-icons/hi2';

const links = [
  { to: '/dashboard', label: 'Dashboard', Icon: HiSquares2X2,      superAdminOnly: false },
  { to: '/users',     label: 'Users',     Icon: HiUsers,            superAdminOnly: false },
  { to: '/roles',     label: 'Roles',     Icon: HiKey,              superAdminOnly: false },
  { to: '/sites',     label: 'Sites',     Icon: HiBuildingOffice2,  superAdminOnly: true  },
  { to: '/profile',   label: 'Profile',   Icon: HiUser,             superAdminOnly: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isSuperAdmin } = useRole();

  const visibleLinks = links.filter(l => !l.superAdminOnly || isSuperAdmin);

  return (
    <aside className="w-56 shrink-0 bg-indigo-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-indigo-800">
        <span className="text-xl font-bold tracking-tight">TenantFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleLinks.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info panel */}
      <div className="px-4 py-4 border-t border-indigo-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-400 w-8 shrink-0">Site</span>
            <span className="text-xs bg-indigo-800 text-indigo-100 px-2 py-0.5 rounded-full truncate">
              {user?.siteId?.name || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-400 w-8 shrink-0">Role</span>
            <span className="text-xs bg-indigo-800 text-indigo-100 px-2 py-0.5 rounded-full truncate">
              {user?.roleId?.name || '—'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full text-left text-xs text-indigo-300 hover:text-white transition-colors pt-1"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
