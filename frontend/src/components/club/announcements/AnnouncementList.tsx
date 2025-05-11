"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {Pin, PlusCircle, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useJWToken } from "@/utils/getJWToken";
import { CreateAnnouncementModal } from "./CreateAnnouncementModal";

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_by: number;
  created_by_username: string;
  created_on: string;
  is_pinned: boolean;
}

interface AnnouncementListProps {
  clubId: number;
  isAdmin: boolean;
}

export function AnnouncementList({ clubId, isAdmin }: AnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { jwtToken, fetchJWToken } = useJWToken();

  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Memoize fetchAnnouncements to avoid unnecessary re-creations
  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/announcements/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`);
      }

      const data = await response.json();
      setAnnouncements(data || []);
      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Failed to load announcements. Please try again later.");
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [clubId, jwtToken, fetchJWToken]);

  // Fetch announcements when the component mounts or refreshCounter changes
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements, refreshCounter]);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCreateAnnouncement = async (
    title: string,
    content: string,
    isPinned: boolean
  ) => {
    try {
      setError(null);
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/announcements/create/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
            is_pinned: isPinned,
          }),
        }
      );

      const responseText = await response.text();
      console.log("Response from create:", responseText);

      if (!response.ok) {
        let errorMessage = "Failed to create announcement";
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          if (responseText && responseText.length < 200) {
            errorMessage += `: ${responseText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Set success message
      setSuccessMessage("Announcement created successfully!");

      // Refresh announcements list
      setRefreshCounter((prev) => prev + 1);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating announcement:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create announcement. Please try again."
      );
    }
  };

  const handleEditAnnouncement = async (
    id: number,
    title: string,
    content: string,
    isPinned: boolean
  ) => {
    try {
      setError(null);
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        return;
      }

      // Log exactly what we're sending
      const requestData = {
        title,
        content,
        is_pinned: isPinned,
      };
      console.log("Sending update data:", JSON.stringify(requestData, null, 2));

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/announcements/${id}/update/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      // Get response text for debugging
      const responseText = await response.text();
      console.log("Response from update:", responseText);

      if (!response.ok) {
        let errorMessage = `Failed to update announcement: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          if (responseText && responseText.length < 200) {
            errorMessage += ` - ${responseText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Set success message
      setSuccessMessage("Announcement updated successfully!");

      // Refresh announcements list
      setRefreshCounter((prev) => prev + 1);
      setEditingAnnouncement(null);
    } catch (err) {
      console.error("Error updating announcement:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update announcement. Please try again."
      );
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      setError(null);
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        return;
      }

      console.log(`Deleting announcement with ID: ${id}`);

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/announcements/${id}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Get response text for debugging
      const responseText = await response.text();
      console.log("Response from delete:", responseText);

      if (!response.ok) {
        let errorMessage = `Failed to delete announcement: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          if (responseText && responseText.length < 200) {
            errorMessage += ` - ${responseText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Set success message
      setSuccessMessage("Announcement deleted successfully!");

      // Refresh announcements list
      setRefreshCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete announcement. Please try again."
      );
    }
  };

  const handleManualRefresh = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-amber-800">Loading announcements...</div>
      </div>
    );
  }


  return (
    <div className="rounded-lg border border-amber-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-serif font-bold text-amber-900 flex items-center">
          Announcements
        </h2>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-800 text-amber-50 hover:bg-amber-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="py-8 text-center text-amber-700">
          No announcements yet.
          {isAdmin && (
            <div className="mt-2">
              <Button
                variant="link"
                onClick={() => setShowCreateModal(true)}
                className="text-amber-800"
              >
                Create the first announcement
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-lg border ${
                announcement.is_pinned
                  ? "border-amber-400 bg-amber-50"
                  : "border-amber-200 bg-white"
              } p-4`}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-amber-900">
                    {announcement.title}
                  </h3>
                  {announcement.is_pinned && (
                    <Pin className="ml-2 h-4 w-4 text-amber-600" />
                  )}
                </div>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-amber-700"
                      onClick={() => setEditingAnnouncement(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-amber-700"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
              <div className="mb-3 whitespace-pre-wrap text-amber-800">
                {announcement.content}
              </div>
              <div className="flex items-center justify-between text-xs text-amber-600">
                <div>Posted by {announcement.created_by_username}</div>
                <div>
                  {formatDistanceToNow(new Date(announcement.created_on), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAnnouncementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAnnouncement}
        announcement={null}
      />

      {editingAnnouncement && (
        <CreateAnnouncementModal
          isOpen={!!editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          onSubmit={(title, content, isPinned) =>
            handleEditAnnouncement(
              editingAnnouncement.id,
              title,
              content,
              isPinned
            )
          }
          announcement={editingAnnouncement}
        />
      )}
    </div>
  );
}
