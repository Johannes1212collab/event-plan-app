"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { inviteGuest } from "@/actions/email";

interface InviteGuestDialogProps {
    eventId: string;
}

export function InviteGuestDialog({ eventId }: InviteGuestDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState("");

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(() => {
            inviteGuest(eventId, email)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error);
                    } else {
                        toast.success("Invitation sent!");
                        setEmail("");
                        setOpen(false);
                    }
                })
                .catch(() => toast.error("Something went wrong"));
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 active:scale-95 transition-all">
                    <Mail className="h-4 w-4" />
                    Invite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Guest</DialogTitle>
                    <DialogDescription>
                        Send an email invitation to join this event. They will receive a link to view the event details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="email" className="text-sm font-medium">Email address</label>
                        <Input
                            id="email"
                            placeholder="friend@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
