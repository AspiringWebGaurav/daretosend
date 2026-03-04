import { type NextRequest } from "next/server";
import { getSessionUser } from "@/domains/auth/getSessionUser";
import { claimUsername } from "@/domains/users/claimUsername";
import { ok, err, unauthorized } from "@/lib/apiResponse";

/**
 * POST /api/users/register
 * Atomically claims a username for the authenticated user and stores the full generated URL.
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    try {
        const { username } = await req.json();
        if (!username || typeof username !== "string") {
            return err("username is required", 400);
        }

        // Validate username format
        if (!/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
            return err(
                "Username must be 3-20 characters, lowercase letters, numbers, underscores only",
                400
            );
        }

        // Dynamically detect origin for complete env-aware link creation
        // Use the request url origin OR the x-forwarded-proto/host headers
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
        const protocol = req.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
        const origin = host ? `${protocol}://${host}` : req.nextUrl.origin;

        const claimedUrl = await claimUsername(user.uid, username, origin);

        return ok({ username: username.toLowerCase(), claimedUrl }, 201);
    } catch (e) {
        if (e instanceof Error) {
            if (e.message === "USERNAME_TAKEN") return err("Username is already taken", 409);
            if (e.message === "USERNAME_ALREADY_SET") return err("You already have a username", 409);
        }
        return err("Failed to claim username", 500);
    }
}
