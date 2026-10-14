"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";
import {
  reqAdminCreateUser,
  reqAdminListUsers,
  reqAdminUpdateUser,
} from "@/services/admin.service";
import { User, UserRole } from "@/types";
import { useAuthContext } from "@/context/AuthContext";
import { useSort } from "@/hooks/useSort";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import {
  EmptyState,
  SortableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Menu } from "@/components/ui/menu";
import Spinner from "@/components/Spinner";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "pending", label: "Pending" },
];

type Filter = "all" | "active" | "inactive" | "pending";

export default function UsersPage() {
  const { user: me } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "viewer",
  });
  const [formTouched, setFormTouched] = useState(false);
  const [confirm, setConfirm] = useState<{
    user: User;
    change: { role?: string; active?: boolean };
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    const res = await reqAdminListUsers();
    if (res.success) setUsers(res.data ?? []);
    else toast.error(res.error_message || "Failed to load users");
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((u) => u.active).length,
      inactive: users.filter((u) => !u.active).length,
      pending: users.filter((u) => u.role === "pending").length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "active" && !u.active) return false;
      if (filter === "inactive" && u.active) return false;
      if (filter === "pending" && u.role !== "pending") return false;
      return (
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  const [sorted, sort] = useSort<User, "email" | "name" | "role" | "created">(
    filtered,
    {
      email: (u) => u.email,
      name: (u) => u.name,
      role: (u) => u.role,
      created: (u) => u.inserted_at,
    },
    { key: "email", dir: "asc" },
  );

  const formErrors = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ? undefined
      : "Enter a valid email",
    password:
      form.password.length >= 8 && form.password.length <= 128
        ? undefined
        : "8–128 characters",
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormTouched(true);
    if (formErrors.email || formErrors.password) return;
    setCreating(true);
    const res = await reqAdminCreateUser({
      ...form,
      email: form.email.trim(),
      name: form.name.trim(),
    });
    setCreating(false);
    if (!res.success) {
      toast.error(res.error_message || "Failed to create user");
      return;
    }
    toast.success(`Created ${form.email.trim()}`);
    setCreateOpen(false);
    setForm({ email: "", name: "", password: "", role: "viewer" });
    setFormTouched(false);
    loadUsers();
  };

  const applyChange = async (
    user: User,
    change: { role?: string; active?: boolean },
  ) => {
    setSaving(true);
    const res = await reqAdminUpdateUser(user.id, change);
    setSaving(false);
    setConfirm(null);
    if (!res.success) {
      toast.error(res.error_message || "Update failed");
      return;
    }
    toast.success(
      change.active === false
        ? `${user.email} deactivated`
        : change.active === true
          ? `${user.email} reactivated`
          : `${user.email} is now ${change.role}`,
    );
    loadUsers();
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
      <PageHeader
        title="Users"
        description="Everyone who can sign in to OpenBucket, local or SSO."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
            Create user
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Filter users"
          className="flex flex-wrap gap-1.5"
        >
          {(["all", "active", "inactive", "pending"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "h-8 rounded-lg bg-surface-elevated px-3 text-xs font-medium text-primary cursor-pointer"
                  : "h-8 rounded-lg border border-border-strong px-3 text-xs font-medium text-secondary hover:text-primary cursor-pointer"
              }
            >
              {f[0].toUpperCase() + f.slice(1)}{" "}
              <span className="text-muted">{counts[f]}</span>
            </button>
          ))}
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search email or name…"
          className="ml-auto w-full sm:w-64"
        />
      </div>

      <Table>
        <TableHeader>
          <tr>
            <SortableHead column="email" sort={sort}>
              Email
            </SortableHead>
            <SortableHead
              column="name"
              sort={sort}
              className="hidden md:table-cell"
            >
              Name
            </SortableHead>
            <TableHead className="hidden sm:table-cell">Auth</TableHead>
            <SortableHead column="role" sort={sort}>
              Role
            </SortableHead>
            <TableHead>Status</TableHead>
            <SortableHead
              column="created"
              sort={sort}
              className="hidden lg:table-cell"
            >
              Created
            </SortableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <EmptyState
              message={users.length === 0 ? "No users yet." : "No users match."}
            />
          ) : (
            sorted.map((u) => {
              const isMe = u.id === me?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell className="max-w-[16rem] truncate">
                    {u.email}
                    {isMe && (
                      <span className="ml-2 text-xs text-muted">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-secondary">
                    {u.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-secondary">
                      {u.auth_type === "sso" ? "SSO" : "Local"}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <select
                      value={u.role}
                      disabled={isMe}
                      title={
                        isMe ? "You can't change your own role" : undefined
                      }
                      aria-label={`Role for ${u.email}`}
                      onChange={(e) =>
                        setConfirm({
                          user: u,
                          change: { role: e.target.value },
                        })
                      }
                      className="h-8 rounded-lg border border-border-strong bg-surface-elevated px-2 text-xs text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.active ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-secondary">
                    {new Date(u.inserted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Menu
                      label={`Actions for ${u.email}`}
                      items={[
                        u.active
                          ? {
                              label: "Deactivate",
                              destructive: true,
                              disabled: isMe,
                              onSelect: () =>
                                setConfirm({
                                  user: u,
                                  change: { active: false },
                                }),
                            }
                          : {
                              label: "Reactivate",
                              onSelect: () => applyChange(u, { active: true }),
                            },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <p className="mt-3 text-xs text-muted">
        Deactivating signs the user out everywhere and blocks sign-in. It can be
        undone; accounts are never hard-deleted.
      </p>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create local user"
        description="For people who sign in with email and password. SSO users are created on first sign-in."
        widthClass="max-w-md"
      >
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4"
          autoComplete="off"
        >
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={formTouched ? formErrors.email : undefined}
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={formTouched ? formErrors.password : undefined}
            hint="8–128 characters"
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={ROLE_OPTIONS.filter((r) => r.value !== "pending")}
          />
          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create user
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.change.active === false
            ? `Deactivate ${confirm.user.email}?`
            : `Make ${confirm?.user.email} ${confirm?.change.role}?`
        }
        description={
          confirm?.change.active === false
            ? "They're signed out immediately and can't sign in again until reactivated."
            : confirm?.change.role === "admin"
              ? "Admins can manage users, instances, credentials, buckets and SSO."
              : confirm?.change.role === "pending"
                ? "Pending users can sign in but see nothing until approved."
                : "Takes effect on their next request."
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirm(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirm?.change.active === false ? "destructive" : "primary"
              }
              loading={saving}
              onClick={() =>
                confirm && applyChange(confirm.user, confirm.change)
              }
            >
              {confirm?.change.active === false ? "Deactivate" : "Change role"}
            </Button>
          </>
        }
      />
    </div>
  );
}
