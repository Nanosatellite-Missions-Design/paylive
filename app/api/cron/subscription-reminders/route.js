import { checkExpiringSubscriptions } from '@/functions/cron/subscriptionReminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  try {
    // Vérifier la clé secrète (optionnel, pour sécurité)
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.CRON_SECRET_KEY || "12f5c231a6549b0f6a1a68343d9e3320cfbe824500a54141dc1b8cbb6b17f8f5";
    
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return new Response('Non autorisé', { status: 401 });
    }
    
    console.log('⏰ Déclenchement du cronjob via API...');
    
    const result = await checkExpiringSubscriptions();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Cronjob exécuté avec succès',
      timestamp: new Date().toISOString(),
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Erreur cronjob API:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}