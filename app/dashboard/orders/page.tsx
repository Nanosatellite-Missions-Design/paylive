"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  Eye,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Order } from "@/types/catalog";
import { useAuth } from "@/contexts/auth-context";
import { Timestamp } from "firebase/firestore";
import { updateDocument } from "@/functions/update-doc-in-collection";
import { formatDate } from "@/functions/format-date";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    bgColor: "bg-yellow-50",
  },
  on_the_way: {
    label: "On the Way",
    icon: Truck,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "bg-blue-50",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    bgColor: "bg-green-50",
  },
} as const;

type StatusKey = keyof typeof statusConfig;

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<StatusKey>("pending");
  const [updateNotes, setUpdateNotes] = useState("");
  const { toast } = useToast();
  const { userOrders } = useAuth();

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleUpdateOrder = (order: Order) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdateNotes(order.notes || "");
    setIsUpdateDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    await updateDocument("orders", selectedOrder.id, {
      ...selectedOrder,
      status: updateStatus,
      notes: updateNotes,
    });

    setIsUpdateDialogOpen(false);

    toast({
      title: "Order Updated",
      description: `Order ${selectedOrder.id} status updated to ${statusConfig[updateStatus].label}`,
    });
  };

  const getStatusIcon = (status: Order["status"]) => {
    const Icon = statusConfig[status].icon;
    return <Icon className="h-4 w-4" />;
  };

  const getNextStatus = (currentStatus: Order["status"]) => {
    switch (currentStatus) {
      case "pending":
        return "on_the_way";
      case "on_the_way":
        return "delivered";
      default:
        return currentStatus;
    }
  };

  const canUpdateStatus = (status: Order["status"]) => {
    return status !== "delivered";
  };

  // Sort orders by createdAt descending
  const sortedOrders = [...userOrders].sort((a, b) => {
    const dateA =
      a.createdAt instanceof Timestamp
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
    const dateB =
      b.createdAt instanceof Timestamp
        ? b.createdAt.toDate()
        : new Date(b.createdAt);

    return dateB.getTime() - dateA.getTime(); // newest first
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {/* <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </Link> */}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Order Management
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage your customer orders
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm hidden md:block text-yellow-700">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {userOrders.filter((o) => o.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm hidden md:block text-blue-700">
                    On the Way
                  </p>
                  <p className="text-2xl font-bold text-blue-800">
                    {userOrders.filter((o) => o.status === "on_the_way").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-sm hidden md:block text-green-700">
                    Delivered
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {userOrders.filter((o) => o.status === "delivered").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-2 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <Package className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm hidden md:block text-purple-700">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-purple-800">
                    {userOrders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {userOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Orders Yet
              </h3>
              <p className="text-gray-500">
                Orders from your catalogs will appear here.
              </p>
            </Card>
          ) : (
            sortedOrders.map((order) => {
              console.log(order.status);
              console.log(statusConfig[order.status]);
              console.log(statusConfig["pending"]);
              const statusInfo = statusConfig[order.status];
              console.log(statusInfo);
              const StatusIcon = statusInfo.icon;

              return (
                <Card
                  key={order.id}
                  className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.id}
                          </h3>
                          <Badge className={`${statusInfo.color} gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{order.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{order.customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                              {order.customer.address}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">
                              XAF{order.total.toFixed(2)}
                            </span>
                            <span className="text-gray-500 ml-1">
                              ({order.items.length} item
                              {order.items.length !== 1 ? "s" : ""})
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Created: {formatDate(order.createdAt)}
                          {/* {order.deliveryDate && (
                            <span className="ml-4">Delivered: {formatDate(order.deliveryDate)}</span>
                          )} */}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>

                        {canUpdateStatus(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrder(order)}
                            className="gap-2"
                          >
                            <Edit3 className="h-4 w-4" />
                            Update
                          </Button>
                        )}

                        {canUpdateStatus(order.status) && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              const nextStatus = getNextStatus(order.status);
                              await updateDocument("orders", order.id, {
                                ...order,
                                status: nextStatus,
                              });
                              //   setOrders(updatedOrders)
                              toast({
                                title: "Status Updated",
                                description: `Order moved to ${statusConfig[nextStatus].label}`,
                              });
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {order.status === "pending"
                              ? "Ship Order"
                              : "Mark Delivered"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* View Order Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details - {selectedOrder?.id}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Status and Basic Info */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={`${
                      statusConfig[selectedOrder.status].color
                    } gap-1 text-sm px-3 py-1`}
                  >
                    {getStatusIcon(selectedOrder.status)}
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      XAF{selectedOrder.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedOrder.customer.phone}
                    </p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedOrder.customer.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span>{selectedOrder.customer.address}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Order Items
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <img
                          src={item.product.image[0] || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            XAF{item.product.price} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          XAF{item.product.price * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Order Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Created: {formatDate(selectedOrder.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Edit3 className="h-4 w-4" />
                      <span>
                        Last Updated: {formatDate(selectedOrder.updatedAt)}
                      </span>
                    </div>
                    {/* {selectedOrder.deliveryDate && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Delivered: {formatDate(selectedOrder.deliveryDate)}</span>
                      </div>
                    )} */}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Order Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Update Order - {selectedOrder?.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select
                  value={updateStatus}
                  onValueChange={(value: Order["status"]) =>
                    setUpdateStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="on_the_way">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        On the Way
                      </div>
                    </SelectItem>
                    <SelectItem value="delivered">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Delivered
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Add any notes about this order update..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Update Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
