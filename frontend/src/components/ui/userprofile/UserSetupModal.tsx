"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useJWToken } from "../../../utils/getJWToken";

export function UserSetupModal({
  isOpen,
  onClose,
  onSave,
  initialData = { displayName: "", bio: "" , zipCode: "", socialLinks: ""},
}) {
  const [formData, setFormData] = useState<{
    displayName: string;
    bio: string;
    zipCode: string;
    socialLinks: string;
    profilePicture: File | null;
  }>({
    displayName: initialData.displayName || "",
    bio: initialData.bio || "",
    zipCode: initialData.zipCode || "",
    socialLinks: initialData.socialLinks || "",
    profilePicture: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { jwtToken, fetchJWToken } = useJWToken();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if(file){
      // Preview url
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);


      // Update form data with the file
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = jwtToken || (await fetchJWToken());

      if (!token) {
        throw new Error("Unable to get authentication token");
      }

      // First, handle the profile picture upload if present
      let profilePicUrl = null;
      if (formData.profilePicture) {
        const pictureFormData = new FormData();
        pictureFormData.append("profilePicture", formData.profilePicture);

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

        if (!pictureResponse.ok) {
          const pictureError = await pictureResponse.json();
          throw new Error(
            pictureError.message || "Failed to upload profile picture"
          );
        }

        const pictureData = await pictureResponse.json();
        profilePicUrl = pictureData.profile_pic_url;
      }

      // Then handle the rest of the profile data as JSON
      const profileResponse = await fetch(
        "http://localhost:8000/api/auth/user/profile/update/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: formData.displayName,
            bio: formData.bio || "",
            zipCode: formData.zipCode || "",
            socialLinks: formData.socialLinks || "",
          }),
        }
      );

      if (!profileResponse.ok) {
        const profileError = await profileResponse.json();
        throw new Error(profileError.message || "Failed to update profile");
      }

      // Update the form data with the profile picture URL if it was uploaded
      const updatedFormData = {
        ...formData,
        profilePicUrl: profilePicUrl || formData.profilePicUrl,
      };

      onSave(updatedFormData);
      onClose();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during profile setup"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-amber-50 border-amber-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-amber-900">
            Welcome to Alexandria!
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center mb-4">
              <div
                className="h-24 w-24 rounded-full overflow-hidden border-4 border-amber-200 bg-amber-100 mb-2 flex items-center justify-center cursor-pointer"
                onClick={triggerFileInput}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-amber-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="text-xs mt-1">Upload</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="text-sm text-amber-800 hover:underline"
              >
                Upload profile picture
              </button>
            </div>

            {/* Rest of your form fields */}
            <div className="space-y-2">
              <label
                htmlFor="displayName"
                className="text-amber-800 font-medium"
              >
                Choose your username*
              </label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Username"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="border-amber-300 bg-white focus-visible:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="bio" className="text-amber-800 font-medium">
                Tell the community about yourself (optional)
              </label>
              <Textarea
                id="bio"
                name="bio"
                placeholder=""
                value={formData.bio}
                onChange={handleChange}
                className="border-amber-300 bg-white h-24 focus-visible:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="zipcode"
                className="text-amber-800 font-medium"
              >
                Zip Code*
              </label>
              <Input
                id="zipCode"
                name="zipCode"
                placeholder="Zip code"
                value={formData.zipCode}
                onChange={handleChange}
                className="border-amber-300 bg-white focus-visible:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="socialLinks"
                className="text-amber-800 font-medium"
              >
                Social media links (optional)
              </label>
              <Input
                id="socialLinks"
                name="socialLinks"
                placeholder="https://twitter.com/yourusername"
                value={formData.socialLinks}
                onChange={handleChange}
                className="border-amber-300 bg-white focus-visible:ring-amber-500"
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.displayName}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              {isSubmitting ? "Saving..." : "Get Started"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
