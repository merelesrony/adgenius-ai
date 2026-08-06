// Module-level singleton — shared across all builder components without prop drilling
const _controllers = new Set<AbortController>()

export const aiAbortRegistry = {
  register(c: AbortController) {
    _controllers.add(c)
  },
  unregister(c: AbortController) {
    _controllers.delete(c)
  },
  abortAll() {
    _controllers.forEach((c) => { try { c.abort() } catch { /* ignore */ } })
    _controllers.clear()
  },
}
