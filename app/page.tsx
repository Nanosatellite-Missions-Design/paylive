import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Gavel, TrendingUp } from "lucide-react"
import AuthLayout from "@/components/auth-layout"

export default function HomePage() {
  // Sample data for featured live sales and auctions
  const liveSales = [
    {
      id: 1,
      title: "Summer Fashion Collection",
      creator: "Style Maven",
      viewers: 1243,
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 2,
      title: "Tech Gadgets Flash Sale",
      creator: "Gadget Guru",
      viewers: 856,
      image: "/placeholder.svg?height=200&width=400",
    },
  ]

  const auctions = [
    {
      id: 1,
      title: "Vintage Camera Collection",
      currentBid: 299,
      endsIn: "2h 15m",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: 2,
      title: "Limited Edition Sneakers",
      currentBid: 175,
      endsIn: "45m",
      image: "/placeholder.svg?height=200&width=400",
    },
  ]

  const trending = [
    {
      id: 1,
      title: "Handcrafted Jewelry",
      creator: "Artisan Gems",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      title: "Smart Home Devices",
      creator: "TechHome",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      title: "Organic Skincare",
      creator: "Natural Glow",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <AuthLayout>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-primary">PayLive</h1>
          <p className="text-gray-500 dark:text-gray-400">Discover live sales and auctions</p>
        </header>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Video className="mr-2 h-5 w-5 text-primary" />
              Live Now
            </h2>
            <Link href="/live" className="text-sm text-primary">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {liveSales.map((sale) => (
              <Link key={sale.id} href={`/live/${sale.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img src={sale.image || "/placeholder.svg"} alt={sale.title} className="w-full h-48 object-cover" />
                    <Badge className="absolute top-2 right-2 bg-red-500">LIVE</Badge>
                    <Badge className="absolute bottom-2 left-2 bg-black/70">{sale.viewers} watching</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <p className="text-sm text-gray-500">by {sale.creator}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Gavel className="mr-2 h-5 w-5 text-primary" />
              Hot Auctions
            </h2>
            <Link href="/auctions" className="text-sm text-primary">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {auctions.map((auction) => (
              <Link key={auction.id} href={`/auctions/${auction.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={auction.image || "/placeholder.svg"}
                      alt={auction.title}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-secondary">Ending Soon</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{auction.title}</h3>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-gray-500">
                        Current bid: <span className="text-primary font-medium">${auction.currentBid}</span>
                      </span>
                      <span className="text-gray-500">
                        Ends in: <span className="text-accent font-medium">{auction.endsIn}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Trending
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {trending.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`}>
                <div className="text-center">
                  <div className="rounded-full overflow-hidden mb-2 mx-auto w-20 h-20 border-2 border-primary/20">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xs font-medium truncate">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AuthLayout>
  )
}
