import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Loading component
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-red-600 mb-4">
        {error?.message || 'Failed to load component'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

// Higher-order component for lazy loading with error boundary
const withLazyLoading = (LazyComponent, fallback = null) => {
  return function LazyLoadedComponent(props) {
    return (
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        <Suspense fallback={fallback || <LoadingSpinner />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
};

// Lazy loaded page components
export const Dashboard = withLazyLoading(
  lazy(() => import('../pages/Dashboard')),
  <LoadingSpinner message="Loading dashboard..." />
);

export const Projects = withLazyLoading(
  lazy(() => import('../pages/Projects')),
  <LoadingSpinner message="Loading projects..." />
);

export const ProjectBoard = withLazyLoading(
  lazy(() => import('../pages/ProjectBoard')),
  <LoadingSpinner message="Loading project board..." />
);

// Lazy loaded component sections
export const TaskModal = withLazyLoading(
  lazy(() => import('../components/tasks/TaskModal')),
  <LoadingSpinner message="Loading task form..." />
);

export const UserProfile = withLazyLoading(
  lazy(() => import('../components/user/UserProfile')),
  <LoadingSpinner message="Loading profile..." />
);

export const ProjectSettings = withLazyLoading(
  lazy(() => import('../components/project/ProjectSettings')),
  <LoadingSpinner message="Loading settings..." />
);

export const TeamManagement = withLazyLoading(
  lazy(() => import('../components/team/TeamManagement')),
  <LoadingSpinner message="Loading team management..." />
);

export const NotificationCenter = withLazyLoading(
  lazy(() => import('../components/notifications/NotificationCenter')),
  <LoadingSpinner message="Loading notifications..." />
);

export const Analytics = withLazyLoading(
  lazy(() => import('../components/analytics/Analytics')),
  <LoadingSpinner message="Loading analytics..." />
);

export const Reports = withLazyLoading(
  lazy(() => import('../components/reports/Reports')),
  <LoadingSpinner message="Loading reports..." />
);

// Advanced lazy loading with preloading
class LazyLoader {
  constructor() {
    this.loadedComponents = new Set();
    this.preloadQueue = new Map();
    this.observer = null;
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const componentName = entry.target.dataset.lazyComponent;
              if (componentName && this.preloadQueue.has(componentName)) {
                this.preloadComponent(componentName);
                this.observer.unobserve(entry.target);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );
    }
  }

  // Register component for preloading
  registerForPreload(componentName, importFunction) {
    this.preloadQueue.set(componentName, importFunction);
  }

  // Preload component
  async preloadComponent(componentName) {
    if (this.loadedComponents.has(componentName)) {
      return;
    }

    try {
      const importFunction = this.preloadQueue.get(componentName);
      if (importFunction) {
        await importFunction();
        this.loadedComponents.add(componentName);
        console.log(`Preloaded component: ${componentName}`);
      }
    } catch (error) {
      console.error(`Failed to preload component ${componentName}:`, error);
    }
  }

  // Observe element for lazy loading
  observe(element, componentName) {
    if (this.observer && element) {
      element.dataset.lazyComponent = componentName;
      this.observer.observe(element);
    }
  }

  // Preload critical components
  async preloadCritical() {
    const criticalComponents = [
      'Dashboard',
      'Projects',
      'TaskModal'
    ];

    const preloadPromises = criticalComponents.map(componentName => 
      this.preloadComponent(componentName)
    );

    await Promise.allSettled(preloadPromises);
  }

  // Preload on user interaction
  preloadOnHover(componentName) {
    return {
      onMouseEnter: () => this.preloadComponent(componentName),
      onFocus: () => this.preloadComponent(componentName)
    };
  }

  // Preload based on route
  preloadForRoute(routePath) {
    const routeComponentMap = {
      '/dashboard': ['Dashboard', 'TaskModal', 'NotificationCenter'],
      '/projects': ['Projects', 'ProjectSettings'],
      '/project/:id': ['ProjectBoard', 'TaskModal', 'TeamManagement'],
      '/profile': ['UserProfile'],
      '/analytics': ['Analytics', 'Reports']
    };

    const components = routeComponentMap[routePath] || [];
    components.forEach(componentName => {
      this.preloadComponent(componentName);
    });
  }

  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Create singleton instance
export const lazyLoader = new LazyLoader();

// Register components for preloading
lazyLoader.registerForPreload('Dashboard', () => import('../pages/Dashboard'));
lazyLoader.registerForPreload('Projects', () => import('../pages/Projects'));
lazyLoader.registerForPreload('ProjectBoard', () => import('../pages/ProjectBoard'));
lazyLoader.registerForPreload('TaskModal', () => import('../components/tasks/TaskModal'));
lazyLoader.registerForPreload('UserProfile', () => import('../components/user/UserProfile'));
lazyLoader.registerForPreload('ProjectSettings', () => import('../components/project/ProjectSettings'));
lazyLoader.registerForPreload('TeamManagement', () => import('../components/team/TeamManagement'));
lazyLoader.registerForPreload('NotificationCenter', () => import('../components/notifications/NotificationCenter'));
lazyLoader.registerForPreload('Analytics', () => import('../components/analytics/Analytics'));
lazyLoader.registerForPreload('Reports', () => import('../components/reports/Reports'));

// Hook for using lazy loader
export const useLazyLoader = () => {
  return {
    preload: (componentName) => lazyLoader.preloadComponent(componentName),
    preloadOnHover: (componentName) => lazyLoader.preloadOnHover(componentName),
    preloadForRoute: (routePath) => lazyLoader.preloadForRoute(routePath),
    observe: (element, componentName) => lazyLoader.observe(element, componentName)
  };
};

// HOC for route-based preloading
export const withRoutePreloading = (WrappedComponent, routePath) => {
  return function RoutePreloadingComponent(props) {
    React.useEffect(() => {
      lazyLoader.preloadForRoute(routePath);
    }, []);

    return <WrappedComponent {...props} />;
  };
};

// Initialize critical component preloading
if (typeof window !== 'undefined') {
  // Preload critical components after a short delay
  setTimeout(() => {
    lazyLoader.preloadCritical();
  }, 100);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    lazyLoader.destroy();
  });
}

export default {
  Dashboard,
  Projects,
  ProjectBoard,
  TaskModal,
  UserProfile,
  ProjectSettings,
  TeamManagement,
  NotificationCenter,
  Analytics,
  Reports,
  withLazyLoading,
  lazyLoader,
  useLazyLoader,
  withRoutePreloading
};