import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Users, Settings, FileText, Plus, Trash2, Copy, X } from 'lucide-react';
import api from '../services/api';

export default function InstanceDashboard() {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('editor');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPasswordData, setTempPasswordData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedInstance = JSON.parse(localStorage.getItem('currentInstance'));
        const storedUser = JSON.parse(localStorage.getItem('instanceUser'));
        setInstance(storedInstance);
        setUser(storedUser);

        if (storedInstance) {
          const response = await api.get(`/instances/${storedInstance.id}/users`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('instanceToken')}`,
            },
          });
          setUsers(response.data);
        }
      } catch (err) {
        console.error('Failed to load instance data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subdomain]);

  const handleLogout = () => {
    localStorage.removeItem('instanceToken');
    localStorage.removeItem('instanceUser');
    localStorage.removeItem('currentInstance');
    navigate('/');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/instances/${instance.id}/users`,
        { email: newUserEmail, role: newUserRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('instanceToken')}`,
          },
        }
      );

      setUsers([...users, response.data]);
      setNewUserEmail('');
      setNewUserRole('editor');
      setShowAddUser(false);
      
      // Show temporary password in modal
      if (response.data.tempPassword) {
        setTempPasswordData({
          email: newUserEmail,
          password: response.data.tempPassword,
        });
        setShowTempPassword(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add user');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleRemoveUser = async (userId) => {
    if (confirm('Remove this user from the instance?')) {
      try {
        await api.delete(`/instances/${instance.id}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('instanceToken')}`,
          },
        });
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to remove user');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Temp Password Modal */}
      {showTempPassword && tempPasswordData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">User Added Successfully!</h3>
              <button
                onClick={() => setShowTempPassword(false)}
                className="text-white hover:bg-green-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-700 mb-4">
                New user <span className="font-semibold">{tempPasswordData.email}</span> has been created.
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Share this temporary password with the user. They will set their own password on first login.
              </p>
              
              <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 mb-4">
                <p className="text-xs text-gray-600 mb-2">Temporary Password:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono bg-white p-2 rounded border border-gray-300">
                    {tempPasswordData.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(tempPasswordData.password)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition"
                    title="Copy password"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowTempPassword(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instance Dashboard</h1>
            <p className="text-gray-600 text-sm">{subdomain}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.email}</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{instance?.status}</p>
              </div>
              <Settings className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Environment</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{instance?.environment}</p>
              </div>
              <FileText className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
              <p className="text-gray-600 text-sm">Manage users and permissions</p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            )}
          </div>

          {/* Add User Form */}
          {showAddUser && user?.role === 'admin' && (
            <div className="border-b border-gray-200 p-6 bg-gray-50">
              <form onSubmit={handleAddUser} className="flex gap-4">
                <input
                  type="email"
                  placeholder="Email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                        u.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {user?.role === 'admin' && u.id !== user.id && (
                        <button
                          onClick={() => handleRemoveUser(u.id)}
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-6 text-center text-gray-600">
              No team members yet. Add your first team member above.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
