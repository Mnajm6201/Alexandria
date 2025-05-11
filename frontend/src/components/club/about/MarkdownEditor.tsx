"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useJWToken } from "@/utils/getJWToken";

// Dynamically import the markdown editor to avoid the SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  clubId: string;
  clubData: any;
  initialContent: string;
  onSave: () => void;
  onCancel: () => void;
}

export function MarkdownEditor({
  clubId,
  initialContent,
  clubData,
  onSave,
  onCancel,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { jwtToken, fetchJWToken } = useJWToken();

  const handleSave = async () => {
    try {
      setError(null);
      setIsSaving(true);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsSaving(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/update/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: clubData.name,
            club_desc: clubData.club_desc,
            is_private: clubData.is_private,
            about_content: content,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to update club information";
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          console.error("Could not parse error response");
        }
        throw new Error(errorMessage);
      }

      onSave();
    } catch (error) {
      console.error("Error saving content:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save content"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-100 text-red-700">{error}</div>
      )}

      <div className="wmde-markdown-var" data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(value) => setContent(value || "")}
          preview="edit"
          height={400}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="border-amber-300 text-amber-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-800 text-amber-50 hover:bg-amber-700"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
