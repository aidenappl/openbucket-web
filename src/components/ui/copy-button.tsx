"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "./button";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  "aria-label"?: string;
}

/** Copies `text` and confirms in place for two seconds; a denied clipboard says so. */
export function CopyButton({
  text,
  label = "Copy",
  className,
  "aria-label": ariaLabel,
}: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      className={className}
      aria-label={ariaLabel}
    >
      {state === "failed" ? (
        <span className="text-destructive">Copy failed</span>
      ) : (
        <>
          <FontAwesomeIcon
            icon={state === "copied" ? faCheck : faCopy}
            className="mr-1.5 h-3 w-3"
          />
          {state === "copied" ? "Copied" : label}
        </>
      )}
    </Button>
  );
}
