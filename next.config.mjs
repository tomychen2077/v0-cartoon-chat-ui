/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Remove output: 'standalone' - Netlify Next.js plugin handles deployment automatically
}

export default nextConfig
