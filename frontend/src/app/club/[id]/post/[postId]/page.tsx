"use client";

import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { ChevronRight, MessageSquare, ThumbsUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJWToken } from "@/utils/getJWToken";
import { CommentsSection } from "@/components/club/comments/CommentSection";

export default function PostDetailPage({
  params,
}: {
  params: { clubId: string; postId: string };
}) {
  const unwrappedParams = React.use(params);
  const clubId = unwrappedParams.id;
  const postId = unwrappedParams.postId;

  const [post, setPost] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  const { jwtToken, fetchJWToken } = useJWToken();

  // Fetch JWT token on mount
  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Function to fetch post details
  const fetchPostDetails = async () => {
    try {
      if (!postId || !clubId) return;

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // First, fetch club details to get club name for breadcrumbs
      const clubResponse = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!clubResponse.ok) {
        throw new Error(`Failed to fetch club details: ${clubResponse.status}`);
      }

      const clubData = await clubResponse.json();
      setClub(clubData);

      // Now fetch post details
      // Note: You'll need to create this endpoint in your backend API
      const postResponse = await fetch(
        `http://localhost:8000/api/bookclubs/posts/${postId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!postResponse.ok) {
        throw new Error(`Failed to fetch post details: ${postResponse.status}`);
      }

      const postData = await postResponse.json();
      setPost(postData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching post details:", err);
      setError("Failed to load post details. Please try again later.");
      setLoading(false);
    }
  };

  // handler for liking a post
  const handleLikePost = async () => {
    try {
      setIsLiking(true);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setIsLiking(false);
        return;
      }

      console.log(
        "Sending like request to:",
        `http://localhost:8000/api/bookclubs/posts/${postId}/like/`
      );

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/posts/${postId}/like/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Like response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error data:", errorData);
        throw new Error(errorData.error || "Failed to like post");
      }

      const data = await response.json();
      console.log("Like response data:", data);
      setLikeCount(data.like_count);
    } catch (err) {
      console.error("Error liking post:", err);
    } finally {
      setIsLiking(false);
    }
  };


  // Fetch post details
  useEffect(() => {
    if (jwtToken) {
      fetchPostDetails();
    }
  }, [jwtToken, clubId, postId]);


  useEffect(() => {
    if (post) {
      setLikeCount(post.like_count || 0);
    }
  }, [post]);

  // Helper for formatting dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">Loading post details...</div>
      </div>
    );
  }

  // Show error state
  if (error || !post || !club) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">
          {error || "Failed to load post"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-amber-700">
            <Link href="/club" className="hover:text-amber-900 hover:underline">
              Book Clubs
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link
              href={`/club/${clubId}`}
              className="hover:text-amber-900 hover:underline"
            >
              {club.name}
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-amber-900">Discussion</span>
          </div>
        </div>

        {/* Post Content */}
        <div className="rounded-lg border border-amber-200 bg-white p-6 mb-6">
          <h1 className="text-2xl font-serif font-bold text-amber-900 mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 mb-6 text-sm text-amber-700">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-amber-200">
                {post.author_pic ? (
                  <img
                    src={post.author_pic}
                    alt={post.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                    {(post.username || "User").substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span>{post.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.created_on)}</span>
            </div>
          </div>

          {/* Post content */}
          <div className="text-amber-800 mb-6 whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Post actions */}
          <div className="flex items-center gap-4 border-t border-amber-100 pt-4">
            <Button
              variant="ghost"
              className="text-amber-700 hover:bg-amber-50 hover:text-amber-900"
              onClick={handleLikePost}
              disabled={isLiking}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {isLiking ? "Liking..." : "Like"} ({likeCount})
            </Button>
            <Button
              variant="ghost"
              className="text-amber-700 hover:bg-amber-50 hover:text-amber-900"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Comment
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection postId={postId} />
      </main>
    </div>
  );
}
