import { Suspense } from "react"
import NavbarClient from "./NavbarClient"

export default async function Navbar() {


    return (
        <Suspense fallback={<div className="h-16 w-full bg-muted/10 animate-pulse" />}>
            <NavbarClient />
        </Suspense>
    )
}
