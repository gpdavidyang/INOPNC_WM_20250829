import * as React from "react"

const headingVariants = cva(
  "text-toss-gray-900 dark:text-toss-gray-100 font-semibold",
  {
    variants: {
      variant: {
        h1: "text-3xl",
        h2: "text-2xl",
        h3: "text-xl",
        h4: "text-lg",
        h5: "text-base",
        h6: "text-sm"
      }
    },
    defaultVariants: {
      variant: "h3"
    }
  }
)

const textVariants = cva(
  "text-toss-gray-700",
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl"
      },
      color: {
        default: "text-toss-gray-700 dark:text-toss-gray-300",
        muted: "text-toss-gray-500 dark:text-toss-gray-400",
        primary: "text-toss-blue-500",
        error: "text-red-500",
        success: "text-green-600",
        warning: "text-orange-500"
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold"
      }
    },
    defaultVariants: {
      size: "base",
      color: "default",
      weight: "normal"
    }
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, as, ...props }, ref) => {
    const Comp = as || variant || "h3"
    return (
      <Comp
        ref={ref}
        className={cn(headingVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div"
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, color, weight, as: Comp = "p", ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(textVariants({ size, color, weight }), className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Heading, Text, headingVariants, textVariants }