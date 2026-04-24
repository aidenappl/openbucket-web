"use client";

import { useEffect, useState } from "react";
import {
  reqAdminListInstances,
  reqAdminCreateInstance,
  reqAdminUpdateInstance,
  reqAdminDeleteInstance,
  reqProxyListCredentials,
  reqProxyCreateCredential,
  reqProxyDeleteCredential,
  reqProxyListBuckets,
  reqProxyGetBucketStats,
  reqProxyCreateBucket,
  reqProxyDeleteBucket,
  reqProxyUpdateBucketACL,
  reqProxyCreateGrant,
  reqProxyDeleteGrant,
  Instance,
  InstanceCredential,
  InstanceBucket,
  InstanceBucketStats,
} from "@/services/admin.service";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";
import { formatBytes } from "@/tools/formatBytes.tools";

type ExpandedView = "credentials" | "buckets" | null;

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createFields, setCreateFields] = useState({
    name: "",
    endpoint: "",
    admin_token: "",
  });
  const [creating, setCreating] = useState(false);

  // Expanded instance state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedView, setExpandedView] = useState<ExpandedView>(null);
  const [credentials, setCredentials] = useState<InstanceCredential[]>([]);
  const [buckets, setBuckets] = useState<InstanceBucket[]>([]);
  const [bucketStats, setBucketStats] = useState<
    Record<string, InstanceBucketStats>
  >({});
  const [subLoading, setSubLoading] = useState(false);

  // Create credential
  const [newCredName, setNewCredName] = useState("");

  // Create bucket
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketOwner, setNewBucketOwner] = useState("");

  // Grant
  const [grantBucket, setGrantBucket] = useState<string | null>(null);
  const [grantKeyId, setGrantKeyId] = useState("");
  const [grantPermission, setGrantPermission] = useState("READ");

  const loadInstances = async () => {
    const res = await reqAdminListInstances();
    if (res.success) setInstances(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    const res = await reqAdminCreateInstance(createFields);
    setCreating(false);
    if (res.success) {
      toast.success("Instance created");
      setShowCreate(false);
      setCreateFields({ name: "", endpoint: "", admin_token: "" });
      loadInstances();
    } else {
      toast.error(res.error_message);
    }
  };

  const handleDelete = async (inst: Instance) => {
    if (!confirm(`Delete instance "${inst.name}"?`)) return;
    const res = await reqAdminDeleteInstance(inst.id);
    if (res.success) {
      toast.success("Instance deleted");
      if (expandedId === inst.id) {
        setExpandedId(null);
        setExpandedView(null);
      }
      loadInstances();
    } else {
      toast.error(res.error_message);
    }
  };

  const handleToggleActive = async (inst: Instance) => {
    const res = await reqAdminUpdateInstance(inst.id, {
      active: !inst.active,
    });
    if (res.success) {
      toast.success(inst.active ? "Instance deactivated" : "Instance activated");
      loadInstances();
    } else {
      toast.error(res.error_message);
    }
  };

  // ── Expand into instance detail ────────────────────────────────────────

  const expandCredentials = async (inst: Instance) => {
    if (expandedId === inst.id && expandedView === "credentials") {
      setExpandedId(null);
      setExpandedView(null);
      return;
    }
    setExpandedId(inst.id);
    setExpandedView("credentials");
    setSubLoading(true);
    const res = await reqProxyListCredentials(inst.id);
    if (res.success) setCredentials(res.data);
    else toast.error("Failed to load credentials");
    setSubLoading(false);
  };

  const expandBuckets = async (inst: Instance) => {
    if (expandedId === inst.id && expandedView === "buckets") {
      setExpandedId(null);
      setExpandedView(null);
      return;
    }
    setExpandedId(inst.id);
    setExpandedView("buckets");
    setSubLoading(true);
    const res = await reqProxyListBuckets(inst.id);
    if (res.success) {
      setBuckets(res.data);
      // Load stats for each bucket
      const statsMap: Record<string, InstanceBucketStats> = {};
      await Promise.all(
        res.data.map(async (b) => {
          const statsRes = await reqProxyGetBucketStats(inst.id, b.name);
          if (statsRes.success) statsMap[b.name] = statsRes.data;
        })
      );
      setBucketStats(statsMap);
    } else {
      toast.error("Failed to load buckets");
    }
    setSubLoading(false);
  };

  const handleCreateCredential = async () => {
    if (!expandedId || !newCredName) return;
    const res = await reqProxyCreateCredential(expandedId, newCredName);
    if (res.success) {
      toast.success("Credential created");
      setNewCredName("");
      // Show the secret key
      if (res.data.secret_key) {
        toast.success(`Secret Key: ${res.data.secret_key}`, {
          duration: 15000,
        });
      }
      const refreshRes = await reqProxyListCredentials(expandedId);
      if (refreshRes.success) setCredentials(refreshRes.data);
    } else {
      toast.error(res.error_message);
    }
  };

  const handleDeleteCredential = async (credId: number) => {
    if (!expandedId || !confirm("Delete this credential?")) return;
    const res = await reqProxyDeleteCredential(expandedId, credId);
    if (res.success) {
      toast.success("Credential deleted");
      const refreshRes = await reqProxyListCredentials(expandedId);
      if (refreshRes.success) setCredentials(refreshRes.data);
    } else {
      toast.error(res.error_message);
    }
  };

  const handleCreateBucket = async () => {
    if (!expandedId || !newBucketName || !newBucketOwner) return;
    const res = await reqProxyCreateBucket(
      expandedId,
      newBucketName,
      newBucketOwner
    );
    if (res.success) {
      toast.success("Bucket created");
      setNewBucketName("");
      setNewBucketOwner("");
      expandBuckets(instances.find((i) => i.id === expandedId)!);
    } else {
      toast.error(res.error_message);
    }
  };

  const handleDeleteBucket = async (bucketName: string) => {
    if (
      !expandedId ||
      !confirm(`Delete bucket "${bucketName}" and ALL its data?`)
    )
      return;
    const res = await reqProxyDeleteBucket(expandedId, bucketName);
    if (res.success) {
      toast.success("Bucket deleted");
      expandBuckets(instances.find((i) => i.id === expandedId)!);
    } else {
      toast.error(res.error_message);
    }
  };

  const handleUpdateACL = async (bucketName: string, acl: string) => {
    if (!expandedId) return;
    const res = await reqProxyUpdateBucketACL(expandedId, bucketName, acl);
    if (res.success) {
      toast.success("ACL updated");
      expandBuckets(instances.find((i) => i.id === expandedId)!);
    } else {
      toast.error(res.error_message);
    }
  };

  const handleCreateGrant = async () => {
    if (!expandedId || !grantBucket || !grantKeyId) return;
    const res = await reqProxyCreateGrant(
      expandedId,
      grantBucket,
      grantKeyId,
      grantPermission
    );
    if (res.success) {
      toast.success("Grant created");
      setGrantBucket(null);
      setGrantKeyId("");
      setGrantPermission("READ");
      expandBuckets(instances.find((i) => i.id === expandedId)!);
    } else {
      toast.error(res.error_message);
    }
  };

  const handleDeleteGrant = async (bucketName: string, grantId: number) => {
    if (!expandedId || !confirm("Remove this grant?")) return;
    const res = await reqProxyDeleteGrant(expandedId, bucketName, grantId);
    if (res.success) {
      toast.success("Grant removed");
      expandBuckets(instances.find((i) => i.id === expandedId)!);
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
          Instances
        </h1>
        <Button
          variant="dark"
                    onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Cancel" : "Add Instance"}
        </Button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Name"
              value={createFields.name}
              onChange={(e) =>
                setCreateFields({ ...createFields, name: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
            />
            <input
              placeholder="Endpoint (https://...)"
              value={createFields.endpoint}
              onChange={(e) =>
                setCreateFields({ ...createFields, endpoint: e.target.value })
              }
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
            />
            <input
              placeholder="Admin Token"
              type="password"
              value={createFields.admin_token}
              onChange={(e) =>
                setCreateFields({
                  ...createFields,
                  admin_token: e.target.value,
                })
              }
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <Button
            variant="dark"
                        onClick={handleCreate}
            active={!creating}
          >
            Create
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {instances.map((inst) => (
          <div
            key={inst.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden"
          >
            {/* Instance header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    inst.active ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {inst.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {inst.endpoint}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => expandCredentials(inst)}
                  className={`text-xs px-3 py-1 rounded-md border cursor-pointer transition-colors ${
                    expandedId === inst.id && expandedView === "credentials"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Credentials
                </button>
                <button
                  onClick={() => expandBuckets(inst)}
                  className={`text-xs px-3 py-1 rounded-md border cursor-pointer transition-colors ${
                    expandedId === inst.id && expandedView === "buckets"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Buckets
                </button>
                <button
                  onClick={() => handleToggleActive(inst)}
                  className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${
                    inst.active
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  {inst.active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleDelete(inst)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Expanded credentials view */}
            {expandedId === inst.id && expandedView === "credentials" && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                {subLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <input
                        placeholder="Credential name"
                        value={newCredName}
                        onChange={(e) => setNewCredName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      />
                      <Button
                        variant="dark"
                                                onClick={handleCreateCredential}
                      >
                        Generate
                      </Button>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400">
                          <th className="pb-1 font-medium">Name</th>
                          <th className="pb-1 font-medium">Key ID</th>
                          <th className="pb-1 font-medium">Created</th>
                          <th className="pb-1 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {credentials.map((c) => (
                          <tr
                            key={c.id}
                            className="border-t border-gray-100 dark:border-gray-700"
                          >
                            <td className="py-1.5 text-gray-900 dark:text-gray-100">
                              {c.name}
                            </td>
                            <td className="py-1.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                              {c.key_id}
                            </td>
                            <td className="py-1.5 text-gray-500 dark:text-gray-400">
                              {new Date(c.date_created).toLocaleDateString()}
                            </td>
                            <td className="py-1.5 text-right">
                              <button
                                onClick={() => handleDeleteCredential(c.id)}
                                className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {credentials.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-4 text-center text-gray-400"
                            >
                              No credentials
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {/* Expanded buckets view */}
            {expandedId === inst.id && expandedView === "buckets" && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                {subLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <input
                        placeholder="Bucket name"
                        value={newBucketName}
                        onChange={(e) => setNewBucketName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      />
                      <input
                        placeholder="Owner Key ID"
                        value={newBucketOwner}
                        onChange={(e) => setNewBucketOwner(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      />
                      <Button
                        variant="dark"
                                                onClick={handleCreateBucket}
                      >
                        Create
                      </Button>
                    </div>

                    {buckets.map((b) => (
                      <div
                        key={b.id}
                        className="mb-3 p-3 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {b.name}
                            </span>
                            {bucketStats[b.name] && (
                              <span className="ml-2 text-xs text-gray-500">
                                {bucketStats[b.name].object_count} objects,{" "}
                                {formatBytes(bucketStats[b.name].total_size)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={b.acl}
                              onChange={(e) =>
                                handleUpdateACL(b.name, e.target.value)
                              }
                              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="PRIVATE">PRIVATE</option>
                              <option value="PUBLIC_READ">PUBLIC_READ</option>
                              <option value="PUBLIC_READ_WRITE">
                                PUBLIC_READ_WRITE
                              </option>
                              <option value="PUBLIC_WRITE">PUBLIC_WRITE</option>
                            </select>
                            <button
                              onClick={() => handleDeleteBucket(b.name)}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Grants */}
                        <div className="text-xs">
                          <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Grants
                          </p>
                          {b.grants && b.grants.length > 0 ? (
                            <div className="space-y-1">
                              {b.grants.map((g) => (
                                <div
                                  key={g.id}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {g.display_name}{" "}
                                    <span className="text-gray-400">
                                      ({g.key_id})
                                    </span>{" "}
                                    — {g.permission}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleDeleteGrant(b.name, g.id)
                                    }
                                    className="text-red-500 hover:underline cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400">No grants</p>
                          )}

                          {/* Add grant */}
                          {grantBucket === b.name ? (
                            <div className="flex gap-2 mt-2">
                              <input
                                placeholder="Key ID"
                                value={grantKeyId}
                                onChange={(e) => setGrantKeyId(e.target.value)}
                                className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                              <select
                                value={grantPermission}
                                onChange={(e) =>
                                  setGrantPermission(e.target.value)
                                }
                                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              >
                                <option value="READ">READ</option>
                                <option value="WRITE">WRITE</option>
                                <option value="FULL_CONTROL">
                                  FULL_CONTROL
                                </option>
                                <option value="READ_ACP">READ_ACP</option>
                                <option value="WRITE_ACP">WRITE_ACP</option>
                              </select>
                              <button
                                onClick={handleCreateGrant}
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => setGrantBucket(null)}
                                className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setGrantBucket(b.name)}
                              className="mt-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              + Add Grant
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {buckets.length === 0 && (
                      <p className="text-center text-gray-400 py-4">
                        No buckets
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {instances.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            No instances registered. Click &quot;Add Instance&quot; to connect
            an openbucket-go server.
          </p>
        )}
      </div>
    </div>
  );
}
