// @/lib/product-utils.ts

/**
 * Récupère toutes les images d'un produit de manière cohérente
 * Gère les différentes structures: image (string), image (array), images (array)
 */
export const getProductImages = (product: any): string[] => {
  if (!product) return [];
  
  const images: string[] = [];
  
  // 1. Vérifier le champ 'images' (tableau)
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      if (img && typeof img === 'string' && img.trim() !== '' && !images.includes(img)) {
        images.push(img);
      }
    });
  }
  
  // 2. Vérifier le champ 'image' (peut être string ou tableau)
  if (product.image) {
    if (Array.isArray(product.image)) {
      product.image.forEach((img: any) => {
        if (img && typeof img === 'string' && img.trim() !== '' && !images.includes(img)) {
          images.push(img);
        }
      });
    } else if (typeof product.image === 'string' && product.image.trim() !== '' && !images.includes(product.image)) {
      images.push(product.image);
    }
  }
  
  // 3. Retourner un tableau vide si aucune image valide
  return images;
};

/**
 * Récupère la première image d'un produit
 */
export const getFirstProductImage = (product: any): string => {
  const images = getProductImages(product);
  return images.length > 0 ? images[0] : "/placeholder.jpg";
};