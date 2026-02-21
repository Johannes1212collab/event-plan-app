"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if the user is on an iOS device
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Optional: Listen for successful installation
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            toast.success("EventHub was installed successfully!");
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt && isIOS) {
            // iOS Safari does not support beforeinstallprompt.
            // Provide fallback manual instructions.
            toast("Install EventHub", {
                description: "Tap the Share button at the bottom of Safari, then scroll down and tap 'Add to Home Screen'.",
                duration: 6000,
            });
            return;
        }

        if (!deferredPrompt) {
            toast.info("App is already installed or your browser doesn't support automatic installation.");
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    // If it's already installed (or not iOS and no prompt available), we can either hide the button or just show "EventHub" text
    // But the user requested to replace the "EH EventHub" logo with this button.
    // So we should return the logo, but make it an interactive install button if installable/iOS.

    return (
        <button
            onClick={handleInstallClick}
            className="flex items-center gap-x-2 p-1 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 group relative"
            title="Install EventHub App"
        >
            <div className="h-8 w-8 bg-black rounded-lg text-white flex items-center justify-center font-bold">
                EH
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 hidden sm:block">
                EventHub
            </h1>

            {(isInstallable || isIOS) && (
                <div className="absolute -right-2 -top-2 bg-blue-600 text-white rounded-full p-1 shadow-sm sm:static sm:bg-transparent sm:text-blue-600 sm:p-0 sm:shadow-none sm:ml-2 sm:opacity-0 sm:-translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
            )}
        </button>
    );
}
