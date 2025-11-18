"use client";

import { useTheme } from "next-themes";
import Image from "next/image";  // ✅ must come from next/image

interface ThemeLogoProps {
    className?: string;
}

export const ThemeLogo = ({ className = "" }: ThemeLogoProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
           <Image
      src={isDark ? "/VoxilityLogoblack.jpg" : "/VoxilityLogobackgroundWhite.jpg"} // ✅ replace with your actual paths
      alt="Vox Logo"
      width={160} // adjust size
      height={40}
      className={className}
      priority
    />
        // <h1
        //     className={`text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${className}`}
        // >VOX  ss  </h1>
    );
};