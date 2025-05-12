"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  BookMarked,
  Music,
  Coffee,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  type: "single" | "multiple" | "slider" | "text";
  options?: {
    id: string;
    text: string;
    icon?: React.ReactNode;
    image?: string;
  }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface UserProfileQuizProps {
  onComplete: (answers: Record<string, any>) => Promise<boolean>;
  onSkip?: () => void;
  isOpen: boolean;
}

export default function UserProfileQuiz({
  onComplete,
  onSkip,
  isOpen,
}: UserProfileQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // If the component is not open, don't render anything
  if (!isOpen) return null;

  // Quiz questions
  const questions: QuizQuestion[] = [
    {
      id: "reading_frequency",
      question: "How often do you read books?",
      description:
        "We'll use this to suggest a reading pace that works for you",
      type: "single",
      options: [
        { id: "daily", text: "Daily", icon: <BookOpen className="h-6 w-6" /> },
        { id: "weekly", text: "Weekly", icon: <Clock className="h-6 w-6" /> },
        {
          id: "monthly",
          text: "Monthly",
          icon: <BookMarked className="h-6 w-6" />,
        },
        { id: "rarely", text: "Rarely", icon: <Coffee className="h-6 w-6" /> },
      ],
    },
    {
      id: "favorite_genres",
      question: "What genres do you enjoy reading?",
      description: "Select as many as you'd like",
      type: "multiple",
      options: [
        { id: "fiction", text: "Fiction" },
        { id: "non_fiction", text: "Non-Fiction" },
        { id: "mystery", text: "Mystery/Thriller" },
        { id: "fantasy", text: "Fantasy" },
        { id: "sci_fi", text: "Science Fiction" },
        { id: "romance", text: "Romance" },
        { id: "biography", text: "Biography" },
        { id: "history", text: "History" },
        { id: "self_help", text: "Self-Help" },
        { id: "poetry", text: "Poetry" },
      ],
    },
    {
      id: "reading_environment",
      question: "How do you prefer to read?",
      type: "single",
      options: [
        {
          id: "physical",
          text: "Physical Books",
          icon: <BookOpen className="h-6 w-6" />,
        },
        {
          id: "ebook",
          text: "E-Books",
          icon: <BookMarked className="h-6 w-6" />,
        },
        {
          id: "audiobook",
          text: "Audiobooks",
          icon: <Music className="h-6 w-6" />,
        },
        {
          id: "mix",
          text: "Mix of Formats",
          icon: <Coffee className="h-6 w-6" />,
        },
      ],
    },
    {
      id: "reading_time",
      question: "When do you usually read?",
      type: "single",
      options: [
        { id: "morning", text: "Morning", icon: <Sun className="h-6 w-6" /> },
        {
          id: "afternoon",
          text: "Afternoon",
          icon: <Coffee className="h-6 w-6" />,
        },
        { id: "evening", text: "Evening", icon: <Moon className="h-6 w-6" /> },
        {
          id: "bedtime",
          text: "Before bed",
          icon: <Moon className="h-6 w-6" />,
        },
        {
          id: "anytime",
          text: "Whenever I can",
          icon: <Clock className="h-6 w-6" />,
        },
      ],
    },
    {
      id: "books_per_year",
      question: "How many books would you like to read this year?",
      description: "We'll help you track your reading goal",
      type: "slider",
      min: 1,
      max: 100,
    },
    {
      id: "favorite_book",
      question: "What's one of your favorite books?",
      description: "We'll use this to recommend similar books you might enjoy",
      type: "text",
      placeholder: "Enter book title...",
    },
  ];

  const handleSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    // Auto-advance to next question after selection
    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 500);
    }
  };

  const handleMultipleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      if (currentAnswers.includes(optionId)) {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((id: string) => id !== optionId),
        };
      } else {
        return { ...prev, [questionId]: [...currentAnswers, optionId] };
      }
    });
  };

  const handleSliderChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await onComplete(answers);
      if (success) {
        toast({
          title: "Profile updated!",
          description: "Your reading preferences have been saved.",
          variant: "default",
        });
        // Redirect to home or dashboard
        router.push("/");
      } else {
        toast({
          title: "Error saving preferences",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving quiz answers:", error);
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      router.push("/");
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-amber-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-serif font-bold text-amber-900">
              Tell us about your reading preferences
            </h2>
            <span className="text-sm text-amber-600">
              {currentStep + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-amber-100" />
        </div>

        <div className="my-8">
          <h3 className="text-xl font-medium text-amber-900 mb-2">
            {currentQuestion.question}
          </h3>
          {currentQuestion.description && (
            <p className="text-amber-700 mb-6">{currentQuestion.description}</p>
          )}

          {/* Question Types */}
          {currentQuestion.type === "single" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option.id}
                  onClick={() =>
                    handleSingleChoice(currentQuestion.id, option.id)
                  }
                  className={`flex items-center p-4 rounded-lg border text-left transition-colors hover:bg-amber-50 
                    ${
                      answers[currentQuestion.id] === option.id
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                        : "border-amber-200"
                    }`}
                >
                  {option.icon && (
                    <div className="mr-3 text-amber-600">{option.icon}</div>
                  )}
                  <div className="flex-1">
                    <span className="font-medium text-amber-900">
                      {option.text}
                    </span>
                  </div>
                  {answers[currentQuestion.id] === option.id && (
                    <Check className="h-5 w-5 text-amber-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multiple" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentQuestion.options?.map((option) => {
                const isSelected = answers[currentQuestion.id]?.includes(
                  option.id
                );
                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      handleMultipleChoice(currentQuestion.id, option.id)
                    }
                    className={`p-3 rounded-lg border text-center transition-colors hover:bg-amber-50 
                      ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 ring-1 ring-amber-200"
                          : "border-amber-200"
                      }`}
                  >
                    <span className="block font-medium text-amber-900">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === "slider" && (
            <div className="my-8 px-4">
              <div className="flex justify-between mb-2">
                <span className="text-amber-700">
                  {currentQuestion.min || 1}
                </span>
                <span className="text-2xl font-bold text-amber-800">
                  {answers[currentQuestion.id] || 12}
                </span>
                <span className="text-amber-700">
                  {currentQuestion.max || 100}+
                </span>
              </div>
              <input
                type="range"
                min={currentQuestion.min || 1}
                max={currentQuestion.max || 100}
                value={answers[currentQuestion.id] || 12}
                onChange={(e) =>
                  handleSliderChange(
                    currentQuestion.id,
                    parseInt(e.target.value)
                  )
                }
                className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {currentQuestion.type === "text" && (
            <div className="mt-4">
              <input
                type="text"
                placeholder={currentQuestion.placeholder}
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleTextChange(currentQuestion.id, e.target.value)
                }
                className="w-full p-3 border border-amber-200 rounded-lg bg-amber-50 focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
          >
            Skip for now
          </Button>

          <div className="flex space-x-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={isSubmitting}
                className="border-amber-300 text-amber-800"
              >
                Back
              </Button>
            )}

            {currentStep < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={
                  currentQuestion.type !== "multiple" &&
                  !answers[currentQuestion.id] &&
                  currentQuestion.type !== "slider"
                }
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? "Saving..." : "Finish"}
                {!isSubmitting && <Check className="ml-1 h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? "bg-amber-600" : "bg-amber-200"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
}
