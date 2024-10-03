import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

let reqCount = 0;

export function middiliware(request : NextRequest){

    reqCount ++;
    console.log(`req count is : ${reqCount}`);
    return  NextResponse.next()
}

export const config = {
    matcher: '/api/:path*',
  }