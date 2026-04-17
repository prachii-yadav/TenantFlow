import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { getRoles, updateRole, deleteRole } from '../api/roles';
import { useRole } from '../hooks/useRole';

const EMPTY_FORM = { name: '', description: '' };

export default function Roles() {
  const { canEdit, isSuperAdmin } = useRole();

  const [roles, setRoles]         = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const fetchRoles = async (q = search) => {
    setLoading(true);
    try {
      const res = await getRoles({ limit: 100, search: q });
      setRoles(res.data.roles);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { fetchRoles(search); }, [search]);

  const openEdit = (role) => {
    setEditing(role);
    setForm({ name: role.name, description: role.description });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRole(editing._id, form);
      toast.success('Role updated');
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"? Users assigned this role will be affected.`)) return;
    try {
      await deleteRole(role._id);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <p className="text-sm text-gray-500 mt-0.5">{roles.length} role{roles.length !== 1 ? 's' : ''} defined</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : roles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          {search ? `No roles matching "${search}".` : 'No roles found.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role._id}
              role={role}
              onEdit={() => openEdit(role)}
              onDelete={() => handleDelete(role)}
              canEdit={canEdit}
              canDelete={isSuperAdmin}
            />
          ))}
        </div>
      )}

      {showModal && editing && (
        <Modal title="Edit Role" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input resize-none"
                placeholder="What can users with this role do?"
              />
            </div>
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
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

function RoleCard({ role, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔑</span>
          <h3 className="font-semibold text-gray-900">{role.name}</h3>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(role.createdAt).toLocaleDateString()}
        </span>
      </div>

      {role.description && (
        <p className="text-sm text-gray-500 leading-relaxed">{role.description}</p>
      )}

      <div className="flex gap-3 mt-auto pt-2 border-t border-gray-100">
        {canEdit && (
          <button onClick={onEdit} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            Edit
          </button>
        )}
        {canDelete && (
          <button onClick={onDelete} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
