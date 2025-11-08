"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Store,
  Copy,
  Eye,
  Trash2,
  ExternalLink,
  Package,
  ArrowLeft,
  Check,
  Edit,
  Info,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { addToCollection } from "@/functions/add-to-collection";
import { Catalog, CatalogProduct } from "@/types/catalog";
import { updateDocument } from "@/functions/update-doc-in-collection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteSubCollectionDocument } from "@/functions/delete-a-sub-document";
import { deleteADocument } from "@/functions/delete-a-document";
import { formatDate } from "@/functions/format-date";
import { useTranslations } from "@/lib/useTranslations";

// Mock data
// const mockProducts = [
//   { id: "1", name: "Wireless Headphones", price: 25000, inStock: true },
//   { id: "2", name: "Smartphone Case", price: 5000, inStock: true },
//   { id: "3", name: "Bluetooth Speaker", price: 15000, inStock: false },
//   { id: "4", name: "Power Bank", price: 8000, inStock: true },
//   { id: "5", name: "USB Cable", price: 2000, inStock: true },
// ];

const mockCatalogs: any = [
  {
    id: "cat1",
    title: "Electronics Collection",
    description: "Latest gadgets and accessories",
    isActive: true,
    productCount: 12,
    createdAt: new Date("2024-01-15"),
    views: 245,
    selectedProducts: ["1", "3", "4"],
  },
  {
    id: "cat2",
    title: "Fashion Essentials",
    description: "Trendy clothing and accessories",
    isActive: false,
    productCount: 8,
    createdAt: new Date("2024-01-10"),
    views: 89,
    selectedProducts: ["2", "5"],
  },
];

interface CatalogType {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  creatorId: string;
  creatorName: string;
  creatorPhone: number;
  productCount: number;
  createdAt: Date;
  views: number;
  products: any[];
}

export default function CatalogsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [newCatalog, setNewCatalog] = useState({
    title: "",
    description: "",
    selectedProducts: [] as CatalogProduct[],
  });
  const [editCatalog, setEditCatalog] = useState({
    id: "",
    title: "",
    description: "",
    selectedProducts: [] as CatalogProduct[],
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const { userInfo, user, userProducts, userCatalogs } = useAuth();
  const t = useTranslations("Dashboard.Catalogs");

  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCatalog.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a catalog title",
        variant: "destructive",
      });
      return;
    }

    if (newCatalog.selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const catalog: Omit<CatalogType, "id"> = {
      title: newCatalog.title,
      description: newCatalog.description,
      creatorId: userInfo.uid,
      creatorPhone: userInfo.phone,
      creatorName: userInfo.name,
      isActive: true,
      productCount: newCatalog.selectedProducts.length,
      createdAt: new Date(),
      views: 0,
      products: newCatalog.selectedProducts,
    };

    try {
      console.log(catalog);
      await addToCollection("catalogs", catalog);
      toast({
        title: "Success",
        description: "Catalog created successfully!",
      });

      setNewCatalog({ title: "", description: "", selectedProducts: [] });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Image upload error:", error);
      setLoading(false);
      toast({
        title: "Upload failed",
        description: "Could not upload one or more images.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUpdatedCatalogProducts = (catalog: Catalog) => {
  return catalog.products.map(productId => {
    // Si c'est déjà un ID string, trouver le produit actuel
    if (typeof productId === 'string') {
      return userProducts.find(p => p.id === productId);
    }
    // Si c'est un objet produit avec ID, trouver le produit actuel
    return userProducts.find(p => p.id === productId.id);
  }).filter(Boolean); // Filtrer les produits non trouvés
};

  const handleEditCatalog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editCatalog.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a catalog title",
        variant: "destructive",
      });
      return;
    }

    if (editCatalog.selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(editCatalog);
      // await addToCollection("catalogs", catalog)
      await updateDocument("catalogs", editCatalog.id, editCatalog);
      setIsEditDialogOpen(false);
      setEditCatalog({
        id: "",
        title: "",
        description: "",
        selectedProducts: [],
      });

      toast({
        title: "Success",
        description: "Catalog updated successfully!",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      setLoading(false);
      toast({
        title: "Upload failed",
        description: "Could not upload one or more images.",
      });
    } finally {
      setLoading(false);
    }

    setIsEditDialogOpen(false);
    setEditCatalog({
      id: "",
      title: "",
      description: "",
      selectedProducts: [],
    });

    toast({
      title: "Success",
      description: "Catalog updated successfully!",
    });
  };

  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      if (!user || !selectedCatalog) return;
      await deleteADocument("catalogs", selectedCatalog.id);
      setSelectedCatalog(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error updating catalog:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to delete catalog.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (catalog: Catalog) => {
    setEditCatalog(catalog);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setIsViewDialogOpen(true);
  };

  const copyLink = async (catalogId: string) => {
    const link = `${window.location.origin}/catalog/${catalogId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(catalogId);
      toast({
        title: "Link Copied!",
        description: "Catalog link has been copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const toggleCatalogStatus = (catalogId: string) => {
    // setCatalogs((prev) =>
    //   prev.map((catalog) => (catalog.id === catalogId ? { ...catalog, isActive: !catalog.isActive } : catalog)),
    // )
  };

  const deleteCatalog = (catalogId: string) => {
    // setCatalogs((prev) => prev.filter((catalog) => catalog.id !== catalogId))
    toast({
      title: "Catalog Deleted",
      description: "The catalog has been removed successfully",
    });
  };

  const handleProductToggle = (product: any, isEdit = false) => {
    if (isEdit) {
      setEditCatalog((prev) => ({
        ...prev,
        selectedProducts: prev.selectedProducts.includes(product)
          ? prev.selectedProducts.filter((id) => id !== product)
          : [...prev.selectedProducts, product],
      }));
    } else {
      setNewCatalog((prev) => ({
        ...prev,
        selectedProducts: prev.selectedProducts.includes(product)
          ? prev.selectedProducts.filter((id) => id !== product)
          : [...prev.selectedProducts, product],
      }));
    }
  };

  const getSelectedProductsForCatalog = (catalog: Catalog) => {
    return userProducts.filter((product) =>
      catalog.selectedProducts.includes(product)
    );
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-gray-600">{t("description")}</p>
        </div>
      </div>

      {/* Create New Catalog Button */}
      <div className="mb-6">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Catalog
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("createNewButton")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCatalog} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    {t("CreateCatalogDialog.catalogTitle")} *
                  </Label>
                  <Input
                    id="title"
                    value={newCatalog.title}
                    onChange={(e) =>
                      setNewCatalog((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Summer Collection 2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">
                    {t("CreateCatalogDialog.description")}
                  </Label>
                  <Textarea
                    id="description"
                    value={newCatalog.description}
                    onChange={(e) =>
                      setNewCatalog((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of your catalog..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">
                  {t("CreateCatalogDialog.selectProducts")} *
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  {t("CreateCatalogDialog.selectProductsDescription")}
                </p>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {userProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`create-${product.id}`}
                          checked={newCatalog.selectedProducts.includes(
                            product
                          )}
                          onCheckedChange={() => handleProductToggle(product)}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`create-${product.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {product.name}
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              XAF {product.price}
                            </span>
                            <Badge
                              variant={
                                product.inStock ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {product.inStock
                                ? t("CreateCatalogDialog.inStock")
                                : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {newCatalog.selectedProducts.length}{" "}
                  {t("CreateCatalogDialog.productsSelected")}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  disabled={loading}
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  {t("CreateCatalogDialog.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {t("CreateCatalogDialog.createButton")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Catalog Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editCatalog")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCatalog} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">
                  {t("CreateCatalogDialog.title")} *
                </Label>
                <Input
                  id="edit-title"
                  value={editCatalog.title}
                  onChange={(e) =>
                    setEditCatalog((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g., Summer Collection 2024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editCatalog.description}
                  onChange={(e) =>
                    setEditCatalog((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of your catalog..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">
                {t("CreateCatalogDialog.selectProducts")} *
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                {t("CreateCatalogDialog.selectProductsDescription")}
              </p>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {userProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={`edit-${product.id}`}
                        checked={editCatalog.selectedProducts.includes(
                          product.id
                        )}
                        onCheckedChange={() =>
                          handleProductToggle(product.id, true)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`edit-${product.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {product.name}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">
                            XAF {product.price.toLocaleString()}
                          </span>
                          <Badge
                            variant={product.inStock ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {product.inStock
                              ? t("CreateCatalogDialog.inStock")
                              : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {editCatalog.selectedProducts.length}{" "}
                {t("CreateCatalogDialog.productsSelected")}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                disabled={loading}
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                {t("deleteDialog.cancel")}
              </Button>
              <Button
                disabled={loading}
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {t("updateCatalog")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Catalog Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("ViewCatalogDialog.dialogTitle")}</DialogTitle>
          </DialogHeader>
          {selectedCatalog && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {t("ViewCatalogDialog.title")}
                  </Label>
                  <p className="text-lg">{selectedCatalog.title}</p>
                </div>
                <div>
                  <Label className="text-base font-medium">
                    {t("ViewCatalogDialog.description")}
                  </Label>
                  <p className="text-gray-600">
                    {selectedCatalog.description || "No description provided"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-medium">
                      {t("ViewCatalogDialog.status")}
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          selectedCatalog.isActive ? "default" : "secondary"
                        }
                      >
                        {selectedCatalog.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-medium">
                      {t("ViewCatalogDialog.views")}
                    </Label>
                    <p className="text-lg">{selectedCatalog.views}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-base font-medium">
                    {t("ViewCatalogDialog.created")}
                  </Label>
                  <p className="text-gray-600">
                    {formatDate(selectedCatalog.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">
                  {t("ViewCatalogDialog.products")} (
                  {selectedCatalog.productCount})
                </Label>
                <div className="mt-3 space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {getUpdatedCatalogProducts(selectedCatalog).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          XAF {product.price.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={product.inStock > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {product.inStock > 0
                          ? t("CreateCatalogDialog.inStock")
                          : "Out of Stock"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => copyLink(selectedCatalog.id)}
                  className="flex-1"
                >
                  {copiedId === selectedCatalog.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t("ViewCatalogDialog.copyLink")}
                    </>
                  )}
                </Button>
                <Link href={`/catalog/${selectedCatalog.id}`} target="_blank">
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("ViewCatalogDialog.viewLive")}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")} {selectedCatalog?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction disabled={loading} onClick={handleDeleteProduct}>
              {t("deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Catalogs Grid */}
      {userCatalogs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noCatalogTitle")}
            </h3>
            <p className="text-gray-600 mb-4">{t("noCatalogDescription")}</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("noCatalogButton")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userCatalogs.map((catalog: Catalog) => (
            <Card
              key={catalog.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {catalog.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {catalog.description || "No description"}
                    </p>
                  </div>
                  <Badge
                    variant={catalog.isActive ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {catalog.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>
                      {getUpdatedCatalogProducts(catalog).length} {t("CatalogCard.products")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>
                      {catalog.views} {t("CatalogCard.view")}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {t("ViewCatalogDialog.created")}{" "}
                  {formatDate(catalog.createdAt)}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewDialog(catalog)}
                    className="flex-1"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {t("CatalogCard.view")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(catalog)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {t("CatalogCard.edit")}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(catalog.id)}
                    className="flex-1"
                  >
                    {copiedId === catalog.id ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        {t("CatalogCard.copyLink")}
                      </>
                    )}
                  </Button>
                  <Link href={`/catalog/${catalog.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCatalogStatus(catalog.id)}
                    className="flex-1"
                  >
                    {catalog.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCatalog(catalog.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
