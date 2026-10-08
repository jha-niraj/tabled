"use client"

import { motion } from "framer-motion"

type Props = {
    options: string[]
    selected?: string
    disabled?: boolean
    onPick: (option: string) => void
}

export function ChoiceChips({ options, selected, disabled, onPick }: Props) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt, i) => (
                <motion.button
                    key={opt}
                    type="button"
                    className="tt-chip"
                    data-selected={selected === opt}
                    disabled={disabled || (selected !== undefined && selected !== opt)}
                    onClick={() => onPick(opt)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                    {opt}
                </motion.button>
            ))}
        </div>
    )
}
