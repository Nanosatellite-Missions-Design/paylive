"use client";

import { useState, useRef, useEffect } from "react";
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
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Loader2,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCodeGenerator from "@/components/qr-code-generator";
import { addToSubCollection } from "@/functions/add-to-a-sub-collection";
import { updateSubcollectionDocument } from "@/functions/update-doc-in-sub-collection";
import { deleteSubCollectionDocument } from "@/functions/delete-a-sub-document";
import { useAuth } from "@/contexts/auth-context";
import { storage } from "@/functions/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

export default function ProductsPage() {
  const { user, userInfo, userProducts, userCatalogs } = useAuth();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingExistingImages, setEditingExistingImages] = useState<string[]>(
    []
  );
  const [editingNewImageFiles, setEditingNewImageFiles] = useState<File[]>([]);
  const [editingNewImagePreviews, setEditingNewImagePreviews] = useState<
    string[]
  >([]);
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductStatus, setNewProductStatus] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductImageFiles, setNewProductImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // CORRECTION: Fonction utilitaire pour obtenir la première image avec type explicite
  const getFirstImage = (product: any): string => {
    if (!product) return "/placeholder.svg";

    // Vérifier d'abord product.images (tableau)
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return product.images[0];
    }

    // Ensuite vérifier product.image (peut être un tableau ou une string)
    if (product.image) {
      if (Array.isArray(product.image) && product.image.length > 0) {
        return product.image[0];
      } else if (
        typeof product.image === "string" &&
        product.image.trim() !== ""
      ) {
        return product.image;
      }
    }

    return "/placeholder.svg";
  };

  // CORRECTION: Fonction utilitaire pour obtenir toutes les images avec type explicite
  const getAllImages = (product: any): string[] => {
    if (!product) return [];

    // CORRECTION: Déclarer images avec le type string[]
    const images: string[] = [];

    // Vérifier d'abord product.images
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      // CORRECTION: Utiliser forEach au lieu de spread operator pour plus de clarté
      product.images.forEach((img: any) => {
        if (img && typeof img === "string" && img.trim() !== "") {
          images.push(img);
        }
      });
    }

    // Ensuite vérifier product.image
    if (product.image) {
      if (Array.isArray(product.image) && product.image.length > 0) {
        // Fusionner en évitant les doublons
        product.image.forEach((img: any) => {
          if (
            img &&
            typeof img === "string" &&
            img.trim() !== "" &&
            !images.includes(img)
          ) {
            images.push(img);
          }
        });
      } else if (
        typeof product.image === "string" &&
        product.image.trim() !== "" &&
        !images.includes(product.image)
      ) {
        images.push(product.image);
      }
    }

    return images;
  };

  const handleShare = async (product: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const productUrl = `${baseUrl}/user/${userInfo?.uid}/product/${product.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: productUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl);
        setShowShareSuccess(true);
        toast({
          title: "Lien copié !",
          description: "Le lien du produit a été copié dans le presse-papier.",
        });
        setTimeout(() => setShowShareSuccess(false), 2000);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userInfo) return;

    if (
      !newProductName ||
      !newProductPrice ||
      !newProductDescription ||
      !newProductCategory ||
      newProductImageFiles.length === 0
    ) {
      toast({
        title: "Champs manquants",
        description:
          "Veuillez remplir tous les champs et télécharger au moins une image.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload all images
      const uploadPromises = newProductImageFiles.map((file) => {
        const uniqueName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}-${file.name}`;
        const storageRef = ref(storage, `products/${user.uid}/${uniqueName}`);
        return uploadBytes(storageRef, file).then((snapshot) =>
          getDownloadURL(snapshot.ref)
        );
      });

      const imageUrls = await Promise.all(uploadPromises);

      const newProduct = {
        name: newProductName,
        creatorId: user.uid,
        creatorName: userInfo.name || "Vendeur",
        price: parseFloat(newProductPrice),
        description: newProductDescription,
        inStock: newProductQuantity ? parseInt(newProductQuantity) : 1,
        images: imageUrls,
        image: imageUrls,
        category: newProductCategory,
        status: "available",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Nouveau produit:", newProduct);
      await addToSubCollection(newProduct, "users", user.uid, "products");

      setIsAddingProduct(false);

      // Reset form
      setNewProductName("");
      setNewProductPrice("");
      setNewProductDescription("");
      setNewProductCategory("");
      setNewProductStatus("");
      setNewProductQuantity("");
      setNewProductImageFiles([]);
      setLoading(false);
      toast({
        title: "Produit ajouté",
        description: "Votre nouveau produit a été ajouté avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement des images:", error);
      setLoading(false);
      toast({
        title: "Échec du téléchargement",
        description: "Impossible de télécharger une ou plusieurs images.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    const allImages = getAllImages(product);
    setEditingExistingImages(allImages);
    setEditingNewImageFiles([]);
    setEditingNewImagePreviews([]);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingProduct) return;

    setLoading(true);

    try {
      let uploadedUrls: string[] = [];

      // Upload new files to Firebase
      if (editingNewImageFiles.length > 0) {
        const uploadPromises = editingNewImageFiles.map(async (file) => {
          const uniqueName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 15)}-${file.name}`;
          const imageRef = ref(
            storage,
            `products/${user.uid}/${editingProduct.id}/${uniqueName}`
          );
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        });

        const newUrls = await Promise.all(uploadPromises);
        uploadedUrls = [...uploadedUrls, ...newUrls];
      }

      // Combiner les images existantes et nouvelles
      const allImages = [...editingExistingImages, ...uploadedUrls];

      const updatedProduct = {
        ...editingProduct,
        name: editingProduct.name,
        price: editingProduct.price,
        description: editingProduct.description,
        category: editingProduct.category,
        status: editingProduct.status,
        inStock: editingProduct.inStock,
        images: allImages,
        image: allImages,
        updatedAt: new Date().toISOString(),
      };

      console.log("Produit mis à jour:", updatedProduct);

      await updateSubcollectionDocument(
        "users",
        user.uid,
        "products",
        editingProduct.id,
        updatedProduct
      );

      toast({
        title: "Produit mis à jour",
        description: "Votre produit a été mis à jour avec succès.",
      });

      setLoading(false);
      setIsEditing(false);
      setEditingProduct(null);
      setEditingExistingImages([]);
      setEditingNewImageFiles([]);
      setEditingNewImagePreviews([]);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      setLoading(false);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du produit.",
        variant: "destructive",
      });
    }
  };

  const handleShowDelete = (product: any) => {
    setSelectedProduct(product);
    setIsDeleting(true);
  };

  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      if (!user || !selectedProduct) return;

      await deleteSubCollectionDocument(
        "users",
        user.uid,
        "products",
        selectedProduct.id
      );

      toast({
        title: "Produit supprimé",
        description: `${selectedProduct.name} a été supprimé.`,
      });

      setLoading(false);
      setIsDeleting(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du produit:", error);
      setLoading(false);
      toast({
        title: "Erreur",
        description: "Échec de la suppression du produit.",
        variant: "destructive",
      });
    }
  };

  const handleShowQRCode = (product: any) => {
    setSelectedProduct(product);
    setShowQRCode(true);
  };

  return (
    <div>
      <div className="container max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/dashboard/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Mes produits</h1>
          </div>
          <p className="text-gray-500">
            Gérez vos produits pour les ventes en direct et les enchères
          </p>
        </header>

        <div className="space-y-4 mb-6">
          {userProducts?.map((product: any) => {
            const firstImage = getFirstImage(product);
            return (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 rounded-md overflow-hidden mr-3 bg-gray-100 flex items-center justify-center">
                      {firstImage !== "/placeholder.svg" ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{product.name}</h3>
                        <Badge
                          className={
                            product.status === "available"
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }
                        >
                          {product.status === "available"
                            ? "Disponible"
                            : "Vendu"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-medium">
                          XAF
                          {typeof product.price === "number"
                            ? product.price.toFixed(2)
                            : "0.00"}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShare(product)}
                            className="h-8 w-8 relative"
                          >
                            <Share2 className="h-4 w-4" />
                            {showShareSuccess && (
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                Lien copié !
                              </div>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShowQRCode(product)}
                            className="h-8 w-8"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShowDelete(product)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera
                définitivement le produit {selectedProduct?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={loading}
                onClick={handleDeleteProduct}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Supprimer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau produit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  placeholder="Entrez le nom du produit"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prix (XAF) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité en stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="1"
                  value={newProductQuantity}
                  onChange={(e) => setNewProductQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Entrez la description du produit"
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="whitespace-pre-wrap min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={newProductCategory}
                  onValueChange={setNewProductCategory}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Électronique</SelectItem>
                    <SelectItem value="fashion">Mode</SelectItem>
                    <SelectItem value="home">Maison & Cuisine</SelectItem>
                    <SelectItem value="beauty">
                      Beauté & Soins personnels
                    </SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Images du produit *</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
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
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      const newFiles = Array.from(files);
                      if (newProductImageFiles.length + newFiles.length > 10) {
                        toast({
                          title: "Trop d'images",
                          description:
                            "Vous ne pouvez télécharger que 10 images maximum.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setNewProductImageFiles((prev) => [...prev, ...newFiles]);
                    }
                  }}
                />

                <div className="flex flex-wrap gap-2 mt-2">
                  {newProductImageFiles.map((file, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-full h-full object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewProductImageFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  disabled={loading}
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                >
                  Annuler
                </Button>
                <Button disabled={loading} type="submit">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    "Ajouter le produit"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG D'ÉDITION AVEC GESTION DES IMAGES */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le produit</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom du produit</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      })
                    }
                    className="whitespace-pre-wrap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Prix (XAF)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.price || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantité en stock</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    step="1"
                    min="0"
                    value={editingProduct.inStock || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        inStock: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingProduct.description || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: e.target.value,
                      })
                    }
                    className="whitespace-pre-wrap min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Catégorie</Label>
                  <Select
                    value={editingProduct.category || ""}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Électronique</SelectItem>
                      <SelectItem value="fashion">Mode</SelectItem>
                      <SelectItem value="home">Maison & Cuisine</SelectItem>
                      <SelectItem value="beauty">
                        Beauté & Soins personnels
                      </SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={editingProduct.status || "available"}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="sold">Vendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Images du produit</Label>

                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <ImageIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm text-gray-500">
                      Ajouter de nouvelles images
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF jusqu'à 5MB
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={editFileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        const totalImages =
                          editingExistingImages.length +
                          editingNewImageFiles.length +
                          files.length;
                        if (totalImages > 10) {
                          toast({
                            title: "Trop d'images",
                            description:
                              "Vous ne pouvez avoir que 10 images maximum.",
                            variant: "destructive",
                          });
                          return;
                        }

                        setEditingNewImageFiles((prev) => [...prev, ...files]);
                        setEditingNewImagePreviews((prev) => [
                          ...prev,
                          ...files.map((file) => URL.createObjectURL(file)),
                        ]);
                      }
                    }}
                  />

                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingExistingImages.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative w-20 h-20 rounded-md overflow-hidden border"
                      >
                        <img
                          src={url}
                          alt={`existante-${index}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExistingImages((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="absolute top-0 right-0 bg-white text-red-500 rounded-full p-1 text-xs hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {editingNewImagePreviews.map((preview, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative w-20 h-20 rounded-md overflow-hidden border"
                      >
                        <img
                          src={preview}
                          className="w-full h-full object-cover"
                          alt={`nouvelle-${index}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNewImagePreviews((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                            setEditingNewImageFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="absolute top-0 right-0 bg-white text-red-500 rounded-full p-1 text-xs hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {editingExistingImages.length +
                      editingNewImagePreviews.length}{" "}
                    image(s) sélectionnée(s)
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    disabled={loading}
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingProduct(null);
                      setEditingExistingImages([]);
                      setEditingNewImageFiles([]);
                      setEditingNewImagePreviews([]);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button disabled={loading} type="submit">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      "Sauvegarder les modifications"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>QR Code du produit</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="bg-white p-4 rounded-md">
                {selectedProduct && (
                  <QRCodeGenerator
                    value={`${window.location.origin}/user/${userInfo?.uid}/product/${selectedProduct.id}`}
                    size={200}
                  />
                )}
              </div>
              <p className="mt-4 text-center text-sm font-medium">
                {selectedProduct?.name}
              </p>
              <p className="text-center text-xs text-gray-500">
                Scannez pour voir les détails du produit
              </p>
              <Button className="mt-4" onClick={() => window.print()}>
                Imprimer le QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
