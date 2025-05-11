"use client";

import React, { useState, useEffect } from "react";
import { useJWToken } from "@/utils/getJWToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReadingProgressProps {
  clubId: string;
  clubData: any;
  currentBook: any;
  onRefresh?: () => void;
}

export function ReadingProgress({
  clubId,
  clubData,
  currentBook,
  onRefresh,
}: ReadingProgressProps) {
  const [readingStatus, setReadingStatus] = useState<string>("Not Started");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [currentPageInput, setCurrentPageInput] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { jwtToken, fetchJWToken } = useJWToken();

  // Fetch JWT token on mount
  useEffect(() => {
    fetchJWToken();
  }, [fetchJWToken]);

  // Fetch current reading progress when component mounts
  useEffect(() => {
    const fetchReadingProgress = async () => {
      if (!jwtToken || !clubId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:8000/api/bookclubs/clubs/${clubId}/progress/`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch reading progress: ${response.status}`
          );
        }

        const data = await response.json();
        setReadingStatus(data.reading_status || "Not Started");

        // Setting different states
        const pageNumber = data.current_page || 0;
        setCurrentPage(pageNumber);
        setCurrentPageInput(String(pageNumber));
      } catch (err) {
        console.error("Error fetching reading progress:", err);
        setError("Failed to load your reading progress.");
      } finally {
        setLoading(false);
      }
    };

    if (jwtToken && clubId) {
      fetchReadingProgress();
    }
  }, [jwtToken, clubId]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Always update the string input state
    setCurrentPageInput(inputValue);

    // Only update the number state if we have a valid number
    if (inputValue.trim() === "") {
      // Don't convert empty string to 0, keep the string value
      setCurrentPage(0); // But keep the numeric state at 0
    } else {
      const parsed = parseInt(inputValue, 10);
      if (!isNaN(parsed)) {
        setCurrentPage(parsed);
      }
    }
  };

  // Function to update reading progress
  const handleUpdateProgress = async () => {
    if (!jwtToken || !clubId) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/api/bookclubs/clubs/${clubId}/progress/update/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reading_status: readingStatus,
            current_page: currentPage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update reading progress: ${response.status}`
        );
      }

      toast({
        title: "Progress Updated",
        description: "Your reading progress has been saved.",
        variant: "default",
      });

      if(onRefresh){
        onRefresh();
      }
      
    } catch (err) {
      console.error("Error updating reading progress:", err);
      setError("Failed to update your reading progress.");

      toast({
        title: "Error",
        description:
          "Failed to update your reading progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // If still loading
  if (loading) {
    return (
      <div className="text-amber-800 p-4 text-center">
        Loading your reading progress...
      </div>
    );
  }

  // Display component
  return (
    <Card className="border-amber-200 bg-amber-50 mb-6">
      <CardHeader>
        <CardTitle className="text-amber-900 flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-amber-700" />
          Your Reading Progress
        </CardTitle>
        {currentBook && (
          <CardDescription className="text-amber-700">
            {currentBook.book_details?.title || "Current Book"}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm p-2 bg-red-50 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reading-status" className="text-amber-800">
            Reading Status
          </Label>
          <Select value={readingStatus} onValueChange={setReadingStatus}>
            <SelectTrigger className="bg-white border-amber-300">
              <SelectValue placeholder="Select your reading status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="Reading">Currently Reading</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current-page" className="text-amber-800">
            Current Page
          </Label>
          <Input
            id="current-page"
            type="textr"
            value={currentPageInput}
            onChange={handlePageInputChange}
            className="bg-white border-amber-300"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpdateProgress}
          disabled={saving}
          className="bg-amber-800 text-amber-50 hover:bg-amber-700 w-full"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Progress
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
