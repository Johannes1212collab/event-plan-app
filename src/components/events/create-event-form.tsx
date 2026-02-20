
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

import LocationPicker from "@/components/events/location-picker";

export const CreateEventForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const [locationData, setLocationData] = useState<{ address: string; lat: number; lng: number } | null>(null);
    const [isFullDay, setIsFullDay] = useState(false);

    // Default initial dates
    const initialDate = new Date();
    const [datePart, setDatePart] = useState(initialDate.toISOString().split('T')[0]);
    // Round to next hour
    initialDate.setHours(initialDate.getHours() + 1, 0, 0, 0);
    const [timePart, setTimePart] = useState(initialDate.toTimeString().slice(0, 5));

    const router = useRouter();

    const onSubmit = (formData: FormData) => {
        setError("");
        setSuccess("");

        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const _isFullDay = formData.get("isFullDay") === "on";

        // Construct the combined date string properly
        const combinedDateString = _isFullDay
            ? `${datePart}T00:00:00.000Z`
            : new Date(`${datePart}T${timePart}`).toISOString();

        // Use location from state if available, otherwise form data (fallback) -> actually just override with state if present
        const location = locationData ? locationData.address : (formData.get("location") as string);
        const lat = locationData?.lat;
        const lng = locationData?.lng;

        startTransition(() => {
            createEvent({ title, description, date: combinedDateString, isFullDay: _isFullDay, location, lat, lng })
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
                                <div className="flex items-center justify-between">
                                    <label htmlFor="date" className="text-sm font-medium">Date & Time</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="isFullDay"
                                            name="isFullDay"
                                            checked={isFullDay}
                                            onChange={(e) => setIsFullDay(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="isFullDay" className="text-sm font-medium text-slate-700 cursor-pointer">Full Day</label>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        id="datePart"
                                        name="datePart"
                                        disabled={isPending}
                                        type="date"
                                        value={datePart}
                                        onChange={(e) => setDatePart(e.target.value)}
                                        required
                                        className="flex-1 text-slate-900 border-slate-300"
                                    />
                                    {!isFullDay && (
                                        <Input
                                            id="timePart"
                                            name="timePart"
                                            disabled={isPending}
                                            type="time"
                                            value={timePart}
                                            onChange={(e) => setTimePart(e.target.value)}
                                            required
                                            className="w-32 text-slate-900 border-slate-300"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <LocationPicker
                                    onLocationSelect={(address, lat, lng) => setLocationData({ address, lat, lng })}
                                />
                                <input type="hidden" name="location" value={locationData?.address || ""} />
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
