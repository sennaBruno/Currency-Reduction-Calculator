/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false, // Set to false to suppress strict mode warnings
  
  // Silence hydration warnings from password manager extensions
  compiler: {
    // This specifically helps with password manager injected attributes
    styledComponents: true,
    // Suppress certain attribute warnings during hydration
    ignoreDuringMinification: [
      'data-dashlane-rid',
      'data-dashlane-label',
    ],
  },
  
  // General experimental features
  experimental: {
    // Helps with certain hydration mismatch issues
    webVitalsAttribution: ['CLS', 'LCP'],
  },
};

export default nextConfig; 