export const apiCall = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data: T; error?: string }> => {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    })
    const data = await res.json()
    return { ok: res.ok, data }
  } catch (error) {
    return {
      ok: false,
      data: null as T,
      error: error instanceof Error ? error.message : "请求失败",
    }
  }
}

export const createItem = <T>(url: string, body: T) =>
  apiCall(url, { method: "POST", body: JSON.stringify(body) })

export const updateItem = <T>(url: string, body: T) =>
  apiCall(url, { method: "PUT", body: JSON.stringify(body) })

export const deleteItem = (url: string) =>
  apiCall(url, { method: "DELETE" })

export const fetchList = <T>(url: string) =>
  apiCall<T[]>(url, { method: "GET" })
