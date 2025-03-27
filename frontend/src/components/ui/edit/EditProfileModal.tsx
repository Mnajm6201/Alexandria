import { useState, useEffect } from "react";
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

  // Update form data when initial data changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
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


  // handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
              className="border-amber-300 text-amber-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-800 text-amber-50 hover:bg-amber-700"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
