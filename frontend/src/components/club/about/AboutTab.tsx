import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "./MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import Image from "next/image"; // Import Image from next/image
import { User } from "lucide-react"; // Import User icon for fallback
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

interface AboutTabProps {
  clubData: any;
  isAdmin: boolean;
  onUpdateClub: () => void;
}

export function AboutTab({ clubData, isAdmin, onUpdateClub }: AboutTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageErrors, setProfileImageErrors] = useState<{
    [key: string]: boolean;
  }>({});

  // Convert created_on to a readable date
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

  // Find admin members
  const adminMembers = (clubData.members || []).filter(
    (member: any) => member.is_admin || member.role === "Moderator"
  );

  // Function to handle profile image URLs
  const getProfileImageUrl = (profilePic: string | null) => {
    if (!profilePic) return null;

    // Check if it's already an absolute URL
    if (profilePic.startsWith("http")) {
      return profilePic;
    }

    // Make it an absolute URL
    return `http://localhost:8000${profilePic}`;
  };

  // Handle image load error
  const handleImageError = (memberId: string) => {
    setProfileImageErrors((prev) => ({
      ...prev,
      [memberId]: true,
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-amber-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif font-bold text-amber-900">
              About This Club
            </h2>

            {isAdmin && !isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-amber-300 text-amber-800"
              >
                Edit About
              </Button>
            )}
          </div>

          {isEditing ? (
            <MarkdownEditor
              clubId={clubData.id}
              clubData={clubData}
              initialContent={clubData.about_content || ""}
              onSave={() => {
                setIsEditing(false);
                onUpdateClub();
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-4 text-amber-800">
              {clubData.about_content ? (
                <div className="prose prose-amber max-w-none">
                  <ReactMarkdown>{clubData.about_content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-amber-700 italic">
                  No detailed description available for this club.
                </p>
              )}

              {!clubData.about_content && clubData.club_desc && (
                <p>{clubData.club_desc}</p>
              )}

              <div className="mt-6">
                <h3 className="mb-3 text-xl font-medium text-amber-900">
                  Club Rules
                </h3>
                <ul className="list-inside list-disc space-y-2 text-amber-800">
                  <li>
                    Be respectful of other members' opinions and perspectives.
                  </li>
                  <li>Stay on topic in discussion threads.</li>
                  <li>No spoilers beyond the current reading schedule.</li>
                  <li>Participate regularly to maintain active membership.</li>
                  <li>Have fun and enjoy the reading experience!</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-medium text-amber-900">
            Club Statistics
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-medium text-amber-900">Founded</h3>
              <p className="text-amber-800">
                {formatDate(clubData.created_on || "")}
              </p>

              <h3 className="mt-4 mb-2 font-medium text-amber-900">Members</h3>
              <p className="text-amber-800">
                {clubData.member_count || 0} members
              </p>

              <h3 className="mt-4 mb-2 font-medium text-amber-900">
                Books Read
              </h3>
              <p className="text-amber-800">
                {(clubData.reading_history?.length || 0) +
                  (clubData.book_details ? 1 : 0) ||
                  (clubData.book_club_history?.length || 0) +
                    (clubData.book_details ? 1 : 0) ||
                  0}
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-medium text-amber-900">Privacy</h3>
              <p className="text-amber-800">
                {clubData.is_private ? "Private Club" : "Public Club"}
              </p>

              <h3 className="mt-4 mb-2 font-medium text-amber-900">
                Discussions
              </h3>
              <p className="text-amber-800">
                {clubData.recent_posts?.length || clubData.posts?.length || 0}{" "}
                discussions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="rounded-lg border border-amber-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-medium text-amber-900">
            Club Leadership
          </h3>
          {adminMembers.length > 0 ? (
            <div className="space-y-4">
              {adminMembers.map((member: any) => {
                const profileUrl = getProfileImageUrl(member.profile_pic);
                const hasImageError = profileImageErrors[member.id];
                const username = member.username || "User";
                const initials = username.substring(0, 2).toUpperCase();

                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-amber-200 relative">
                      {profileUrl && !hasImageError ? (
                        <Image
                          src={profileUrl}
                          alt={username}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          onError={() => handleImageError(member.id)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-amber-900">
                          {username}
                        </span>
                        <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                          {member.role || "Admin"}
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-700">
                        Since {formatDate(member.join_date || "")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-amber-700 text-center">
              No leadership information available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
