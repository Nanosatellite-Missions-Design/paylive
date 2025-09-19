"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  ShoppingCart,
  Users,
  Zap,
  Star,
  Play,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import LandingNavbar from "@/components/landing-navbar";
import { useTranslations } from "@/lib/useTranslations";

export default function LandingPage() {
  const t = useTranslations("HomePage");
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200">
            🚀 {t("banner.badge")}
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t("banner.title1")},
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              {t("banner.title2")}
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("banner.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3"
              >
                <Play className="mr-2 h-5 w-5" />
                {t("banner.button")}
              </Button>
            </Link>
            {/* <Link href="/catalog/demo">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-3 border-2 bg-transparent"
              >
                View Demo Catalog
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link> */}
          </div>

          {/* Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">1M+</div>
              <div className="text-gray-600">Products Sold</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">$50M+</div>
              <div className="text-gray-600">Revenue Generated</div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t("features.title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("features.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Live Streaming */}
          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("features.featureCard.1")}
              </h3>
              <p className="text-gray-600">
                {t("features.featureCard.1Description")}
              </p>
            </CardContent>
          </Card>

          {/* Product Catalogs */}
          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("features.featureCard.2")}
              </h3>
              <p className="text-gray-600">
                {t("features.featureCard.2Description")}
              </p>
            </CardContent>
          </Card>

          {/* Real-time Chat */}
          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("features.featureCard.3")}
              </h3>
              <p className="text-gray-600">
                {t("features.featureCard.3Description")}
              </p>
            </CardContent>
          </Card>

          {/* Instant Payments */}
          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("features.featureCard.4")}
              </h3>
              <p className="text-gray-600">
                {t("features.featureCard.4Description")}
              </p>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("features.featureCard.5")}
              </h3>
              <p className="text-gray-600">
                {t("features.featureCard.5Description")}
              </p>
            </CardContent>
          </Card>

          {/* Mobile Optimized */}
          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("features.featureCard.6")}
              </h3>
              <p className="text-gray-600">
                {t("features.featureCard.6Description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">{t("CallToAction.title")}</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t("CallToAction.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100"
              >
                {t("CallToAction.button")}
              </Button>
            </Link>
            {/* <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 border-white text-white hover:bg-white/10 bg-transparent"
              >
                Contact Sales
              </Button>
            </Link> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PL</span>
                </div>
                <span className="text-xl font-bold">PayLive</span>
              </div>
              <p className="text-gray-400">
                The future of live commerce. Sell live, earn more.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-white">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div> */}

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PayLive. {t("copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
