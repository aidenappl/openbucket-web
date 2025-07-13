"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Bucket = () => {
  const router = useRouter();
  const { hasBucket } = usePermissions();
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hasBucket === true) {
      router.replace("/");
    }
  }, [hasBucket, router]);

  if (hasBucket === null) return <p>Loading...</p>; // Show loading state while checking permissions
  if (hasBucket === true) return null; // Redirecting, no need to render anything
  return (
    <div className="pb-10">
      <div className="bg-white p-4 rounded-md shadow-sm">
        <div className="flex flex-col gap-3 w-1/3">
          <h1 className="text-lg font-semibold">Add Bucket</h1>
          <Input
            placeholder="Enter bucket name"
            value={fields["bucket"] || ""}
            label="Bucket Name"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                bucket: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter bucket nickname"
            value={fields["nickname"] || ""}
            label="Bucket Nickname"
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                nickname: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter region"
            value={fields["region"] || ""}
            label="Region"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                region: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter endpoint"
            value={fields["endpoint"] || ""}
            label="Endpoint"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                endpoint: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter access key ID"
            value={fields["accessKeyId"] || ""}
            label="Access Key ID"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                accessKeyId: e.target.value,
              }));
            }}
          />
          <Input
            placeholder="Enter secret access key"
            value={fields["secretAccessKey"] || ""}
            label="Secret Access Key"
            required
            onChange={(e) => {
              setFields((prev) => ({
                ...prev,
                secretAccessKey: e.target.value,
              }));
            }}
          />
          <Button>Submit</Button>
        </div>
      </div>
    </div>
  );
};

export default Bucket;
