import { NextRequest, NextResponse } from 'next/server';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  DocumentReference
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialiser Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

// Définir les types
interface TelegramGroup {
  id: string;
  name?: string;
  publicSlug?: string;
  telegramGroupId?: string;
  price?: number;
  description?: string;
  creatorUid?: string | null;
  fromSubcollection?: boolean;
  fullPath?: string;
  subscriptionType?: string;
  currentMembers?: number;
  isActive?: boolean;
  creatorName?: string;
  welcomeMessage?: string;
  [key: string]: any;
}

interface GroupResult {
  group: TelegramGroup;
  source: string;
  userId?: string;
  docRef: DocumentReference;
}

// Fonction pour chercher un groupe par n'importe quel identifiant
async function findGroupByIdentifier(identifier: string): Promise<GroupResult | null> {
  try {
    console.log(`🔍 API: Recherche groupe avec identifiant: "${identifier}"`);
    
    // Chercher dans la collection principale
    const groupsRef = collection(db, 'telegram_groups');
    
    // 1. Chercher par publicSlug
    const slugQuery = query(groupsRef, where('publicSlug', '==', identifier));
    const slugSnapshot = await getDocs(slugQuery);
    
    if (!slugSnapshot.empty) {
      const groupDoc = slugSnapshot.docs[0];
      const groupData = groupDoc.data();
      console.log(`✅ API: Groupe trouvé dans collection principale par publicSlug: ${groupData.name || 'Sans nom'}`);
      
      return {
        group: {
          id: groupDoc.id,
          name: groupData.name,
          publicSlug: groupData.publicSlug,
          telegramGroupId: groupData.telegramGroupId,
          price: groupData.price,
          description: groupData.description,
          creatorUid: groupData.creatorUid || null,
          subscriptionType: groupData.subscriptionType,
          currentMembers: groupData.currentMembers,
          isActive: groupData.isActive,
          creatorName: groupData.creatorName,
          welcomeMessage: groupData.welcomeMessage,
          ...groupData
        },
        source: 'root',
        docRef: groupDoc.ref
      };
    }
    
    // 2. Chercher par ID Firestore (si l'identifiant ressemble à un ID Firestore)
    if (identifier.match(/^[a-zA-Z0-9]{20}$/)) {
      try {
        const groupDocRef = doc(db, 'telegram_groups', identifier);
        const groupDoc = await getDoc(groupDocRef);
        
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          console.log(`✅ API: Groupe trouvé dans collection principale par ID Firestore: ${groupData.name || 'Sans nom'}`);
          
          return {
            group: {
              id: groupDoc.id,
              name: groupData.name,
              publicSlug: groupData.publicSlug,
              telegramGroupId: groupData.telegramGroupId,
              price: groupData.price,
              description: groupData.description,
              creatorUid: groupData.creatorUid || null,
              subscriptionType: groupData.subscriptionType,
              currentMembers: groupData.currentMembers,
              isActive: groupData.isActive,
              creatorName: groupData.creatorName,
              welcomeMessage: groupData.welcomeMessage,
              ...groupData
            },
            source: 'root',
            docRef: groupDoc.ref
          };
        }
      } catch (error) {
        console.log('⚠️ ID Firestore non trouvé dans collection principale');
      }
    }
    
    // 3. Chercher dans les sous-collections users/*/telegram_groups
    console.log('⚠️ API: Groupe non trouvé dans collection principale, recherche dans sous-collections...');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 API: ${usersSnapshot.size} utilisateurs à scanner`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userGroupsRef = collection(db, `users/${userId}/telegram_groups`);
      
      // Chercher par publicSlug
      const userSlugQuery = query(userGroupsRef, where('publicSlug', '==', identifier));
      const userSlugSnapshot = await getDocs(userSlugQuery);
      
      if (!userSlugSnapshot.empty) {
        const groupDoc = userSlugSnapshot.docs[0];
        const groupData = groupDoc.data();
        console.log(`✅ API: Groupe trouvé dans sous-collection utilisateur ${userId} par publicSlug: ${groupData.name || 'Sans nom'}`);
        
        return {
          group: {
            id: groupDoc.id,
            name: groupData.name,
            publicSlug: groupData.publicSlug,
            telegramGroupId: groupData.telegramGroupId,
            price: groupData.price,
            description: groupData.description,
            creatorUid: userId,
            fromSubcollection: true,
            fullPath: groupDoc.ref.path,
            subscriptionType: groupData.subscriptionType,
            currentMembers: groupData.currentMembers,
            isActive: groupData.isActive,
            creatorName: groupData.creatorName,
            welcomeMessage: groupData.welcomeMessage,
            ...groupData
          },
          source: 'subcollection',
          userId: userId,
          docRef: groupDoc.ref
        };
      }
      
      // Chercher par ID Firestore (si dans sous-collection)
      if (identifier.match(/^[a-zA-Z0-9]{20}$/)) {
        try {
          const groupDocRef = doc(db, `users/${userId}/telegram_groups`, identifier);
          const groupDoc = await getDoc(groupDocRef);
          
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            console.log(`✅ API: Groupe trouvé dans sous-collection utilisateur ${userId} par ID Firestore: ${groupData.name || 'Sans nom'}`);
            
            return {
              group: {
                id: groupDoc.id,
                name: groupData.name,
                publicSlug: groupData.publicSlug,
                telegramGroupId: groupData.telegramGroupId,
                price: groupData.price,
                description: groupData.description,
                creatorUid: userId,
                fromSubcollection: true,
                fullPath: groupDoc.ref.path,
                subscriptionType: groupData.subscriptionType,
                currentMembers: groupData.currentMembers,
                isActive: groupData.isActive,
                creatorName: groupData.creatorName,
                welcomeMessage: groupData.welcomeMessage,
                ...groupData
              },
              source: 'subcollection',
              userId: userId,
              docRef: groupDoc.ref
            };
          }
        } catch (error) {
          // Continuer à chercher
        }
      }
    }
    
    // 4. Si l'identifiant est un nombre (telegramGroupId), chercher par telegramGroupId
    if (/^-?\d+$/.test(identifier)) {
      // Chercher dans collection principale
      const telegramQuery = query(groupsRef, where('telegramGroupId', '==', identifier));
      const telegramSnapshot = await getDocs(telegramQuery);
      
      if (!telegramSnapshot.empty) {
        const groupDoc = telegramSnapshot.docs[0];
        const groupData = groupDoc.data();
        console.log(`✅ API: Groupe trouvé dans collection principale par telegramGroupId: ${groupData.name || 'Sans nom'}`);
        
        return {
          group: {
            id: groupDoc.id,
            name: groupData.name,
            publicSlug: groupData.publicSlug,
            telegramGroupId: groupData.telegramGroupId,
            price: groupData.price,
            description: groupData.description,
            creatorUid: groupData.creatorUid || null,
            subscriptionType: groupData.subscriptionType,
            currentMembers: groupData.currentMembers,
            isActive: groupData.isActive,
            creatorName: groupData.creatorName,
            welcomeMessage: groupData.welcomeMessage,
            ...groupData
          },
          source: 'root',
          docRef: groupDoc.ref
        };
      }
      
      // Chercher dans sous-collections
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userGroupsRef = collection(db, `users/${userId}/telegram_groups`);
        
        const userTelegramQuery = query(userGroupsRef, where('telegramGroupId', '==', identifier));
        const userTelegramSnapshot = await getDocs(userTelegramQuery);
        
        if (!userTelegramSnapshot.empty) {
          const groupDoc = userTelegramSnapshot.docs[0];
          const groupData = groupDoc.data();
          console.log(`✅ API: Groupe trouvé dans sous-collection utilisateur ${userId} par telegramGroupId: ${groupData.name || 'Sans nom'}`);
          
          return {
            group: {
              id: groupDoc.id,
              name: groupData.name,
              publicSlug: groupData.publicSlug,
              telegramGroupId: groupData.telegramGroupId,
              price: groupData.price,
              description: groupData.description,
              creatorUid: userId,
              fromSubcollection: true,
              fullPath: groupDoc.ref.path,
              subscriptionType: groupData.subscriptionType,
              currentMembers: groupData.currentMembers,
              isActive: groupData.isActive,
              creatorName: groupData.creatorName,
              welcomeMessage: groupData.welcomeMessage,
              ...groupData
            },
            source: 'subcollection',
            userId: userId,
            docRef: groupDoc.ref
          };
        }
      }
    }
    
    console.log(`❌ API: Groupe "${identifier}" non trouvé nulle part`);
    return null;
    
  } catch (error) {
    console.error('❌ API Erreur recherche groupe:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    // ATTENTION: params est maintenant une promesse dans Next.js 14
    const resolvedParams = await params;
    const groupId = resolvedParams.groupId;
    
    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'ID de groupe manquant' },
        { status: 400 }
      );
    }
    
    console.log(`📡 API: Requête GET pour groupe ID: "${groupId}"`);
    console.log(`📡 API: URL complète: ${request.url}`);
    
    // Extraire les paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const telegramGroupId = searchParams.get('telegramGroupId');
    const telegramUserId = searchParams.get('telegramUserId');
    
    console.log('📊 API: Paramètres de requête:', {
      groupId,
      telegramGroupId,
      telegramUserId
    });
    
    // Chercher le groupe
    const result = await findGroupByIdentifier(groupId);
    
    if (!result) {
      // Si on a un telegramGroupId en paramètre, essayer avec ça
      if (telegramGroupId) {
        console.log(`🔄 API: Essai avec telegramGroupId depuis paramètre: ${telegramGroupId}`);
        const fallbackResult = await findGroupByIdentifier(telegramGroupId);
        
        if (fallbackResult) {
          console.log(`✅ API: Groupe trouvé via paramètre telegramGroupId: ${fallbackResult.group.name || 'Sans nom'}`);
          return NextResponse.json({
            success: true,
            group: fallbackResult.group,
            source: fallbackResult.source,
            foundVia: 'telegramGroupId_param'
          });
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Groupe non trouvé',
          details: `Aucun groupe trouvé avec l'identifiant: ${groupId}`,
          searchedIn: ['collection principale', 'sous-collections utilisateurs']
        },
        { status: 404 }
      );
    }
    
    // Déterminer comment le groupe a été trouvé
    let foundWith = 'unknown';
    if (result.group.publicSlug === groupId) {
      foundWith = 'publicSlug';
    } else if (result.group.telegramGroupId === groupId) {
      foundWith = 'telegramGroupId';
    } else if (result.group.id === groupId) {
      foundWith = 'documentId';
    }
    
    console.log(`✅ API: Groupe trouvé: ${result.group.name || 'Sans nom'} (source: ${result.source})`);
    console.log('📋 API: Données retournées:', {
      id: result.group.id,
      name: result.group.name,
      publicSlug: result.group.publicSlug,
      telegramGroupId: result.group.telegramGroupId,
      price: result.group.price
    });
    
    return NextResponse.json({
      success: true,
      group: result.group,
      source: result.source,
      metadata: {
        requestId: groupId,
        foundWith,
        hasCreator: !!result.group.creatorUid,
        hasTelegramGroupId: !!result.group.telegramGroupId,
        fromSubcollection: result.group.fromSubcollection || false
      }
    });
    
  } catch (error: any) {
    console.error('❌ API Erreur serveur:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}