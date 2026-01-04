import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/sched",
        destination: "/sched/index.htm",
        permanent: false,
      },
      {
        source: "/sched/",
        destination: "/sched/index.htm",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
