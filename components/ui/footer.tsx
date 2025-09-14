import * as React from "react"

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  sections?: FooterSection[]
  bottomLinks?: FooterLink[]
  copyright?: string
  logo?: React.ReactNode
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ 
    className, 
    sections = [], 
    bottomLinks = [],
    copyright,
    logo,
    ...props 
  }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          "border-t border-toss-gray-200 dark:border-toss-gray-700 bg-toss-gray-50 dark:bg-toss-gray-900",
          className
        )}
        {...props}
      >
        <Container>
          {/* Main Footer Content */}
          <div className="py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
              {/* Logo and Company Info */}
              <div className="col-span-2 md:col-span-1 lg:col-span-2">
                {logo || (
                  <div className="mb-4">
                    <span className="text-xl font-bold text-toss-gray-900 dark:text-toss-gray-100">
                      건설일지
                    </span>
                  </div>
                )}
                <Text size="sm" color="muted">
                  건설 현장의 모든 기록을 한곳에서
                </Text>
              </div>

              {/* Footer Sections */}
              {sections.map((section, index) => (
                <div key={index}>
                  <h3 className="mb-4 text-sm font-semibold text-toss-gray-900 dark:text-toss-gray-100">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          href={link.href}
                          className="text-sm text-toss-gray-600 dark:text-toss-gray-400 hover:text-toss-blue-500 dark:hover:text-toss-blue-400 transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-toss-gray-200 dark:border-toss-gray-700 py-6">
            <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
              {/* Copyright */}
              <Text size="sm" color="muted">
                {copyright || `© ${new Date().getFullYear()} 건설일지. All rights reserved.`}
              </Text>

              {/* Bottom Links */}
              {bottomLinks.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {bottomLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="text-sm text-toss-gray-600 dark:text-toss-gray-400 hover:text-toss-blue-500 dark:hover:text-toss-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </footer>
    )
  }
)
Footer.displayName = "Footer"

const SimpleFooter = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <footer
      ref={ref}
      className={cn(
        "border-t border-toss-gray-200 dark:border-toss-gray-700 bg-white dark:bg-toss-gray-900",
        className
      )}
      {...props}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Text size="sm" color="muted">
            © {new Date().getFullYear()} 건설일지
          </Text>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-toss-gray-600 hover:text-toss-blue-500"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/terms"
              className="text-sm text-toss-gray-600 hover:text-toss-blue-500"
            >
              이용약관
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
})
SimpleFooter.displayName = "SimpleFooter"

export { Footer, SimpleFooter }