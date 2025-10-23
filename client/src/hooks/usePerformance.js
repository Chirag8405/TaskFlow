import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} - Render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }

    // Report to analytics in production
    if (process.env.NODE_ENV === 'production' && renderTime > 100) {
      // Only report slow renders
      reportPerformanceMetric({
        component: componentName,
        renderTime,
        renderCount: renderCount.current
      });
    }

    renderStartTime.current = performance.now();
  });

  const startOperation = useCallback((operationName) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${componentName}.${operationName}: ${duration.toFixed(2)}ms`);
        }
        return duration;
      }
    };
  }, [componentName]);

  return { startOperation };
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const logMemoryUsage = () => {
        const memory = performance.memory;
        console.log('[Memory]', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        });
      };

      const interval = setInterval(logMemoryUsage, 30000); // Log every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);
};

// Network performance monitoring
export const useNetworkMonitor = () => {
  const monitorRequest = useCallback((url, method = 'GET') => {
    const startTime = performance.now();
    
    return {
      end: (success = true, size = 0) => {
        const duration = performance.now() - startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Network] ${method} ${url}: ${duration.toFixed(2)}ms ${success ? '✓' : '✗'}`);
        }

        // Report to analytics
        reportNetworkMetric({
          url,
          method,
          duration,
          success,
          size
        });
      }
    };
  }, []);

  return { monitorRequest };
};

// Bundle size analyzer (development only)
export const useBundleAnalyzer = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Analyze loaded modules
      const modules = Object.keys(window.webpackChunkName || {});
      console.log('[Bundle] Loaded modules:', modules.length);
      
      // Check for large dependencies
      const largeDependencies = modules.filter(mod => 
        mod.includes('node_modules') && mod.length > 100
      );
      
      if (largeDependencies.length > 0) {
        console.warn('[Bundle] Large dependencies detected:', largeDependencies);
      }
    }
  }, []);
};

// Web Vitals monitoring
export const useWebVitals = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Dynamic import to reduce bundle size
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(reportWebVital);
        getFID(reportWebVital);
        getFCP(reportWebVital);
        getLCP(reportWebVital);
        getTTFB(reportWebVital);
      }).catch(() => {
        // Silently fail if web-vitals is not available
      });
    }
  }, []);
};

// Performance reporting functions
const reportPerformanceMetric = (metric) => {
  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', 'performance_metric', {
      custom_parameter_1: metric.component,
      custom_parameter_2: metric.renderTime,
      custom_parameter_3: metric.renderCount
    });
  }
  
  // Or send to custom analytics endpoint
  if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
    fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'performance', ...metric })
    }).catch(() => {
      // Silently fail
    });
  }
};

const reportNetworkMetric = (metric) => {
  if (window.gtag) {
    window.gtag('event', 'network_metric', {
      custom_parameter_1: metric.url,
      custom_parameter_2: metric.duration,
      custom_parameter_3: metric.success
    });
  }
};

const reportWebVital = (metric) => {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true
    });
  }
};

// React DevTools profiler integration
export const useProfiler = (id, phase) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const profiler = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      if (profiler.onCommitFiberRoot) {
        console.log(`[Profiler] ${id} - ${phase}`);
      }
    }
  }, [id, phase]);
};

// Custom hook for component performance optimization
export const useOptimization = (componentName) => {
  const { startOperation } = usePerformanceMonitor(componentName);
  
  // Measure render performance
  const measureRender = useCallback(() => {
    return startOperation('render');
  }, [startOperation]);

  // Measure effect performance
  const measureEffect = useCallback((effectName) => {
    return startOperation(`effect:${effectName}`);
  }, [startOperation]);

  // Measure callback performance
  const measureCallback = useCallback((callbackName) => {
    return startOperation(`callback:${callbackName}`);
  }, [startOperation]);

  return {
    measureRender,
    measureEffect,
    measureCallback
  };
};