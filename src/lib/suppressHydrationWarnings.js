/**
 * Suppresses hydration warning messages in development mode
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store the original console.error
  const originalConsoleError = console.error;
  
  // Replace with filtered version
  console.error = (...args) => {
    // Check if this is a hydration warning
    if (
      typeof args[0] === 'string' && 
      (
        args[0].includes('Warning: Text content did not match') ||
        args[0].includes('Warning: Expected server HTML to contain') ||
        args[0].includes('Hydration') ||
        args[0].includes('hydration') ||
        args[0].includes('data-dashlane')
      )
    ) {
      // Suppress hydration warnings
      return;
    }
    
    // Pass through other errors to the original console.error
    originalConsoleError.apply(console, args);
  };
}

export {}; 