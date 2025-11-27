// lib/pawapaypolling.ts
export const pollTransactionStatus = async (
  depositId: string,
  intervalMs = 5000,
  maxAttempts = 12
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const res = await fetch(`/api/pawapay/deposits?depositId=${depositId}`);
      const responseData = await res.json();

      console.log(`🔄 Polling #${attempt} pour depositId=${depositId}`, responseData);

      // ✅ CORRECTION : Accéder au statut réel de la transaction DANS data
      const transactionStatus = responseData?.data?.status;

      if (!transactionStatus) {
        console.warn("⚠️ Pas de statut de transaction reçu dans responseData.data");
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }

      console.log(`📊 Statut transaction réel: ${transactionStatus}`);

      // ✅ Transaction confirmée
      if (transactionStatus === "SUCCESSFUL" || transactionStatus === "COMPLETED") {
        console.log("✅ Transaction confirmée SUCCESSFUL");
        return { ok: true, data: responseData };
      }

      // ❌ Transaction échouée
      if (transactionStatus === "FAILED" || transactionStatus === "DECLINED" || transactionStatus === "REJECTED") {
        console.log("❌ Transaction échouée");
        return { ok: false, data: responseData, error: `Transaction échouée: ${transactionStatus}` };
      }

      // Statuts intermédiaires - continuer le polling
      if (transactionStatus === "PROCESSING" || transactionStatus === "PENDING" || transactionStatus === "INITIATED" || transactionStatus === "ACCEPTED") {
        console.log(`⏳ Transaction en cours: ${transactionStatus}`);
        await new Promise((r) => setTimeout(r, intervalMs));
        continue;
      }

      // Statut inconnu - continuer le polling
      console.warn(`⚠️ Statut inconnu: ${transactionStatus}`);
      await new Promise((r) => setTimeout(r, intervalMs));

    } catch (err: any) {
      console.error("⚠️ Erreur lors du polling", err);
      return { ok: false, error: err.message };
    }
  }

  console.warn("⏱️ Polling timeout, la transaction reste en attente");
  return { ok: false, error: "timeout" };
};