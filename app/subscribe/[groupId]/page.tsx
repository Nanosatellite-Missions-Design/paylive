// /app/subscribe/[groupId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Users,
  Calendar,
  Check,
  Shield,
  ExternalLink,
} from "lucide-react";

export default function SubscribePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);

  useEffect(() => {
    fetchGroup();
  }, [params.groupId]);

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/telegram/groups/${params.groupId}`);
      const data = await response.json();

      if (data.success) {
        setGroup(data.group);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Groupe introuvable",
        variant: "destructive",
      });
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Rediriger vers le processus de paiement
    router.push(`/checkout/telegram/${params.groupId}`);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!group) {
    return <div>Groupe non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-3xl">{group.name}</CardTitle>
            <p className="text-blue-100">{group.description}</p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-5xl font-bold text-gray-900">
                      {group.price} XAF
                    </p>
                    <p className="text-gray-500">
                      {group.subscription_type === "monthly"
                        ? "par mois"
                        : group.subscription_type === "weekly"
                        ? "par semaine"
                        : "accès à vie"}
                    </p>
                  </div>

                  <Badge className="text-lg py-2 px-4">
                    {group.subscription_type === "monthly"
                      ? "Mensuel"
                      : group.subscription_type === "weekly"
                      ? "Hebdomadaire"
                      : "À vie"}
                  </Badge>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Accès au groupe Telegram privé</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-green-500" />
                    <span>Communauté de {group.current_members} membres</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>Contenu exclusif et protégé</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-green-500" />
                    <span>Support automatique 24/7</span>
                  </li>
                </ul>

                <Button
                  onClick={handleSubscribe}
                  size="lg"
                  className="w-full py-6 text-lg"
                >
                  S'abonner maintenant
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Paiement sécurisé avec PawaPay • Annulation à tout moment
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Comment ça marche ?
                  </h3>
                  <ol className="space-y-2 text-sm text-blue-700">
                    <li>1. Clique sur "S'abonner"</li>
                    <li>2. Effectue le paiement Mobile Money</li>
                    <li>3. Reçois instantanément le lien d'accès</li>
                    <li>4. Rejoins le groupe via le bot Telegram</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">À propos du créateur</h3>
                  <p className="text-gray-600">
                    Créé par: {group.creator_name}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {group.welcome_message}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open("https://t.me/PayLiveBot", "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tester le bot PayLive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
