"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  FieldError as AriaFieldError,
  FieldErrorProps as AriaFieldErrorProps,
  Group as AriaGroup,
  GroupProps as AriaGroupProps,
  Label as AriaLabel,
  LabelProps as AriaLabelProps,
  Text as AriaText,
  TextProps as AriaTextProps,
  composeRenderProps,
} from "react-aria-components"

import { cn } from "@/lib/utils"

const labelVariants = cva([
  "block mb-2 text-xs uppercase tracking-widest text-text-muted transition-colors",
  /* Focused/Active */
  "group-data-[focus-within]:text-gold-accent group-data-[open]:text-gold-accent",
  /* Disabled */
  "data-[disabled]:opacity-50",
  /* Invalid */
  "group-data-[invalid]:text-destructive",
])

interface LabelProps extends AriaLabelProps {
  className?: string
  children?: React.ReactNode
}

const Label = ({ className, ...props }: LabelProps) => (
  <AriaLabel className={cn(labelVariants(), className)} {...props} />
)

interface DescriptionProps extends AriaTextProps {
  className?: string
  children?: React.ReactNode
}

function FormDescription({ className, ...props }: DescriptionProps) {
  return (
    <AriaText
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
      slot="description"
    />
  )
}

function FieldError({ className, ...props }: AriaFieldErrorProps) {
  return (
    <AriaFieldError
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  )
}

const fieldGroupVariants = cva("", {
  variants: {
    variant: {
      default: [
        "relative flex h-14 w-full items-center overflow-hidden border border-border bg-surface/50 px-4 text-text-primary transition-all outline-none",
        /* Focus Within */
        "data-[focus-within]:ring-1 data-[focus-within]:ring-gold-accent data-[focus-within]:border-gold-accent",
        /* Disabled */
        "data-[disabled]:opacity-50",
      ],
      ghost: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface GroupProps
  extends AriaGroupProps,
    VariantProps<typeof fieldGroupVariants> {}

function FieldGroup({ className, variant, ...props }: GroupProps) {
  return (
    <AriaGroup
      className={composeRenderProps(className, (className) =>
        cn(fieldGroupVariants({ variant }), className)
      )}
      {...props}
    />
  )
}

export {
  Label,
  labelVariants,
  FieldGroup,
  fieldGroupVariants,
  FieldError,
  FormDescription,
}
