// // /app/dashboard/telegram-group/setup/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/auth-context";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { useToast } from "@/hooks/use-toast";
// import { Bot, Users, Calendar, Globe, Lock, HelpCircle } from "lucide-react";

// export default function TelegramGroupSetupPage() {
//   const { user, userInfo } = useAuth();
//   const { toast } = useToast();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [step, setStep] = useState(1);

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     price: "",
//     subscriptionType: "monthly",
//     telegramGroupId: "",
//     welcomeMessage: "Bienvenue dans le groupe ! 👋",
//     maxMembers: 100,
//     isPublic: false,
//     autoRemoveExpired: true,
//   });

//   useEffect(() => {
//     // Récupérer les données temporaires
//     const tempData = localStorage.getItem("temp_telegram_group");
//     if (tempData) {
//       setFormData((prev) => ({
//         ...prev,
//         ...JSON.parse(tempData),
//       }));
//     }
//   }, []);

//   const handleCreateGroup = async () => {
//     setLoading(true);

//     try {
//       const response = await fetch("/api/telegram/create-group", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...formData,
//           creatorUid: user?.uid,
//           creatorName: userInfo?.name || "Anonyme",
//         }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         // Nettoyer les données temporaires
//         localStorage.removeItem("temp_telegram_group");

//         toast({
//           title: "Groupe créé avec succès !",
//           description: "Configure maintenant le bot Telegram.",
//         });

//         router.push(`/dashboard/telegram-group/${result.groupId}/bot-setup`);
//       } else {
//         throw new Error(result.error);
//       }
//     } catch (error: any) {
//       toast({
//         title: "Erreur",
//         description: error.message || "Impossible de créer le groupe",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container max-w-4xl mx-auto py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold flex items-center gap-2">
//           <Bot className="h-8 w-8" />
//           Configuration du groupe Telegram
//         </h1>
//         <p className="text-gray-500 mt-2">
//           Finalise la configuration de ton groupe payant
//         </p>
//       </div>

//       <div className="grid md:grid-cols-3 gap-6">
//         {/* Guide du bot */}
//         <div className="md:col-span-1 space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Configuration du bot</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3 text-sm">
//               <div className="flex items-start gap-2">
//                 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mt-0.5">
//                   1
//                 </div>
//                 <span>
//                   Ajoute <strong>@PayLiveBot</strong> à ton groupe Telegram
//                 </span>
//               </div>

//               <div className="flex items-start gap-2">
//                 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mt-0.5">
//                   2
//                 </div>
//                 <span>Donne-lui tous les droits d'administrateur</span>
//               </div>

//               <div className="flex items-start gap-2">
//                 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mt-0.5">
//                   3
//                 </div>
//                 <span>Copie l'ID du groupe avec @RawDataBot</span>
//               </div>

//               <div className="mt-4">
//                 <Button
//                   variant="outline"
//                   className="w-full"
//                   onClick={() =>
//                     window.open("https://t.me/PayLiveBot", "_blank")
//                   }
//                 >
//                   <Bot className="h-4 w-4 mr-2" />
//                   Ouvrir le bot
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Formulaire principal */}
//         <div className="md:col-span-2">
//           <Card>
//             <CardContent className="p-6">
//               <div className="space-y-6">
//                 {/* Informations de base */}
//                 <div className="space-y-4">
//                   <h3 className="font-semibold text-lg">
//                     Informations du groupe
//                   </h3>

//                   <div className="space-y-2">
//                     <Label htmlFor="telegramGroupId">
//                       ID du groupe Telegram *
//                     </Label>
//                     <Input
//                       id="telegramGroupId"
//                       value={formData.telegramGroupId}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           telegramGroupId: e.target.value,
//                         })
//                       }
//                       placeholder="-1001234567890"
//                       required
//                     />
//                     <p className="text-xs text-gray-500">
//                       Format: -100xxxxxxxxx. Ajoute @RawDataBot à ton groupe
//                       pour l'obtenir.
//                     </p>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="maxMembers">
//                       Nombre maximum de membres
//                     </Label>
//                     <Input
//                       id="maxMembers"
//                       type="number"
//                       value={formData.maxMembers}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           maxMembers: parseInt(e.target.value),
//                         })
//                       }
//                       min="1"
//                       max="200000"
//                     />
//                   </div>
//                 </div>

//                 {/* Configuration de l'abonnement */}
//                 <div className="space-y-4">
//                   <h3 className="font-semibold text-lg">
//                     Configuration de l'abonnement
//                   </h3>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label>Type d'abonnement</Label>
//                       <Select
//                         value={formData.subscriptionType}
//                         onValueChange={(value) =>
//                           setFormData({ ...formData, subscriptionType: value })
//                         }
//                       >
//                         <SelectTrigger>
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="weekly">Hebdomadaire</SelectItem>
//                           <SelectItem value="monthly">Mensuel</SelectItem>
//                           <SelectItem value="lifetime">À vie</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="price">Prix (XAF)</Label>
//                       <Input
//                         id="price"
//                         type="number"
//                         value={formData.price}
//                         onChange={(e) =>
//                           setFormData({ ...formData, price: e.target.value })
//                         }
//                         placeholder="5000"
//                         required
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
//                     <Textarea
//                       id="welcomeMessage"
//                       value={formData.welcomeMessage}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           welcomeMessage: e.target.value,
//                         })
//                       }
//                       placeholder="Message envoyé automatiquement aux nouveaux membres..."
//                       rows={3}
//                     />
//                   </div>
//                 </div>

//                 {/* Options avancées */}
//                 <div className="space-y-4">
//                   <h3 className="font-semibold text-lg">Options avancées</h3>

//                   <div className="space-y-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <Globe className="h-4 w-4 text-gray-500" />
//                         <Label htmlFor="isPublic">Groupe public</Label>
//                       </div>
//                       <Switch
//                         id="isPublic"
//                         checked={formData.isPublic}
//                         onCheckedChange={(checked) =>
//                           setFormData({ ...formData, isPublic: checked })
//                         }
//                       />
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       Si activé, ton groupe apparaîtra dans l'annuaire public
//                     </p>

//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <Lock className="h-4 w-4 text-gray-500" />
//                         <Label htmlFor="autoRemoveExpired">
//                           Expulsion automatique
//                         </Label>
//                       </div>
//                       <Switch
//                         id="autoRemoveExpired"
//                         checked={formData.autoRemoveExpired}
//                         onCheckedChange={(checked) =>
//                           setFormData({
//                             ...formData,
//                             autoRemoveExpired: checked,
//                           })
//                         }
//                       />
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       Expulse automatiquement les membres dont l'abonnement a
//                       expiré
//                     </p>
//                   </div>
//                 </div>

//                 {/* Boutons d'action */}
//                 <div className="flex justify-between pt-6">
//                   <Button
//                     variant="outline"
//                     onClick={() => router.push("/dashboard/products")}
//                   >
//                     Annuler
//                   </Button>

//                   <Button
//                     onClick={handleCreateGroup}
//                     disabled={
//                       loading || !formData.telegramGroupId || !formData.price
//                     }
//                   >
//                     {loading
//                       ? "Création en cours..."
//                       : "Créer le groupe payant"}
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
