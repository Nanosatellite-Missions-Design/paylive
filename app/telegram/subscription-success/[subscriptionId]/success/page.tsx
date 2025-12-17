// "use client";

// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { useToast } from "@/hooks/use-toast";
// import {
//   CheckCircle,
//   Bot,
//   ExternalLink,
//   Copy,
//   Users,
//   Calendar,
//   Shield,
//   ArrowLeft,
//   Loader2,
//   MessageSquare,
// } from "lucide-react";
// import TelegramPaymentDialog from "@/components/telegram-payment-dialog";

// export default function SubscriptionSuccessPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { toast } = useToast();

//   const [loading, setLoading] = useState(true);
//   const [subscription, setSubscription] = useState<any>(null);
//   const [group, setGroup] = useState<any>(null);
//   const [inviteLink, setInviteLink] = useState<string>("");
//   const [showPaymentDialog, setShowPaymentDialog] = useState(false);
//   const [paymentState, setPaymentState] = useState<
//     "idle" | "pending" | "success" | "failed"
//   >("idle");
//   const [telegramId, setTelegramId] = useState("");
//   const [savingTelegramId, setSavingTelegramId] = useState(false);

//   const subscriptionId = params.subscriptionId as string;

//   useEffect(() => {
//     if (subscriptionId) {
//       fetchSubscription();
//     }
//   }, [subscriptionId]);

//   const fetchSubscription = async () => {
//     try {
//       // Récupérer l'abonnement
//       const response = await fetch(
//         `/api/telegram/subscriptions?id=${subscriptionId}`
//       );
//       const data = await response.json();

//       if (data.success) {
//         setSubscription(data.subscription);

//         // Récupérer les infos du groupe
//         if (data.subscription.groupId) {
//           const groupResponse = await fetch(
//             `/api/telegram/groups/${data.subscription.groupId}`
//           );
//           const groupData = await groupResponse.json();

//           if (groupData.success) {
//             setGroup(groupData.group);
//           }
//         }

//         // Vérifier si un lien d'invitation est disponible
//         if (data.subscription.inviteLink) {
//           setInviteLink(data.subscription.inviteLink);
//         } else if (data.subscription.subscriberTelegramId) {
//           // Générer un lien d'invitation via le bot
//           const botUsername =
//             process.env.NEXT_PUBLIC_BOT_USERNAME || "PayLiveBot";
//           const joinLink = `https://t.me/${botUsername}?start=join:${subscriptionId}:${data.subscription.subscriberTelegramId}:${data.subscription.telegramGroupId}`;
//           setInviteLink(joinLink);
//         }
//       } else {
//         throw new Error(data.error);
//       }
//     } catch (error) {
//       console.error("Erreur:", error);
//       toast({
//         title: "Erreur",
//         description: "Impossible de charger l'abonnement",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyInviteLink = () => {
//     if (inviteLink) {
//       navigator.clipboard.writeText(inviteLink);
//       toast({
//         title: "Lien copié !",
//         description: "Le lien a été copié dans votre presse-papier",
//       });
//     }
//   };

//   const openTelegram = () => {
//     if (inviteLink) {
//       window.open(inviteLink, "_blank");
//     }
//   };

//   const handleSaveTelegramId = async () => {
//     if (!telegramId.trim()) {
//       toast({
//         title: "Erreur",
//         description: "Veuillez entrer votre ID Telegram",
//         variant: "destructive",
//       });
//       return;
//     }

//     setSavingTelegramId(true);

//     try {
//       const response = await fetch(
//         `/api/telegram/subscriptions/${subscriptionId}/link-telegram`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ telegramId }),
//         }
//       );

//       const data = await response.json();

//       if (data.success) {
//         toast({
//           title: "Succès",
//           description: "Votre ID Telegram a été enregistré",
//         });

//         // Recharger les données
//         fetchSubscription();
//       } else {
//         throw new Error(data.error);
//       }
//     } catch (error: any) {
//       toast({
//         title: "Erreur",
//         description:
//           error.message || "Impossible d'enregistrer votre ID Telegram",
//         variant: "destructive",
//       });
//     } finally {
//       setSavingTelegramId(false);
//     }
//   };

//   const handlePaymentComplete = (status: string) => {
//     if (status === "success") {
//       setPaymentState("success");
//       // Recharger les données après paiement
//       setTimeout(() => {
//         fetchSubscription();
//       }, 2000);
//     } else if (status === "failed") {
//       setPaymentState("failed");
//     } else if (status === "pending") {
//       setPaymentState("pending");
//     } else {
//       setPaymentState("idle");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="h-12 w-12 text-green-500 animate-spin mx-auto" />
//           <p className="mt-2">Chargement de votre abonnement...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!subscription) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold mb-4">Abonnement non trouvé</h2>
//           <Button onClick={() => router.push("/")}>Retour à l'accueil</Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
//       <div className="container max-w-2xl mx-auto px-4">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
//             <CheckCircle className="h-10 w-10 text-green-600" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Abonnement confirmé !
//           </h1>
//           <p className="text-gray-600">
//             {subscription.status === "active"
//               ? "Vous avez maintenant accès au groupe"
//               : "Votre abonnement est en attente de paiement"}
//           </p>
//         </div>

//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="text-xl">
//               {subscription.groupName || "Groupe Telegram"}
//             </CardTitle>
//             <CardDescription>
//               {subscription.status === "active"
//                 ? "Votre accès a été activé avec succès"
//                 : "Veuillez finaliser votre paiement pour activer votre accès"}
//             </CardDescription>
//           </CardHeader>

//           <CardContent>
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Montant</p>
//                   <p className="text-lg font-bold">
//                     {subscription.paymentAmount} XAF
//                   </p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Statut</p>
//                   <Badge
//                     className={
//                       subscription.status === "active"
//                         ? "bg-green-100 text-green-800"
//                         : subscription.status === "pending"
//                         ? "bg-yellow-100 text-yellow-800"
//                         : "bg-red-100 text-red-800"
//                     }
//                   >
//                     {subscription.status === "active" && "Actif"}
//                     {subscription.status === "pending" && "En attente"}
//                     {subscription.status === "expired" && "Expiré"}
//                   </Badge>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Début</p>
//                   <p className="font-medium">
//                     {subscription.startDate
//                       ? new Date(subscription.startDate).toLocaleDateString()
//                       : "N/A"}
//                   </p>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Fin</p>
//                   <p className="font-medium">
//                     {subscription.endDate
//                       ? new Date(subscription.endDate).toLocaleDateString()
//                       : "N/A"}
//                   </p>
//                 </div>
//               </div>

//               <Separator />

//               {subscription.status === "active" ? (
//                 <>
//                   <div className="space-y-2">
//                     <h3 className="font-semibold">Accès au groupe</h3>

//                     {/* Lien d'invitation */}
//                     {inviteLink ? (
//                       <div className="p-4 bg-blue-50 rounded-lg">
//                         <h4 className="font-medium mb-2 flex items-center gap-2">
//                           <Bot className="h-5 w-5" />
//                           Rejoindre via Telegram
//                         </h4>
//                         <p className="text-sm text-gray-600 mb-3">
//                           Cliquez sur le bouton ci-dessous pour rejoindre le
//                           groupe. Le lien est valable pendant 24 heures.
//                         </p>

//                         <div className="space-y-3">
//                           <div className="flex gap-2">
//                             <Button
//                               onClick={openTelegram}
//                               className="flex-1"
//                               size="lg"
//                             >
//                               <ExternalLink className="h-4 w-4 mr-2" />
//                               Rejoindre sur Telegram
//                             </Button>
//                             <Button
//                               variant="outline"
//                               onClick={copyInviteLink}
//                               size="lg"
//                             >
//                               <Copy className="h-4 w-4" />
//                             </Button>
//                           </div>

//                           <p className="text-xs text-gray-500">
//                             Si le lien ne fonctionne pas, ouvrez Telegram et
//                             tapez @
//                             {process.env.NEXT_PUBLIC_BOT_USERNAME ||
//                               "PayLiveBot"}
//                           </p>
//                         </div>
//                       </div>
//                     ) : !subscription.subscriberTelegramId ? (
//                       <div className="p-4 bg-yellow-50 rounded-lg">
//                         <h4 className="font-medium mb-2 flex items-center gap-2">
//                           <MessageSquare className="h-5 w-5" />
//                           Lier votre compte Telegram
//                         </h4>
//                         <p className="text-sm text-gray-600 mb-3">
//                           Pour recevoir votre invitation, veuillez fournir votre
//                           ID Telegram.
//                         </p>

//                         <div className="space-y-3">
//                           <div className="flex gap-2">
//                             <input
//                               type="text"
//                               placeholder="Votre ID Telegram (ex: 123456789)"
//                               value={telegramId}
//                               onChange={(e) => setTelegramId(e.target.value)}
//                               className="flex-1 px-3 py-2 border rounded-md"
//                               disabled={savingTelegramId}
//                             />
//                             <Button
//                               onClick={handleSaveTelegramId}
//                               disabled={savingTelegramId || !telegramId.trim()}
//                               size="lg"
//                             >
//                               {savingTelegramId ? (
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                               ) : (
//                                 "Enregistrer"
//                               )}
//                             </Button>
//                           </div>
//                           <p className="text-xs text-gray-500">
//                             Pour obtenir votre ID Telegram, envoyez /start à
//                             @userinfobot sur Telegram
//                           </p>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="p-4 bg-green-50 rounded-lg">
//                         <p className="text-sm text-gray-600">
//                           Une invitation vous a été envoyée sur Telegram.
//                           Vérifiez vos messages privés.
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   <Separator />

//                   <div className="space-y-3">
//                     <h3 className="font-semibold">À retenir</h3>
//                     <ul className="space-y-2 text-sm">
//                       <li className="flex items-start gap-2">
//                         <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>
//                           Votre accès est automatiquement géré par le bot
//                         </span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <Users className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>
//                           Le bot vérifiera automatiquement votre abonnement à
//                           chaque connexion
//                         </span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <Calendar className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>
//                           Vous recevrez une notification avant l'expiration de
//                           votre abonnement
//                         </span>
//                       </li>
//                     </ul>
//                   </div>
//                 </>
//               ) : subscription.status === "pending" ? (
//                 <div className="p-4 bg-yellow-50 rounded-lg text-center">
//                   <h3 className="font-semibold mb-2">Paiement en attente</h3>
//                   <p className="text-sm text-gray-600 mb-4">
//                     Votre abonnement est en attente de confirmation de paiement.
//                   </p>
//                   <Button onClick={() => setShowPaymentDialog(true)} size="lg">
//                     Finaliser le paiement
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="p-4 bg-red-50 rounded-lg text-center">
//                   <h3 className="font-semibold mb-2">Abonnement expiré</h3>
//                   <p className="text-sm text-gray-600 mb-4">
//                     Votre abonnement a expiré. Renouvelez-le pour continuer à
//                     accéder au groupe.
//                   </p>
//                   <Button onClick={() => setShowPaymentDialog(true)} size="lg">
//                     Renouveler l'abonnement
//                   </Button>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         <div className="flex justify-center gap-4">
//           <Button variant="outline" onClick={() => router.push("/dashboard")}>
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Retour au tableau de bord
//           </Button>
//           {group?.id && (
//             <Button onClick={() => router.push(`/telegram/groups/${group.id}`)}>
//               Voir les détails du groupe
//             </Button>
//           )}
//         </div>
//       </div>

//       {/* Dialog de paiement pour les abonnements en attente ou expirés */}
//       {(subscription.status === "pending" ||
//         subscription.status === "expired") && (
//         <TelegramPaymentDialog
//           open={showPaymentDialog}
//           onOpenChange={setShowPaymentDialog}
//           amount={subscription.paymentAmount?.toString() || "0"}
//           product={subscription.groupName || "Renouvellement d'abonnement"}
//           onPaymentComplete={handlePaymentComplete}
//           paymentState={paymentState}
//           groupId={subscription.groupId}
//           telegramGroupId={subscription.telegramGroupId}
//           subscriberTelegramId={subscription.subscriberTelegramId}
//         />
//       )}
//     </div>
//   );
// }
