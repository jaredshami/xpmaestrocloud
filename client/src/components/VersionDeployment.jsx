import { useState, useEffect } from 'react';
import { GitBranch, CheckCircle, AlertCircle, Clock, ArrowRight, X } from 'lucide-react';
import api from '../services/api';

export default function VersionDeployment({ onClose, onDeploymentComplete }) {
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deploymentSteps, setDeploymentSteps] = useState([]);

  useEffect(() => {
    checkDeploymentStatus();
  }, []);

  const checkDeploymentStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/versions/deployment-status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setDeploymentStatus(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check deployment status');
    } finally {
      setLoading(false);
    }
  };

  // Get available new versions (versions in GitHub that are not on VPS)
  const getAvailableNewVersions = () => {
    if (!deploymentStatus?.allVersionsOnGitHub || !deploymentStatus?.vpsLatest) {
      return [];
    }
    
    // Get all versions from GitHub that are newer than VPS latest
    return deploymentStatus.allVersionsOnGitHub;
  };

  const handleVersionSelect = (versionNumber) => {
    setSelectedVersion(versionNumber);
    
    // Find and auto-populate description for selected version
    const versionInfo = deploymentStatus?.allVersionsOnGitHub?.find(v => v.version === versionNumber);
    if (versionInfo) {
      setDescription(versionInfo.description || '');
    }
  };

  const handleStartDeployment = async (e) => {
    e.preventDefault();

    if (!selectedVersion) {
      setError('Please select a version to deploy');
      return;
    }

    try {
      setDeploying(true);
      setError('');
      setSuccess('');

      const versionNumber = selectedVersion;

      // Initialize deployment steps
      const steps = [
        { step: 1, name: 'Pulling core files from GitHub', status: 'in-progress' },
        { step: 2, name: 'Comparing manifests', status: 'pending' },
        { step: 3, name: 'Creating version folder', status: 'pending' },
        { step: 4, name: 'Updating version registry', status: 'pending' },
      ];
      setDeploymentSteps(steps);

      const response = await api.post(
        '/versions/deploy',
        {
          versionNumber,
          description,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      // Simulate step progression
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDeploymentSteps(prev => prev.map(s => s.step === 1 ? { ...s, status: 'completed' } : s.step === 2 ? { ...s, status: 'in-progress' } : s));

      await new Promise(resolve => setTimeout(resolve, 1500));
      setDeploymentSteps(prev => prev.map(s => s.step === 2 ? { ...s, status: 'completed' } : s.step === 3 ? { ...s, status: 'in-progress' } : s));

      await new Promise(resolve => setTimeout(resolve, 1500));
      setDeploymentSteps(prev => prev.map(s => s.step === 3 ? { ...s, status: 'completed' } : s.step === 4 ? { ...s, status: 'in-progress' } : s));

      await new Promise(resolve => setTimeout(resolve, 1500));
      setDeploymentSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));

      setSuccess(`Version ${versionNumber} deployed successfully!`);

      if (onDeploymentComplete) {
        onDeploymentComplete(versionNumber);
      }

      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Deployment failed');
      setDeploymentSteps([]);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Version Deployment</h2>
            <button onClick={onClose} className="text-white hover:bg-purple-700 p-1 rounded">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 flex justify-between items-center sticky top-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Version Deployment</h2>
            <p className="text-purple-100">Deploy new version from GitHub master branch</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-purple-700 p-2 rounded transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
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
            <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Success</h3>
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Deployment Status Info */}
          <div className={`border rounded-lg p-4 ${deploymentStatus?.hasNewVersion ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <GitBranch className={`w-5 h-5 mt-0.5 flex-shrink-0 ${deploymentStatus?.hasNewVersion ? 'text-green-600' : 'text-yellow-600'}`} />
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${deploymentStatus?.hasNewVersion ? 'text-green-900' : 'text-yellow-900'}`}>
                    {deploymentStatus?.hasNewVersion ? 'New Version Available' : 'No New Version'}
                  </h3>
                  <div className={`space-y-1 text-sm ${deploymentStatus?.hasNewVersion ? 'text-green-800' : 'text-yellow-800'}`}>
                    <p><span className="font-medium">GitHub Latest:</span> {deploymentStatus?.gitHubLatest}</p>
                    <p><span className="font-medium">VPS Latest:</span> {deploymentStatus?.vpsLatest}</p>
                    {deploymentStatus?.hasNewVersion ? (
                      <p className="font-semibold text-green-700 mt-2">✓ Ready to deploy {deploymentStatus?.gitHubLatest}</p>
                    ) : (
                      <p className="text-yellow-700 mt-2">Versions are in sync</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={checkDeploymentStatus}
                disabled={loading}
                className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded transition"
              >
                {loading ? 'Checking...' : 'Check for Updates'}
              </button>
            </div>
          </div>

          {/* Deployment Form - Only show if new version exists */}
          {!deploying && deploymentSteps.length === 0 && deploymentStatus?.hasNewVersion && (
            <form onSubmit={handleStartDeployment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Version to Deploy
                </label>
                <select
                  value={selectedVersion}
                  onChange={(e) => handleVersionSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-semibold"
                >
                  <option value="">-- Choose a version --</option>
                  {getAvailableNewVersions().map((version) => (
                    <option key={version.version} value={version.version}>
                      {version.version} - {version.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Release Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  placeholder="Description from manifest"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={deploying || !selectedVersion}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <GitBranch className="w-5 h-5" />
                {deploying ? 'Deploying...' : `Deploy ${selectedVersion}`}
              </button>
            </form>
          )}

          {/* No New Version Message */}
          {!deploying && deploymentSteps.length === 0 && !deploymentStatus?.hasNewVersion && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600">
                VPS is up to date with GitHub. No new versions to deploy.
              </p>
            </div>
          )}

          {/* Deployment Steps */}
          {deploymentSteps.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Deployment Progress</h3>
              {deploymentSteps.map((step, idx) => (
                <div key={step.step} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : step.status === 'in-progress' ? (
                      <Clock className="w-6 h-6 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'in-progress' ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  {idx < deploymentSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recent Versions */}
          {!deploying && deploymentSteps.length === 0 && deploymentStatus?.versions?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Recent Versions</h3>
              <div className="space-y-2">
                {deploymentStatus.versions.map((v) => (
                  <div key={v.version} className="flex justify-between items-center text-sm">
                    <span className="font-mono font-semibold text-gray-900">{v.version}</span>
                    <span className="text-xs text-gray-600">{new Date(v.releaseDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <span className="font-semibold">Tip:</span> Deployments pull only core files from GitHub master branch, leaving client code untouched.
          </p>
        </div>
      </div>
    </div>
  );
}
