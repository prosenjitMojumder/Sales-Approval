
import React, { useState, useEffect } from 'react';
import { User, Role, RoleLabels } from '../types';
import * as StorageService from '../services/storageService';

interface Props {
  onLabelsUpdate: () => void;
}

const AdminPanel: React.FC<Props> = ({ onLabelsUpdate }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  
  // User Edit State
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});

  // Role Edit State
  const [roleLabels, setRoleLabels] = useState<RoleLabels | null>(null);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = () => {
    setUsers(StorageService.getUsers());
  };

  const loadRoles = () => {
    setRoleLabels(StorageService.getRoleLabels());
  };

  // --- USER HANDLERS ---

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsEditingUser(true);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      StorageService.deleteUser(id);
      loadUsers();
    }
  };

  const handleAddNewUser = () => {
    setCurrentUser({
        role: Role.SALESPERSON, // default
        name: '',
        username: '',
        password: ''
    });
    setIsEditingUser(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.name || !currentUser.username || !currentUser.password || !currentUser.role) {
        alert("All fields are required");
        return;
    }

    const userToSave: User = {
        id: currentUser.id || crypto.randomUUID(),
        name: currentUser.name,
        username: currentUser.username,
        password: currentUser.password,
        role: currentUser.role
    };

    StorageService.saveUser(userToSave);
    loadUsers();
    setIsEditingUser(false);
  };

  // --- ROLE HANDLERS ---
  const handleRoleChange = (roleKey: Role, newValue: string) => {
    if (!roleLabels) return;
    setRoleLabels({ ...roleLabels, [roleKey]: newValue });
  };

  const handleSaveRoles = () => {
      if (roleLabels) {
          StorageService.saveRoleLabels(roleLabels);
          onLabelsUpdate(); // Notify parent to refresh
          alert("Role names updated successfully!");
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-gray-800">System Administration</h2>
            <p className="text-sm text-gray-500">Manage users and configuration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <i className="fas fa-users mr-2"></i> User Management
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'roles' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <i className="fas fa-tags mr-2"></i> Role Settings
          </button>
      </div>

      {activeTab === 'users' && (
        <>
            {!isEditingUser ? (
                <div>
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={handleAddNewUser}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-user-plus"></i> Add User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Username</th>
                                    <th className="px-4 py-3">Assigned Role</th>
                                    <th className="px-4 py-3">Password</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{user.username}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {roleLabels ? roleLabels[user.role] : user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{user.password}</td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800 p-1">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 p-1">
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="max-w-lg mx-auto bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">{currentUser.id ? 'Edit User' : 'Add New User'}</h3>
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentUser.name || ''}
                                onChange={e => setCurrentUser({...currentUser, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={currentUser.username || ''}
                                    onChange={e => setCurrentUser({...currentUser, username: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={currentUser.password || ''}
                                    onChange={e => setCurrentUser({...currentUser, password: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentUser.role}
                                onChange={e => setCurrentUser({...currentUser, role: e.target.value as Role})}
                            >
                                {Object.values(Role).map(role => (
                                    <option key={role} value={role}>
                                        {roleLabels ? roleLabels[role] : role}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setIsEditingUser(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Save User
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
      )}

      {activeTab === 'roles' && roleLabels && (
        <div className="max-w-2xl">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6 text-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Changing role names will update the display name across the entire application. 
                Permissions and internal logic will remain unchanged.
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    {Object.values(Role).map((roleKey) => (
                        <div key={roleKey} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                System ID: {roleKey}
                             </label>
                             <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-600 mb-1">Display Name</label>
                                    <input 
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={roleLabels[roleKey]}
                                        onChange={(e) => handleRoleChange(roleKey, e.target.value)}
                                    />
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-end">
                    <button 
                        onClick={handleSaveRoles}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-save"></i> Save Role Changes
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
