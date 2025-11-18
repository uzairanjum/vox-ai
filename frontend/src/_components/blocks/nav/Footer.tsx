"use client"

import React from "react"
import Link from "next/link"
import { Github } from "lucide-react"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/10 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Branding */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">VOX</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Building tools for growth and productivity.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-primary">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Social / Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Connect</h3>
            <div className="flex items-center space-x-4">

            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} VOX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
