import { checkExpiringSubscriptions } from '@/functions/cron/subscriptionReminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  try {
    // Vérifier la clé secrète (optionnel, pour sécurité)
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.CRON_SECRET_KEY;
    
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