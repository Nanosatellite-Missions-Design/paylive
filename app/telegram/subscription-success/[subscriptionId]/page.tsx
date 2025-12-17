//

"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Bot,
  ExternalLink,
  Copy,
  Users,
  Calendar,
  Shield,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const groupName = searchParams.get("groupName");
  const price = searchParams.get("price");
  const subscriptionType = searchParams.get("subscriptionType") || "30 jours";
  const telegramUserId = searchParams.get("telegramUserId");

  // Décoder le nom du groupe (si encodé)
  const decodedGroupName = groupName
    ? decodeURIComponent(groupName)
    : "Groupe Telegram";

  const openTelegram = () => {
    window.open("https://t.me", "_blank");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "L'information a été copiée",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement Réussi ! 🎉
          </h1>
          <p className="text-gray-600">
            Votre abonnement a été activé avec succès
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{decodedGroupName}</CardTitle>
            <CardDescription>Groupe Telegram Premium</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Section 1: Récapitulatif */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  Récapitulatif de votre achat
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Groupe</p>
                    <p className="font-medium">{decodedGroupName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Montant</p>
                    <p className="text-lg font-bold text-green-600">
                      {price} XAF
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Durée</p>
                    <Badge variant="outline" className="bg-blue-50">
                      {subscriptionType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Statut</p>
                    <Badge className="bg-green-100 text-green-800">
                      ✅ Actif
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 2: Instructions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Accès au groupe
                </h3>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          Message envoyé sur Telegram
                        </h4>
                        <p className="text-sm text-gray-600">
                          Vous avez reçu un message privé avec un lien
                          d'invitation. Le lien est valable 24 heures.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <ExternalLink className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Étape suivante</h4>
                        <p className="text-sm text-gray-600">
                          1. Ouvrez Telegram
                          <br />
                          2. Cherchez @PayLiveBot
                          <br />
                          3. Cliquez sur le bouton "Rejoindre le groupe"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <Shield className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Accès sécurisé</h4>
                        <p className="text-sm text-gray-600">
                          Le bot vérifiera automatiquement votre abonnement.
                          Vous serez retiré si l'abonnement expire.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 3: Actions */}
              {/* <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  Que faire maintenant ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button onClick={openTelegram} className="w-full" size="lg">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir Telegram
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard("https://t.me/PayLiveBot")}
                    className="w-full"
                    size="lg"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier @PayLiveBot
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Si vous ne recevez pas le message dans les 2 minutes,
                  contactez @PayLiveSupport
                </p>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          <Button
            onClick={() => window.open("https://t.me/PayLiveBot", "_blank")}
            className="w-full sm:w-auto"
          >
            <Bot className="h-4 w-4 mr-2" />
            Ouvrir le bot sur Telegram
          </Button>
        </div> */}

        {/* Informations de support */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Besoin d'aide ?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Le message privé vient de @PayLiveBot</li>
            <li>• Vérifiez vos messages spam sur Telegram</li>
            <li>• Le lien expire dans 24 heures</li>
            <li>• Contact: @PayLiveSupport sur Telegram</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
