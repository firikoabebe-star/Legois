"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to home
          </Link>

          <h1 className="text-2xl font-bold mb-2">Create a new workspace</h1>
          <p className="text-muted-foreground">
            Set up a workspace for your team to collaborate and organize content
          </p>
        </div>

        <CreateWorkspaceModal isOpen={isModalOpen} onClose={handleClose} />
      </div>
    </div>
  );
}
