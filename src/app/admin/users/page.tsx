"use client";

import { useEffect, useState } from "react";
import {
  reqAdminListUsers,
  reqAdminCreateUser,
  reqAdminUpdateUser,
  reqAdminDeleteUser,
} from "@/services/admin.service";
import { User } from "@/types";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";

const ROLE_OPTIONS = ["admin", "editor", "viewer", "pending"] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createFields, setCreateFields] = useState({
    email: "",
    name: "",
    password: "",
    role: "viewer",
  });
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    const res = await reqAdminListUsers();
    if (res.success) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    const res = await reqAdminCreateUser(createFields);
    setCreating(false);

    if (res.success) {
      toast.success("User created");
      setShowCreate(false);
      setCreateFields({ email: "", name: "", password: "", role: "viewer" });
      loadUsers();
    } else {
      toast.error(res.error_message);
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    const res = await reqAdminUpdateUser(user.id, { role: newRole });
    if (res.success) {
      toast.success("Role updated");
      loadUsers();
    } else {
      toast.error(res.error_message);
    }
  };

  const handleToggleActive = async (user: User) => {
    const res = await reqAdminUpdateUser(user.id, { active: !user.active });
    if (res.success) {
      toast.success(user.active ? "User deactivated" : "User activated");
      loadUsers();
    } else {
      toast.error(res.error_message);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Deactivate ${user.email}?`)) return;
    const res = await reqAdminDeleteUser(user.id);
    if (res.success) {
      toast.success("User deactivated");
      loadUsers();
    } else {
      toast.error(res.error_message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Users
        </h1>
        <Button
          variant="dark"
                    onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Cancel" : "Create User"}
        </Button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              placeholder="user@example.com"
              value={createFields.email}
              onChange={(e) =>
                setCreateFields({ ...createFields, email: e.target.value })
              }
              required
            />
            <Input
              label="Name"
              placeholder="Full Name"
              value={createFields.name}
              onChange={(e) =>
                setCreateFields({ ...createFields, name: e.target.value })
              }
              required
            />
            <Input
              label="Password"
              placeholder="Password"
              type="password"
              value={createFields.password}
              onChange={(e) =>
                setCreateFields({ ...createFields, password: e.target.value })
              }
              required
            />
            <div className="w-full flex flex-col gap-1">
              <label className="text-sm leading-none font-medium text-gray-900 dark:text-gray-100">
                Role
              </label>
              <select
                value={createFields.role}
                onChange={(e) =>
                  setCreateFields({ ...createFields, role: e.target.value })
                }
                className="min-w-[200px] mt-1 text-sm block bg-white dark:bg-gray-900 dark:text-gray-100 pl-3 py-1.5 pr-3 rounded-sm outline-1 -outline-offset-1 outline-gray-300 dark:outline-gray-600"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <Button
            variant="dark"
            onClick={handleCreate}
            active={!creating}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-left">
              <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                Email
              </th>
              <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                Auth
              </th>
              <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                Role
              </th>
              <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-gray-200 dark:border-gray-700"
              >
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                  {user.email}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {user.name ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {user.auth_type}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${
                      user.active
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {user.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDelete(user)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
