'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Menu, X, Home, FileText, Calendar, Users, Settings, Bell, User as UserIcon } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
}

interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  items?: NavItem[]
  actions?: React.ReactNode
}

const NavBar = React.forwardRef<HTMLElement, NavBarProps>(
  ({ className, logo, items = [], actions, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <nav
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full border-b border-toss-gray-200 dark:border-toss-gray-700 bg-white/80 dark:bg-toss-gray-900/80 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <Container>
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                {logo || (
                  <span className="text-xl font-bold text-toss-gray-900 dark:text-toss-gray-100">
                    건설일지
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center space-x-2 text-sm font-medium text-toss-gray-700 dark:text-toss-gray-300 transition-colors hover:text-toss-blue-500 dark:hover:text-toss-blue-400"
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="error" className="ml-1">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {actions || (
                <>
                  <Button variant="ghost" size="compact">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="compact">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <Button
                variant="ghost"
                size="compact"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation menu"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </Container>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <Container>
              <div className="space-y-1 pb-3 pt-2">
                {items.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-base font-medium text-toss-gray-700 dark:text-toss-gray-300 hover:bg-toss-gray-100 dark:hover:bg-toss-gray-800 hover:text-toss-blue-500 dark:hover:text-toss-blue-400"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge variant="error" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
                <div className="my-2 border-t border-toss-gray-200 dark:border-toss-gray-700" />
                <div className="flex space-x-2 px-3 py-2">
                  {actions || (
                    <>
                      <Button variant="ghost" size="compact" className="flex-1">
                        <Bell className="mr-2 h-4 w-4" />
                        알림
                      </Button>
                      <Button variant="ghost" size="compact" className="flex-1">
                        <UserIcon className="mr-2 h-4 w-4" />
                        프로필
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Container>
          </div>
        )}
      </nav>
    )
  }
)
NavBar.displayName = "NavBar"

export { NavBar }