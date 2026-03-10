import { cache } from "react";
import { auth } from "@/lib/auth/auth";

export const getCachedSession = cache(auth);

