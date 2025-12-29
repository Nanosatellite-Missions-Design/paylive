// components/admin/users-table.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  DollarSign,
  Calendar,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  uid: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  balance: number;
  createdAt: any;
  totalWithdrawn: number;
  lifetimeSales: number;
}

export default function UsersTable() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Erreur de chargement");
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    if (!editingRole) return;

    try {
      setUpdating(userId);
      const response = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: editingRole }),
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour localement
        setUsers(users.map(user => 
          user.uid === userId ? { ...user, role: editingRole } : user
        ));
        
        setEditingUserId(null);
        toast({
          title: "Succès",
          description: `Rôle mis à jour en ${getRoleLabel(editingRole)}`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const startEditing = (user: UserData) => {
    setEditingUserId(user.uid);
    setEditingRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditingRole("");
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search);
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

// Dans components/admin/users-table.tsx, modifiez la fonction formatDate :
const formatDate = (date: any) => {
  if (!date || date === "Date inconnue") {
    return "N/A";
  }
  
  try {
    let jsDate: Date;
    
    // Si c'est déjà un objet Date
    if (date instanceof Date) {
      jsDate = date;
    }
    // Si c'est une string ISO
    else if (typeof date === 'string') {
      jsDate = new Date(date);
    }
    // Si c'est un timestamp Firestore avec _seconds
    else if (date && typeof date === 'object' && date._seconds) {
      jsDate = new Date(date._seconds * 1000);
    }
    // Si c'est un timestamp Firestore avec toDate()
    else if (date && date.toDate) {
      jsDate = date.toDate();
    }
    // Autre format
    else {
      jsDate = new Date(date);
    }
    
    // Vérifier si la date est valide
    if (isNaN(jsDate.getTime())) {
      return "Date invalide";
    }
    
    return jsDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.error("Erreur format date:", error, date);
    return "Date invalide";
  }
};

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "user":
        return "Créateur";
      case "creator":
        return "Créateur";
      default:
        return role;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case "user":
      case "creator":
        return <Badge className="bg-green-100 text-green-800">Créateur</Badge>;
      default:
        return <Badge variant="outline">{getRoleLabel(role)}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des utilisateurs</CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email ou téléphone..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="border rounded-md px-3 py-2"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="user">Créateurs</option>
            </select>
            <Button variant="outline" onClick={fetchUsers}>
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Solde</TableHead>
              <TableHead>Ventes totales</TableHead>
              <TableHead>Date d'inscription</TableHead>
              {/* <TableHead>Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {editingUserId === user.uid ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        disabled={updating === user.uid}
                      >
                        <option value="admin">Administrateur</option>
                        <option value="user">Créateur</option>
                      </select>
                      {updating === user.uid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateRole(user.uid)}
                            disabled={!editingRole}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(user)}
                      >
                        Modifier
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span className="font-medium">
                      {user.balance?.toLocaleString()} XAF
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{user.lifetimeSales || 0}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </TableCell>
                {/* <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              {filteredUsers.length} utilisateurs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center">
                Page {currentPage} sur {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}