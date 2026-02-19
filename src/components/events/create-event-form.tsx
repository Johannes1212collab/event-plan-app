
"use client";

import { useState, useTransition } from "react";
import { createEvent } from "@/actions/event";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export const CreateEventForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const onSubmit = (formData: FormData) => {
        setError("");
        setSuccess("");

        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const date = formData.get("date") as string;
        const location = formData.get("location") as string;

        startTransition(() => {
            createEvent({ title, description, date, location })
                .then((data) => {
                    if (data.error) {
                        setError(data.error);
                    }
                    if (data.success) {
                        setSuccess(data.success);
                        if (data.eventId) {
                            router.push(`/events/${data.eventId}`);
                        }
                    }
                })
                .catch(() => setError("Something went wrong!"));
        });
    };

    return (
        <Card className="w-[600px] shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Create Event</CardTitle>
                <CardDescription className="text-center">Host a new gathering for your friends.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={onSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">Event Title</label>
                            <Input
                                id="title"
                                name="title"
                                disabled={isPending}
                                placeholder="Birthday Party"
                                type="text"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                disabled={isPending}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Let's celebrate..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="date" className="text-sm font-medium">Date & Time</label>
                                <Input
                                    id="date"
                                    name="date"
                                    disabled={isPending}
                                    type="datetime-local"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="location" className="text-sm font-medium">Location</label>
                                <Input
                                    id="location"
                                    name="location"
                                    disabled={isPending}
                                    placeholder="123 Main St"
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" asChild disabled={isPending}>
                            <Link href="/dashboard">Cancel</Link>
                        </Button>
                        <Button disabled={isPending} type="submit">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Event
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
