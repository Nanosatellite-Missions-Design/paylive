// "use client";

// import { useSearchParams, useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import {
//   CheckCircle,
//   ExternalLink,
//   Copy,
//   Shield,
//   ArrowLeft,
//   Link as LinkIcon,
// } from "lucide-react";

// export default function SubscriptionSuccessPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const { toast } = useToast();

//   const groupName = searchParams.get("groupName");
//   const price = searchParams.get("price");
//   const inviteLinkParam = searchParams.get("inviteLink");
//   const manualMode = searchParams.get("manualMode");

//   // Décoder le nom du groupe et le lien
//   const decodedGroupName = groupName
//     ? decodeURIComponent(groupName)
//     : "Groupe Telegram";
//   const inviteLink = inviteLinkParam
//     ? decodeURIComponent(inviteLinkParam)
//     : null;

//   const copyToClipboard = (text: string) => {
//     if (!text) {
//       toast({
//         title: "Erreur",
//         description: "Aucun lien à copier",
//         variant: "destructive",
//       });
//       return;
//     }

//     navigator.clipboard.writeText(text);
//     toast({
//       title: "Copié !",
//       description: "Le lien a été copié",
//     });
//   };

//   const openInviteLink = (link: string) => {
//     if (!link) {
//       toast({
//         title: "Erreur",
//         description: "Lien non disponible",
//         variant: "destructive",
//       });
//       return;
//     }

//     window.open(link, "_blank");
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
//       <div className="container max-w-2xl mx-auto px-4">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
//             <CheckCircle className="h-10 w-10 text-green-600" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Paiement Réussi ! 🎉
//           </h1>
//           <p className="text-gray-600">
//             Votre abonnement a été activé avec succès
//           </p>
//         </div>

//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="text-xl">{decodedGroupName}</CardTitle>
//             <p className="text-sm text-gray-500">Groupe Telegram Premium</p>
//           </CardHeader>

//           <CardContent className="space-y-6">
//             {/* Récapitulatif */}
//             <div className="space-y-3">
//               <h3 className="font-semibold text-lg">Récapitulatif</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Groupe</p>
//                   <p className="font-medium">{decodedGroupName}</p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Montant</p>
//                   <p className="text-lg font-bold text-green-600">
//                     {price} XAF
//                   </p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Durée</p>
//                   <Badge variant="outline" className="bg-blue-50">
//                     30 jours
//                   </Badge>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Statut</p>
//                   <Badge className="bg-green-100 text-green-800">
//                     ✅ Actif
//                   </Badge>
//                 </div>
//               </div>
//             </div>

//             <Separator />

//             {/* Section Lien Direct */}
//             <div className="space-y-3">
//               <h3 className="font-semibold text-lg flex items-center gap-2">
//                 <LinkIcon className="h-5 w-5" />
//                 Accès au groupe
//               </h3>

//               {inviteLink ? (
//                 <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//                   <div className="flex items-center gap-2 mb-3">
//                     <LinkIcon className="h-5 w-5 text-green-600" />
//                     <h3 className="font-semibold text-green-800">
//                       Lien direct vers le groupe
//                     </h3>
//                   </div>

//                   <div className="mb-4">
//                     <p className="text-sm text-gray-600 mb-2">
//                       Cliquez pour rejoindre <strong>{decodedGroupName}</strong>{" "}
//                       :
//                     </p>

//                     <div className="flex flex-col sm:flex-row gap-2">
//                       <Button
//                         onClick={() => openInviteLink(inviteLink)}
//                         className="flex-1 bg-green-600 hover:bg-green-700"
//                         size="lg"
//                       >
//                         <ExternalLink className="h-4 w-4 mr-2" />
//                         🚀 Rejoindre le groupe
//                       </Button>

//                       <Button
//                         variant="outline"
//                         onClick={() => copyToClipboard(inviteLink)}
//                         className="flex-1"
//                         size="lg"
//                       >
//                         <Copy className="h-4 w-4 mr-2" />
//                         Copier le lien
//                       </Button>
//                     </div>
//                   </div>

//                   <div className="text-xs text-gray-500">
//                     <p>✅ Valable 24 heures</p>
//                     <p>✅ Un clic suffit pour rejoindre</p>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="p-4 bg-blue-50 rounded-lg">
//                   <div className="flex items-start gap-3">
//                     <div className="bg-blue-100 p-2 rounded-full">
//                       <Shield className="h-5 w-5 text-blue-600" />
//                     </div>
//                     <div>
//                       <h4 className="font-medium">Accès sécurisé</h4>
//                       <p className="text-sm text-gray-600">
//                         Vous recevrez un message privé avec le lien
//                         d'invitation. Le bot vérifiera automatiquement votre
//                         abonnement.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Actions */}
//         <div className="flex flex-col sm:flex-row justify-center gap-4">
//           <Button
//             variant="outline"
//             onClick={() => router.push("/")}
//             className="w-full sm:w-auto"
//           >
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Retour à l'accueil
//           </Button>

//           {inviteLink && (
//             <Button
//               onClick={() => openInviteLink(inviteLink)}
//               className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
//             >
//               <ExternalLink className="h-4 w-4 mr-2" />
//               Rejoindre le groupe
//             </Button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

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
  Calendar,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";

// Fonction pour formater le type d'abonnement
const formatSubscriptionType = (type: string): string => {
  switch (type) {
    case "trois_jours":
      return "3 jours";
    case "hebdomadaire":
      return "7 jours";
    case "mensuelle":
      return "30 jours";
    case "trimestrielle":
      return "3 mois";
    case "one_time":
      return "30 jours";
    default:
      // Si c'est un nombre comme "3", "7", "30"
      const days = parseInt(type);
      if (!isNaN(days)) {
        return `${days} jour${days > 1 ? "s" : ""}`;
      }
      return type;
  }
};

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const groupName = searchParams.get("groupName");
  const price = searchParams.get("price");
  const subscriptionTypeParam =
    searchParams.get("subscriptionType") || "one_time";
  const inviteLinkParam = searchParams.get("inviteLink");
  const subscriptionId = searchParams.get("subscriptionId");

  // Décoder le nom du groupe et le lien
  const decodedGroupName = groupName
    ? decodeURIComponent(groupName)
    : "Groupe Telegram";
  const inviteLink = inviteLinkParam
    ? decodeURIComponent(inviteLinkParam)
    : null;

  // Formater le type d'abonnement pour l'affichage
  const formattedSubscriptionType = formatSubscriptionType(
    subscriptionTypeParam
  );

  // Récupérer les détails de l'abonnement depuis l'API si subscriptionId est présent
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!subscriptionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/telegram/subscriptions?subscriptionId=${subscriptionId}`
        );
        const data = await response.json();

        if (data.success && data.subscription) {
          console.log("📊 Détails abonnement récupérés:", data.subscription);
          setSubscriptionDetails(data.subscription);

          // Si l'abonnement a un subscriptionType différent, l'utiliser
          if (
            data.subscription.subscriptionType &&
            data.subscription.subscriptionType !== subscriptionTypeParam
          ) {
            console.log(
              `🔄 Correction subscriptionType: ${subscriptionTypeParam} → ${data.subscription.subscriptionType}`
            );
          }
        }
      } catch (error) {
        console.error("❌ Erreur récupération détails:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [subscriptionId, subscriptionTypeParam]);

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

  // Calculer la date d'expiration si on a les détails
  const getExpirationInfo = () => {
    if (subscriptionDetails?.endDate) {
      const endDate = new Date(subscriptionDetails.endDate);
      return endDate.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    return null;
  };

  const expirationDate = getExpirationInfo();

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
                    {loading ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 animate-spin" />
                        Chargement...
                      </span>
                    ) : (
                      formattedSubscriptionType
                    )}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Statut</p>
                  <Badge className="bg-green-100 text-green-800">
                    ✅ Actif
                  </Badge>
                </div>
              </div>

              {/* Date d'expiration si disponible */}
              {/* {expirationDate && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Date d'expiration :</span>
                    <span>{expirationDate}</span>
                  </div>
                </div>
              )} */}
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
                    {formattedSubscriptionType && (
                      <p>
                        ✅ Durée de l'abonnement : {formattedSubscriptionType}
                      </p>
                    )}
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
                      {formattedSubscriptionType && (
                        <div className="mt-2 flex items-center gap-2 text-blue-700">
                          <Clock className="h-4 w-4" />
                          <span>Durée : {formattedSubscriptionType}</span>
                        </div>
                      )}
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

        {/* Informations supplémentaires */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">
            Informations de votre abonnement
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {formattedSubscriptionType && (
              <li className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>
                  Durée : <strong>{formattedSubscriptionType}</strong>
                </span>
              </li>
            )}
            {expirationDate && (
              <li className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-green-500" />
                <span>
                  Expire le : <strong>{expirationDate}</strong>
                </span>
              </li>
            )}
            <li className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-yellow-500" />
              <span>Le lien d'invitation est valable 24 heures</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Accès automatique vérifié par le bot</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
