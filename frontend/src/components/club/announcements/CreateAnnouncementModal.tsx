"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Pin } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_by: number;
  created_by_username: string;
  created_on: string;
  is_pinned: boolean;
}

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string, isPinned: boolean) => void;
  announcement: Announcement | null;
}

export function CreateAnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
  announcement,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset form when modal is opened or announcement changes
  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        setTitle(announcement.title);
        setContent(announcement.content);
        setIsPinned(announcement.is_pinned);
      } else {
        setTitle("");
        setContent("");
        setIsPinned(false);
      }
      setError(null);
    }
  }, [isOpen, announcement]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Announcement title is required");
      return;
    }

    if (!content.trim()) {
      setError("Announcement content is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(title, content, isPinned);
      onClose();
    } catch (err) {
      console.error("Error submitting announcement:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save announcement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-lg rounded-lg bg-amber-50 p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-amber-700 hover:text-amber-900"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-6 text-2xl font-serif font-bold text-amber-900 flex items-center">
          {announcement ? "Edit Announcement" : "Create Announcement"}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="announcement-title" className="text-amber-800">
              Title *
            </Label>
            <Input
              id="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-amber-300 bg-white focus-visible:ring-amber-600"
              placeholder="Enter a title for your announcement"
              required
            />
          </div>

          <div>
            <Label htmlFor="announcement-content" className="text-amber-800">
              Content *
            </Label>
            <Textarea
              id="announcement-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-amber-300 bg-white focus-visible:ring-amber-600"
              placeholder="Enter the announcement message..."
              rows={6}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-pinned"
              checked={isPinned}
              onCheckedChange={(checked) => setIsPinned(checked as boolean)}
              className="border-amber-400 data-[state=checked]:bg-amber-600"
            />
            <div className="flex items-center">
              <Label htmlFor="is-pinned" className="text-amber-800">
                Pin this announcement
              </Label>
              <Pin className="ml-1 h-4 w-4 text-amber-600" />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-amber-300 text-amber-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-amber-800 text-amber-50 hover:bg-amber-700"
            >
              {isSubmitting
                ? "Saving..."
                : announcement
                ? "Update Announcement"
                : "Post Announcement"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
