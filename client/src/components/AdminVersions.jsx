import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import api from '../services/api';
import VersionDeployment from './VersionDeployment';

export default function AdminVersions() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeployment, setShowDeployment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/versions/available', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setVersions(response.data.versions);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (version) => {
    if (!confirm(`Delete version ${version}? This cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await api.delete(`/versions/${version}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setSuccess(`Version ${version} deleted successfully`);
      await loadVersions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete version');
    }
  };

  const handleDeploymentComplete = (newVersion) => {
    setSuccess(`Version ${newVersion} deployed successfully!`);
    loadVersions();
  };

  const handleMarkAsLatest = async (version) => {
    if (!confirm(`Mark version ${version} as latest?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await api.put(
        `/versions/${version}/latest`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setSuccess(`Version ${version} marked as latest`);
      await loadVersions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update version');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8">
        <h2 className="text-2xl font-bold text-white mb-2">Version Management</h2>
        <p className="text-purple-100">Create and manage core tool versions</p>
      </div>

      <div className="p-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 rounded">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900">Success</h3>
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Version Button */}
        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Available Versions</h3>
          <button
            onClick={() => setShowDeployment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Deploy New Version
          </button>
        </div>

        {/* Versions List */}
        <div className="space-y-4">
          {versions.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600">
              No versions created yet. Create your first version to get started.
            </div>
          ) : (
            versions.map((version, idx) => (
              <div
                key={version.version}
                className={`p-6 rounded-lg border-2 transition ${
                  version.status === 'latest'
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{version.version}</h3>
                      {version.status === 'latest' && (
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{version.description}</p>
                    {version.releaseDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        Released: {new Date(version.releaseDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {version.status !== 'latest' && (
                      <button
                        onClick={() => handleMarkAsLatest(version.version)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                      >
                        Set as Latest
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVersion(version.version)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Version Stats */}
                {version.stats && (
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-300">
                    <div>
                      <p className="text-xs text-gray-600">Instances</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {version.stats.instancesUsing || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Files</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {version.stats.fileCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Size</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {version.stats.size ? (version.stats.size / 1024).toFixed(2) + ' KB' : '0 KB'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-start gap-3">
          <Upload className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-semibold">Deployment Instructions:</p>
            <p>Click "Deploy New Version" to pull the latest core files from GitHub master branch and create a new version automatically.</p>
            <p className="mt-1">New instances will use the "Latest" version by default.</p>
          </div>
        </div>
      </div>

      {/* Deployment Tool Modal */}
      {showDeployment && (
        <VersionDeployment
          onClose={() => setShowDeployment(false)}
          onDeploymentComplete={handleDeploymentComplete}
        />
      )}
        </div>
      </div>
    </div>
  );
}
