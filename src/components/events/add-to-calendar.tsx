"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus } from "lucide-react";
import * as ics from "ics";

interface AddToCalendarProps {
    event: {
        title: string;
        description?: string | null;
        date: Date;
        location?: string | null;
        durationHours?: number; // Default logic can be assumed
    };
}

export function AddToCalendar({ event }: AddToCalendarProps) {
    const googleCalendarUrl = () => {
        const startTime = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
        // Default to 2 hours duration if not specified
        const endTime = new Date(new Date(event.date).getTime() + (event.durationHours || 2) * 60 * 60 * 1000)
            .toISOString()
            .replace(/-|:|\.\d\d\d/g, "");

        const url = new URL("https://calendar.google.com/calendar/render");
        url.searchParams.append("action", "TEMPLATE");
        url.searchParams.append("text", event.title);
        url.searchParams.append("dates", `${startTime}/${endTime}`);
        if (event.description) url.searchParams.append("details", event.description);
        if (event.location) url.searchParams.append("location", event.location);

        return url.toString();
    };

    const handleAppleCalendar = async () => {
        const startDate = new Date(event.date);
        // ICS implementation
        const icsEvent: ics.EventAttributes = {
            start: [
                startDate.getFullYear(),
                startDate.getMonth() + 1,
                startDate.getDate(),
                startDate.getHours(),
                startDate.getMinutes(),
            ],
            duration: { hours: event.durationHours || 2, minutes: 0 },
            title: event.title,
            description: event.description || "",
            location: event.location || "",
            status: "CONFIRMED",
            busyStatus: "BUSY",
        };

        const filename = "event.ics";
        const file = await new Promise<File>((resolve, reject) => {
            ics.createEvent(icsEvent, (error, value) => {
                if (error) {
                    reject(error);
                }

                resolve(new File([value], filename, { type: "text/calendar" }));
            });
        });

        const url = URL.createObjectURL(file);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Add to Calendar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <a href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                        Google Calendar
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAppleCalendar} className="cursor-pointer">
                    Apple / Outlook (.ics)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
