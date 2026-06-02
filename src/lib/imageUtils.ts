/**
 * Fixes Docker MinIO URLs for local development.
 * Replaces 'minio:9000' with 'localhost:9000' so the browser can resolve it.
 */
export const fixImageUrl = (url?: string | null): string => {
    if (!url) return '';

    if (url.includes('localhost:9000')) {
        return url.replace('http://localhost:9000', 'https://rachell-diaphanometric-viva.ngrok-free.dev');
    }

    if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('/')) {
        return url;
    }

    // If it's a signed URL (has query params like X-Amz-Signature...), we should be careful.
    // However, if the backend generated it with 'minio:9000' base, the signature is likely for 'minio'.
    // BUT since we switched the backend to sign with 'localhost', the URL coming in might already be 'localhost'.
    // If we still get 'minio:9000', it's likely a raw URL (public bucket) or the signing config isn't active yet.

    // DEBUG: Log URL to see what we get
    if (url.includes('documents')) {
        console.log('fixImageUrl processing document URL:', url);
    }

    if (url.includes('X-Amz-Signature')) {
        // It's a signed URL. 
        // If it starts with minio:9000, we MUST replace it with localhost:9000 
        // PROVIDED that the backend signed it for localhost (which we did).
        // If backend signed for minio:9000, replacing host WILL break signature.
        // But since we fixed backend to sign for localhost, we should receive localhost.
        // If we receive minio:9000 with signature, it means backend didn't use the signing client?
        if (url.includes('minio:9000')) {
            return url.replace('minio:9000', 'localhost:9000');
        }
        return url;
    }

    if (url.includes('minio:9000')) {
        return url.replace('minio:9000', 'localhost:9000');
    }

    return url;
};
