import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const isLoggedIn = request.cookies.get("jwt") !== undefined;

    // 如果用户已登录，则不进行重定向
    if (isLoggedIn) {
        return NextResponse.next();
    }

    // 如果用户未登录，则重定向到登录页面
    return NextResponse.redirect(new URL("/auth/login", request.url));
}

// 配置中间件的匹配路径
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/editor/:path*",
    ],
};