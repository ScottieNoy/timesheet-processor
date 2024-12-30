'use client';

import { useState } from 'react';
import { User } from '@/types/auth';

interface UserManagementProps {
  user: User;
  onLogout: () => void;
}

export default function UserManagement({ user, onLogout }: UserManagementProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Add user form state
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch('/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'updateUser',
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setShowUpdateForm(false);
        window.location.reload(); // Refresh to update UI with new user data
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch('/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'addUser',
          username: addUsername,
          password: addPassword,
          adminPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User added successfully');
        setShowAddUserForm(false);
        setAddUsername('');
        setAddPassword('');
        setAdminPassword('');
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (error) {
      setError('An error occurred while adding user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome, {user.username}</span>
          <button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            className="text-blue-600 hover:text-blue-800"
            disabled={isLoading}
          >
            Update Profile
          </button>
          {user.isAdmin && (
            <button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className="text-green-600 hover:text-green-800"
              disabled={isLoading}
            >
              Add User
            </button>
          )}
        </div>
        <button
          onClick={onLogout}
          className="text-red-600 hover:text-red-800"
          disabled={isLoading}
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      {showUpdateForm && (
        <form onSubmit={handleUpdateUser} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Username (optional)
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password (optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      )}

      {showAddUserForm && (
        <form onSubmit={handleAddUser} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Username
            </label>
            <input
              type="text"
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Admin Password
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Adding User...' : 'Add User'}
          </button>
        </form>
      )}
    </div>
  );
}
