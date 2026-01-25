import { NextRequest, NextResponse } from 'next/server';
import { VoucherService } from '@/lib/services/voucherService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      code, 
      amount, 
      userId, 
      telegramGroupId, 
      productType 
    } = body;
    
    if (!code || !amount) {
      return NextResponse.json(
        { success: false, error: 'Code et montant requis' },
        { status: 400 }
      );
    }
    
    const result = await VoucherService.validateAndApplyVoucher(
      code,
      amount,
      userId,
      telegramGroupId,
      productType
    );
    
    if (!result.valid) {
      return NextResponse.json(
        { 
          success: false, 
          valid: false,
          error: result.error,
          finalAmount: amount 
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      success: true,
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      voucher: {
        code: result.voucher?.code,
        discountType: result.voucher?.discountType,
        discountValue: result.voucher?.discountValue
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur API validation voucher:', error);
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