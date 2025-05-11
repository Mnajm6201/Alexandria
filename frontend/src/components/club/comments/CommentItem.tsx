import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useJWToken } from "@/utils/getJWToken";

interface CommentItemProps {
  comment: any;
  onReply: (parentId: number, content: string) => Promise<void>;
  level?: number;
  maxLevel?: number;
}

export function CommentItem({
  comment,
  onReply,
  level = 0,
  maxLevel = 3,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentLikeCount, setCommentLikeCount] = useState(comment.like_count || 0);
  const [isLikingComment, setIsLikingComment] = useState(false);


  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLikeComment = async () => {
    try {
      setIsLikingComment(true);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        // Handle error
        setIsLikingComment(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/comments/${comment.id}/like/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to like comment");
      }

      const data = await response.json();
      setCommentLikeCount(data.like_count);
    } catch (err) {
      console.error("Error liking comment:", err);
    } finally {
      setIsLikingComment(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate indent based on nesting level
  const indentClass = level > 0 ? `ml-${Math.min(level * 4, 12)}` : "";

  return (
    <div className={`mb-4 ${indentClass}`}>
      <div className="rounded-lg border border-amber-200 bg-white p-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-amber-200">
            {comment.profile_pic ? (
              <img
                src={comment.profile_pic}
                alt={comment.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                {(comment.username || "").substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-amber-900">
                {comment.username}
              </span>
              <span className="text-xs text-amber-700">
                {formatDate(comment.created_on)}
              </span>
              {comment.parent_username && (
                <span className="text-xs text-amber-700">
                  Replying to {comment.parent_username}
                </span>
              )}
            </div>
            <div className="mt-2 text-amber-800">{comment.content}</div>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 text-amber-700 hover:bg-amber-50 hover:text-amber-900"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageSquare className="mr-1 h-4 w-4" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 text-amber-700 hover:bg-amber-50 hover:text-amber-900"
                onClick={handleLikeComment}
                disabled={isLikingComment}
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                Like
              </Button>
              <span className="text-xs text-amber-700">
                {commentLikeCount} likes
              </span>
            </div>

            {isReplying && (
              <div className="mt-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[80px] border-amber-300 focus-visible:ring-amber-600"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-800"
                    onClick={() => setIsReplying(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-800 text-amber-50 hover:bg-amber-700"
                    onClick={handleReplySubmit}
                    disabled={isSubmitting || !replyContent.trim()}
                  >
                    {isSubmitting ? "Submitting..." : "Reply"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render children comments if any and if not exceeding max level */}
      {comment.children && comment.children.length > 0 && level < maxLevel && (
        <div className="mt-2">
          {comment.children.map((childComment: any) => (
            <CommentItem
              key={childComment.id}
              comment={childComment}
              onReply={onReply}
              level={level + 1}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
