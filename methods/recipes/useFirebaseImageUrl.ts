import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../constants/FirebaseConfig';

/**
 * Resolves a Firebase Storage path OR an existing https:// URL into a
 * guaranteed-fresh download URL.
 *
 * Pass either:
 *   - A storage path:  "users/uid/recipes/abc.jpg"
 *   - A full URL:      "https://firebasestorage.googleapis.com/..."
 *   - null/undefined:  returns null
 *
 * Always fetches a fresh URL via the SDK so the token is never stale.
 */
export function useFirebaseImageUrl(pathOrUrl: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      try {
        let storagePath: string;

        if (pathOrUrl.startsWith('http')) {
          // Extract the path from a full Firebase Storage URL
          // URL format: .../o/users%2Fuid%2Frecipes%2Ffile.jpg?alt=media...
          const match = pathOrUrl.match(/\/o\/(.+?)(\?|$)/);
          if (!match) {
            // Not a Firebase URL we can parse — use as-is
            if (!cancelled) setUrl(pathOrUrl);
            return;
          }
          storagePath = decodeURIComponent(match[1]);
        } else {
          storagePath = pathOrUrl;
        }

        const freshUrl = await getDownloadURL(ref(storage, storagePath));
        if (!cancelled) setUrl(freshUrl);
      } catch (err) {
        console.warn('[useFirebaseImageUrl] Failed to get download URL:', err);
        if (!cancelled) setUrl(null);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [pathOrUrl]);

  return url;
}