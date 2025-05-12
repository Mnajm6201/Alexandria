"use client"

import type React from "react"

import { useState } from "react"
import { Book, PlusCircle, Save } from "lucide-react"
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

    type NewEntryModalProps = {
    journalId: string
    bookTitle: string
    }

    export function NewEntryModal({ journalId, bookTitle }: NewEntryModalProps) {
    const [open, setOpen] = useState(false)
    const [entryData, setEntryData] = useState({
        title: "",
        pages: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setEntryData((prev) => ({ ...prev, [id]: value }))
    }

    const handleSave = () => {
        // In a real app, this would save the new entry to a database
        console.log("Saving new entry for journal:", journalId, entryData)
        setOpen(false)
        setEntryData({
        title: "",
        pages: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Entry
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
            <DialogTitle>Create New Journal Entry</DialogTitle>
            <DialogDescription>Add a new entry to your {bookTitle} reading journal.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="title">Entry Title</Label>
                <Input
                id="title"
                placeholder="Give your entry a title..."
                value={entryData.title}
                onChange={handleChange}
                />
            </div>

            <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={entryData.date} onChange={handleChange} />
                </div>
                <div className="space-y-2 flex-1">
                <Label htmlFor="pages">Book Pages</Label>
                <div className="flex items-center">
                    <Book className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Input id="pages" placeholder="e.g. 51-75" value={entryData.pages} onChange={handleChange} />
                </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Journal Entry</Label>
                <Textarea
                id="content"
                placeholder="Write your thoughts about these pages..."
                className="min-h-[200px] font-serif"
                value={entryData.content}
                onChange={handleChange}
                />
            </div>
            </div>
            <DialogFooter>
            <Button onClick={handleSave} disabled={!entryData.title || !entryData.pages}>
                <Save className="mr-2 h-4 w-4" />
                Save Entry
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    )
}
