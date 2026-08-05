"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Home" },
  { href: "/pets", label: "Pets" },
  { href: "/schedule", label: "Schedule" },
  { href: "/assistant", label: "Assistant" },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="app-nav">
      <div className="app-nav-brand">PawPal+</div>
      <div className="app-nav-links">
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link key={link.href} href={link.href} className={active ? "nav-link active" : "nav-link"}>
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
