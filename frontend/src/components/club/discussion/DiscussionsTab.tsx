"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Calendar, MessageSquare } from "lucide-react";
import { NewDiscussionModal } from "./DiscussionModal";
import { DiscussionItem } from "./DiscussionItem";
import { AnnouncementsPanel } from "./AnnouncementsPanel";

interface DiscussionsTabProps {
  clubData: any;
  clubId: string;
  onRefresh: () => void;
}

export function DiscussionsTab({
  clubData,
  clubId,
  onRefresh,
}: DiscussionsTabProps) {
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);

  // Get discussions from the API response
  const discussions = clubData.recent_posts || clubData.posts || [];

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-amber-900">
            Discussions
          </h2>
          <Button
            className="bg-amber-800 text-amber-50 hover:bg-amber-700"
            disabled={!clubData.is_user_member}
            onClick={() => setShowNewDiscussionModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Topic
          </Button>
        </div>

        {discussions.length > 0 ? (
          <div className="space-y-4">
            {discussions.map((post: any) => (
              <DiscussionItem
                key={post.id}
                post={post}
                clubId={clubId}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-white p-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-amber-300" />
            <h3 className="mt-2 text-lg font-medium text-amber-900">
              No Discussions Yet
            </h3>
            <p className="mt-1 text-amber-700">
              Be the first to start a discussion in this book club!
            </p>
            {clubData.is_user_member && (
              <Button
                className="mt-4 bg-amber-800 text-amber-50 hover:bg-amber-700"
                onClick={() => setShowNewDiscussionModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Topic
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Sidebar with announcements and active members */}
      <div>
        <AnnouncementsPanel
          announcements={clubData.announcements || []}
          formatDate={formatDate}
        />

        {/* Active Members Panel would go here */}
      </div>

      {/* New Discussion Modal */}
      <NewDiscussionModal
        clubId={clubId}
        isOpen={showNewDiscussionModal}
        onClose={() => setShowNewDiscussionModal(false)}
        onDiscussionCreated={onRefresh}
      />
    </div>
  );
}
