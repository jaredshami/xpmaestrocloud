import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Download, RotateCcw, ChevronDown } from 'lucide-react';
import api from '../services/api';

export default function VersionManager({ instanceId, onVersionUpdate }) {
  const [currentVersion, setCurrentVersion] = useState(null);
  const [availableVersions, setAvailableVersions] = useState([]);
  const [versionHistory, setVersionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadVersionData();
  }, [instanceId]);

  const loadVersionData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current instance version
      const currentRes = await api.get(`/versions/${instanceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('instanceToken')}` },
      });
      setCurrentVersion(currentRes.data);

      // Get available versions
      const availableRes = await api.get('/versions/available');
      setAvailableVersions(availableRes.data.versions);
      setSelectedVersion(currentRes.data.currentVersion);

      // Get version history
      const historyRes = await api.get(`/versions/${instanceId}/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('instanceToken')}` },
      });
      setVersionHistory(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load version data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVersion = async () => {
    if (!selectedVersion || selectedVersion === currentVersion.currentVersion) {
      setError('Please select a different version');
      return;
    }

    if (!confirm(`Update from ${currentVersion.currentVersion} to ${selectedVersion}?`)) {
      return;
    }

    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      const response = await api.put(
        `/versions/${instanceId}`,
        { targetVersion: selectedVersion },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('instanceToken')}` },
        }
      );

      setSuccess(response.data.message);
      setCurrentVersion(response.data.instance);
      
      if (onVersionUpdate) {
        onVersionUpdate(response.data.instance);
      }

      // Reload history
      await loadVersionData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update version');
    } finally {
      setUpdating(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm('Rollback to previous version?')) {
      return;
    }

    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      const response = await api.post(
        `/versions/${instanceId}/rollback`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('instanceToken')}` },
        }
      );

      setSuccess(response.data.message);
      setCurrentVersion(response.data.instance);
      setSelectedVersion(response.data.instance.currentVersion);

      if (onVersionUpdate) {
        onVersionUpdate(response.data.instance);
      }

      // Reload history
      await loadVersionData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rollback version');
    } finally {
      setUpdating(false);
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
        <p className="text-purple-100">Update or rollback your instance to different versions</p>
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

        {/* Current Version Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Version</h3>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Instance: <span className="font-mono font-semibold">{currentVersion.subdomain}</span></p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{currentVersion.currentVersion}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
        </div>

        {/* Update Version Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update to Version</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Version</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                disabled={updating}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="">Choose a version...</option>
                {availableVersions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.version} - {v.description} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedVersion && selectedVersion !== currentVersion.currentVersion && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Updating from:</span> {currentVersion.currentVersion} → {selectedVersion}
                </p>
              </div>
            )}

            <button
              onClick={handleUpdateVersion}
              disabled={!selectedVersion || selectedVersion === currentVersion.currentVersion || updating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {updating ? 'Updating...' : 'Update Version'}
            </button>
          </div>
        </div>

        {/* Rollback Section */}
        {versionHistory.length > 1 && (
          <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Rollback Available</h3>
                <p className="text-sm text-yellow-800">
                  If you encounter issues with the current version, you can rollback to the previous stable version.
                </p>
              </div>
              <button
                onClick={handleRollback}
                disabled={updating}
                className="flex-shrink-0 ml-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                {updating ? 'Rolling back...' : 'Rollback'}
              </button>
            </div>
          </div>
        )}

        {/* Version History Section */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition mb-4"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Version History</h3>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition ${showHistory ? 'rotate-180' : ''}`}
            />
          </button>

          {showHistory && (
            <div className="space-y-3">
              {versionHistory.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 text-center">No version history yet</p>
              ) : (
                versionHistory.map((entry, idx) => (
                  <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {entry.fromVersion} → {entry.toVersion}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                        entry.status === 'rolled_back' ? 'bg-yellow-100 text-yellow-800' :
                        entry.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600">{entry.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Tip:</span> Always backup your instance data before updating to a new version. You can rollback anytime if issues occur.
        </p>
      </div>
    </div>
  );
}
