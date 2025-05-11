import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useJWToken } from "@/utils/getJWToken";
import { CommentItem } from "./CommentItem";

interface CommentsSectionProps {
  postId: string | number;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { jwtToken, fetchJWToken } = useJWToken();

  // Fetch comments when component mounts
  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/posts/${postId}/comments/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      setComments(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch comments");
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

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
        `http://localhost:8000/api/bookclubs/posts/${postId}/comments/create/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newComment,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      // Clear the input and refresh comments
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError(err instanceof Error ? err.message : "Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    try {
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/posts/${postId}/comments/create/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content,
            parent: parentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit reply");
      }

      // Refresh comments
      fetchComments();
    } catch (err) {
      console.error("Error submitting reply:", err);
      setError(err instanceof Error ? err.message : "Failed to submit reply");
      throw err; // Re-throw to let the CommentItem know it failed
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium text-amber-900">Comments</h3>

      {/* New comment form */}
      <div className="rounded-lg border border-amber-200 bg-white p-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[100px] border-amber-300 focus-visible:ring-amber-600"
        />
        <div className="mt-3 flex justify-end">
          <Button
            className="bg-amber-800 text-amber-50 hover:bg-amber-700"
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "Submitting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-100 p-3 text-red-700">{error}</div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-amber-700">Loading comments...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))
        ) : (
          <div className="text-center text-amber-700">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
