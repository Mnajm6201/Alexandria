"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormPrivacySlider } from "@/components/ui/privacy-slider"
import { Edit, Loader2, Save } from "lucide-react"
import { useJWToken } from "@/utils/getJWToken"
import { toast } from "@/hooks/use-toast"

interface JournalEntry {
  id: number
  title: string
  content: string
  page_num: number | null
  is_private: boolean
  created_on: string
  updated_on: string
}

interface EditEntryModalProps {
  entry: JournalEntry
  onEntryUpdated?: () => void
}

export function EditEntryModal({ entry, onEntryUpdated }: EditEntryModalProps) {
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    title: entry.title,
    content: entry.content,
    page_num: entry.page_num?.toString() || "",
    is_private: entry.is_private
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { jwtToken, fetchJWToken } = useJWToken()

  // Reset form data when entry changes
  useEffect(() => {
    setFormData({
      title: entry.title,
      content: entry.content,
      page_num: entry.page_num?.toString() || "",
      is_private: entry.is_private
    })
    setErrors({})
  }, [entry])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required"
    }

    if (formData.page_num && isNaN(Number(formData.page_num))) {
      newErrors.page_num = "Page number must be a valid number"
    }

    if (formData.page_num && Number(formData.page_num) < 1) {
      newErrors.page_num = "Page number must be greater than 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsUpdating(true)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in.",
          variant: "destructive",
        })
        return
      }

      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        page_num: formData.page_num ? Number(formData.page_num) : null,
        is_private: formData.is_private
      }

      console.log('Updating entry:', updateData)

      const response = await fetch(`http://localhost:8000/api/entries/${entry.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Entry update failed:', errorData)
        
        // Handle validation errors from backend
        if (response.status === 400 && errorData) {
          const backendErrors: Record<string, string> = {}
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              backendErrors[key] = errorData[key][0]
            } else {
              backendErrors[key] = errorData[key]
            }
          })
          setErrors(backendErrors)
          return
        }
        
        throw new Error(`Failed to update entry: ${response.status}`)
      }

      const updatedEntry = await response.json()
      console.log('Entry updated successfully:', updatedEntry)

      // Close modal and notify parent
      setOpen(false)
      if (onEntryUpdated) {
        onEntryUpdated()
      }

      toast({
        title: "Success",
        description: "Entry updated successfully!",
      })

    } catch (err) {
      console.error('Error updating entry:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handlePrivacyChange = (isPrivate: boolean) => {
    handleInputChange("is_private", isPrivate)
  }

  const handleClose = () => {
    if (!isUpdating) {
      setOpen(false)
      // Reset form to original values
      setFormData({
        title: entry.title,
        content: entry.content,
        page_num: entry.page_num?.toString() || "",
        is_private: entry.is_private
      })
      setErrors({})
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Edit className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
            <DialogDescription>
              Make changes to your journal entry. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Enter a title for this entry..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                disabled={isUpdating}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-page_num">Page Number (optional)</Label>
              <Input
                id="edit-page_num"
                type="number"
                min="1"
                placeholder="e.g., 45"
                value={formData.page_num}
                onChange={(e) => handleInputChange("page_num", e.target.value)}
                disabled={isUpdating}
                className={errors.page_num ? "border-red-500" : ""}
              />
              {errors.page_num && (
                <p className="text-sm text-red-500">{errors.page_num}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                placeholder="Share your thoughts, insights, favorite quotes, or analysis..."
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                disabled={isUpdating}
                className={`min-h-[120px] ${errors.content ? "border-red-500" : ""}`}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Entry Privacy</Label>
              <div className="flex flex-col gap-2">
                <FormPrivacySlider
                  value={formData.is_private}
                  onValueChange={handlePrivacyChange}
                  disabled={isUpdating}
                  className="self-start"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.is_private 
                    ? "This entry will be private and only visible to you" 
                    : "This entry will be public (visible to others if journal is public)"
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}