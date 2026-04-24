"use client";

import { useEffect, useState } from "react";
import { reqAdminListUsers } from "@/services/admin.service";
import { reqAdminListInstances, Instance } from "@/services/admin.service";
import { User } from "@/types";
import Spinner from "@/components/Spinner";

export default function AdminOverview() {
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [userRes, instanceRes] = await Promise.all([
        reqAdminListUsers(),
        reqAdminListInstances(),
      ]);
      if (userRes.success) setUsers(userRes.data ?? []);
      if (instanceRes.success) setInstances(instanceRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const stats = [
    { label: "Total Users", value: users.length },
    { label: "Active Users", value: users.filter((u) => u.active).length },
    {
      label: "Pending Approval",
      value: users.filter((u) => u.role === "pending").length,
    },
    { label: "Instances", value: instances.length },
    {
      label: "Active Instances",
      value: instances.filter((i) => i.active).length,
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Admin Overview
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
