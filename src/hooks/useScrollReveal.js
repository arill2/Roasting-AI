import { useEffect, useRef, useState } from 'react'

export function useScrollReveal(options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', triggerOnce = true } = options
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      // Element not mounted yet — retry via MutationObserver on next tick
      const timer = setTimeout(() => {
        const el2 = ref.current
        if (!el2) return

        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true)
              if (triggerOnce) obs.unobserve(el2)
            } else if (!triggerOnce) {
              setIsVisible(false)
            }
          },
          { threshold, rootMargin }
        )
        obs.observe(el2)
        // Store for cleanup
        ref._obs = obs
      }, 100)
      return () => clearTimeout(timer)
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) obs.unobserve(el)
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return [ref, isVisible]
}
