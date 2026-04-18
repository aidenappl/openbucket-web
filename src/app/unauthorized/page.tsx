"use client";

import Image from "next/image";
import { UnauthorizedPage } from "forta-js/react";

export default function Page() {
  return (
    <UnauthorizedPage
      serviceName="OpenBucket"
      logo={
        <Image
          src="/OpemBucket-Logo-Transparent-Dark.svg"
          alt="OpenBucket"
          width={40}
          height={40}
          className="dark:invert"
        />
      }
    />
  );
}
