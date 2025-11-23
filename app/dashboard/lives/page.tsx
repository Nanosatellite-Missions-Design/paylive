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
  Share2, // AJOUT: Import de l'icône Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/functions/firebase";
import { addToCollection } from "@/functions/add-to-collection";
import { updateDocument } from "@/functions/update-doc-in-collection";
import { getASubDocument } from "@/functions/get-a-document";
import { useTranslations } from "@/lib/useTranslations";

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
  const t = useTranslations("Dashboard.Lives");

  // AJOUT: État pour le partage
  const [shareStates, setShareStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    if (!userInfo?.uid || !lives) return;

    setLoadingLives(true);
    const unsubscribes: (() => void)[] = [];
    const enrichedLivesMap = new Map<string, any>();

    const updateUserLives = () => {
      setUserLives(Array.from(enrichedLivesMap.values()));
    };

    const userLives = lives.filter(
      (live: any) => live.creatorId === userInfo.uid
    );

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

  // AJOUT: Fonction pour partager le live
  const handleShareLive = async (liveId: string, liveTitle: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const liveUrl = `${baseUrl}/live/${liveId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: liveTitle,
          text: `Rejoignez-moi pour ce live shopping: ${liveTitle}`,
          url: liveUrl,
        });
      } catch (error) {
        // L'utilisateur a probablement annulé le partage
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copier dans le presse-papier
      try {
        await navigator.clipboard.writeText(liveUrl);
        setShareStates((prev) => ({ ...prev, [liveId]: true }));
        toast({
          title: "Lien copié !",
          description: "Le lien du live a été copié dans le presse-papier.",
        });
        setTimeout(() => {
          setShareStates((prev) => ({ ...prev, [liveId]: false }));
        }, 3000);
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateLiveSale = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const title = e.target.title.value;
    const description = e.target.description.value;
    const date = e.target.date.value;
    const time = e.target.time.value;

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
      products: selectedProducts,
      description,
      image: imageUrl,
    };

    await addToCollection("lives", newLiveSale);
    setIsCreatingLiveSale(false);
    setSelectedProducts([]);
    setThumbnail(null);
    setNewLiveTitle("");
    setNewLiveDescription("");
    setLoading(false);

    toast({
      title: "Live créé",
      description: "Votre nouveau live a été programmé avec succès.",
    });
  };

  const handleStartLiveSale = async (id: any) => {
    const now = new Date().toISOString();
    await updateDocument("lives", id, { status: "active", startedAt: now });
    toast({
      title: "Live démarré",
      description: "Votre live a commencé avec succès.",
    });
  };

  const handleEndLiveSale = async (id: any) => {
    const now = new Date().toISOString();

    await updateDocument("lives", id, { status: "ended", endedAt: now });

    toast({
      title: "Live terminé",
      description: "Votre live s'est terminé avec succès.",
    });
  };

  const handleSetFeaturedProduct = async (saleId: any, productId: any) => {
    await updateDocument("lives", saleId, {
      currentFeaturedProduct: productId,
    });

    toast({
      title: "Produit vedette mis à jour",
      description: "Le produit vedette a été mis à jour avec succès.",
    });

    setShowProductsDialog(false);
  };

  const getStatusBadge = (status: any) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-500">En Direct</Badge>;
      case "scheduled":
        return <Badge className="bg-amber-500">Programmé</Badge>;
      case "ended":
        return <Badge className="bg-gray-500">Terminé</Badge>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500">{t("description")}</p>
            <Dialog
              open={isCreatingLiveSale}
              onOpenChange={setIsCreatingLiveSale}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("create")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {t("CreateLiveDialog.createLiveSale")}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleCreateLiveSale}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">{t("CreateLiveDialog.title")}</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Entrez le titre du live"
                      required
                      value={newLiveTitle}
                      onChange={(e) => setNewLiveTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {t("CreateLiveDialog.description")}
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Entrez la description"
                      required
                      value={newLiveDescritpion}
                      onChange={(e) => setNewLiveDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">{t("CreateLiveDialog.date")}</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">{t("CreateLiveDialog.time")}</Label>
                    <Input id="time" name="time" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("CreateLiveDialog.selectProducts")}</Label>
                    <div className="grid gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                      {userProducts.map((product: any) => (
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
                          {product.name}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("CreateLiveDialog.selectMultiple")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">
                      {t("CreateLiveDialog.thumbnail")}
                    </Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-500">
                        Cliquez pour télécharger ou glisser-déposer
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF jusqu'à 5MB
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
                          alt="Aperçu de la miniature"
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
                        setNewLiveTitle("");
                        setNewLiveDescription("");
                      }}
                      disabled={loading}
                    >
                      {t("CreateLiveDialog.cancel")}
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        t("CreateLiveDialog.createButton")
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
              {t("all")}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              {t("liveNow")}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex-1">
              {t("scheduled")}
            </TabsTrigger>
            <TabsTrigger value="ended" className="flex-1">
              {t("ended")}
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
                      {sale.viewers} {t("LiveCard.watching")}
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
                    <span>
                      {sale.products.length} {t("LiveCard.products")}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {sale.status === "scheduled" && (
                      <>
                        <Button onClick={() => handleStartLiveSale(sale.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          {t("LiveCard.startLive")}
                        </Button>

                        {/* AJOUT: Bouton Partager pour les lives programmés */}
                        <Button
                          variant="outline"
                          onClick={() => handleShareLive(sale.id, sale.title)}
                          className="relative"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          {shareStates[sale.id]
                            ? "Lien copié !"
                            : "Partager l'invitation"}
                        </Button>
                      </>
                    )}

                    {sale.status === "active" && (
                      <>
                        <Button
                          onClick={() => handleEndLiveSale(sale.id)}
                          variant="destructive"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          {t("LiveCard.endLive")}
                        </Button>

                        {/* AJOUT: Bouton Partager pour les lives actifs */}
                        <Button
                          variant="outline"
                          onClick={() => handleShareLive(sale.id, sale.title)}
                          className="relative"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          {shareStates[sale.id]
                            ? "Lien copié !"
                            : "Partager le live"}
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
                              {t("LiveCard.manageProducts")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {t("LiveCard.manageProductsDialog.title")}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <p className="text-sm text-gray-500">
                                {t("LiveCard.manageProductsDialog.description")}
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
                                    {sale.currentFeaturedProduct ===
                                    product.id ? (
                                      <Badge className="bg-primary">
                                        {t(
                                          "LiveCard.manageProductsDialog.featured"
                                        )}
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
                                        {t(
                                          "LiveCard.manageProductsDialog.setAsFeatured"
                                        )}
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
                                  {t("LiveCard.manageProductsDialog.close")}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Link href={`/live/${sale.id}`}>
                          <Button variant="outline" className="w-full">
                            <Video className="h-4 w-4 mr-2" />
                            {t("LiveCard.viewLive")}
                          </Button>
                        </Link>
                      </>
                    )}

                    {sale.status === "ended" && (
                      <div className="text-sm text-gray-500">
                        <p>Commençé le: {sale.startedAt}</p>
                        <p>Spectateurs totaux: {sale.viewers}</p>
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
                      {t("liveNow")}
                    </Badge>
                    <Badge className="absolute bottom-2 left-2 bg-black/70">
                      <Users className="h-3 w-3 mr-1" />
                      {sale.viewers} {t("LiveCard.watching")}
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
                        <span>Commençé {sale.startedAt}</span>
                      </div>
                      <span>
                        {sale.products.length} {t("LiveCard.products")}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button
                        onClick={() => handleEndLiveSale(sale.id)}
                        variant="destructive"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        {t("LiveCard.endLive")}
                      </Button>

                      {/* AJOUT: Bouton Partager pour les lives actifs */}
                      <Button
                        variant="outline"
                        onClick={() => handleShareLive(sale.id, sale.title)}
                        className="relative"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {shareStates[sale.id]
                          ? "Lien copié !"
                          : "Partager le live"}
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
                            {t("LiveCard.manageProducts")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {t("LiveCard.manageProductsDialog.title")}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <p className="text-sm text-gray-500">
                              {t("CreateLiveDialog.description")}
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
                                      {t(
                                        "LiveCard.manageProductsDialog.featured"
                                      )}
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
                                      {t(
                                        "LiveCard.manageProductsDialog.setAsFeatured"
                                      )}
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
                                {t("LiveCard.manageProductsDialog.close")}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Link href={`/live/${sale.id}`}>
                        <Button variant="outline" className="w-full">
                          <Video className="h-4 w-4 mr-2" />
                          {t("LiveCard.viewLive")}
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
                      {t("scheduled")}
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
                      <span>
                        {sale.products.length} {t("LiveCard.products")}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button onClick={() => handleStartLiveSale(sale.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        {t("LiveCard.startLive")}
                      </Button>

                      {/* AJOUT: Bouton Partager pour les lives programmés */}
                      <Button
                        variant="outline"
                        onClick={() => handleShareLive(sale.id, sale.title)}
                        className="relative"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {shareStates[sale.id]
                          ? "Lien copié !"
                          : "Partager l'invitation"}
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
                      {t("ended")}
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
                      <span>
                        {sale.products.length} {t("LiveCard.products")}
                      </span>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      <p>Commençé le: {sale.startedAt}</p>
                      <p>Spectateurs totaux: {sale.viewers}</p>
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
