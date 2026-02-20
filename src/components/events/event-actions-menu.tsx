"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    MoreHorizontal,
    Mail,
    QrCode,
    Link as LinkIcon,
    Share2,
    CalendarPlus,
    CalendarCheck
} from "lucide-react";
import { useState } from "react";
import { InviteGuestDialog } from "./invite-guest-dialog";
// Actually, Dialogs usually need to wrap the trigger or be controlled. 
// A DropdownMenuItem cannot easily contain a DialogTrigger without closing the menu.
// Pattern: Control the dialog state manually or use a specific structure.
// Better UX for Dropdown + Dialog:
// The DropdownMenuItem onClick sets a state to open the Dialog, which is rendered OUTSIDE the Dropdown.

// We might need to refactor this too if it's a dropdown itself.
// AddToCalendar IS a dropdown... Nested dropdowns can be tricky but Shadcn/Radix supports them (Submenu).

import { QRInvite } from "./qr-invite"; // This is a Dialog.
import { toast } from "sonner";
import * as ics from "ics";

interface EventActionsMenuProps {
    event: {
        id: string;
        title: string;
        description?: string | null;
        date: Date;
        location?: string | null;
        durationHours?: number;
    };
}

export const EventActionsMenu = ({ event }: EventActionsMenuProps) => {
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showQRDialog, setShowQRDialog] = useState(false);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/events/${event.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Event link copied to clipboard!");
    };

    const googleCalendarUrl = () => {
        const startTime = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
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
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 active:scale-95 transition-all">
                        <Share2 className="h-4 w-4" />
                        Share / Options
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Event Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Invite via Email</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setShowQRDialog(true)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        <span>Show QR Code</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleCopyLink}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        <span>Copy Link</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            <span>Add to Calendar</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem asChild>
                                <a href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="cursor-pointer flex items-center w-full">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Google Calendar</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleAppleCalendar} className="cursor-pointer">
                                <CalendarCheck className="mr-2 h-4 w-4" />
                                <span>Apple / Outlook (.ics)</span>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                </DropdownMenuContent>
            </DropdownMenu>

            <InviteGuestDialog
                eventId={event.id}
                open={showInviteDialog}
                onOpenChange={setShowInviteDialog}
            />

            <QRInvite
                open={showQRDialog}
                onOpenChange={setShowQRDialog}
            />
        </>
    );
};
