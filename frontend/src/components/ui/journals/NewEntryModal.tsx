"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormPrivacySlider } from "@/components/ui/privacy-slider"
import { Plus, Loader2 } from "lucide-react"
import { useJWToken } from "@/utils/getJWToken"
import { toast } from "@/hooks/use-toast"

interface NewEntryModalProps {
  journalId: number
  onEntryCreated?: () => void
}

interface CreateEntryData {
  title: string
  content: string
  page_num: number | null
  is_private: boolean
  journal: number
}

export function NewEntryModal({ journalId, onEntryCreated }: NewEntryModalProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    page_num: "",
    is_private: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { jwtToken, fetchJWToken } = useJWToken()

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
      setIsCreating(true)

      const token = jwtToken || await fetchJWToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in.",
          variant: "destructive",
        })
        return
      }

      const entryData: CreateEntryData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        page_num: formData.page_num ? Number(formData.page_num) : null,
        is_private: formData.is_private,
        journal: journalId
      }

      console.log('Creating entry:', entryData)

      const response = await fetch('http://localhost:8000/api/entries/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Entry creation failed:', errorData)
        
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
        
        throw new Error(`Failed to create entry: ${response.status}`)
      }

      const createdEntry = await response.json()
      console.log('Entry created successfully:', createdEntry)

      // Reset form
      setFormData({
        title: "",
        content: "",
        page_num: "",
        is_private: false
      })
      setErrors({})

      // Close modal and notify parent
      setOpen(false)
      if (onEntryCreated) {
        onEntryCreated()
      }

    } catch (err) {
      console.error('Error creating entry:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
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
    if (!isCreating) {
      setOpen(false)
      setFormData({
        title: "",
        content: "",
        page_num: "",
        is_private: false
      })
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Journal Entry</DialogTitle>
          <DialogDescription>
            Add a new entry to document your reading progress and thoughts.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter a title for this entry..."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={isCreating}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_num">Page Number (optional)</Label>
            <Input
              id="page_num"
              type="number"
              min="1"
              placeholder="e.g., 45"
              value={formData.page_num}
              onChange={(e) => handleInputChange("page_num", e.target.value)}
              disabled={isCreating}
              className={errors.page_num ? "border-red-500" : ""}
            />
            {errors.page_num && (
              <p className="text-sm text-red-500">{errors.page_num}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, insights, favorite quotes, or analysis..."
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              disabled={isCreating}
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
                disabled={isCreating}
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

          {errors.journal && (
            <p className="text-sm text-red-500">{errors.journal}</p>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Entry
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}