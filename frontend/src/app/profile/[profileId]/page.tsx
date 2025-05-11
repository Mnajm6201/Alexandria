"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Edit,
  Settings,
  ChevronRight,
  Award,
  BookMarked,
  BookText,
  Users,
  Coffee,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/Header";
import { useJWToken } from "@/utils/getJWToken";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { EditProfileModal } from "@/components/ui/edit/EditProfileModal";
import { DeleteAccountDialog } from "@/components/ui/delete/DeleteAccountDialog";
import { UserSetupModal } from "@/components/ui/userprofile/UserSetupModal";
import CurrentlyReading from "@/components/profiles/CurrentlyReading";
import UserBookClubs from "@/components/profiles/UserBookClubs";

// Define profile data interface
interface ProfileData {
  id?: string;
  username: string;
  bio?: string;
  zipCode?: string;
  socialLinks?: string;
  need_setup?: boolean;
  profile_pic?: string;
  profile_pic_url?: string;
  stats?: {
    books_read: number;
    average_rating: string;
    favorite_genre: string;
  };
  recently_read?: any[];
  book_clubs?: any[];
  profilePicUrl?: string; // For backward compatibility
}

// Default profile data
const DEFAULT_PROFILE_DATA: ProfileData = {
  username: "",
  bio: "",
  zipCode: "",
  socialLinks: "",
  need_setup: false,
  stats: {
    books_read: 0,
    average_rating: "N/A",
    favorite_genre: "N/A",
  },
  recently_read: [],
  book_clubs: [],
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  // State variables
  const [profileData, setProfileData] =
    useState<ProfileData>(DEFAULT_PROFILE_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

  // Hooks
  const { jwtToken, fetchJWToken } = useJWToken();
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { profileId } = use(params);

  // Fetch profile data when component mounts
  useEffect(() => {
    const initProfile = async () => {
      if (!isLoaded) return;

      // Check if this is the current user's profile
      if (user) {
        try {
          const token = await fetchJWToken();
          // Get current user's ID from backend
          const currentUserResponse = await fetch(
            "http://localhost:8000/api/auth/profile/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (currentUserResponse.ok) {
            const currentUserData = await currentUserResponse.json();

            // If profileId is "me" or matches the current user's ID, set as current user
            setIsCurrentUser(
              profileId === "me" ||
                profileId === user.id ||
                profileId === currentUserData.id?.toString()
            );

            // If this is the current user, fetch their profile
            if (
              profileId === "me" ||
              profileId === user.id ||
              profileId === currentUserData.id?.toString()
            ) {
              await fetchCurrentUserProfile();
            } else {
              await fetchUserProfile(profileId);
            }
          } else {
            // If we can't get current user info, try normal profile fetch
            await fetchUserProfile(profileId);
          }
        } catch (err) {
          console.error("Error initializing profile:", err);
          await fetchUserProfile(profileId);
        }
      } else {
        // Not logged in, just fetch the requested profile
        await fetchUserProfile(profileId);
      }
    };

    initProfile();
  }, [profileId, isLoaded, user]);

  // Function to fetch current user's profile
  const fetchCurrentUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/auth/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      console.log("Received current user profile data:", data);

      // Check if user needs setup
      if (data.need_setup) {
        setShowSetupModal(true);
      }

      // Format the data to match our ProfileData interface
      setProfileData({
        username: data.username || "",
        bio: data.bio || "",
        zipCode: data.zip_code || "",
        socialLinks: data.social_links || "",
        need_setup: data.need_setup || false,
        profile_pic: data.profile_pic || "",
        profilePicUrl: data.profile_pic || "", // For backward compatibility
        stats: {
          books_read: 0,
          average_rating: "N/A",
          favorite_genre: "N/A",
        },
        recently_read: [],
        book_clubs: [],
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching current user profile:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch profile data"
      );
      setLoading(false);
    }
  };

  // Function to fetch another user's profile
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // Fetch the public profile of the specified user
      const response = await fetch(
        `http://localhost:8000/api/auth/users/${userId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      console.log("Received other user profile data:", data);

      // Set the profile data
      setProfileData({
        id: data.id?.toString(),
        username: data.username || "",
        bio: data.bio || "",
        zipCode: data.zip_code || "",
        socialLinks: data.social_links || "",
        profile_pic: data.profile_pic || data.profile_pic_url || "",
        profilePicUrl: data.profile_pic || data.profile_pic_url || "",
        stats: data.stats || {
          books_read: 0,
          average_rating: "N/A",
          favorite_genre: "N/A",
        },
        recently_read: data.recently_read || [],
        book_clubs: data.book_clubs || [],
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch profile data"
      );
      setLoading(false);
    }
  };

  // Handle profile image URL
  const getProfileImageUrl = (profilePic: string | undefined) => {
    if (!profilePic) return null;

    // Check if it's already an absolute URL
    if (profilePic.startsWith("http")) {
      return profilePic;
    }

    // Make it an absolute URL
    return `http://localhost:8000${profilePic}`;
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        console.error("Cannot delete account: No Valid JWT token");
        setIsDeleting(false);
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/auth/user/delete",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const deleteClerk = await fetch("/api/clerk/delete", {
          method: "POST",
          credentials: "include",
        });

        await signOut();
        router.push("/");
      } else {
        console.error("Delete failed:", await response.text());
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle profile updates
  const handleSaveProfile = async (newProfileData: ProfileData) => {
    try {
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        console.error("Cannot save profile: No Valid JWT");
        return;
      }

      // Handle profile picture upload if provided
      let profilePicUrl = profileData.profile_pic || profileData.profilePicUrl;

      if (newProfileData.profilePicture) {
        try {
          const pictureFormData = new FormData();
          pictureFormData.append(
            "profilePicture",
            newProfileData.profilePicture
          );

          const pictureResponse = await fetch(
            "http://localhost:8000/api/auth/user/profile/update-picture/",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: pictureFormData,
            }
          );

          if (pictureResponse.ok) {
            const pictureData = await pictureResponse.json();
            profilePicUrl = pictureData.profile_pic_url;
          }
        } catch (pictureError) {
          console.error("Error uploading profile picture:", pictureError);
        }
      }

      // Update profile data
      const response = await fetch(
        "http://localhost:8000/api/auth/user/profile/update/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: newProfileData.username,
            bio: newProfileData.bio,
            zipCode: newProfileData.zipCode || "",
            socialLinks: newProfileData.socialLinks || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update local state with new data
      setProfileData({
        ...profileData,
        username: newProfileData.username,
        bio: newProfileData.bio || "",
        zipCode: newProfileData.zipCode || "",
        socialLinks: newProfileData.socialLinks || "",
        profile_pic: profilePicUrl,
        profilePicUrl: profilePicUrl,
      });

      // Refresh profile to ensure we have latest data
      if (isCurrentUser) {
        fetchCurrentUserProfile();
      }

      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">Loading profile...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  const profileImageUrl = getProfileImageUrl(
    profileData.profile_pic || profileData.profilePicUrl
  );

  return (
    <div className="flex min-h-screen flex-col bg-amber-50">
      {/* Header */}
      <Header variant="app" />

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          {/* Left Column - Profile Info */}
          <div className="md:col-span-2">
            <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
              {/* Profile Image */}
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-amber-200 bg-amber-100">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-amber-100 text-amber-700">
                    <User className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-amber-900">
                      {profileData.username}
                    </h1>
                  </div>

                  {/* Only show edit buttons for current user */}
                  {isCurrentUser && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-amber-300"
                        onClick={() => setShowEditModal(true)}
                      >
                        <Edit className="h-4 w-4 text-amber-800" />
                        <span className="sr-only">Edit Profile</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-amber-300"
                      >
                        <Settings className="h-4 w-4 text-amber-800" />
                        <span className="sr-only">Settings</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-amber-300"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <X className="h-4 w-4 text-amber-800" />
                        <span className="sr-only">Delete Account</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-amber-800">
                    {profileData.bio || "No bio available."}
                  </p>
                </div>
              </div>
            </div>

            {/* Currently Reading Section */}
            <CurrentlyReading
              userId={profileId === "me" ? undefined : profileId}
              showAddButton={isCurrentUser}
              className="mb-8"
            />

            {/* Recent Books / Want to Read - Only show if there's actual data */}
            {profileData.recently_read &&
              profileData.recently_read.length > 0 && (
                <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-serif font-bold text-amber-900">
                      {isCurrentUser ? "Want to Read" : "Recently Read"}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-800"
                    >
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {profileData.recently_read.map((book) => (
                      <div key={book.id} className="space-y-2">
                        <div className="aspect-[2/3] overflow-hidden rounded-md bg-amber-200">
                          <Image
                            src={
                              book.cover_image ||
                              `/placeholder.svg?height=150&width=100&text=Book`
                            }
                            alt={book.title}
                            width={100}
                            height={150}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <Link
                            href={`/book/${book.id}`}
                            className="text-sm font-medium text-amber-900 hover:underline line-clamp-1"
                          >
                            {book.title}
                          </Link>
                          <p className="text-xs text-amber-700 line-clamp-1">
                            {book.author}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Book Clubs */}
            <div className="rounded-lg border border-amber-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-serif font-bold text-amber-900">
                Book Clubs
              </h2>
              <UserBookClubs
                userId={profileId === "me" ? undefined : profileId}
                showAddButton={isCurrentUser}
                limit={5}
              />
            </div>

            {/* Achievement Showcase - Use placeholder for now */}
            <div className="rounded-lg border border-amber-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-serif font-bold text-amber-900">
                Achievement Showcase
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((achievement) => (
                  <div
                    key={achievement}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                      <Award className="h-8 w-8 text-amber-600" />
                    </div>
                    <span className="mt-2 text-xs text-amber-800 line-clamp-2">
                      {achievement % 2 === 0 ? "Bookworm" : "Speed Reader"}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 w-full text-amber-800"
              >
                View All Achievements
              </Button>
            </div>

            {/* Quick Links - Only show for current user */}
            {isCurrentUser && (
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/book"
                  className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-white p-4 text-center transition-colors hover:bg-amber-100"
                >
                  <BookMarked className="h-8 w-8 text-amber-800" />
                  <span className="mt-2 font-medium text-amber-900">
                    My Books
                  </span>
                </Link>
                <Link
                  href="/journal"
                  className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-white p-4 text-center transition-colors hover:bg-amber-100"
                >
                  <BookText className="h-8 w-8 text-amber-800" />
                  <span className="mt-2 font-medium text-amber-900">
                    My Journals
                  </span>
                </Link>
                <Link
                  href="/community"
                  className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-white p-4 text-center transition-colors hover:bg-amber-100"
                >
                  <Users className="h-8 w-8 text-amber-800" />
                  <span className="mt-2 font-medium text-amber-900">
                    Community Hub
                  </span>
                </Link>
                <Link
                  href="/club"
                  className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-white p-4 text-center transition-colors hover:bg-amber-100"
                >
                  <Coffee className="h-8 w-8 text-amber-800" />
                  <span className="mt-2 font-medium text-amber-900">
                    Book Clubs
                  </span>
                </Link>
              </div>
            )}

            {/* Reading Stats */}
            <div className="rounded-lg border border-amber-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-serif font-bold text-amber-900">
                Reading Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-amber-800">Books Read:</span>
                  <span className="font-medium text-amber-900">
                    {profileData.stats?.books_read || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Average Rating:</span>
                  <span className="font-medium text-amber-900">
                    {profileData.stats?.average_rating || "N/A"} ★
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Favorite Genre:</span>
                  <span className="font-medium text-amber-900">
                    {profileData.stats?.favorite_genre || "N/A"}
                  </span>
                </div>
              </div>

              {/* Reading Challenge - Only show for current user */}
              {isCurrentUser && (
                <div className="mt-4 rounded-lg bg-amber-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-800">
                      2025 Reading Challenge
                    </span>
                    <span className="text-sm font-medium text-amber-900">
                      64% Complete
                    </span>
                  </div>
                  <Progress value={64} className="mt-2 h-2 bg-amber-200" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals - Only for current user */}
      {isCurrentUser && (
        <>
          <EditProfileModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveProfile}
            initialData={{
              username: profileData.username,
              bio: profileData.bio || "",
              zipCode: profileData.zipCode || "",
              socialLinks: profileData.socialLinks || "",
              profilePicUrl:
                profileData.profile_pic || profileData.profilePicUrl || "",
            }}
          />

          <DeleteAccountDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={handleDeleteAccount}
            isLoading={isDeleting}
          />

          <UserSetupModal
            isOpen={showSetupModal}
            onClose={() => setShowSetupModal(false)}
            onSave={handleSaveProfile}
            initialData={{
              username: profileData.username,
              bio: profileData.bio || "",
              zipCode: profileData.zipCode || "",
              socialLinks: profileData.socialLinks || "",
              need_setup: profileData.need_setup || false,
              profilePicUrl:
                profileData.profile_pic || profileData.profilePicUrl || "",
            }}
          />
        </>
      )}
    </div>
  );
}
