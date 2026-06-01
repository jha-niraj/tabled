"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { cn } from "../../lib/utils"

const InputOTP = React.forwardRef<
    React.ElementRef<typeof OTPInput>,
    React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
    <OTPInput
        ref={ref}
        containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
        className={cn("disabled:cursor-not-allowed", className)}
        {...props}
    />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
    React.ElementRef<"div">,
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
    React.ElementRef<"div">,
    React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext)
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index] ?? {}

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex h-14 w-12 items-center justify-center rounded-xl border text-lg font-semibold transition-all",
                "border-neutral-200 bg-white text-neutral-900",
                "dark:border-neutral-700 dark:bg-neutral-900 dark:text-white",
                isActive && "border-neutral-900 ring-2 ring-neutral-900/20 dark:border-white dark:ring-white/20",
                className,
            )}
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-0.5 animate-caret-blink bg-neutral-900 dark:bg-white duration-1000" />
                </div>
            )}
        </div>
    )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
    React.ElementRef<"div">,
    React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
    <div ref={ref} role="separator" className="text-neutral-300 dark:text-neutral-600 text-xl" {...props}>
        -
    </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
