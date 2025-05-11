"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useJWToken } from "@/utils/getJWToken";

interface NewDiscussionModalProps {
  clubId: string;
  isOpen: boolean;
  onClose: () => void;
  onDiscussionCreated: () => void;
}

export function NewDiscussionModal({
  clubId,
  isOpen,
  onClose,
  onDiscussionCreated,
}: NewDiscussionModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { jwtToken, fetchJWToken } = useJWToken();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/posts/create/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create discussion");
      }

      // Success
      setTitle("");
      setContent("");
      onDiscussionCreated();
      onClose();
    } catch (err) {
      console.error("Error creating discussion:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create discussion"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-amber-50 p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-amber-700 hover:text-amber-900"
          disabled={isSubmitting}
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-6 text-2xl font-serif font-bold text-amber-900">
          New Discussion
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="discussion-title" className="text-amber-800">
              Title *
            </Label>
            <Input
              id="discussion-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-amber-300 bg-white focus-visible:ring-amber-600"
              placeholder="Enter a title for your discussion"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="discussion-content" className="text-amber-800">
              Content
            </Label>
            <Textarea
              id="discussion-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-amber-300 bg-white focus-visible:ring-amber-600"
              placeholder="Share your thoughts or questions..."
              rows={6}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-amber-300 text-amber-800"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-800 text-amber-50 hover:bg-amber-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Discussion"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
