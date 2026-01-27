import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const telegramGroupId = searchParams.get('telegramGroupId');
    
    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'groupId requis' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Recherche creatorUid pour:', { groupId, telegramGroupId });
    
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // 1. Chercher dans telegram_groups (collection principale)
    const groupsRef = collection(db, 'telegram_groups');
    const groupQuery = query(groupsRef, where('groupId', '==', groupId));
    const groupSnapshot = await getDocs(groupQuery);
    
    if (!groupSnapshot.empty) {
      const groupData = groupSnapshot.docs[0].data();
      console.log('✅ CreatorUid trouvé dans telegram_groups:', {
        creatorUid: groupData.creatorUid || groupData.uid,
        groupName: groupData.name
      });
      
      return NextResponse.json({
        success: true,
        creatorUid: groupData.creatorUid || groupData.uid,
        groupName: groupData.name,
        source: 'telegram_groups'
      });
    }
    
    // 2. Chercher dans user_telegram_groups (sous-collection)
    console.log('🔍 Recherche dans les sous-collections utilisateurs...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userGroupsRef = collection(db, `users/${userId}/telegram_groups`);
      const userGroupQuery = query(userGroupsRef, where('groupId', '==', groupId));
      const userGroupSnapshot = await getDocs(userGroupQuery);
      
      if (!userGroupSnapshot.empty) {
        const groupData = userGroupSnapshot.docs[0].data();
        console.log('✅ CreatorUid trouvé dans sous-collection:', {
          creatorUid: userId,
          groupName: groupData.name
        });
        
        return NextResponse.json({
          success: true,
          creatorUid: userId,
          groupName: groupData.name,
          source: 'user_subcollection'
        });
      }
    }
    
    // 3. Chercher par telegramGroupId si fourni
    if (telegramGroupId) {
      console.log('🔍 Recherche par telegramGroupId:', telegramGroupId);
      
      // Dans telegram_groups
      const telegramGroupQuery = query(groupsRef, where('telegramGroupId', '==', telegramGroupId));
      const telegramGroupSnapshot = await getDocs(telegramGroupQuery);
      
      if (!telegramGroupSnapshot.empty) {
        const groupData = telegramGroupSnapshot.docs[0].data();
        console.log('✅ CreatorUid trouvé par telegramGroupId:', {
          creatorUid: groupData.creatorUid || groupData.uid,
          groupName: groupData.name
        });
        
        return NextResponse.json({
          success: true,
          creatorUid: groupData.creatorUid || groupData.uid,
          groupName: groupData.name,
          source: 'telegram_groups_by_telegramId'
        });
      }
      
      // Dans user_telegram_groups
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userGroupsRef = collection(db, `users/${userId}/telegram_groups`);
        const userGroupQuery = query(userGroupsRef, where('telegramGroupId', '==', telegramGroupId));
        const userGroupSnapshot = await getDocs(userGroupQuery);
        
        if (!userGroupSnapshot.empty) {
          const groupData = userGroupSnapshot.docs[0].data();
          console.log('✅ CreatorUid trouvé par telegramGroupId dans sous-collection:', {
            creatorUid: userId,
            groupName: groupData.name
          });
          
          return NextResponse.json({
            success: true,
            creatorUid: userId,
            groupName: groupData.name,
            source: 'user_subcollection_by_telegramId'
          });
        }
      }
    }
    
    console.log('❌ Groupe non trouvé:', groupId);
    return NextResponse.json({
      success: false,
      error: 'Groupe non trouvé',
      searchedIn: ['telegram_groups', 'user_subcollections']
    });
    
  } catch (error: any) {
    console.error('❌ Erreur récupération creatorUid:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.stack 
      },
      { status: 500 }
    );
  }
}