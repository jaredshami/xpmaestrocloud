import { useState, useEffect } from 'react';
import { instanceService, clientService } from '../services/api';
import { Plus, Trash2, Copy } from 'lucide-react';
import Modal from './Modal';

export default function Instances() {
  const [instances, setInstances] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ clientId: '', environment: 'prod' });
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [instancesRes, clientsRes] = await Promise.all([
        instanceService.getAll(),
        clientService.getAll(),
      ]);
      setInstances(instancesRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await instanceService.create(formData);
      setFormData({ clientId: '', environment: 'prod' });
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create instance:', error);
      alert(error.response?.data?.error || 'Failed to create instance');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this instance?')) {
      try {
        await instanceService.delete(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete instance:', error);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Instances</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Instance
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subdomain</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Environment</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {instances.map((instance) => (
              <tr key={instance.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-900 font-mono max-w-xs truncate">
                      {instance.subdomain}
                    </code>
                    <button
                      onClick={() => copyToClipboard(instance.subdomain)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {copied === instance.subdomain && <span className="text-xs text-green-600">Copied!</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {instance.client?.name}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {instance.environment}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    instance.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {instance.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(instance.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {instances.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No instances yet. Create one to get started!</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Instance">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} (ID: {client.customerId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
            <select
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="prod">Production</option>
              <option value="stage">Staging</option>
              <option value="dev">Development</option>
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Subdomain Format:</strong> c{'{customerId}'}-i{'{instanceId}'}-{formData.environment}.xpmaestrocloud.com
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Instance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
