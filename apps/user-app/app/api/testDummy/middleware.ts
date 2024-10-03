import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

let reqCount = 0;

export function middleware(request: NextRequest) {
    reqCount++;
    console.log(`req count is: ${reqCount}`);
    console.log(`Middleware executed for: ${request.nextUrl.pathname}`);
    return NextResponse.next();
}

export const config = {
    matcher: ['/api/testDummy/:path*'],
};
