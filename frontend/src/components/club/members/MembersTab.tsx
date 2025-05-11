import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Search, Filter, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface MembersTabProps {
  clubData: any;
  clubId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function MembersTab({
  clubData,
  clubId,
  isAdmin,
  onRefresh,
}: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImageErrors, setProfileImageErrors] = useState<{
    [key: string]: boolean;
  }>({});

  // Get members from API response (handle different possible structures)
  const members = clubData.members || clubData.active_members || [];

  // Reading Progress icons
  const ReadingStatusBadge = ({ status }) => {
    // Define colors based on reading status
    const getStatusColor = (status) => {
      switch (status) {
        case "Not Started":
          return "bg-gray-200 text-gray-800";
        case "Reading":
          return "bg-green-100 text-green-800";
        case "Completed":
          return "bg-blue-100 text-blue-800";
        case "On Hold":
          return "bg-amber-100 text-amber-800";
        default:
          return "bg-gray-200 text-gray-800";
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
          status
        )}`}
      >
        {status}
      </span>
    );
  };

  // Get total pages from book details if available - check multiple possible sources
  const totalPages =
    clubData?.book_details?.page_count || // Direct from our new utility
    clubData?.book_details?.primary_edition?.page_count || // From primary edition
    (clubData?.book_details?.other_editions?.length > 0
      ? clubData.book_details.other_editions[0].page_count
      : null) ||
    300; // Default fallback value

  const ReadingProgressBar = ({ currentPage, totalPages = 300 }) => {
    // Calculate progress percentage, ensuring we have valid numbers
    const current = Number(currentPage) || 0;
    const total = Number(totalPages) || 300;
    const progress = total > 0 ? Math.min(100, (current / total) * 100) : 0;

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div
          className="bg-amber-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
        <p className="text-xs text-amber-700 mt-1">
          Page {current} {total > 0 ? `of ${total}` : ""}
        </p>
      </div>
    );
  };

  // Filter members based on search
  const filteredMembers = searchQuery
    ? members.filter((member: any) =>
        (member.username || member.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : members;

  // Format date helper
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

  // Function to process profile image URLs
  const getProfileImageUrl = (profilePic: string | null) => {
    if (!profilePic) return null;

    // Check if it's already an absolute URL
    if (profilePic.startsWith("http")) {
      return profilePic;
    }

    // Make it an absolute URL
    return `http://localhost:8000${profilePic}`;
  };

  // Handle image error
  const handleImageError = (memberId: string) => {
    setProfileImageErrors((prev) => ({
      ...prev,
      [memberId]: true,
    }));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-amber-900">
          Members
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
            <input
              type="text"
              placeholder="Search members..."
              className="rounded-md border border-amber-300 bg-amber-50 pl-9 pr-4 py-2 text-sm placeholder:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-amber-300 text-amber-800">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Current Book Info - Show what everyone is reading */}
      {clubData?.book_details && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-amber-700 mr-2" />
            <h3 className="text-lg font-medium text-amber-900">
              Currently Reading
            </h3>
          </div>
          <div className="mt-2">
            <p className="font-medium text-amber-900">
              {clubData.book_details.title}
            </p>
            {clubData.book_details.authors && (
              <p className="text-sm text-amber-700">
                by{" "}
                {Array.isArray(clubData.book_details.authors)
                  ? clubData.book_details.authors.join(", ")
                  : clubData.book_details.authors}
              </p>
            )}
            {totalPages && (
              <p className="text-xs text-amber-600 mt-1">{totalPages} pages</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member: any) => {
            const profileUrl = getProfileImageUrl(member.profile_pic);
            const hasImageError = profileImageErrors[member.id];
            const username = member.username || member.name || "Member";

            // Extract the correct user ID for the profile link
            const userId = member.user;

            return (
              <div
                key={member.id}
                className="rounded-lg border border-amber-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-amber-200 relative">
                    {profileUrl && !hasImageError ? (
                      <Image
                        src={profileUrl}
                        alt={username}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        onError={() => handleImageError(member.id)}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${userId}`}
                        className="font-medium text-amber-900 hover:underline"
                      >
                        {username}
                      </Link>
                      {(member.is_admin || member.role === "Moderator") && (
                        <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                          {member.role || "Admin"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-amber-700">
                      Joined{" "}
                      {formatDate(member.join_date || member.joined || "")}
                    </p>
                  </div>
                </div>

                {/* Enhanced Reading Progress Section */}
                <div className="mt-4 bg-amber-50 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-800">
                      Reading Progress
                    </span>
                    <ReadingStatusBadge
                      status={member.reading_status || "Not Started"}
                    />
                  </div>
                  <ReadingProgressBar
                    currentPage={member.current_page || 0}
                    totalPages={totalPages}
                  />
                </div>

                <div className="mt-3">
                  <Link href={`/profile/${userId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-amber-800"
                    >
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-lg border border-amber-200 bg-white p-6 text-center">
            <p className="text-amber-700">
              No members found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
