"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, BellOff } from "lucide-react";

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function NotificationsManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);

        // If they already have a subscription, we should sync it with our DB just in case
        // they logged into a new account on this same browser
        if (subscription) {
            await fetch('/api/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });
        }
    };

    const subscribeButtonOnClick = async () => {
        if (!publicVapidKey) {
            toast.error("Push Notifications are not configured on this server.");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            });

            const response = await fetch('/api/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });

            if (response.ok) {
                setIsSubscribed(true);
                toast.success("Push notifications enabled!");
            } else {
                throw new Error("Failed to save subscription to database");
            }
        } catch (error: any) {
            console.error('Error subscribing to push notifications:', error);
            if (Notification.permission === 'denied') {
                toast.error("You blocked notifications in your browser settings. Please unblock EventHub to receive alerts.");
            } else {
                toast.error("Failed to enable notifications.");
            }
        }
    };

    const unsubscribeButtonOnClick = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Remove from our database first
                await fetch('/api/push', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });

                // Unsubscribe from browser
                await subscription.unsubscribe();
                setIsSubscribed(false);
                toast("Push notifications disabled.");
            }
        } catch (error) {
            console.error("Error unsubscribing", error);
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <button
            onClick={isSubscribed ? unsubscribeButtonOnClick : subscribeButtonOnClick}
            className={`flex items-center gap-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isSubscribed
                    ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 shadow-sm'
                }`}
        >
            {isSubscribed ? (
                <>
                    <BellOff className="h-3.5 w-3.5" />
                    <span>Disable Alerts</span>
                </>
            ) : (
                <>
                    <BellRing className="h-3.5 w-3.5" />
                    <span>Enable Chat Alerts</span>
                </>
            )}
        </button>
    );
}
