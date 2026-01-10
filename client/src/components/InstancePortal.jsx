import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import SetupPassword from './SetupPassword';
import api from '../services/api';

export default function InstancePortal() {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [setupData, setSetupData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, get the instance ID from subdomain
      const response = await api.get(`/instances?subdomain=${subdomain}`);
      const instance = response.data[0];

      if (!instance) {
        throw new Error('Instance not found');
      }

      // Try to login
      const loginResponse = await api.post(`/instances/${instance.id}/users/login`, {
        instanceId: instance.id,
        email,
        password: password || undefined, // Password not required if needs setup
      });

      // Check if password setup is required
      if (loginResponse.data.requiresPasswordSetup) {
        setSetupData({
          userId: loginResponse.data.userId,
          instanceId: loginResponse.data.instanceId,
          email: loginResponse.data.email,
        });
        setSetupMode(true);
        return;
      }

      // Normal login successful
      localStorage.setItem('instanceToken', loginResponse.data.token);
      localStorage.setItem('instanceUser', JSON.stringify(loginResponse.data.user));
      localStorage.setItem('currentInstance', JSON.stringify(instance));

      navigate(`/instance/${subdomain}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = async (newPassword) => {
    // Auto-login with new password
    setPassword(newPassword);
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 1000);
  };

  if (setupMode && setupData) {
    return (
      <SetupPassword
        subdomain={subdomain}
        userId={setupData.userId}
        instanceId={setupData.instanceId}
        email={setupData.email}
        onSetupComplete={handleSetupComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white mb-8 hover:text-blue-100 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Admin
        </button>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
            <div className="flex items-center justify-center mb-3">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Instance Access</h1>
            <p className="text-blue-100 text-center text-sm mt-2">{subdomain}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password (leave blank if first time)"
              />
              <p className="text-xs text-gray-600 mt-1">If this is your first time, password can be left blank</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Access Instance'}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              First time accessing this instance?{' '}
              <span className="text-blue-600 font-medium">Enter your email and set a password</span>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-white text-sm">
          <p>Instance ID: <span className="font-mono">{subdomain}</span></p>
        </div>
      </div>
    </div>
  );
}
