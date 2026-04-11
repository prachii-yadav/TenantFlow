import { useAuth } from '../context/AuthContext';

/**
 * Role hierarchy (case-insensitive):
 *   "Super Admin" → sees all sites, full access everywhere
 *   "Admin"       → full access within their own site
 *   "Manager"     → create/edit within their own site, no delete
 *   anything else → read-only (Viewer)
 */
export function useRole() {
  const { user } = useAuth();
  const roleName = (user?.roleId?.name || '').toLowerCase();

  const isSuperAdmin = roleName === 'super admin';
  const isAdmin      = roleName === 'admin';
  const isManager    = roleName === 'manager';
  const isViewer     = !isSuperAdmin && !isAdmin && !isManager;

  return {
    roleName,
    isSuperAdmin,
    isAdmin,
    isManager,
    isViewer,
    canCreate: isSuperAdmin || isAdmin || isManager,
    canEdit:   isSuperAdmin || isAdmin || isManager,
    canDelete: isSuperAdmin || isAdmin,
  };
}
