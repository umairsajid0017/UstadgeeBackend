import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "@/components/layout/AdminLayout";
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
  XCircle,
  Play
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
    <AdminLayout title="Tasks">
      <Tabs defaultValue="active" className="mb-6">
            <TabsList className="bg-card/50 backdrop-blur-sm border border-primary/20">
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Active Tasks
              </TabsTrigger>
              {user?.userTypeId === 1 && (
                <TabsTrigger 
                  value="completed" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Completed Tasks
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Active Tasks Tab */}
            <TabsContent value="active">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {user?.userTypeId === 1 ? "My Requests" : "Assigned Tasks"}
              </h2>
              
              {isLoadingActive ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : !activeTasks || activeTasks.data.length === 0 ? (
                <div className="text-center py-12 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
                    <Clock className="h-8 w-8 text-primary" />
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
                    <Card key={task.id} className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium truncate">
                              {task.service?.title || "Service Request"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Request #{task.id}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            task.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                            task.status === 'Accepted' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
                            task.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30' :
                            task.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/30' :
                            'bg-red-500/10 text-red-500 border border-red-500/30'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-5">
                          <div className="flex items-start">
                            <Clock className="h-4 w-4 text-primary mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm font-medium">Estimated Time</p>
                              <p className="text-sm text-muted-foreground">
                                {task.estTime} {task.estTime === 1 ? 'hour' : 'hours'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <Calendar className="h-4 w-4 text-primary mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm font-medium">Arrival Time</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(task.arrivalTime), "PPP p")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <PanelRight className="h-4 w-4 text-primary mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm font-medium">Description</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-primary/10">
                          <div className="font-semibold text-primary">
                            ₹{task.totalAmount}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleViewTask(task)}
                            className="bg-primary/90 hover:bg-primary text-white shadow-md shadow-primary/20"
                          >
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
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Completed Requests
                </h2>
                
                {isLoadingCompleted ? (
                  <div className="flex justify-center my-12">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : !completedTasks || completedTasks.data.length === 0 ? (
                  <div className="text-center py-12 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No completed tasks found</h3>
                    <p className="text-muted-foreground">
                      You don't have any completed tasks yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedTasks.data.map((task: any) => (
                      <Card key={task.id} className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-primary/10 transition-all duration-300">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium truncate">
                                {task.service?.title || "Service Request"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Request #{task.id}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              task.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 
                              'bg-red-500/10 text-red-500 border border-red-500/30'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                          
                          <div className="space-y-3 mb-5">
                            <div className="flex items-start">
                              <Map className="h-4 w-4 text-primary mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm font-medium">Service Provider</p>
                                <p className="text-sm text-muted-foreground">
                                  {task.worker?.fullName || "Unknown"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <Clock className="h-4 w-4 text-primary mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm font-medium">Estimated Time</p>
                                <p className="text-sm text-muted-foreground">
                                  {task.estTime} {task.estTime === 1 ? 'hour' : 'hours'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <PanelRight className="h-4 w-4 text-primary mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm font-medium">Description</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t border-primary/10">
                            <div className="font-semibold text-primary">
                              ₹{task.totalAmount}
                            </div>
                            {task.status === 'Completed' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleOpenReviewDialog(task)}
                                variant="outline"
                                className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                              >
                                <Star className="h-4 w-4 mr-1 text-yellow-500" />
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
      {/* Task Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Task Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background/50 p-5 rounded-lg border border-primary/10 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {selectedTask.service?.title || "Service Request"}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-primary/70">Status</p>
                      <p className="font-medium">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          selectedTask.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                          selectedTask.status === 'Accepted' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
                          selectedTask.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30' :
                          selectedTask.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/30' :
                          'bg-red-500/10 text-red-500 border border-red-500/30'
                        }`}>
                          {selectedTask.status}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-primary/70">Description</p>
                      <p className="text-muted-foreground">{selectedTask.description}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-primary/70">Estimated Time</p>
                      <p className="text-muted-foreground">{selectedTask.estTime} {selectedTask.estTime === 1 ? 'hour' : 'hours'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-primary/70">Total Amount</p>
                      <p className="font-semibold text-primary">₹{selectedTask.totalAmount}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-primary/70">Expected Arrival</p>
                      <p className="text-muted-foreground">{format(new Date(selectedTask.arrivalTime), "PPP p")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-primary/70">Offer Expires</p>
                      <p className="text-muted-foreground">{format(new Date(selectedTask.offerExpirationDate), "PPP p")}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-background/50 p-5 rounded-lg border border-primary/10 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {user?.userTypeId === 1 ? "Service Provider" : "Requester"}
                  </h3>
                  
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10 mr-3">
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
                    <div className="flex gap-3 mt-6">
                      <Button 
                        className="flex-1 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20 group"
                        onClick={() => handleUpdateStatus(selectedTask.id, 2)} // Accept (status 2)
                      >
                        <CheckSquare className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 group"
                        onClick={() => handleUpdateStatus(selectedTask.id, 5)} // Cancel (status 5)
                      >
                        <XCircle className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {user?.userTypeId !== 1 && selectedTask.status === 'Accepted' && (
                    <div className="mt-6">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 group"
                        onClick={() => handleUpdateStatus(selectedTask.id, 3)} // In Progress (status 3)
                      >
                        <Play className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                        Start Work
                      </Button>
                    </div>
                  )}
                  
                  {user?.userTypeId !== 1 && selectedTask.status === 'In Progress' && (
                    <div className="mt-6">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 group"
                        onClick={() => handleUpdateStatus(selectedTask.id, 4)} // Completed (status 4)
                      >
                        <CheckCircle className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                  
                  {user?.userTypeId === 1 && selectedTask.status === 'Pending' && (
                    <div className="mt-6">
                      <Button 
                        variant="outline" 
                        className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 group"
                        onClick={() => handleUpdateStatus(selectedTask.id, 5)} // Cancel (status 5)
                      >
                        <XCircle className="h-5 w-5 mr-2 group-hover:animate-pulse" />
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
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Leave a Review
            </DialogTitle>
            <DialogDescription>
              Share your experience with this service provider
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              <div className="flex items-center mb-4 p-4 bg-background/50 rounded-lg border border-primary/10">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10 mr-3">
                  {selectedTask.worker?.profileImage ? (
                    <img 
                      src={`/uploads/profiles/${selectedTask.worker.profileImage}`} 
                      alt={selectedTask.worker.fullName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <span className="text-primary font-bold text-xl">
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
              
              <div className="bg-background/50 p-4 rounded-lg border border-primary/10">
                <label className="block text-sm font-medium mb-3 text-primary/70">Rating</label>
                <div className="flex items-center space-x-2 justify-center">
                  <TooltipProvider>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Tooltip key={star}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transform transition-transform hover:scale-110"
                          >
                            <Star 
                              className={`h-10 w-10 ${
                                star <= rating 
                                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' 
                                  : 'text-gray-500/50'
                              }`} 
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-card/90 backdrop-blur-md border-primary/20">
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
              
              <div className="bg-background/50 p-4 rounded-lg border border-primary/10">
                <label htmlFor="comment" className="block text-sm font-medium mb-2 text-primary/70">
                  Comment (Optional)
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  className="w-full rounded-md border border-primary/20 bg-card/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:border-primary/50"
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReviewDialogOpen(false)}
                  className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReview}
                  disabled={addReviewMutation.isPending}
                  className="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20"
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
    </AdminLayout>
  );
}
