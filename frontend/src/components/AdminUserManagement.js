import React, { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import adminService from '../services/adminService';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  SearchInput,
  Select,
  Skeleton,
} from '../ui';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmRequest, setConfirmRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUsers({
        page: currentPage,
        limit: 10,
        search: debouncedSearch || undefined,
      });

      if (response && Array.isArray(response.users)) {
        setUsers(response.users);
        setTotalPages(response.totalPages || 1);
        setTotal(response.total || response.users.length);
      } else if (Array.isArray(response)) {
        setUsers(response);
        setTotalPages(1);
        setTotal(response.length);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setSelectedUsers([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch]);

  const toggleUserStatus = async (user) => {
    setActionLoading(true);
    setError('');
    try {
      await adminService.toggleUserStatus(user._id);
      setSuccess(`${user.firstName || 'User'} is now ${user.isActive ? 'deactivated' : 'active'}.`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update the account status.');
    } finally {
      setActionLoading(false);
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmRequest) return;
    setActionLoading(true);
    setError('');
    try {
      if (confirmRequest.type === 'delete') {
        await adminService.deleteUser(confirmRequest.user._id);
        setSuccess('User deleted.');
      } else if (confirmRequest.type === 'bulk') {
        await adminService.bulkUserAction({
          userIds: selectedUsers,
          action: bulkAction,
        });
        setSuccess(`Bulk action “${bulkAction}” applied to ${selectedUsers.length} users.`);
        setSelectedUsers([]);
        setBulkAction('');
      }
      setConfirmRequest(null);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'The action could not be completed.');
    } finally {
      setActionLoading(false);
    }
  };

  const allSelected = users.length > 0 && selectedUsers.length === users.length;

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="Search accounts, review activity status and apply bulk changes."
        actions={
          <Button variant="secondary" icon={ArrowPathIcon} onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <Card>
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <SearchInput
            className="flex-1"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search users"
          />

          {selectedUsers.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value)}
                aria-label="Bulk action"
                className="w-auto"
              >
                <option value="">Select action</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </Select>
              <Button
                size="sm"
                disabled={!bulkAction}
                onClick={() => setConfirmRequest({ type: 'bulk' })}
              >
                Apply to {selectedUsers.length}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="border-t border-ink-100 dark:border-ink-800">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={UserGroupIcon}
              title="No users found"
              description="Try a different search term or clear your filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-950/40 dark:text-ink-400">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) =>
                          setSelectedUsers(event.target.checked ? users.map((user) => user._id) : [])
                        }
                        aria-label="Select all users"
                        className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 dark:border-ink-600 dark:bg-ink-900"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {users.map((user) => {
                    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed user';
                    return (
                      <tr key={user._id} className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                            aria-label={`Select ${name}`}
                            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 dark:border-ink-600 dark:bg-ink-900"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={name} src={user.profilePicture} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink-900 dark:text-white">{name}</p>
                              <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.isActive ? 'success' : 'danger'} dot>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.role === 'admin' ? 'brand' : 'neutral'}>
                            {user.role || 'user'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-500 dark:text-ink-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant={user.isActive ? 'secondary' : 'primary'}
                              icon={user.isActive ? XCircleIcon : CheckCircleIcon}
                              disabled={actionLoading}
                              onClick={() => toggleUserStatus(user)}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            {user.role !== 'admin' ? (
                              <Button
                                size="xs"
                                variant="danger-soft"
                                icon={TrashIcon}
                                disabled={actionLoading}
                                onClick={() => setConfirmRequest({ type: 'delete', user })}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm text-ink-500 dark:border-ink-800 dark:text-ink-400">
          <span>
            {total} {total === 1 ? 'user' : 'users'}
            {selectedUsers.length ? ` · ${selectedUsers.length} selected` : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {confirmRequest ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-user-action"
        >
          <div className="w-full max-w-md rounded-card border border-ink-200 bg-white p-6 shadow-pop dark:border-ink-800 dark:bg-ink-900">
            <h2 id="confirm-user-action" className="text-lg font-semibold text-ink-900 dark:text-white">
              {confirmRequest.type === 'delete' ? 'Delete this user?' : `Apply “${bulkAction}”?`}
            </h2>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
              {confirmRequest.type === 'delete'
                ? 'This permanently removes the account and their data. This cannot be undone.'
                : `This will be applied to ${selectedUsers.length} selected ${selectedUsers.length === 1 ? 'user' : 'users'}.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmRequest(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="danger" loading={actionLoading} onClick={runConfirmedAction}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminUserManagement;
