import { useState, useCallback } from "react"

export interface UseTableDataOptions<T> {
  fetchUrl: string
  onError?: (error: string) => void
}

export const useTableData = <T extends { id: string }>(options: UseTableDataOptions<T>) => {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await globalThis.fetch(options.fetchUrl)
      const result = await res.json()
      setData(Array.isArray(result) ? result : [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "加载失败"
      setError(msg)
      options.onError?.(msg)
    } finally {
      setIsLoading(false)
    }
  }, [options])

  return { data, isLoading, error, fetch: refetch, setData }
}

export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }, [])

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => prev.length === ids.length && ids.length > 0 ? [] : ids)
  }, [])

  const clear = useCallback(() => setSelectedIds([]), [])

  return { selectedIds, toggle, toggleAll, clear }
}

export const useBatchDelete = (deleteUrl: (id: string) => string) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const batchDelete = useCallback(async (ids: string[]) => {
    if (!confirm(`确定要删除选中的 ${ids.length} 项吗？此操作不可恢复。`)) return false
    setIsDeleting(true)
    try {
      await Promise.all(ids.map(id =>
        fetch(deleteUrl(id), { method: "DELETE" })
      ))
      return true
    } catch (error) {
      console.error("批量删除失败:", error)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [deleteUrl])

  return { isDeleting, batchDelete }
}

export const useFilter = <T>(data: T[], predicates: Record<string, (item: T) => boolean>) => {
  const [filters, setFilters] = useState<Record<string, string | boolean>>({})

  const filtered = data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      const predicate = predicates[key]
      return predicate ? (value === "" || value === false ? true : predicate(item)) : true
    })
  })

  return { filters, setFilters, filtered }
}
