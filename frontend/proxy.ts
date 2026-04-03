import { NextResponse } from "next/server";
// import { auth } from "./lib/auth";

// export function proxy(req: Request) {
//   return auth.handler(req);
// }

export function proxy() {
  return NextResponse.next();
}
