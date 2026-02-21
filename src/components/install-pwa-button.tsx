"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);

    useEffect(() => {
        // Check if the user is on an iOS device
        const userAgent = (window.navigator.userAgent || window.navigator.vendor).toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // Check if the user is on an Android device for fallback text
        setIsAndroid(/android/.test(userAgent));

        // Check for common in-app browsers (Facebook, Instagram, TikTok, Snapchat, WeChat, etc)
        setIsInAppBrowser(/fbav|fban|instagram|tiktok|line|snapchat|wechat|micromessenger/i.test(userAgent));

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
        if (isInAppBrowser) {
            toast("Open in System Browser", {
                description: "You are viewing this inside another app. Please tap the menu icon (⋮) in the top corner and select 'Open in Chrome/Safari' to install EventHub.",
                duration: 8000,
            });
            return;
        }

        if (!deferredPrompt && isIOS) {
            // iOS Safari does not support beforeinstallprompt.
            // Provide fallback manual instructions.
            toast("Install EventHub", {
                description: "Tap the Share button at the bottom of Safari, then scroll down and tap 'Add to Home Screen'.",
                duration: 6000,
            });
            return;
        }

        if (!deferredPrompt && isAndroid) {
            // Android browsers like Samsung Internet or Chrome sometimes suppress the prompt.
            toast("Install EventHub", {
                description: "Tap the menu icon (⋮ or 三) in your browser, then select 'Install app' or 'Add to Home screen'.",
                duration: 6000,
            });
            return;
        }

        if (!deferredPrompt) {
            toast.info("App is already installed, or your browser window doesn't support automatic installation.");
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
            className="flex items-center gap-x-2 p-1.5 -ml-1.5 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 group text-left"
            title="Install EventHub App"
        >
            <div className="h-8 w-8 bg-black rounded-lg text-white flex items-center justify-center font-bold shrink-0">
                EH
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 hidden sm:block leading-none">
                    EventHub
                </h1>
                {(isInstallable || isIOS || isAndroid) && (
                    <span className="text-[11px] sm:text-xs font-semibold text-blue-600 flex items-center gap-x-1 whitespace-nowrap mt-0.5 group-hover:text-blue-700 transition-colors">
                        <Download className="h-3 w-3" /> Install EventHub now
                    </span>
                )}
            </div>
        </button>
    );
}
