/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // تجاهل أخطاء الأنواع أثناء البناء
    ignoreBuildErrors: true,
  },
  eslint: {
    // تجاهل أخطاء التنسيق أثناء البناء
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
};

export default nextConfig;
