import { useEffect, useCallback } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
}

interface UsePerformanceOptions {
  trackPageLoad?: boolean
  trackRender?: boolean
  trackInteractions?: boolean
  onMetrics?: (metrics: Partial<PerformanceMetrics>) => void
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    trackPageLoad = true,
    trackRender = true,
    trackInteractions = true,
    onMetrics,
  } = options

  // Track page load performance
  useEffect(() => {
    if (!trackPageLoad) return

    const measurePageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart
          const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
          
          const metrics = {
            loadTime: Math.round(loadTime),
            renderTime: Math.round(renderTime),
          }
          
          onMetrics?.(metrics)
          
          // Log performance metrics in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Performance Metrics:', metrics)
          }
        }
      }
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePageLoad()
    } else {
      window.addEventListener('load', measurePageLoad)
      return () => window.removeEventListener('load', measurePageLoad)
    }
  }, [trackPageLoad, onMetrics])

  // Track render performance
  const measureRender = useCallback((componentName: string) => {
    if (!trackRender) return

    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      onMetrics?.({ renderTime: Math.round(renderTime) })
      
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render detected in ${componentName}: ${Math.round(renderTime)}ms`)
      }
    }
  }, [trackRender, onMetrics])

  // Track interaction performance
  const measureInteraction = useCallback((interactionName: string) => {
    if (!trackInteractions) return

    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const interactionTime = endTime - startTime
      
      onMetrics?.({ interactionTime: Math.round(interactionTime) })
      
      if (process.env.NODE_ENV === 'development' && interactionTime > 100) {
        console.warn(`Slow interaction detected in ${interactionName}: ${Math.round(interactionTime)}ms`)
      }
    }
  }, [trackInteractions, onMetrics])

  // Web Vitals tracking
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Track Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      if (process.env.NODE_ENV === 'development') {
        console.log('LCP:', Math.round(lastEntry.startTime))
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // LCP not supported
    }

    return () => observer.disconnect()
  }, [])

  // Memory usage tracking
  const getMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      }
    }
    return null
  }, [])

  return {
    measureRender,
    measureInteraction,
    getMemoryUsage,
  }
}

// Performance monitoring component
export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  usePerformance({
    onMetrics: (metrics) => {
      // Send metrics to analytics service in production
      if (process.env.NODE_ENV === 'production') {
        // Example: analytics.track('performance', metrics)
      }
    },
  })

  return <>{children}</>
}