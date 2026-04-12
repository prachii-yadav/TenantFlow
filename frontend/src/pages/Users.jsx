import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { getUsers, createUser, updateUser, deleteUser, deactivateUser, activateUser } from '../api/users';
import { getRoles } from '../api/roles';
import { getSites } from '../api/sites';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', email: '', password: '', siteId: '', roleId: '' };

export default function Users() {
  const { canCreate, canEdit, canDelete, isSuperAdmin, isAdmin, isManager } = useRole();
  const { user: currentUser } = useAuth();

  const [users, setUsers]           = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [roles, setRoles]           = useState([]);
  const [sites, setSites]           = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null); // null = create
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', variant: 'danger', onConfirm: null });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, limit: 10, search });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    Promise.all([getRoles({ limit: 100 }), getSites({ limit: 100 })]).then(([r, s]) => {
      setRoles(r.data.roles);
      setSites(s.data.sites);
    });
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      siteId: isSuperAdmin ? '' : (currentUser?.siteId?._id || ''),
    });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', siteId: user.siteId?._id, roleId: user.roleId?._id });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await updateUser(editing._id, payload);
        toast.success('User updated');
      } else {
        await createUser(form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (user) => {
    const deactivating = user.isActive;
    setConfirm({
      open: true,
      title: deactivating ? 'Deactivate User' : 'Activate User',
      message: deactivating
        ? `Deactivate ${user.name}? They will no longer be able to sign in.`
        : `Activate ${user.name}? They will regain access to the system.`,
      variant: deactivating ? 'warning' : 'success',
      onConfirm: async () => {
        try {
          if (deactivating) {
            await deactivateUser(user._id);
            toast.success('User deactivated');
          } else {
            await activateUser(user._id);
            toast.success('User activated');
          }
          fetchUsers();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Error updating user');
        }
      },
    });
  };

  const handleDelete = (user) => {
    setConfirm({
      open: true,
      title: 'Delete User',
      message: `Permanently delete ${user.name}? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteUser(user._id);
          toast.success('User deleted');
          fetchUsers();
        } catch {
          toast.error('Failed to delete user');
        }
      },
    });
  };

  const closeConfirm = () => setConfirm({ open: false, title: '', message: '', variant: 'danger', onConfirm: null });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total users</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No users found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Site', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.siteId?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.roleId?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge active={u.isActive} /></td>
                  <td className="px-4 py-3">
                    {(!isManager || u.roleId?.name?.toLowerCase() === 'viewer') &&
                     (!isAdmin   || u.roleId?.name?.toLowerCase() !== 'admin') && (
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(u)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`text-xs font-medium ${u.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={pagination.page}
        pages={pagination.pages}
        total={pagination.total}
        limit={10}
        onPageChange={setPage}
      />

      {/* Confirm Modal */}
      {confirm.open && (
        <Modal title={confirm.title} onClose={closeConfirm}>
          <p className="text-sm text-gray-600 mb-6">{confirm.message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeConfirm}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => { await confirm.onConfirm(); closeConfirm(); }}
              className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                confirm.variant === 'danger'  ? 'bg-red-600 hover:bg-red-700' :
                confirm.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
                                                'bg-green-600 hover:bg-green-700'
              }`}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? 'Edit User' : 'Add User'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="jane@example.com"
              />
            </Field>
            <Field label={editing ? 'New Password (leave blank to keep)' : 'Password'}>
              <input
                type="password"
                required={!editing}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder={editing ? '••••••••' : 'Min 6 characters'}
              />
            </Field>
            {isSuperAdmin ? (
              <Field label="Site">
                <select
                  required
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                  className="input"
                >
                  <option value="">Select a site</option>
                  {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Site">
                <select
                  required
                  disabled
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                  className="input disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <option value="">Select a site</option>
                  {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Role">
              <select
                required
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                className="input"
              >
                <option value="">Select a role</option>
                {roles
                  .filter((r) => r.name.toLowerCase() !== 'super admin')
                  .filter((r) => !isAdmin || r.name.toLowerCase() !== 'admin')
                  .filter((r) => !isManager || r.name.toLowerCase() === 'viewer')
                  .map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2 transition-colors"
              >
                {saving && <Spinner size="sm" />}
                {editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
