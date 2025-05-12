import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Book, Save } from "lucide-react"
import Link from "next/link"

export default function EntryPage({
    params,
    }: {
    params: { id: string; entryId: string }
    }) {
    // Mock data for a specific entry
    const entry = {
        id: params.entryId,
        journalId: params.id,
        bookTitle: "Dune",
        title: "The spice must flow",
        pages: "51-75",
        content: `The economic and political implications of the spice melange are fascinating. It's the most valuable substance in the universe, and whoever controls it has immense power.

    The Spacing Guild's monopoly on interstellar travel depends entirely on the spice, which gives their navigators the ability to fold space. Without it, the entire galactic economy would collapse.

    Herbert creates a brilliant parallel to our world's dependence on oil and other natural resources. The spice represents both wealth and addiction - the elite need it to maintain their power, yet they're enslaved by this dependency.

    The Fremen's relationship with the spice is different - they live with it as part of their ecosystem rather than exploiting it purely for gain. Their sustainable approach contrasts sharply with the Empire's extractive methods.

    Questions to explore further:
    - How does the spice economy mirror real-world resource politics?
    - What does Herbert suggest about the relationship between resource control and political power?
    - Is there an environmental message in how different groups approach spice harvesting?`,
        date: "April 20, 2025",
    }

    return (
        <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
            <Link href={`/journals/journal/${entry.journalId}`} className="flex items-center text-primary mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {entry.bookTitle} Journal
            </Link>

            <div className="grid gap-6 max-w-3xl mx-auto">
            <Card className="p-6">
                <form className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Entry Title</Label>
                    <Input id="title" defaultValue={entry.title} />
                </div>

                <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" defaultValue="2025-04-20" />
                    </div>
                    <div className="space-y-2 flex-1">
                    <Label htmlFor="pages">Book Pages</Label>
                    <div className="flex items-center">
                        <Book className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Input id="pages" defaultValue={entry.pages} placeholder="e.g. 51-75" />
                    </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="content">Journal Entry</Label>
                    <Textarea id="content" defaultValue={entry.content} className="min-h-[300px] font-serif" />
                </div>

                <Button className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Entry
                </Button>
                </form>
            </Card>
            </div>
        </main>
        </div>
    )
}
