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
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Loader2,
  Share2,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Globe,
  CreditCard,
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
  const [isTelegramProduct, setIsTelegramProduct] = useState(false);

  // États d'édition pour Telegram
  const [editingTelegramWelcomeMessage, setEditingTelegramWelcomeMessage] =
    useState("");
  const [editingTelegramMaxMembers, setEditingTelegramMaxMembers] =
    useState("");
  const [editingTelegramSubscriptionType, setEditingTelegramSubscriptionType] =
    useState("mensuelle");
  const [editingTelegramImagePreview, setEditingTelegramImagePreview] =
    useState<string | null>(null);

  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const editTelegramFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductImageFiles, setNewProductImageFiles] = useState<File[]>([]);
  const [newProductImagePreviews, setNewProductImagePreviews] = useState<
    string[]
  >([]);

  // Champs pour Telegram
  const [telegramGroupId, setTelegramGroupId] = useState("");
  const [telegramWelcomeMessage, setTelegramWelcomeMessage] = useState(
    "Bienvenue dans le groupe ! 👋"
  );
  const [telegramMaxMembers, setTelegramMaxMembers] = useState("100");
  const [telegramSubscriptionType, setTelegramSubscriptionType] =
    useState("mensuelle");
  const [telegramGroupImageFile, setTelegramGroupImageFile] =
    useState<File | null>(null);
  const [telegramGroupImagePreview, setTelegramGroupImagePreview] = useState<
    string | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const telegramFileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Fonction utilitaire pour obtenir la première image
  const getFirstImage = (product: any): string => {
    if (!product) return "/placeholder.svg";

    if (product.type === "telegram") {
      if (
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
      ) {
        return product.images[0];
      }
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
    }

    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return product.images[0];
    }

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

  const getAllImages = (product: any): string[] => {
    if (!product) return [];

    const images: string[] = [];

    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        if (img && typeof img === "string" && img.trim() !== "") {
          images.push(img);
        }
      });
    }

    if (product.image) {
      if (Array.isArray(product.image)) {
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
    let productUrl = `${baseUrl}/user/${userInfo?.uid}/product/${product.id}`;

    if (product.type === "telegram" && product.publicSlug) {
      productUrl = `${baseUrl}/telegram/${product.publicSlug}`;
    }

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

  // Fonction d'upload d'image robuste
  const uploadImageToFirebase = async (
    file: File,
    path: string
  ): Promise<string> => {
    try {
      // Vérifications de base
      if (!file || !file.name || file.size === 0) {
        throw new Error("Fichier invalide");
      }

      if (!path || !user?.uid) {
        throw new Error("Chemin de stockage invalide");
      }

      // Créer un nom unique pour le fichier
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const uniqueName = `${timestamp}-${randomStr}-${sanitizedName}`;

      // Créer la référence Firebase Storage
      const storageRef = ref(storage, `${path}/${uniqueName}`);

      // Upload du fichier
      const snapshot = await uploadBytes(storageRef, file);

      // Obtenir l'URL de téléchargement
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return downloadUrl;
    } catch (error: any) {
      console.error("Erreur lors de l'upload de l'image:", error);
      throw new Error(
        `Échec de l'upload: ${error.message || "Erreur inconnue"}`
      );
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userInfo || !user.uid) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un produit.",
        variant: "destructive",
      });
      return;
    }

    // Validation pour les produits normaux
    if (!isTelegramProduct) {
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
    } else {
      // Validation pour les produits Telegram
      if (
        !newProductName ||
        !newProductPrice ||
        !telegramGroupId ||
        !telegramSubscriptionType
      ) {
        toast({
          title: "Champs manquants",
          description:
            "Veuillez remplir tous les champs requis pour le groupe Telegram.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isTelegramProduct) {
        let telegramImageUrl = "/placeholder.svg";

        // Upload de l'image du groupe Telegram si elle existe
        if (telegramGroupImageFile) {
          try {
            telegramImageUrl = await uploadImageToFirebase(
              telegramGroupImageFile,
              `telegram-groups/${user.uid}`
            );
          } catch (uploadError: any) {
            console.error("Erreur upload image Telegram:", uploadError);
            toast({
              title: "Avertissement",
              description: `L'image n'a pas pu être uploadée: ${uploadError.message}.`,
              variant: "default",
            });
          }
        }

        // Créer un groupe Telegram via l'API
        const response = await fetch("/api/telegram/create-group", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newProductName,
            description:
              newProductDescription || "Rejoignez notre groupe exclusif",
            price: parseFloat(newProductPrice),
            subscriptionType: telegramSubscriptionType,
            telegramGroupId: telegramGroupId,
            welcomeMessage: telegramWelcomeMessage,
            maxMembers: telegramMaxMembers,
            creatorUid: user.uid,
            creatorName: userInfo.name || "Anonyme",
            image: telegramImageUrl,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Erreur lors de la création du groupe"
          );
        }

        toast({
          title: "Groupe créé !",
          description: "Votre groupe Telegram payant a été créé avec succès.",
        });
      } else {
        // Créer un produit normal
        const uploadPromises = newProductImageFiles.map((file) =>
          uploadImageToFirebase(file, `products/${user.uid}`)
        );

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
          type: "normal",
        };

        await addToSubCollection(newProduct, "users", user.uid, "products");

        toast({
          title: "Produit ajouté",
          description: "Votre nouveau produit a été ajouté avec succès.",
        });
      }

      // Réinitialiser le formulaire
      setIsAddingProduct(false);
      setIsTelegramProduct(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductDescription("");
      setNewProductCategory("");
      setNewProductQuantity("");
      setNewProductImageFiles([]);
      setNewProductImagePreviews([]);
      setTelegramGroupId("");
      setTelegramWelcomeMessage("Bienvenue dans le groupe ! 👋");
      setTelegramMaxMembers("100");
      setTelegramSubscriptionType("mensuelle");
      setTelegramGroupImageFile(null);
      setTelegramGroupImagePreview(null);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    const allImages = getAllImages(product);
    setEditingExistingImages(allImages);
    setEditingNewImageFiles([]);
    setEditingNewImagePreviews([]);
    setEditingTelegramImagePreview(null);

    if (product.type === "telegram") {
      setEditingTelegramWelcomeMessage(
        product.welcomeMessage || "Bienvenue dans le groupe ! 👋"
      );
      setEditingTelegramMaxMembers(product.maxMembers?.toString() || "100");
      setEditingTelegramSubscriptionType(
        product.subscriptionType || "mensuelle"
      );
    }

    setIsEditing(true);
  };

  const handleSaveEditNormal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !user ||
      !user.uid ||
      !editingProduct ||
      editingProduct.type === "telegram"
    ) {
      toast({
        title: "Erreur",
        description: "Données utilisateur ou produit invalides.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let uploadedUrls: string[] = [];
      const uploadPath = `products/${user.uid}/${editingProduct.id}`;

      // Vérifier le chemin avant l'upload
      if (!uploadPath || uploadPath.includes("undefined")) {
        throw new Error(
          "Chemin d'upload invalide. Vérifiez que l'utilisateur et le produit sont corrects."
        );
      }

      if (editingNewImageFiles.length > 0) {
        const uploadPromises = editingNewImageFiles.map((file) =>
          uploadImageToFirebase(file, uploadPath)
        );

        const newUrls = await Promise.all(uploadPromises);
        uploadedUrls = [...uploadedUrls, ...newUrls];
      }

      const allImages = [...editingExistingImages, ...uploadedUrls];

      // S'assurer qu'il y a au moins une image
      if (allImages.length === 0) {
        throw new Error("Le produit doit avoir au moins une image");
      }

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

      setIsEditing(false);
      setEditingProduct(null);
      setEditingExistingImages([]);
      setEditingNewImageFiles([]);
      setEditingNewImagePreviews([]);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la mise à jour du produit.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !user ||
      !user.uid ||
      !editingProduct ||
      editingProduct.type !== "telegram"
    ) {
      toast({
        title: "Erreur",
        description: "Données utilisateur ou produit invalides.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = editingExistingImages[0] || "/placeholder.svg";
      const uploadPath = `telegram-groups/${user.uid}/${editingProduct.id}`;

      // Vérifier si un nouveau fichier a été sélectionné via l'input
      if (editTelegramFileInputRef.current?.files?.length) {
        const file = editTelegramFileInputRef.current.files[0];
        if (file) {
          imageUrl = await uploadImageToFirebase(file, uploadPath);
        }
      }

      const updatedProduct = {
        ...editingProduct,
        name: editingProduct.name,
        price: editingProduct.price,
        description: editingProduct.description,
        subscriptionType: editingTelegramSubscriptionType,
        welcomeMessage: editingTelegramWelcomeMessage,
        maxMembers: parseInt(editingTelegramMaxMembers) || 100,
        images: [imageUrl],
        image: imageUrl,
        updatedAt: new Date().toISOString(),
      };

      await updateSubcollectionDocument(
        "users",
        user.uid,
        "products",
        editingProduct.id,
        updatedProduct
      );

      toast({
        title: "Groupe mis à jour",
        description: "Votre groupe Telegram a été mis à jour avec succès.",
      });

      setIsEditing(false);
      setEditingProduct(null);
      setEditingExistingImages([]);
      setEditingTelegramImagePreview(null);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du groupe Telegram:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Échec de la mise à jour du groupe Telegram.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      if (
        selectedProduct.type === "telegram" &&
        selectedProduct.telegramGroupId
      ) {
        await deleteSubCollectionDocument(
          "users",
          user.uid,
          "telegram_groups",
          selectedProduct.telegramGroupId
        );
      }

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

      setIsDeleting(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du produit:", error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression du produit.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowQRCode = (product: any) => {
    setSelectedProduct(product);
    setShowQRCode(true);
  };

  // Gestion des images pour les produits normaux
  const handleNormalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (newProductImageFiles.length + newFiles.length > 10) {
        toast({
          title: "Trop d'images",
          description: "Vous ne pouvez télécharger que 10 images maximum.",
          variant: "destructive",
        });
        return;
      }

      setNewProductImageFiles((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setNewProductImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // Gestion de l'image pour les groupes Telegram
  const handleTelegramImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setTelegramGroupImageFile(file);
      setTelegramGroupImagePreview(URL.createObjectURL(file));
    }
  };

  // Gestion de l'image pour les groupes Telegram (édition)
  const handleEditTelegramImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Créer un preview
      const previewUrl = URL.createObjectURL(file);
      setEditingTelegramImagePreview(previewUrl);
    }
  };

  // Nettoyage des URLs d'objets
  useEffect(() => {
    return () => {
      newProductImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      editingNewImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      if (telegramGroupImagePreview)
        URL.revokeObjectURL(telegramGroupImagePreview);
      if (editingTelegramImagePreview)
        URL.revokeObjectURL(editingTelegramImagePreview);
    };
  }, [
    newProductImagePreviews,
    editingNewImagePreviews,
    telegramGroupImagePreview,
    editingTelegramImagePreview,
  ]);

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
            Gérez vos produits pour les ventes en direct, les enchères et les
            groupes Telegram
          </p>
        </header>

        <div className="space-y-4 mb-6">
          {userProducts?.map((product: any) => {
            const firstImage = getFirstImage(product);
            const isTelegram = product.type === "telegram";

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
                      ) : isTelegram ? (
                        <MessageSquare className="h-8 w-8 text-blue-500" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{product.name}</h3>
                          {isTelegram && (
                            <Badge className="bg-blue-500">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Telegram
                            </Badge>
                          )}
                        </div>
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
                      {isTelegram && product.subscriptionType && (
                        <p className="text-xs text-blue-600 mt-1">
                          {product.subscriptionType === "mensuelle" &&
                            "Mensuel (30 jours)"}
                          {product.subscriptionType === "trimestrielle" &&
                            "Trimestriel (3 mois)"}
                          {product.subscriptionType === "hebdomadaire" &&
                            "Hebdomadaire (7 jours)"}
                          {product.subscriptionType === "trois_jours" &&
                            "3 jours"}
                          {product.maxMembers &&
                            ` • Max ${product.maxMembers} membres`}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-medium">
                          XAF
                          {typeof product.price === "number"
                            ? product.price.toFixed(2)
                            : "0.00"}
                        </p>
                        <div className="flex items-center gap-1">
                          {/* Masquer le partage et QR code pour les produits de type catalogue */}
                          {product.type !== "telegram" &&
                            product.type !== "catalog" && (
                              <>
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
                              </>
                            )}
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

        {/* AlertDialog pour la suppression */}
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

        {/* Dialog d'ajout de produit */}
        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isTelegramProduct
                  ? "Créer un groupe Telegram payant"
                  : "Ajouter un nouveau produit"}
              </DialogTitle>
            </DialogHeader>

            {/* Switch pour choisir le type de produit */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {isTelegramProduct ? (
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <p className="font-medium">
                    {isTelegramProduct ? "Groupe Telegram" : "Produit normal"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isTelegramProduct
                      ? "Vendez l'accès à votre groupe Telegram"
                      : "Produit physique ou digital"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isTelegramProduct}
                onCheckedChange={setIsTelegramProduct}
              />
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
              {/* Formulaire commun */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {isTelegramProduct ? "Nom du groupe *" : "Nom du produit *"}
                </Label>
                <Input
                  id="name"
                  placeholder={
                    isTelegramProduct
                      ? "Nom de votre groupe Telegram"
                      : "Entrez le nom du produit"
                  }
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
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-amber-600">
                    ⓘ Commission PayLive : 4% par vente (vous recevrez 96% du
                    prix)
                  </p>
                  <p className="text-xs text-amber-600">
                    ⓘ Frais de retrait : 2% par retrait (vous recevrez 98% du
                    montant retiré)
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    💡 Astuce : Ajoutez 6% au prix que vous souhaitez réellement
                    recevoir.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {isTelegramProduct
                    ? "Description du groupe (optionnel)"
                    : "Description *"}
                </Label>
                <Textarea
                  id="description"
                  placeholder={
                    isTelegramProduct
                      ? "Décrivez votre groupe Telegram..."
                      : "Entrez la description du produit"
                  }
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="whitespace-pre-wrap min-h-[100px]"
                  required={!isTelegramProduct}
                />
              </div>

              {/* Section image pour les deux types */}
              <div className="space-y-2">
                <Label htmlFor="image">
                  {isTelegramProduct
                    ? "Image du groupe (optionnel)"
                    : "Images du produit *"}
                </Label>
                {isTelegramProduct ? (
                  <>
                    <div
                      onClick={() => telegramFileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {telegramGroupImagePreview ? (
                        <div className="flex justify-center mb-2">
                          <img
                            src={telegramGroupImagePreview}
                            alt="Preview"
                            className="h-20 w-20 object-cover rounded"
                          />
                        </div>
                      ) : (
                        <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      )}
                      <p className="text-sm text-gray-500">
                        {telegramGroupImagePreview
                          ? "Cliquez pour changer l'image"
                          : "Cliquez pour télécharger une image"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF jusqu'à 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={telegramFileInputRef}
                      onChange={handleTelegramImageUpload}
                    />
                  </>
                ) : (
                  <>
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
                      onChange={handleNormalImageUpload}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newProductImagePreviews.map((preview, index) => (
                        <div key={index} className="relative w-20 h-20">
                          <img
                            src={preview}
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
                              setNewProductImagePreviews((prev) =>
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
                  </>
                )}
              </div>

              {/* Formulaire spécifique Telegram */}
              {isTelegramProduct && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <Label
                      htmlFor="telegramGroupId"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      ID du groupe Telegram *
                    </Label>
                    <div className="text-sm text-gray-600 mb-2">
                      <p>
                        1. Ajoutez @
                        {process.env.NEXT_PUBLIC_BOT_USERNAME || "PayLiveBot"} à
                        votre groupe
                      </p>
                      <p>2. Envoyez /getid dans le groupe</p>
                      <p>3. Copiez l'ID reçu et collez-le ici</p>
                    </div>
                    <Input
                      id="telegramGroupId"
                      placeholder="-1001234567890"
                      value={telegramGroupId}
                      onChange={(e) => setTelegramGroupId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="subscriptionType"
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Type d'accès *
                    </Label>
                    <Select
                      value={telegramSubscriptionType}
                      onValueChange={setTelegramSubscriptionType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensuelle">
                          Mensuelle (30 jours)
                        </SelectItem>
                        <SelectItem value="trimestrielle">
                          Trimestrielle (3 mois)
                        </SelectItem>
                        <SelectItem value="hebdomadaire">
                          Hebdomadaire (7 jours)
                        </SelectItem>
                        <SelectItem value="trois_jours">
                          3 jours (test)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="maxMembers"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Nombre maximum de membres
                    </Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      min="1"
                      max="100000"
                      placeholder="100"
                      value={telegramMaxMembers}
                      onChange={(e) => setTelegramMaxMembers(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="welcomeMessage"
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Message de bienvenue
                    </Label>
                    <Textarea
                      id="welcomeMessage"
                      placeholder="Message affiché quand un membre rejoint..."
                      value={telegramWelcomeMessage}
                      onChange={(e) =>
                        setTelegramWelcomeMessage(e.target.value)
                      }
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              {/* Formulaire spécifique produit normal */}
              {!isTelegramProduct && (
                <>
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
                        <SelectItem value="electronics">
                          Électronique
                        </SelectItem>
                        <SelectItem value="fashion">Mode</SelectItem>
                        <SelectItem value="home">Maison & Cuisine</SelectItem>
                        <SelectItem value="beauty">
                          Beauté & Soins personnels
                        </SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  disabled={loading}
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setIsTelegramProduct(false);
                    setNewProductName("");
                    setNewProductPrice("");
                    setNewProductDescription("");
                    setNewProductCategory("");
                    setNewProductQuantity("");
                    setNewProductImageFiles([]);
                    setNewProductImagePreviews([]);
                    setTelegramGroupId("");
                    setTelegramWelcomeMessage("Bienvenue dans le groupe ! 👋");
                    setTelegramMaxMembers("100");
                    setTelegramSubscriptionType("mensuelle");
                    setTelegramGroupImageFile(null);
                    setTelegramGroupImagePreview(null);
                  }}
                >
                  Annuler
                </Button>
                <Button disabled={loading} type="submit">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isTelegramProduct
                        ? "Création en cours..."
                        : "Ajout en cours..."}
                    </>
                  ) : isTelegramProduct ? (
                    "Créer le groupe"
                  ) : (
                    "Ajouter le produit"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG D'ÉDITION */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle>
                Modifier{" "}
                {editingProduct?.type === "telegram"
                  ? "le groupe Telegram"
                  : "le produit"}
              </DialogTitle>
            </DialogHeader>

            {editingProduct && editingProduct.type === "telegram" && (
              <form
                onSubmit={handleSaveEditTelegram}
                className="space-y-4 mt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom du groupe</Label>
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
                  <Label>Image du groupe</Label>
                  <div
                    onClick={() => editTelegramFileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {editingTelegramImagePreview ? (
                      <div className="flex justify-center mb-2">
                        <img
                          src={editingTelegramImagePreview}
                          alt="Nouvelle image"
                          className="h-20 w-20 object-cover rounded"
                        />
                      </div>
                    ) : editingExistingImages[0] ? (
                      <div className="flex justify-center mb-2">
                        <img
                          src={editingExistingImages[0]}
                          alt="Current"
                          className="h-20 w-20 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    ) : (
                      <ImageIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    )}
                    <p className="text-sm text-gray-500">
                      Cliquez pour changer l'image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF jusqu'à 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={editTelegramFileInputRef}
                    onChange={handleEditTelegramImageUpload}
                  />
                </div>

                {/* Champs spécifiques Telegram */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-subscriptionType"
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Type d'accès
                    </Label>
                    <Select
                      value={editingTelegramSubscriptionType}
                      onValueChange={setEditingTelegramSubscriptionType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensuelle">
                          Mensuelle (30 jours)
                        </SelectItem>
                        <SelectItem value="trimestrielle">
                          Trimestrielle (3 mois)
                        </SelectItem>
                        <SelectItem value="hebdomadaire">
                          Hebdomadaire (7 jours)
                        </SelectItem>
                        <SelectItem value="trois_jours">
                          3 jours (test)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-maxMembers"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Nombre maximum de membres
                    </Label>
                    <Input
                      id="edit-maxMembers"
                      type="number"
                      min="1"
                      max="100000"
                      placeholder="100"
                      value={editingTelegramMaxMembers}
                      onChange={(e) =>
                        setEditingTelegramMaxMembers(e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-welcomeMessage"
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Message de bienvenue
                    </Label>
                    <Textarea
                      id="edit-welcomeMessage"
                      placeholder="Message affiché quand un membre rejoint..."
                      value={editingTelegramWelcomeMessage}
                      onChange={(e) =>
                        setEditingTelegramWelcomeMessage(e.target.value)
                      }
                      className="min-h-[80px]"
                    />
                  </div>
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
                      setEditingTelegramImagePreview(null);
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

            {editingProduct && editingProduct.type !== "telegram" && (
              <form onSubmit={handleSaveEditNormal} className="space-y-4 mt-4">
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

        {/* DIALOG QR CODE */}
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
