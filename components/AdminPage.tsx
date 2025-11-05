import React from 'react';
import { AppUser, UserStatus } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface AdminPageProps {
  users: AppUser[];
  currentUser: AppUser;
  onUpdateUserStatus: (uid: string, status: UserStatus) => void;
}

const statusColors: Record<UserStatus, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  approved: 'bg-green-900 text-green-300',
  rejected: 'bg-red-900 text-red-300',
};

const AdminPage: React.FC<AdminPageProps> = ({ users, currentUser, onUpdateUserStatus }) => {
  const handleStatusChange = (uid: string, newStatus: UserStatus) => {
    onUpdateUserStatus(uid, newStatus);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <ShieldCheckIcon className="h-6 w-6 mr-3 text-cyan-400" />
          User Management
        </h3>
        <p className="text-sm text-gray-400 mt-1">Manage user roles and access permissions.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${user.role === 'admin' ? 'bg-cyan-800 text-cyan-200' : 'bg-gray-600 text-gray-200'}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.uid !== currentUser.uid ? (
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.uid, e.target.value as UserStatus)}
                      className="bg-gray-700 border-gray-600 rounded-md px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <span className="text-xs text-gray-500">Cannot change own status</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-gray-400 text-center p-6">No users found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminPage;