"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Plus,
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  Pause,
  Package,
  Loader2,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/functions/firebase";
import { addToCollection } from "@/functions/add-to-collection";
import { updateDocument } from "@/functions/update-doc-in-collection"
import { getASubDocument } from "@/functions/get-a-document"

export default function LiveSalesManagementPage() {
  const { lives, userInfo, userProducts } = useAuth();
  const [userLives, setUserLives] = useState<any[]>([]);
  const [newLiveTitle, setNewLiveTitle] = useState("");
  const [newLiveDescritpion, setNewLiveDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isCreatingLiveSale, setIsCreatingLiveSale] = useState(false);
  const [selectedLiveSale, setSelectedLiveSale] = useState<any>(null);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [loadingLives, setLoadingLives] = useState(false);
  const { toast } = useToast();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userInfo?.uid || !lives) return;

    setLoadingLives(true);
    const unsubscribes: (() => void)[] = [];
    const enrichedLivesMap = new Map<string, any>();

    const updateUserLives = () => {
      setUserLives(Array.from(enrichedLivesMap.values()));
    };

    const userLives = lives.filter((live: any) => live.creatorId === userInfo.uid);

    userLives.forEach((live: any) => {
      if (!Array.isArray(live.products) || live.products.length === 0) {
        enrichedLivesMap.set(live.id, { ...live, products: [] });
        updateUserLives();
        return;
      }

      const productMap = new Map<string, any>();

      const handleProductUpdate = (productId: string, data: any | null) => {
        if (data) {
          productMap.set(productId, data);
        } else {
          productMap.delete(productId);
        }

        enrichedLivesMap.set(live.id, {
          ...live,
          products: Array.from(productMap.values()),
        });

        updateUserLives();
      };

      // Set up real-time listeners for each product in the live
      live.products.forEach((productId: string) => {
        const unsub = getASubDocument(
          live.creatorId,
          "products",
          productId,
          (data) => handleProductUpdate(productId, data)
        );
        if (unsub) unsubscribes.push(unsub);
      });
    });

    setLoadingLives(false);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [userInfo?.uid, lives]);


  const handleCreateLiveSale = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const title = e.target.title.value;
    const description = e.target.description.value;
    const date = e.target.date.value;
    const time = e.target.time.value;
    const switchTime = e.target.switch.value

    let imageUrl = "/placeholder.svg";

    if (thumbnail) {
      const storageRef = ref(
        storage,
        `liveSales/${Date.now()}_${thumbnail.name}`
      );
      const snapshot = await uploadBytes(storageRef, thumbnail);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const newLiveSale = {
      title,
      status: "scheduled",
      creatorId: userInfo.uid,
      creatorName: userInfo.name,
      scheduledFor: `${date} - ${time}`,
      startedAt: "",
      viewers: 0,
      products: selectedProducts, // implement product selection later
      description,
      switchTime,
      image: imageUrl,
    };

    await addToCollection("lives", newLiveSale)
    setIsCreatingLiveSale(false);
    setSelectedProducts([]);
    setThumbnail(null);
    setLoading(true);

    toast({
      title: "Live sale created",
      description: "Your new live sale has been scheduled successfully.",
    });

    console.log("New Live Sale:", newLiveSale);
  };

  const handleStartLiveSale = async (id: any) => {
    const now = new Date().toISOString();
    await updateDocument("lives", id, {status: "active", startedAt: now})
    toast({
      title: "Live sale started",
      description: "Your live sale has started successfully.",
    });
  };

  const handleEndLiveSale = async (id: any) => {
    const now = new Date().toISOString();

    await updateDocument("lives", id, {status: "ended", endedAt: now})

    toast({
      title: "Live sale ended",
      description: "Your live sale has ended successfully.",
    });
  };

  const handleSetFeaturedProduct = async (saleId: any, productId: any) => {
    await updateDocument("lives", saleId, {currentFeaturedProduct: productId})

    toast({
      title: "Featured product updated",
      description: "The featured product has been updated successfully.",
    });

    setShowProductsDialog(false);
  };

  const getStatusBadge = (status: any) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-500">Live Now</Badge>;
      case "scheduled":
        return <Badge className="bg-amber-500">Scheduled</Badge>;
      case "ended":
        return <Badge className="bg-gray-500">Ended</Badge>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">My Live Sales</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500">Manage your live sales and products</p>
            <Dialog
              open={isCreatingLiveSale}
              onOpenChange={setIsCreatingLiveSale}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Live Sale</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleCreateLiveSale}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Enter live sale title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Enter description"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" name="time" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Products</Label>
                    <div className="grid gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                      {userProducts.map((product: any) => {
                        const selectedIndex = selectedProducts.indexOf(product.id)
                        const isSelected = selectedIndex !== -1
                        const orderLabel = isSelected ? `(${selectedIndex + 1})` : ""
                        return (
                        <label
                          key={product.id}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            value={product.id}
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSelectedProducts((prev) =>
                                e.target.checked
                                  ? [...prev, value]
                                  : prev.filter((id) => id !== value)
                              );
                            }}
                          />
                          {product.name} <span className="text-xs text-gray-400">selected as n {orderLabel}</span>
                        </label>
                      )})}
                    </div>
                    <p className="text-xs text-gray-500">
                      You can select multiple products during the live sale
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">How long to switch products</Label>
                    <Input
                      id="switchTime"
                      name="switchTime"
                      type="number"
                      placeholder="Enter number of minutes"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail Image</Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setThumbnail(file);
                      }}
                    />
                    {thumbnail && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(thumbnail)}
                          alt="Thumbnail preview"
                          className="w-32 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setIsCreatingLiveSale(false);
                        setThumbnail(null);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Create Live Sale"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Live Now
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex-1">
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="ended" className="flex-1">
              Ended
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {userLives.map((sale) => (
              <Card key={sale.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={sale.image || "/placeholder.svg"}
                    alt={sale.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(sale.status)}
                  </div>
                  {sale.status === "active" && (
                    <Badge className="absolute bottom-2 left-2 bg-black/70">
                      <Users className="h-3 w-3 mr-1" />
                      {sale.viewers} watching
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{sale.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {sale.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      {sale.status === "scheduled" ? (
                        <Calendar className="h-4 w-4 mr-1" />
                      ) : (
                        <Clock className="h-4 w-4 mr-1" />
                      )}
                      <span>{sale.scheduledFor}</span>
                    </div>
                    <span>{sale.products.length} products</span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {sale.status === "scheduled" && (
                      <Button onClick={() => handleStartLiveSale(sale.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Live Sale
                      </Button>
                    )}

                    {sale.status === "active" && (
                      <>
                        <Button
                          onClick={() => handleEndLiveSale(sale.id)}
                          variant="destructive"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          End Live Sale
                        </Button>

                        <Dialog
                          open={
                            showProductsDialog && selectedLiveSale === sale.id
                          }
                          onOpenChange={(open) => {
                            setShowProductsDialog(open);
                            if (open) setSelectedLiveSale(sale.id);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Package className="h-4 w-4 mr-2" />
                              Manage Products
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Manage Featured Products
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <p className="text-sm text-gray-500">
                                Select a product to feature in your live sale.
                                The featured product will be prominently
                                displayed to viewers.
                              </p>

                              <div className="space-y-2">
                                {sale.products.map((product: any) => (
                                  <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 border rounded-md"
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {product.name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        XAF{product.price}
                                      </p>
                                    </div>
                                    {sale.currentFeaturedProduct === product.id ? (
                                      <Badge className="bg-primary">
                                        Featured
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleSetFeaturedProduct(
                                            sale.id,
                                            product.id
                                          )
                                        }
                                      >
                                        Set as Featured
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setShowProductsDialog(false)}
                                >
                                  Close
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Link href={`/live/${sale.id}`}>
                          <Button variant="outline" className="w-full">
                            <Video className="h-4 w-4 mr-2" />
                            View Live Stream
                          </Button>
                        </Link>
                      </>
                    )}

                    {sale.status === "ended" && (
                      <div className="text-sm text-gray-500">
                        <p>Started: {sale.startedAt}</p>
                        <p>Total viewers: {sale.viewers}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {userLives
              .filter((sale) => sale.status === "active")
              .map((sale) => (
                <Card key={sale.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={sale.image || "/placeholder.svg"}
                      alt={sale.title}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Live Now
                    </Badge>
                    <Badge className="absolute bottom-2 left-2 bg-black/70">
                      <Users className="h-3 w-3 mr-1" />
                      {sale.viewers} watching
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {sale.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Started {sale.startedAt}</span>
                      </div>
                      <span>{sale.products.length} products</span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const link = `https://paylive.vercel.app/lives/${sale.id}`
                          navigator.clipboard.writeText(link)
                          toast({
                            title: "Copied",
                            description: "Link Copied to Clipboard.",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Live Link
                      </Button>

                      <Button
                        onClick={() => handleEndLiveSale(sale.id)}
                        variant="destructive"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        End Live Sale
                      </Button>

                      <Dialog
                        open={
                          showProductsDialog && selectedLiveSale === sale.id
                        }
                        onOpenChange={(open) => {
                          setShowProductsDialog(open);
                          if (open) setSelectedLiveSale(sale.id);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Package className="h-4 w-4 mr-2" />
                            Manage Products
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Featured Products</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <p className="text-sm text-gray-500">
                              Select a product to feature in your live sale. The
                              featured product will be prominently displayed to
                              viewers.
                            </p>

                            <div className="space-y-2">
                              {sale.products.map((product: any) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between p-3 border rounded-md"
                                >
                                  <div>
                                    <p className="font-medium">
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      XAF{product.price}
                                    </p>
                                  </div>
                                  {product.featured ? (
                                    <Badge className="bg-primary">
                                      Featured
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleSetFeaturedProduct(
                                          sale.id,
                                          product.id
                                        )
                                      }
                                    >
                                      Set as Featured
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setShowProductsDialog(false)}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Link href={`/live/${sale.id}`}>
                        <Button variant="outline" className="w-full">
                          <Video className="h-4 w-4 mr-2" />
                          View Live Stream
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {userLives
              .filter((sale) => sale.status === "scheduled")
              .map((sale) => (
                <Card key={sale.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={sale.image || "/placeholder.svg"}
                      alt={sale.title}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-amber-500">
                      Scheduled
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {sale.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{sale.scheduledFor}</span>
                      </div>
                      <span>{sale.products.length} products</span>
                    </div>

                    <div className="mt-4">
                      <Button onClick={() => handleStartLiveSale(sale.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Live Sale
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="ended" className="space-y-4">
            {userLives
              .filter((sale) => sale.status === "ended")
              .map((sale) => (
                <Card key={sale.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={sale.image || "/placeholder.svg"}
                      alt={sale.title}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-gray-500">
                      Ended
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{sale.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {sale.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{sale.scheduledFor}</span>
                      </div>
                      <span>{sale.products.length} products</span>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      <p>Started: {sale.startedAt}</p>
                      <p>Total viewers: {sale.viewers}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
