"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Edit,
  Settings,
  PlusCircle,
  ChevronRight,
  Award,
  BookMarked,
  BookText,
  Users,
  Coffee,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/Header";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { EditProfileModal } from "@/components/ui/edit/EditProfileModal";
import { useJWToken } from "../../utils/getJWToken";
import { DeleteAccountDialog } from "@/components/ui/delete/DeleteAccountDialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function UserProfile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [userName, setUsername] = useState<string | "">("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [edit, setEdit] = useState<boolean>(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "loading..",
  });

  const router = useRouter();

  const { jwtToken, fetchJWToken } = useJWToken();
  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  useEffect(() => {
    if (isLoaded && user) {
      // Get the username (or use firstName or fullName)

      fetchProfileData();
    }
  }, [user, isLoaded, jwtToken]);

  //   const fetchProfileData = async () => {
  //     try{
  //         const token = await getToken();
  //         const response = await fetch("http://localhost:8000/");
  //     }
  //     catch(error){
  //         console.log("error, ", error);
  //     }
  //   }

  //Fetching the user's profile data
  const fetchProfileData = async () => {
    try {
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        console.error("Cannot fetch the JWT token");
        return;
      }

      const response = await fetch("http://localhost:8000/api/auth/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Data is: ", data);

        // update the proile with the updated data
        setProfileData({
          displayName: data.username || userName,
          bio: data.bio || "loading..",
        });

        if (data.username) {
          setUsername(data.username);
        }
      } else {
        console.error("Failed to fetch profile");
        return {
          success: false,
          error: data.message,
          field: data.field,
        };
      }
    } catch (err) {
      console.error("error: ", err);
    }
  };

 const handleDeleteAccount = async () => {
   setIsDeleting(true);

   try {
     const token = jwtToken || (await fetchJWToken());

     if (!token) {
       console.error("Cannot delete account: No Valid JWT token");
       setIsDeleting(false);
       return;
     }

     console.log("Delete Request Details:");
     console.log(
       "JWT Token (first/last 5):",
       token.slice(0, 5) + "..." + token.slice(-5)
     );
     console.log(
       "Full Endpoint:",
       "http://localhost:8000/api/auth/user/delete"
     );

     try {
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

       console.log("Delete Response Details:");
       console.log("Response Status:", response.status);
       console.log("Response Status Text:", response.statusText);

       // Try to get response body for more context
       const responseBody = await response.text();
       console.log("Response Body:", responseBody);

       if (response.ok) {
         const deleteClerk = await fetch("/api/clerk/delete", {
           method: "POST",
           credentials: "include",
         });

         if (!deleteClerk.ok) {
           console.log("Clerk api error", await deleteClerk.text());
         }

         console.log("Proceeding to sign out and redirect");
         await signOut();
         router.push("/");
       } else {
         console.error("Delete failed with response:", responseBody);
         throw new Error(`Delete failed: ${responseBody}`);
       }
     } catch (fetchError) {
       console.error("Fetch Error:", fetchError);
     }
   } catch (error) {
     console.error("Outer Error:", error);
   } finally {
     setIsDeleting(false);
   }
 };

  // Handling the profile changes
  interface ProfileData {
    displayName: string;
    bio: string;
  }

  const handleSaveProfile = async (newProfileData: ProfileData) => {
    setProfileData(newProfileData);
    setUsername(newProfileData.displayName);

    try {
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        console.error("Cannot save profile: No Valid JWT");
        return;
      }
      const response = await fetch(
        "http://localhost:8000/api/auth/user/profile/update/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: newProfileData.displayName,
            bio: newProfileData.bio,
          }),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to save profile. Status:",
          response.status,
          "Error:",
          errorText
        );
        return;
      }
      fetchProfileData();
      console.log("Profile Updated successfully");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error updating profile:", error.message, error.stack);
      } else {
        console.error("Error updating profile:", error);
      }
    }
  };

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
              <div className="relative">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-amber-200 bg-amber-100">
                  <Image
                    src="/placeholder.svg?height=128&width=128"
                    alt="Profile"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-amber-900">
                      {userName}
                    </h1>

                    <EditProfileModal
                      isOpen={edit}
                      onClose={() => setEdit(false)}
                      onSave={handleSaveProfile}
                      initialData={profileData}
                    />
                    <DeleteAccountDialog
                      isOpen={showDeleteDialog}
                      onClose={() => setShowDeleteDialog(false)}
                      onConfirm={handleDeleteAccount}
                      isLoading={isDeleting}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-amber-300"
                      onClick={() => setEdit(true)}
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
                </div>

                {/* Bio */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-amber-800">{profileData.bio}</p>
                </div>
              </div>
            </div>

            {/* Currently Reading */}
            <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-amber-900">
                  Currently Reading
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Journal Entry
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md bg-amber-200">
                  <Image
                    src="https://covers.openlibrary.org/b/id/10504392-L.jpg"
                    alt="Book cover"
                    width={64}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Link
                    href="#"
                    className="font-medium text-amber-900 hover:underline"
                  >
                    The Midnight Library
                  </Link>
                  <p className="text-sm text-amber-700">by Matt Haig</p>
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <span>On page 142 of 304</span>
                    <span className="text-xs">(47%)</span>
                  </div>
                  <Progress
                    value={47}
                    className="h-2 bg-amber-100"
                    indicatorclassname="bg-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Want to Read */}
            <div className="mb-8 rounded-lg border border-amber-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-amber-900">
                  Want to Read
                </h2>
                <Button variant="ghost" size="sm" className="text-amber-800">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {/* Book 1 */}
              <div className="space-y-2">
                <div className="aspect-[2/3] overflow-hidden rounded-md bg-amber-200">
                  <Image
                    src="https://covers.openlibrary.org/b/id/14637497-L.jpg"
                    alt="Book 1"
                    width={100}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <Link
                    href="#"
                    className="text-sm font-medium text-amber-900 hover:underline line-clamp-1"
                  >
                    Book Title 1
                  </Link>
                  <p className="text-xs text-amber-700 line-clamp-1">Author Name</p>
                </div>
              </div>

              {/* Book 2 */}
              <div className="space-y-2">
                <div className="aspect-[2/3] overflow-hidden rounded-md bg-amber-200">
                  <Image
                    src="https://covers.openlibrary.org/b/id/14596711-L.jpg"
                    alt="Book 2"
                    width={100}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <Link
                    href="#"
                    className="text-sm font-medium text-amber-900 hover:underline line-clamp-1"
                  >
                    Book Title 2
                  </Link>
                  <p className="text-xs text-amber-700 line-clamp-1">Author Name</p>
                </div>
              </div>

              {/* Book 3 */}
              <div className="space-y-2">
                <div className="aspect-[2/3] overflow-hidden rounded-md bg-amber-200">
                  <Image
                    src="https://covers.openlibrary.org/b/id/14303933-L.jpg"
                    alt="Book 3"
                    width={100}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <Link
                    href="#"
                    className="text-sm font-medium text-amber-900 hover:underline line-clamp-1"
                  >
                    Book Title 3
                  </Link>
                  <p className="text-xs text-amber-700 line-clamp-1">Author Name</p>
                </div>
              </div>

              {/* Book 4 */}
              <div className="space-y-2">
                <div className="aspect-[2/3] overflow-hidden rounded-md bg-amber-200">
                  <Image
                    src="https://covers.openlibrary.org/b/id/14422282-L.jpg"
                    alt="Book 4"
                    width={100}
                    height={150}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <Link
                    href="#"
                    className="text-sm font-medium text-amber-900 hover:underline line-clamp-1"
                  >
                    Book Title 4
                  </Link>
                  <p className="text-xs text-amber-700 line-clamp-1">Author Name</p>
                </div>
              </div>
            </div>

            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Achievement Showcase */}
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

            {/* Quick Links */}
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

            {/* Reading Stats */}
            <div className="rounded-lg border border-amber-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-serif font-bold text-amber-900">
                Reading Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-amber-800">Books Read (2023):</span>
                  <span className="font-medium text-amber-900">32</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Reading Goal:</span>
                  <span className="font-medium text-amber-900">50 books</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Average Rating:</span>
                  <span className="font-medium text-amber-900">4.2 ★</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Favorite Genre:</span>
                  <span className="font-medium text-amber-900">Fiction</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-amber-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-800">
                    2023 Reading Challenge
                  </span>
                  <span className="text-sm font-medium text-amber-900">
                    64% Complete
                  </span>
                </div>
                <Progress
                  value={64}
                  className="mt-2 h-2 bg-amber-200"
                  indicatorclassname="bg-amber-600"
                />
              </div>
            </div>

            {/* Following */}
            {/* <div className="rounded-lg border border-amber-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-amber-900">
                  Following
                </h2>
                <Button variant="ghost" size="sm" className="text-amber-800">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((friend) => (
                  <div key={friend} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-amber-200">
                      <Image
                        src={`/placeholder.svg?height=40&width=40&text=U${friend}`}
                        alt={`User ${friend}`}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">
                        Book Friend {friend}
                      </p>
                      <p className="text-xs text-amber-700">
                        Currently reading: Book Title
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </main>
    </div>
  );
}
