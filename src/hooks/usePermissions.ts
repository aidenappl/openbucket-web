// src/hooks/usePermissions.ts
"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export function usePermissions() {
  const [hasBucket, setHasBucket] = useState<boolean | null>(null);
  const [hasAPI, setHasAPI] = useState<boolean | null>(null);

  useEffect(() => {
    const role = Cookies.get("bucket");
    const AWS_ACCESS_KEY_ID = Cookies.get("AWS_ACCESS_KEY_ID");
    const AWS_SECRET_ACCESS_KEY = Cookies.get("AWS_SECRET_ACCESS_KEY");
    const REGION = Cookies.get("REGION");
    const BUCKET_NAME = Cookies.get("BUCKET_NAME");
    const ENDPOINT = Cookies.get("ENDPOINT");
    const isValid = role != null && AWS_ACCESS_KEY_ID != null && AWS_SECRET_ACCESS_KEY != null && REGION != null && BUCKET_NAME != null && ENDPOINT != null ;
    setHasAPI(isValid);
    setHasBucket(role != null);
  }, []);

  return { hasBucket, hasAPI };
}
