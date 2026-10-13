"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActions({
  content,
  filename,
}: {
  content: string;
  filename: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
        Export .md
      </Button>
    </div>
  );
}
