import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from "firebase/app"; // <-- IMPORTANT: ajoutez getApps et getApp
import { getFirestore, collection, setDoc, doc, serverTimestamp } from "firebase/firestore";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c",
  measurementId: "G-NYG1GEHPFY",
};

// CORRECTION CRITIQUE : Initialisation unique
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction pour obtenir le nombre de membres d'un groupe Telegram
async function getTelegramGroupMembersCount(telegramGroupId: string): Promise<number> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMemberCount?chat_id=${telegramGroupId}`
    );
    
    const data = await response.json();
    
    if (data.ok) {
      return data.result;
    } else {
      console.error('Erreur API Telegram:', data);
      return 2;
    }
  } catch (error) {
    console.error('Erreur récupération membres:', error);
    return 2;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      name,
      description,
      price,
      subscriptionType,
      telegramGroupId,
      welcomeMessage,
      maxMembers,
      creatorUid,
      creatorName,
      image
    } = body;

    console.log('Données reçues pour création:', { name, telegramGroupId, creatorUid });

    // Validation
    if (!name || !price || !telegramGroupId || !creatorUid) {
      return NextResponse.json(
        { error: 'Champs manquants requis' },
        { status: 400 }
      );
    }

    // Vérifier que db est initialisé
    if (!db) {
      throw new Error("Firestore n'est pas initialisé");
    }

    // 1. Récupérer le nombre actuel de membres
    const currentMembersCount = await getTelegramGroupMembersCount(telegramGroupId);
    console.log(`Membres actuels: ${currentMembersCount}`);

    // 2. Créer le document dans telegram_groups
    const telegramGroupsRef = collection(db, `users/${creatorUid}/telegram_groups`);
    const telegramGroupDoc = doc(telegramGroupsRef);
    const telegramGroupDocId = telegramGroupDoc.id;
    
    const telegramGroupData = {
      id: telegramGroupDocId,
      name: name.trim(),
      description: (description || `Rejoignez notre groupe ${name}`).trim(),
      price: parseFloat(price),
      subscriptionType: subscriptionType || 'mensuelle',
      telegramGroupId: telegramGroupId.trim(),
      welcomeMessage: welcomeMessage || 'Bienvenue dans le groupe ! 👋',
      maxMembers: maxMembers ? parseInt(maxMembers) : 100,
      currentMembers: currentMembersCount,
      creatorUid: creatorUid.trim(),
      creatorName: (creatorName || "Anonyme").trim(),
      image: image || "/telegram-group.png",
      status: 'active',
      isPublic: false,
      autoRemoveExpired: true,
      botIsAdmin: true, // On suppose que le bot est admin
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publicSlug: `telegram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      subscriptionCount: 0
    };

    console.log('Création du document dans telegram_groups...');
    await setDoc(telegramGroupDoc, telegramGroupData);
    console.log(`Document créé: ${telegramGroupDocId}`);

    // 3. Créer aussi un produit correspondant
    const productsRef = collection(db, `users/${creatorUid}/products`);
    const productDoc = doc(productsRef);
    const productDocId = productDoc.id;
    
    // const productData = {
    //   id: productDocId,
    //   name: name.trim(),
    //   description: (description || `Rejoignez notre groupe ${name}`).trim(),
    //   price: parseFloat(price),
    //   category: 'telegram_group',
    //   subscriptionType: subscriptionType || 'mensuelle',
    //   telegramGroupId: telegramGroupDocId,
    //   telegramChatId: telegramGroupId.trim(),
    //   welcomeMessage: welcomeMessage || 'Bienvenue dans le groupe ! 👋',
    //   maxMembers: maxMembers ? parseInt(maxMembers) : 100,
    //   currentMembers: currentMembersCount,
    //   creatorUid: creatorUid.trim(),
    //   creatorName: (creatorName || "Anonyme").trim(),
    //   status: 'available',
    //   createdAt: serverTimestamp(),
    //   updatedAt: serverTimestamp(),
    //   type: 'telegram',
    //   images: [image || "/telegram-group.png"],
    //   image: image || "/telegram-group.png",
    //   inStock: 9999,
    //   botIsAdmin: true
    // };

    // Dans la section de création du produit (lignes 102-128)
const productData = {
  id: productDocId,
  name: name.trim(),
  description: (description || `Rejoignez notre groupe ${name}`).trim(),
  price: parseFloat(price),
  category: 'telegram_group',
  subscriptionType: subscriptionType || 'mensuelle',
  telegramGroupDocId: telegramGroupDocId, // ← Stockez l'ID du document telegram_groups
  telegramGroupId: telegramGroupId.trim(), // ← Stockez l'ID réel du groupe Telegram
  welcomeMessage: welcomeMessage || 'Bienvenue dans le groupe ! 👋',
  maxMembers: maxMembers ? parseInt(maxMembers) : 100,
  currentMembers: currentMembersCount,
  creatorUid: creatorUid.trim(),
  creatorName: (creatorName || "Anonyme").trim(),
  status: 'available',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  type: 'telegram', // ← Important : type "telegram"
  images: [image || "/telegram-group.png"],
  image: image || "/telegram-group.png",
  inStock: 9999,
  botIsAdmin: true
};
    console.log('Création du document dans products...');
    await setDoc(productDoc, productData);
    console.log(`Document produit créé: ${productDocId}`);

    return NextResponse.json({
      success: true,
      groupId: telegramGroupDocId,
      productId: productDocId,
      publicSlug: telegramGroupData.publicSlug,
      currentMembers: currentMembersCount,
      botIsAdmin: true,
      message: 'Groupe Telegram créé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur création groupe Telegram:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}