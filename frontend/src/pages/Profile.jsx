import { useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../api/users';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const openEdit = () => {
    setForm({ name: user.name, email: user.email, password: '' });
    setError('');
    setShowEdit(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      await updateUser(user._id, payload);
      await refreshUser();
      setShowEdit(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: 'Full Name', value: user?.name },
    { label: 'Email',     value: user?.email },
    { label: 'Role',      value: user?.roleId?.name || '—' },
    { label: 'Site',      value: user?.siteId?.name || '—' },
    { label: 'Status',    value: user?.isActive ? 'Active' : 'Inactive', highlight: user?.isActive },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account information</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 max-w-lg">
        {/* Avatar header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={openEdit}
            title="Edit profile"
            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <dl className="divide-y divide-gray-100">
          {fields.map(({ label, value, highlight }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <dt className="text-sm text-gray-500 w-28 shrink-0">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 text-right">
                {label === 'Status' ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    highlight ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {value}
                  </span>
                ) : value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Profile" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
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
