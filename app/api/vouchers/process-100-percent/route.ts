import { NextRequest, NextResponse } from 'next/server';
import { VoucherService } from '@/lib/services/voucherService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      voucherCode, 
      paymentData, 
      telegramData,
      userId 
    } = body;
    
    if (!voucherCode) {
      return NextResponse.json(
        { success: false, error: 'Code voucher requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que c'est bien un voucher 100%
    // Note: Cette vérification devrait être faite côté client avant d'appeler cette API
    // Mais on double-vérifie côté serveur
    
    console.log('🎫 Traitement voucher 100%:', { voucherCode, hasTelegramData: !!telegramData });
    
    // Appeler le service pour traiter le voucher 100%
    const result = await VoucherService.process100PercentVoucher(
      { code: voucherCode },
      paymentData,
      userId,
      telegramData
    );
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Erreur lors du traitement du voucher 100%' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      subscriptionId: result.subscriptionId,
      message: telegramData 
        ? 'Abonnement Telegram gratuit activé avec succès' 
        : 'Transaction gratuite créée avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur API traitement voucher 100%:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        details: error.message 
      },
      { status: 500 }
    );
  }
}