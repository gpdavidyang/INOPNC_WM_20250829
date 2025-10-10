import * as React from 'react'

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children?: React.ReactNode
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ href, children, ...rest }, ref) => {
  return (
    <a href={href} ref={ref} {...rest}>
      {children}
    </a>
  )
})

Link.displayName = 'MockNextLink'

export default Link
