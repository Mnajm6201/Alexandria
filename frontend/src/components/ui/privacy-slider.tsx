"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FormPrivacySliderProps {
  value?: boolean
  onValueChange?: (value: boolean) => void
  className?: string
  disabled?: boolean
}

export function FormPrivacySlider({ 
  value = false, 
  onValueChange, 
  className,
  disabled = false
}: FormPrivacySliderProps) {
  const handleToggle = (newIsPrivate: boolean) => {
    if (disabled) return
    onValueChange?.(newIsPrivate)
  }

  return (
    <div className={cn("relative inline-flex", className)}>
      <div className={cn(
        "relative flex bg-gray-200 rounded-lg p-1 w-48 h-10",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {/* Sliding background bar */}
        <div
          className={cn(
            "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all duration-300 ease-in-out shadow-sm border border-gray-400",
            value
              ? "left-[calc(50%+2px)] bg-gradient-to-r from-red-800 to-red-900"
              : "left-1 bg-gradient-to-r from-amber-600 to-amber-700",
          )}
        />

        {/* Public button */}
        <button
          type="button"
          onClick={() => handleToggle(false)}
          disabled={disabled}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center text-sm font-medium transition-all duration-300 rounded-md",
            !value ? "text-white drop-shadow-sm" : "text-gray-500 hover:text-gray-700",
            disabled && "cursor-not-allowed"
          )}
        >
          Public
        </button>

        {/* Private button */}
        <button
          type="button"
          onClick={() => handleToggle(true)}
          disabled={disabled}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center text-sm font-medium transition-all duration-300 rounded-md",
            value ? "text-white drop-shadow-sm" : "text-gray-500 hover:text-gray-700",
            disabled && "cursor-not-allowed"
          )}
        >
          Private
        </button>
      </div>
    </div>
  )
}