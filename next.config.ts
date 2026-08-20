import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: { bodySizeLimit: "4gb" },
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
