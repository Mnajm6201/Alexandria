// Updated EditProfileModal.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: ProfileData) => Promise<boolean>;
  initialData: {
    username: string;
    bio: string;
    zipCode?: string;
    socialLinks?: string;
    profilePicUrl?: string;
  };
}

interface ProfileData {
  displayName: string;
  bio: string;
  zipCode?: string;
  socialLinks?: string;
  profilePicture?: File | null;
  profilePicUrl?: string;
}

export function EditProfileModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>({
    displayName: initialData.username || "",
    bio: initialData.bio || "",
    zipCode: initialData.zipCode || "",
    socialLinks: initialData.socialLinks || "",
    profilePicture: null,
    profilePicUrl: initialData.profilePicUrl || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        displayName: initialData.username || "",
        bio: initialData.bio || "",
        zipCode: initialData.zipCode || "",
        socialLinks: initialData.socialLinks || "",
        profilePicture: prev.profilePicture || null,
        profilePicUrl: initialData.profilePicUrl || "",
      }));

      if (initialData.profilePicUrl) {
        const url = initialData.profilePicUrl;
        setPreviewUrl(
          url.startsWith("http") || url.startsWith("blob:")
            ? url
            : `http://localhost:8000${url}`
        );
      } else {
        setPreviewUrl("");
      }

      setErrors({});
    }
  }, [isOpen, initialData]);
  
  

  useEffect(() => {
    let prevUrl = previewUrl;

    return () => {
      if (prevUrl && prevUrl.startsWith("blob:")) {
        URL.revokeObjectURL(prevUrl);
      }
    };
  }, [previewUrl]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPEG, PNG, or GIF image.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Image must be smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
        profilePicUrl: objectUrl,
      }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateZipCode = (zipCode: string) => {
    return !zipCode || /^\d{5}(-\d{4})?$/.test(zipCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim())
      newErrors.displayName = "Name is required";
    if (formData.zipCode && !validateZipCode(formData.zipCode))
      newErrors.zipCode = "Invalid zip code";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSave(formData);
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
        onClose();
      } else {
        toast({
          title: "Update Failed",
          description: "Could not update profile. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Update Failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif font-bold text-amber-900">
            Edit Profile
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-amber-800 hover:bg-amber-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div
              className="h-24 w-24 rounded-full overflow-hidden border-4 border-amber-200 bg-amber-100 mb-2 flex items-center justify-center cursor-pointer"
              onClick={triggerFileInput}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                  onError={(e) =>
                    (e.currentTarget.src = "/default-profile.png")
                  }
                />
              ) : (
                <div className="text-amber-800">Upload</div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfileChange}
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
          <Input
            id='displayName'
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Display Name"
          />
          {errors.displayName && (
            <p className="text-red-500 text-sm">{errors.displayName}</p>
          )}

          <Input
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="Zip Code"
          />
          {errors.zipCode && (
            <p className="text-red-500 text-sm">{errors.zipCode}</p>
          )}

          <Input
            name="socialLinks"
            value={formData.socialLinks}
            onChange={handleChange}
            placeholder="Social Links"
          />

          <Textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Your bio..."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
