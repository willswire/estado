import { Buffer } from 'node:buffer';

export function checkAuthorization(request: Request): { username: string, password: string } | null {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
        console.log("No authorization header provided.");
        return null;
    }

    const [basic, credentials] = authorization.split(" ");
    if (basic !== "Basic") {
        console.log("Unsupported authorization method.");
        return null;
    }

    const [username, password] = Buffer.from(credentials, "base64").toString().split(":");
    if (!username || !password) {
        console.log("Invalid credentials.");
        return null;
    }

    return { username, password };
}
