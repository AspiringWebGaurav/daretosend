import { NextResponse } from "next/server";

export interface ApiSuccess<T = unknown> {
    success: true;
    data: T;
}

export interface ApiError {
    success: false;
    error: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
    return NextResponse.json({ success: true, data }, { status });
}

export function err(
    message: string,
    status = 400
): NextResponse<ApiError> {
    return NextResponse.json({ success: false, error: message }, { status });
}

export const unauthorized = () => err("Unauthorized", 401);
export const forbidden = () => err("Forbidden", 403);
export const notFound = () => err("Not found", 404);
export const serverError = (msg = "Internal server error") => err(msg, 500);
export const tooManyRequests = () => err("Daily send limit reached", 429);
export const serviceUnavailable = () =>
    err("Service temporarily unavailable", 503);
