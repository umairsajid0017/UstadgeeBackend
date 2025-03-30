import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  Calendar, 
  PanelRight, 
  Map, 
  Star,
  CheckSquare, 
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  
  // Fetch active tasks
  const { data: activeTasks, isLoading: isLoadingActive } = useQuery({
    queryKey: [user?.userTypeId === 1 ? "/api/getUserRequests" : "/api/getUstadRequests"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: user?.id.toString(),
          worker_id: user?.id.toString(),
        }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }
      
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch completed tasks
  const { data: completedTasks, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["/api/getUserRequestsCompleted"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: user?.id.toString(),
        }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch completed tasks");
      }
      
      return res.json();
    },
    enabled: !!user && user.userTypeId === 1, // Only for regular users
  });
  
  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, statusId }: { requestId: number, statusId: number }) => {
      await apiRequest("POST", "/api/updateRequestStatus", {
        request_id: requestId,
        status_id: statusId
      });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Task status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/getUserRequests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/getUstadRequests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/getUserRequestsCompleted"] });
      setIsDetailOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  });
  
  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async ({ workerId, rating, description }: { workerId: number, rating: number, description: string }) => {
      await apiRequest("POST", "/api/addReview", {
        worker_id: workerId,
        rating,
        description,
        user_id: user?.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully",
      });
      setIsReviewDialogOpen(false);
      setRating(0);
      setReviewComment("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    }
  });
  
  // Handle opening task details
  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };
  
  // Handle updating task status
  const handleUpdateStatus = (requestId: number, statusId: number) => {
    updateStatusMutation.mutate({ requestId, statusId });
  };
  
  // Handle opening review dialog
  const handleOpenReviewDialog = (task: any) => {
    setSelectedTask(task);
    setIsReviewDialogOpen(true);
  };
  
  // Handle submitting review
  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }
    
    addReviewMutation.mutate({
      workerId: parseInt(selectedTask.workerId),
      rating,
      description: reviewComment
    });
  };
  
  const isLoading = isLoadingActive || isLoadingCompleted;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Tasks" />
        
        <main className="p-6">
          <Tabs defaultValue="active" className="mb-6">
            <TabsList>
              <TabsTrigger value="active">Active Tasks</TabsTrigger>
              {user?.userTypeId === 1 && (
                <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
              )}
            </TabsList>
            
            {/* Active Tasks Tab */}
            <TabsContent value="active">
              <h2 className="text-2xl font-bold mb-6">
                {user?.userTypeId === 1 ? "My Requests" : "Assigned Tasks"}
              </h2>
              
              {isLoadingActive ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !activeTasks || activeTasks.data.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No active tasks found</h3>
                  <p className="text-muted-foreground">
                    {user?.userTypeId === 1 
                      ? "You haven't requested any services yet"
                      : "You don't have any active tasks assigned"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTasks.data.map((task: any) => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium truncate">
                              {task.service?.title || "Service Request"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Request #{task.id}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            task.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start">
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm font-medium">Estimated Time</p>
                              <p className="text-sm text-muted-foreground">
                                {task.estTime} {task.estTime === 1 ? 'hour' : 'hours'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm font-medium">Arrival Time</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(task.arrivalTime), "PPP p")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <PanelRight className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm font-medium">Description</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t">
                          <div className="font-semibold">
                            ₹{task.totalAmount}
                          </div>
                          <Button size="sm" onClick={() => handleViewTask(task)}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Completed Tasks Tab (only for regular users) */}
            {user?.userTypeId === 1 && (
              <TabsContent value="completed">
                <h2 className="text-2xl font-bold mb-6">Completed Requests</h2>
                
                {isLoadingCompleted ? (
                  <div className="flex justify-center my-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !completedTasks || completedTasks.data.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No completed tasks found</h3>
                    <p className="text-muted-foreground">
                      You don't have any completed tasks yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedTasks.data.map((task: any) => (
                      <Card key={task.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium truncate">
                                {task.service?.title || "Service Request"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Request #{task.id}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-start">
                              <Map className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm font-medium">Service Provider</p>
                                <p className="text-sm text-muted-foreground">
                                  {task.worker?.fullName || "Unknown"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm font-medium">Estimated Time</p>
                                <p className="text-sm text-muted-foreground">
                                  {task.estTime} {task.estTime === 1 ? 'hour' : 'hours'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <PanelRight className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm font-medium">Description</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="font-semibold">
                              ₹{task.totalAmount}
                            </div>
                            {task.status === 'Completed' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleOpenReviewDialog(task)}
                                variant="outline"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
      
      {/* Task Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedTask.service?.title || "Service Request"}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p className="font-medium">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          selectedTask.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          selectedTask.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                          selectedTask.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                          selectedTask.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedTask.status}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p>{selectedTask.description}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estimated Time</p>
                      <p>{selectedTask.estTime} {selectedTask.estTime === 1 ? 'hour' : 'hours'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">₹{selectedTask.totalAmount}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expected Arrival</p>
                      <p>{format(new Date(selectedTask.arrivalTime), "PPP p")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Offer Expires</p>
                      <p>{format(new Date(selectedTask.offerExpirationDate), "PPP p")}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {user?.userTypeId === 1 ? "Service Provider" : "Requester"}
                  </h3>
                  
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 mr-3">
                      {user?.userTypeId === 1 && selectedTask.worker?.profileImage ? (
                        <img 
                          src={`/uploads/profiles/${selectedTask.worker.profileImage}`} 
                          alt={selectedTask.worker.fullName} 
                          className="h-full w-full object-cover"
                        />
                      ) : user?.userTypeId !== 1 && selectedTask.user?.profileImage ? (
                        <img 
                          src={`/uploads/profiles/${selectedTask.user.profileImage}`} 
                          alt={selectedTask.user.fullName} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10">
                          <span className="text-primary font-bold text-xl">
                            {user?.userTypeId === 1 
                              ? selectedTask.worker?.fullName?.charAt(0) || 'U' 
                              : selectedTask.user?.fullName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium">
                        {user?.userTypeId === 1 
                          ? selectedTask.worker?.fullName || "Unknown Provider" 
                          : selectedTask.user?.fullName || "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user?.userTypeId === 1 
                          ? selectedTask.worker?.phoneNumber || "" 
                          : selectedTask.user?.phoneNumber || ""}
                      </p>
                    </div>
                  </div>
                  
                  {selectedTask.audioName && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Voice Message</p>
                      <audio 
                        controls 
                        src={`/uploads/audio/${selectedTask.audioName}`} 
                        className="w-full"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  {/* Action buttons based on user type and task status */}
                  {user?.userTypeId !== 1 && selectedTask.status === 'Pending' && (
                    <div className="flex gap-2 mt-6">
                      <Button 
                        className="flex-1"
                        onClick={() => handleUpdateStatus(selectedTask.id, 2)} // Accept (status 2)
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-500 hover:text-red-700"
                        onClick={() => handleUpdateStatus(selectedTask.id, 5)} // Cancel (status 5)
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {user?.userTypeId !== 1 && selectedTask.status === 'Accepted' && (
                    <div className="mt-6">
                      <Button 
                        className="w-full"
                        onClick={() => handleUpdateStatus(selectedTask.id, 3)} // In Progress (status 3)
                      >
                        Start Work
                      </Button>
                    </div>
                  )}
                  
                  {user?.userTypeId !== 1 && selectedTask.status === 'In Progress' && (
                    <div className="mt-6">
                      <Button 
                        className="w-full"
                        onClick={() => handleUpdateStatus(selectedTask.id, 4)} // Completed (status 4)
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                  
                  {user?.userTypeId === 1 && selectedTask.status === 'Pending' && (
                    <div className="mt-6">
                      <Button 
                        variant="outline" 
                        className="w-full text-red-500 hover:text-red-700"
                        onClick={() => handleUpdateStatus(selectedTask.id, 5)} // Cancel (status 5)
                      >
                        Cancel Request
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with this service provider
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              <div className="flex items-center mb-2">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 mr-3">
                  {selectedTask.worker?.profileImage ? (
                    <img 
                      src={`/uploads/profiles/${selectedTask.worker.profileImage}`} 
                      alt={selectedTask.worker.fullName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <span className="text-primary font-bold">
                        {selectedTask.worker?.fullName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="font-medium">{selectedTask.worker?.fullName || "Service Provider"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTask.service?.title || "Service"}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex items-center space-x-1">
                  <TooltipProvider>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Tooltip key={star}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                          >
                            <Star 
                              className={`h-8 w-8 ${
                                star <= rating 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {star === 1 ? 'Poor' : 
                           star === 2 ? 'Fair' : 
                           star === 3 ? 'Good' : 
                           star === 4 ? 'Very Good' : 'Excellent'}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
              
              <div>
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReview}
                  disabled={addReviewMutation.isPending}
                >
                  {addReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
