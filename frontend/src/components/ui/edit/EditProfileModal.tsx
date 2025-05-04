import { useState, useEffect, useRef } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { X } from "lucide-react";

// Defining the props interface for the modal
/* 
    The interface definition are:
    isOpen: if the modal is opened
    onClose: a function that executes when the modal is closed
    onSave: a function with storing the profileData after the profileData is filled or whatever the use has edited
    initialData: the original data before we make an edit
*/
interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: ProfileData) => void;
  initialData: ProfileData;
}

/* 
    The interface of the profile data
    displayName: the name of the user (username)
    bio: the bio of the user
    tags: the tags stored in for users like based on the achievements they've gotten
*/
interface ProfileData {
  displayName: string;
  bio: string;
  zipCode?: string;
  profilePicture?: File | null;
  profilePicUrl?: string;
}
/*
    formData, setFormData: a useState that handles state change
*/
export function EditProfileModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>(initialData);

  // State validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for image preview
  const [previewUrl, setPreviewUrl] = useState<string>(initialData.profilePicUrl || "");
  
  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Update form data when initial data changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);

      // Checking if the url already incldues the full server path if its use it directly 
      // Otherwise we'll prepend the server url if needed
      if(initialData.profilePicUrl){
        const url = initialData.profilePicUrl;
        if(url.startsWith("http") || !url.startsWith("/")){
          setPreviewUrl(url);
        }
        else{
          setPreviewUrl(`http://localhost:8000${url}`);
        }
      }
      else{
        setPreviewUrl('');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Handle the input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handling profile pic change
  const handleProfileChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    // store the file from the event
    const file = e.target.files?.[0];

    // Validate the file if it's not empty
    if (file){
      // Create an preview url
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Update the data with the new preview url
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };

  // clean up the object url when component unmounts
  useEffect(() => {
    return () => {
      if(previewUrl && previewUrl.startsWith("blob")){
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [previewUrl]);

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };



  // Validate zip code (US Format for now)
  const validateZipCode = (zipCode: string) => {
    // basic regex format for us zipcode
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }


  // handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate input
    const newErrors : Record<string, string> = {};

    if (!formData.displayName.trim()){
      newErrors.displayName = "Name is required";
    }

    if (formData.zipCode && !validateZipCode(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid zip code";
    }

    // If errors exist, stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);


    try{
      // Saving the data to the parent component for API processing
      onSave(formData);
      onClose();
    }
    catch(error){
      console.error('Error submitting form', error);
    }
    finally{
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
          {/* Profile Picture Upload */}
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
                  onError={(e) => {
                    console.error("Error loading profile image:", previewUrl);
                    // Set a fallback if image fails to load
                    e.currentTarget.src = "/default-profile.png";
                  }}
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

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-amber-800 mb-1"
            >
              Display Name
            </label>
            <Input
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="border-amber-300 bg-amber-50 focus-visible:ring-amber-600"
            />
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* New Zip Code Field */}
          <div>
            <label
              htmlFor="zipCode"
              className="block text-sm font-medium text-amber-800 mb-1"
            >
              Zip Code
            </label>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode || ""}
              onChange={handleChange}
              placeholder="Enter your zip code"
              className="border-amber-300 bg-amber-50 focus-visible:ring-amber-600"
            />
            {errors.zipCode && (
              <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
            )}
            <p className="text-xs text-amber-700 mt-1">
              We only collect your zip code to help find libraries near you.
            </p>
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-amber-800 mb-1"
            >
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="border-amber-300 bg-amber-50 focus-visible:ring-amber-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-amber-300 text-amber-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-800 text-amber-50 hover:bg-amber-700"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
