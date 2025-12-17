// // /app/dashboard/telegram-group/new/page.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
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
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/auth-context";
// import { Loader2, Bot, Users, Calendar, Lock, Globe } from "lucide-react";

// export default function NewTelegramGroupPage() {
//   const { user, userInfo } = useAuth();
//   const { toast } = useToast();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [step, setStep] = useState(1);

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     subscriptionType: "monthly",
//     price: "",
//     telegramGroupId: "",
//     groupLink: "",
//     welcomeMessage: "Bienvenue dans le groupe !",
//     maxMembers: 100,
//     autoRemoveExpired: true,
//     isPublic: false,
//   });

//   const handleSubmit = async (e: any) => {
//     e.preventDefault();
//     if (!user) return;

//     setLoading(true);

//     try {
//       // 1. Créer le produit dans Firestore
//       const productData = {
//         name: formData.name,
//         description: formData.description,
//         productType: "telegram_group",
//         price: parseFloat(formData.price),
//         images: [], // Pas d'image nécessaire
//         category: "telegram_group",
//         status: "available",
//         inStock: formData.maxMembers,

//         // Champs spécifiques Telegram
//         telegramGroupId: formData.telegramGroupId,
//         subscriptionType: formData.subscriptionType,
//         billingPeriodDays:
//           formData.subscriptionType === "weekly"
//             ? 7
//             : formData.subscriptionType === "monthly"
//             ? 30
//             : 0,
//         groupLink: formData.groupLink,
//         welcomeMessage: formData.welcomeMessage,
//         maxMembers: formData.maxMembers,
//         currentMembers: 0,
//         subscriptionCount: 0,
//         autoRemoveExpired: formData.autoRemoveExpired,
//         isPublic: formData.isPublic,
//         creatorId: user.uid,
//         creatorName: userInfo?.name || "Anonyme",
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       };

//       // 2. Ajouter à la collection products
//       const response = await fetch("/api/telegram/create-group", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...productData, userId: user.uid }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         toast({
//           title: "Groupe créé avec succès !",
//           description: "Configure maintenant ton bot Telegram.",
//         });

//         router.push(`/dashboard/telegram-group/${result.groupId}/setup`);
//       } else {
//         throw new Error(result.error || "Erreur inconnue");
//       }
//     } catch (error) {
//       console.error("Erreur création groupe:", error);
//       toast({
//         title: "Erreur",
//         description: "Impossible de créer le groupe.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container max-w-4xl mx-auto py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold">Créer un groupe Telegram payant</h1>
//         <p className="text-gray-500 mt-2">
//           Transforme ton groupe Telegram en source de revenus récurrents
//         </p>
//       </div>

//       <form onSubmit={handleSubmit}>
//         <div className="grid md:grid-cols-3 gap-6">
//           {/* Étapes de progression */}
//           <div className="md:col-span-1 space-y-4">
//             <Card>
//               <CardContent className="p-6">
//                 <div className="space-y-2">
//                   <div
//                     className={`flex items-center gap-3 p-3 rounded ${
//                       step >= 1 ? "bg-blue-50" : ""
//                     }`}
//                   >
//                     <div
//                       className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                         step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
//                       }`}
//                     >
//                       1
//                     </div>
//                     <span className="font-medium">Informations de base</span>
//                   </div>

//                   <div
//                     className={`flex items-center gap-3 p-3 rounded ${
//                       step >= 2 ? "bg-blue-50" : ""
//                     }`}
//                   >
//                     <div
//                       className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                         step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
//                       }`}
//                     >
//                       2
//                     </div>
//                     <span className="font-medium">Configuration Telegram</span>
//                   </div>

//                   <div
//                     className={`flex items-center gap-3 p-3 rounded ${
//                       step >= 3 ? "bg-blue-50" : ""
//                     }`}
//                   >
//                     <div
//                       className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                         step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
//                       }`}
//                     >
//                       3
//                     </div>
//                     <span className="font-medium">Tarification</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle className="text-lg flex items-center gap-2">
//                   <Bot className="h-5 w-5" />
//                   Configuration du bot
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <ol className="space-y-2 text-sm text-gray-600">
//                   <li>1. Ajoute @PayLiveBot à ton groupe</li>
//                   <li>2. Donne-lui les droits d'administrateur</li>
//                   <li>3. Active toutes les permissions</li>
//                   <li>4. Copie l'ID du groupe</li>
//                 </ol>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Formulaire principal */}
//           <div className="md:col-span-2">
//             <Card>
//               <CardContent className="p-6">
//                 <Tabs value={step.toString()} className="space-y-4">
//                   {/* Étape 1 */}
//                   <TabsContent value="1" className="space-y-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="name">Nom du groupe *</Label>
//                       <Input
//                         id="name"
//                         value={formData.name}
//                         onChange={(e) =>
//                           setFormData({ ...formData, name: e.target.value })
//                         }
//                         placeholder="Ex: Formation Trading Avancé"
//                         required
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="description">Description *</Label>
//                       <Textarea
//                         id="description"
//                         value={formData.description}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             description: e.target.value,
//                           })
//                         }
//                         placeholder="Décris ce que les membres vont trouver dans ton groupe..."
//                         rows={4}
//                         required
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="welcomeMessage">
//                         Message de bienvenue
//                       </Label>
//                       <Textarea
//                         id="welcomeMessage"
//                         value={formData.welcomeMessage}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             welcomeMessage: e.target.value,
//                           })
//                         }
//                         placeholder="Message envoyé quand un membre rejoint"
//                         rows={3}
//                       />
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => router.back()}
//                       >
//                         Annuler
//                       </Button>
//                       <Button type="button" onClick={() => setStep(2)}>
//                         Suivant
//                       </Button>
//                     </div>
//                   </TabsContent>

//                   {/* Étape 2 */}
//                   <TabsContent value="2" className="space-y-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="telegramGroupId">
//                         ID du groupe Telegram *
//                       </Label>
//                       <Input
//                         id="telegramGroupId"
//                         value={formData.telegramGroupId}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             telegramGroupId: e.target.value,
//                           })
//                         }
//                         placeholder="-100xxxxxxxxx"
//                         required
//                       />
//                       <p className="text-sm text-gray-500">
//                         Pour obtenir l'ID : ajoute @RawDataBot à ton groupe et
//                         copie le "chat_id"
//                       </p>
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="groupLink">
//                         Lien d'invitation public
//                       </Label>
//                       <Input
//                         id="groupLink"
//                         value={formData.groupLink}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             groupLink: e.target.value,
//                           })
//                         }
//                         placeholder="https://t.me/+xxxxxxxxxx"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="maxMembers">
//                         Nombre maximum de membres
//                       </Label>
//                       <Input
//                         id="maxMembers"
//                         type="number"
//                         value={formData.maxMembers}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             maxMembers: parseInt(e.target.value),
//                           })
//                         }
//                         min="1"
//                         max="200000"
//                       />
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Switch
//                         checked={formData.autoRemoveExpired}
//                         onCheckedChange={(checked) =>
//                           setFormData({
//                             ...formData,
//                             autoRemoveExpired: checked,
//                           })
//                         }
//                       />
//                       <Label>
//                         Expulser automatiquement les abonnements expirés
//                       </Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Switch
//                         checked={formData.isPublic}
//                         onCheckedChange={(checked) =>
//                           setFormData({ ...formData, isPublic: checked })
//                         }
//                       />
//                       <Label>Groupe public (visible dans l'annuaire)</Label>
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => setStep(1)}
//                       >
//                         Retour
//                       </Button>
//                       <Button type="button" onClick={() => setStep(3)}>
//                         Suivant
//                       </Button>
//                     </div>
//                   </TabsContent>

//                   {/* Étape 3 */}
//                   <TabsContent value="3" className="space-y-4">
//                     <div className="space-y-2">
//                       <Label>Type d'abonnement *</Label>
//                       <Select
//                         value={formData.subscriptionType}
//                         onValueChange={(value) =>
//                           setFormData({ ...formData, subscriptionType: value })
//                         }
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Sélectionne un type" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="weekly">
//                             <div className="flex items-center gap-2">
//                               <Calendar className="h-4 w-4" />
//                               Hebdomadaire
//                             </div>
//                           </SelectItem>
//                           <SelectItem value="monthly">
//                             <div className="flex items-center gap-2">
//                               <Calendar className="h-4 w-4" />
//                               Mensuel
//                             </div>
//                           </SelectItem>
//                           <SelectItem value="lifetime">
//                             <div className="flex items-center gap-2">
//                               <Lock className="h-4 w-4" />
//                               Accès à vie
//                             </div>
//                           </SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="price">Prix (XAF) *</Label>
//                       <div className="relative">
//                         <Input
//                           id="price"
//                           type="number"
//                           value={formData.price}
//                           onChange={(e) =>
//                             setFormData({ ...formData, price: e.target.value })
//                           }
//                           placeholder="5000"
//                           className="pl-12"
//                           required
//                         />
//                         <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                           XAF
//                         </div>
//                       </div>
//                     </div>

//                     {formData.subscriptionType !== "lifetime" && (
//                       <div className="bg-blue-50 p-4 rounded-md">
//                         <p className="text-sm text-blue-700">
//                           💡 Les paiements récurrents seront automatiquement
//                           facturés chaque période. Les membres recevront une
//                           notification 3 jours avant le renouvellement.
//                         </p>
//                       </div>
//                     )}

//                     <div className="flex items-center justify-between pt-4">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => setStep(2)}
//                       >
//                         Retour
//                       </Button>
//                       <Button type="submit" disabled={loading}>
//                         {loading ? (
//                           <>
//                             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                             Création en cours...
//                           </>
//                         ) : (
//                           "Créer le groupe payant"
//                         )}
//                       </Button>
//                     </div>
//                   </TabsContent>
//                 </Tabs>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }
