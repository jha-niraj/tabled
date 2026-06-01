"use client"

import type React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { cn } from "../../lib/utils"
import { InlineLoader } from "./loader"
import { Input } from "./input"

// ─── Column definition ────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
    /** Unique key - also used as fallback cell value when `render` is absent */
    key: string
    header: string
    /** Show sort arrows in the header; fire onSort when clicked */
    sortable?: boolean
    /** Tailwind classes applied to every cell in this column */
    className?: string
    /** Tailwind classes applied to the th only */
    headerClassName?: string
    /**
     * Custom cell renderer.
     * Receives the full row - return any ReactNode.
     * When omitted, renders `String(row[key] ?? "-")`.
     */
    render?: (row: T) => React.ReactNode
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
    // ── Data ──────────────────────────────────────────────────────────────────
    data: T[]
    columns: DataTableColumn<T>[]
    loading?: boolean
    /** Required: provides a stable React key for each row */
    getRowId: (row: T) => string

    // ── Row interaction ───────────────────────────────────────────────────────
    /**
     * Called when a row is clicked.
     * The caller decides what to do: open a sheet, navigate, select, etc.
     */
    onRowClick?: (row: T) => void
    /** ID of the row that should appear highlighted (e.g., sheet is open for it) */
    highlightRowId?: string

    // ── Actions column ────────────────────────────────────────────────────────
    /**
     * Renders an extra column at the far right.
     * Return buttons, menus, or any interactive element.
     * Click events are stopped from bubbling to `onRowClick`.
     */
    renderRowActions?: (row: T) => React.ReactNode

    // ── Search (controlled) ───────────────────────────────────────────────────
    searchValue?: string
    searchPlaceholder?: string
    /** Called on every keystroke - caller handles debouncing / fetching */
    onSearchChange?: (value: string) => void

    // ── Sort (controlled) ─────────────────────────────────────────────────────
    sortKey?: string
    sortDir?: "asc" | "desc"
    /**
     * Called when a sortable column header is clicked.
     * Caller is responsible for updating `sortKey` / `sortDir` and re-fetching.
     */
    onSort?: (key: string, dir: "asc" | "desc") => void

    // ── Pagination (controlled) ───────────────────────────────────────────────
    page?: number
    totalPages?: number
    totalItems?: number
    /** Called when prev/next page buttons are clicked */
    onPageChange?: (page: number) => void

    // ── Empty state ───────────────────────────────────────────────────────────
    emptyTitle?: string
    emptyDescription?: string
    emptyIcon?: React.ReactNode

    // ── Misc ──────────────────────────────────────────────────────────────────
    className?: string
    /** Slot rendered to the left of the search bar - use for filter chips, etc. */
    toolbarLeft?: React.ReactNode
    /** Slot rendered to the right of the search bar - use for action buttons */
    toolbarRight?: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T>({
    data,
    columns,
    loading = false,
    getRowId,
    onRowClick,
    highlightRowId,
    renderRowActions,
    searchValue,
    searchPlaceholder = "Search…",
    onSearchChange,
    sortKey,
    sortDir,
    onSort,
    page,
    totalPages,
    totalItems,
    onPageChange,
    emptyTitle = "No results",
    emptyDescription,
    emptyIcon,
    className,
    toolbarLeft,
    toolbarRight,
}: DataTableProps<T>) {

    function handleHeaderClick(col: DataTableColumn<T>) {
        if (!col.sortable || !onSort) return
        const nextDir = sortKey === col.key && sortDir === "asc" ? "desc" : "asc"
        onSort(col.key, nextDir)
    }

    function SortIcon({ col }: { col: DataTableColumn<T> }) {
        if (!col.sortable) return null
        if (sortKey !== col.key) return <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
        return sortDir === "asc"
            ? <ChevronUp className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
    }

    const hasToolbar = onSearchChange || toolbarLeft || toolbarRight

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* Toolbar */}
            {hasToolbar && (
                <div className="flex items-center gap-3 flex-wrap">
                    {toolbarLeft}
                    {onSearchChange && (
                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <Input
                                value={searchValue ?? ""}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="pl-9 h-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                            />
                        </div>
                    )}
                    {toolbarRight && <div className="ml-auto flex items-center gap-2">{toolbarRight}</div>}
                </div>
            )}

            {/* Table card */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <InlineLoader size={32} />
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                        {emptyIcon && <div className="mb-4 opacity-30">{emptyIcon}</div>}
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{emptyTitle}</p>
                        {emptyDescription && (
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">{emptyDescription}</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleHeaderClick(col)}
                                            className={cn(
                                                "text-left p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 select-none",
                                                col.sortable && onSort && "cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors",
                                                col.headerClassName,
                                                col.className,
                                            )}
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                {col.header}
                                                <SortIcon col={col} />
                                            </span>
                                        </th>
                                    ))}
                                    {renderRowActions && (
                                        <th className="w-16 p-4" />
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => {
                                    const rowId = getRowId(row)
                                    const isHighlighted = highlightRowId === rowId
                                    return (
                                        <tr
                                            key={rowId}
                                            onClick={() => onRowClick?.(row)}
                                            className={cn(
                                                "transition-colors",
                                                i < data.length - 1 && "border-b border-neutral-100 dark:border-neutral-800",
                                                onRowClick && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                                                isHighlighted && "bg-neutral-50 dark:bg-neutral-800/40",
                                            )}
                                        >
                                            {columns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={cn("p-4 text-sm text-neutral-700 dark:text-neutral-300", col.className)}
                                                >
                                                    {col.render
                                                        ? col.render(row)
                                                        : String((row as Record<string, unknown>)[col.key] ?? "-")}
                                                </td>
                                            ))}
                                            {renderRowActions && (
                                                <td
                                                    className="p-4"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {renderRowActions(row)}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer: item count + pagination */}
            {(totalItems !== undefined || (totalPages !== undefined && totalPages > 1)) && (
                <div className="flex items-center justify-between gap-4 px-1">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {totalItems !== undefined && (
                            <>{totalItems} {totalItems === 1 ? "item" : "items"}{page !== undefined && totalPages !== undefined && totalPages > 1 && ` · page ${page} of ${totalPages}`}</>
                        )}
                    </p>
                    {totalPages !== undefined && totalPages > 1 && onPageChange && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onPageChange(Math.max(1, (page ?? 1) - 1))}
                                disabled={(page ?? 1) <= 1}
                                className="cursor-pointer p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onPageChange(Math.min(totalPages, (page ?? 1) + 1))}
                                disabled={(page ?? 1) >= totalPages}
                                className="cursor-pointer p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
