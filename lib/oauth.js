// app/lib/oauth.js
import crypto from 'crypto';

export function getOAuthSignature(method, url, params, consumerSecret) {
    // Sort parameters alphabetically and encode them
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

    // Create the base string
    const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;

    // Create the signing key (assuming no token secret)
    const signingKey = `${encodeURIComponent(consumerSecret)}&`;

    // Generate the HMAC-SHA1 signature and encode it in Base64
    const signature = crypto
        .createHmac('sha1', signingKey)
        .update(baseString)
        .digest('base64');

    return signature;
}
