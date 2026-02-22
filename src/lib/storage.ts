import { del } from '@vercel/blob';

/**
 * Deletes one or more files from cloud storage (Vercel Blob).
 * Abstracted to easily swap storage providers in the future.
 * 
 * @param urls A single URL or an array of URLs to delete.
 */
export const deleteMedia = async (urls: string | string[]) => {
    if (!urls || (Array.isArray(urls) && urls.length === 0)) {
        return;
    }

    try {
        await del(urls);
    } catch (error) {
        console.error("Failed to delete media from storage:", error);
        throw error;
    }
};
