"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    MoreHorizontal,
    Mail,
    QrCode,
    Link as LinkIcon,
    Share2
} from "lucide-react";
import { useState } from "react";
import { InviteGuestDialog } from "./invite-guest-dialog"; // Modify InviteGuestDialog to be trigger-able or wrap it?
// Actually, Dialogs usually need to wrap the trigger or be controlled. 
// A DropdownMenuItem cannot easily contain a DialogTrigger without closing the menu.
// Pattern: Control the dialog state manually or use a specific structure.
// Better UX for Dropdown + Dialog:
// The DropdownMenuItem onClick sets a state to open the Dialog, which is rendered OUTSIDE the Dropdown.

import { AddToCalendar } from "./add-to-calendar"; // We might need to refactor this too if it's a dropdown itself.
// AddToCalendar IS a dropdown... Nested dropdowns can be tricky but Shadcn/Radix supports them (Submenu).

import { QRInvite } from "./qr-invite"; // This is a Dialog.
import { toast } from "sonner";

interface EventActionsMenuProps {
    event: any; // Type strictly if possible, or use the type from Prisma
}

export const EventActionsMenu = ({ event }: EventActionsMenuProps) => {
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showQRDialog, setShowQRDialog] = useState(false);

    // We need to reconstruct the QRInvite and InviteGuestDialog to handle "controlled" open state 
    // OR just render them here and trigger them.
    // Actually, Shadcn Dialog has `open` and `onOpenChange` props.

    const handleCopyLink = () => {
        const url = `${window.location.origin}/events/${event.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Event link copied to clipboard!");
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share / Options
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Event Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Add to Calendar - This usually opens its own dropdown. 
              For simplicity in this menu, maybe just link to Google Calendar directly? 
              OR use a Submenu. Let's try Subcontent if AddToCalendar allows, 
              but AddToCalendar component encapsulates its own button. 
              
              Refactoring AddToCalendar to be a SubMenu would be best, 
              but for now, let's keep it simple: 
              We can just render the "AddToCalendar" logic here.
          */}
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        {/* We need to refactor AddToCalendar to act as a proper sub-menu or just extract the logic. 
                  Let's assume for now user is okay with a cleaner top level, 
                  maybe just "Google Calendar" and "iCal" as items here? 
              */}
                        <div className="w-full" onClick={(e) => e.stopPropagation()}>
                            {/* HACK: Existing component has its own trigger. 
                   We should probably NOT nest the existing component if it has a button.
                   Let's use the AddToCalendar logic directly or refactor it.
                   
                   Let's Refactor AddToCalendar in a subsequent step? 
                   No, let's try to make it work smoothly.
                   
                   Actually, "Add to Calendar" is complex. 
                   Let's make a "Copy Link" item first.
               */}
                        </div>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Add to Calendar...</span>
                        {/* This is getting complicated with nested existing components. 
                  Easiest path: Copy Link, Email, QR are updated. 
                  Calendar: Just extract the Google URL generation here?
              */}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Invite via Email</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setShowQRDialog(true)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        <span>Show QR Code</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleCopyLink}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        <span>Copy Link</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Render the Dialogs controlled by state */}
            <InviteGuestDialog
                eventId={event.id}
                open={showInviteDialog}
                onOpenChange={setShowInviteDialog}
            />

            {/* We need to update existing components to accept 'open' props if they don't */}
            <QRInvite
                open={showQRDialog}
                onOpenChange={setShowQRDialog}
            // We might need to pass event URL or ID if it's not hardcoded context
            />
        </>
    );
};
