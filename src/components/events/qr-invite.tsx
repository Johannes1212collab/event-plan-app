"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";

export function QRInvite() {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUrl(window.location.href);
        }
    }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">QR Code</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite via QR Code</DialogTitle>
                    <DialogDescription>
                        Share this QR code with friends to let them join the event instantly.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        {url && (
                            <QRCode
                                size={256}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={url}
                                viewBox={`0 0 256 256`}
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
