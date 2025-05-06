/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Ignoring errors is dangerous, but needed for the type
    // issue with PageProps in Next.js 15.3.1
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 