"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  ExternalLink,
  Copy,
  Shield,
  ArrowLeft,
  Link as LinkIcon,
} from "lucide-react";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const groupName = searchParams.get("groupName");
  const price = searchParams.get("price");
  const inviteLinkParam = searchParams.get("inviteLink");
  const manualMode = searchParams.get("manualMode");

  // Décoder le nom du groupe et le lien
  const decodedGroupName = groupName
    ? decodeURIComponent(groupName)
    : "Groupe Telegram";
  const inviteLink = inviteLinkParam
    ? decodeURIComponent(inviteLinkParam)
    : null;

  const copyToClipboard = (text: string) => {
    if (!text) {
      toast({
        title: "Erreur",
        description: "Aucun lien à copier",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Le lien a été copié",
    });
  };

  const openInviteLink = (link: string) => {
    if (!link) {
      toast({
        title: "Erreur",
        description: "Lien non disponible",
        variant: "destructive",
      });
      return;
    }

    window.open(link, "_blank");
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
            <p className="text-sm text-gray-500">Groupe Telegram Premium</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Récapitulatif */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Récapitulatif</h3>
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
                    30 jours
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

            {/* Section Lien Direct */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Accès au groupe
              </h3>

              {inviteLink ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">
                      Lien direct vers le groupe
                    </h3>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Cliquez pour rejoindre <strong>{decodedGroupName}</strong>{" "}
                      :
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => openInviteLink(inviteLink)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        🚀 Rejoindre le groupe
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(inviteLink)}
                        className="flex-1"
                        size="lg"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copier le lien
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>✅ Valable 24 heures</p>
                    <p>✅ Un clic suffit pour rejoindre</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Accès sécurisé</h4>
                      <p className="text-sm text-gray-600">
                        Vous recevrez un message privé avec le lien
                        d'invitation. Le bot vérifiera automatiquement votre
                        abonnement.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>

          {inviteLink && (
            <Button
              onClick={() => openInviteLink(inviteLink)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Rejoindre le groupe
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
