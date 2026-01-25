import { NextRequest, NextResponse } from 'next/server';
import { VoucherService } from '@/lib/services/voucherService';

// GET - Récupérer tous les vouchers
export async function GET() {
  try {
    console.log('🔍 Récupération de tous les vouchers...');
    const vouchers = await VoucherService.getAllVouchers();
    
    return NextResponse.json({ 
      success: true, 
      vouchers,
      count: vouchers.length
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET vouchers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau voucher
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📦 Données reçues pour création voucher:', body);
    
    // Validation des champs requis
    if (!body.code) {
      return NextResponse.json(
        { success: false, error: 'Le code est requis' },
        { status: 400 }
      );
    }
    
    if (!body.discountValue || body.discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur de réduction doit être positive' },
        { status: 400 }
      );
    }
    
    // Normaliser les dates
    const voucherData = {
      ...body,
      validFrom: body.validFrom || new Date().toISOString().split('T')[0],
      validUntil: body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    console.log('🎫 Création du voucher avec données:', voucherData);
    
    const voucherId = await VoucherService.createVoucher(voucherData);
    
    return NextResponse.json({ 
      success: true, 
      voucherId,
      message: 'Voucher créé avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur POST voucher:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la création du voucher'
      },
      { status: 500 }
    );
  }
}

// PUT - Activer/désactiver un voucher
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const voucherId = searchParams.get('id');
    const action = searchParams.get('action');
    
    console.log('🔄 Action sur voucher:', { voucherId, action });
    
    if (!voucherId) {
      return NextResponse.json(
        { success: false, error: 'ID du voucher requis' },
        { status: 400 }
      );
    }
    
    if (action === 'toggle') {
      const newStatus = await VoucherService.toggleVoucher(voucherId);
      return NextResponse.json({ 
        success: true, 
        isActive: newStatus,
        message: `Voucher ${newStatus ? 'activé' : 'désactivé'} avec succès`
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Action non supportée' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('❌ Erreur PUT voucher:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la mise à jour'
      },
      { status: 500 }
    );
  }
}