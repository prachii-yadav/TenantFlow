import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { getSites, createSite, updateSite, deleteSite } from '../api/sites';
import { useRole } from '../hooks/useRole';

const EMPTY_FORM = { name: '', domain: '' };
const LIMIT = 10;

export default function Sites() {
  const { canCreate, canEdit, canDelete } = useRole();

  const [sites, setSites]           = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSites({ page, limit: LIMIT, search });
      const sitesData = res.data.sites;
      setSites(sitesData);
      setPagination(
        res.data.pagination ?? { page: 1, pages: 1, total: sitesData.length }
      );
    } catch {
      toast.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchSites(); }, [fetchSites]);
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (site) => {
    setEditing(site);
    setForm({ name: site.name, domain: site.domain || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateSite(editing._id, form);
        toast.success('Site updated');
      } else {
        await createSite(form);
        toast.success('Site created');
      }
      setShowModal(false);
      fetchSites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving site');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (site) => {
    if (!window.confirm(`Delete site "${site.name}"? Users assigned to this site will be unlinked.`)) return;
    try {
      await deleteSite(site._id);
      toast.success('Site deleted');
      fetchSites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete site');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total} site{pagination.total !== 1 ? 's' : ''} registered
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Site
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search sites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : sites.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          {search ? `No sites matching "${search}".` : 'No sites yet. Create one to get started.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Site Name', 'Domain', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sites.map((site) => (
                <tr key={site._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <span className="text-sm font-medium text-gray-900">{site.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {site.domain ? (
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {site.domain}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <button onClick={() => openEdit(site)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors">
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(site)} className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={pagination.page}
        pages={pagination.pages}
        total={pagination.total}
        limit={LIMIT}
        onPageChange={setPage}
      />

      {showModal && (
        <Modal title={editing ? 'Edit Site' : 'Add Site'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="input"
                placeholder="e.g. acme.com"
              />
              <p className="text-xs text-gray-400 mt-1">Used for display purposes only.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2 transition-colors">
                {saving && <Spinner size="sm" />}
                {editing ? 'Save Changes' : 'Create Site'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
