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
import { ChevronLeft, Plus, Edit, Trash2, QrCode, Loader2 } from "lucide-react";
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
  const { user, userInfo, userProducts } = useAuth();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingExistingImages, setEditingExistingImages] = useState<string[]>(
    []
  ); // Firebase image URLs
  const [editingNewImageFiles, setEditingNewImageFiles] = useState<File[]>([]);
  const [editingNewImagePreviews, setEditingNewImagePreviews] = useState<
    string[]
  >([]);

  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductStatus, setNewProductStatus] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductImageFiles, setNewProductImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log(userProducts)
  }, [user, userProducts])

  const handleAddProduct = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    if (
      !newProductName ||
      !newProductPrice ||
      !newProductDescription ||
      !newProductCategory ||
      newProductImageFiles.length === 0
    ) {
      toast({
        title: "Missing fields",
        description: "Fill all fields and upload images.",
      });
      return;
    }
    setLoading(true);

    try {
      // Upload all images
      const uploadPromises = newProductImageFiles.map((file) => {
        const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        return uploadBytes(storageRef, file).then((snapshot) =>
          getDownloadURL(snapshot.ref)
        );
      });

      const imageUrls = await Promise.all(uploadPromises);

      const newProduct = {
        name: newProductName,
        creatorId: user.uid,
        creatorName: userInfo.name,
        price: parseFloat(newProductPrice),
        description: newProductDescription,
        image: imageUrls, // Array of image URLs
        category: newProductCategory,
        status: "available",
      };

      console.log("New Product:", newProduct);
      await addToSubCollection(newProduct, "users", user.uid, "products");

      setIsAddingProduct(false);

      // Reset
      setNewProductName("");
      setNewProductPrice("");
      setNewProductDescription("");
      setNewProductCategory("");
      setNewProductStatus("");
      setNewProductImageFiles([]);
      setLoading(false);
      toast({
        title: "Product added",
        description: "Your new product has been added successfully.",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      setLoading(false);
      toast({
        title: "Upload failed",
        description: "Could not upload one or more images.",
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditingExistingImages(product.images || []); // ← assumes `images` is an array of Firebase URLs
    setEditingNewImageFiles([]);
    setEditingNewImagePreviews([]);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // const uploadedUrls: string[] = []

      // // Upload new files to Firebase
      // if (editingNewImageFiles.length > 0) {
      //   const uploadPromises = editingNewImageFiles.map(async (file) => {
      //     const imageRef = ref(storage, `products/${editingProduct.id}/${Date.now()}-${file.name}`)
      //     await uploadBytes(imageRef, file)
      //     return await getDownloadURL(imageRef)
      //   })

      //   const newUrls = await Promise.all(uploadPromises)
      //   uploadedUrls.push(...newUrls)
      // }

      const updatedProduct = {
        ...editingProduct,
        images: [...editingExistingImages],
        // images: [...editingExistingImages, ...uploadedUrls],
      };
      if (!user) return;
      console.log("Updated Product:", updatedProduct);
      await updateSubcollectionDocument(
        "users",
        user.uid,
        "products",
        editingProduct.id,
        updatedProduct
      );
      // You can replace this with a Firestore update

      toast({
        title: "Product updated",
        description: "Your product has been updated successfully.",
      });
      setLoading(false);
      setIsEditing(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to update product.",
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
      if (!user) return;
      await deleteSubCollectionDocument(
        "users",
        user.uid,
        "products",
        selectedProduct.id
      );
    } catch (error) {
      console.error("Error updating product:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to delete product.",
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
            <Link href="/profile" className="mr-2">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">My Products</h1>
          </div>
          <p className="text-gray-500">
            Manage your products for live sales and auctions
          </p>
        </header>

        <div className="space-y-4 mb-6">
          {userProducts?.map((product: any) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-md overflow-hidden mr-3">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
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
                        {product.status === "available" ? "Available" : "Sold"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-medium">
                        XAF{product.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1">
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
          ))}
        </div>

        <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product {selectedProduct?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={loading}
                onClick={handleDeleteProduct}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (XAF)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(e) => setNewProductPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  ierd="description"
                  placeholder="Enter product description"
                  onChange={(e) => setNewProductDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  defaultValue="electronics"
                  onValueChange={setNewProductCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="home">Home & Kitchen</SelectItem>
                    <SelectItem value="beauty">
                      Beauty & Personal Care
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Product Images</Label>

                {/* Clickable Upload Box */}
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

                {/* Hidden Input */}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      setNewProductImageFiles((prev) => [
                        ...prev,
                        ...Array.from(files as FileList),
                      ]);
                    }
                  }}
                />

                {/* Image Previews */}
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
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
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
                  Cancel
                </Button>
                <Button disabled={loading} type="submit">
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Add Product"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (XAF)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingProduct.description}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="home">Home & Kitchen</SelectItem>
                      <SelectItem value="beauty">
                        Beauty & Personal Care
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingProduct.status}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* <div className="space-y-2">
                  <Label>Product Images</Label>

                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
                  >
                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={editFileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files)
                        setEditingNewImageFiles(prev => [...prev, ...files])
                        setEditingNewImagePreviews(prev => [
                          ...prev,
                          ...files.map(file => URL.createObjectURL(file)),
                        ])
                      }
                    }}
                  />
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingExistingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative w-20 h-20 rounded-md overflow-hidden border">
                        <img src={url} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEditingExistingImages(prev => prev.filter((_, i) => i !== index))
                          }
                          className="absolute top-0 right-0 bg-white text-red-500 rounded-full p-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {editingNewImagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative w-20 h-20 rounded-md overflow-hidden border">
                        <img src={preview} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNewImagePreviews(prev => prev.filter((_, i) => i !== index))
                            setEditingNewImageFiles(prev => prev.filter((_, i) => i !== index))
                          }}
                          className="absolute top-0 right-0 bg-white text-red-500 rounded-full p-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div> */}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    disabled={loading}
                    variant="outline"
                    type="button"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button disabled={loading} type="submit">
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Save Changes"
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
              <DialogTitle>Product QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="bg-white p-4 rounded-md">
                {selectedProduct && (
                  <QRCodeGenerator
                    value={`https://paylive.vercel.app/product/${selectedProduct.id}`}
                    size={200}
                  />
                )}
              </div>
              <p className="mt-4 text-center text-sm">
                {selectedProduct?.name}
              </p>
              <p className="text-center text-xs text-gray-500">
                Scan to view product details
              </p>
              <Button className="mt-4" onClick={() => window.print()}>
                Print QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
