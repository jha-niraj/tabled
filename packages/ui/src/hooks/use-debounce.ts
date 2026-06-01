"use client"

import { useState, useEffect } from "react"

/**
 * Debounces a value - returns a version of `value` that only updates
 * after `delay` ms of inactivity. Use for search inputs so you don't
 * fire a request on every keystroke.
 *
 * @example
 * const [search, setSearch] = useState("")
 * const debouncedSearch = useDebounce(search, 300)
 * useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debounced
}
