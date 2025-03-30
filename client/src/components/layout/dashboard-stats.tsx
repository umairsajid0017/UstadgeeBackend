import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, CheckCircle, Settings, Users } from "lucide-react";

interface DashboardStatsProps {
  services: number;
  activeTasks: number;
  completedTasks: number;
}

export default function DashboardStats({ 
  services, 
  activeTasks, 
  completedTasks 
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Active Tasks Stat */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Active Tasks</p>
              <p className="text-3xl font-semibold mt-1">{activeTasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              {/* Status indicators could go here if needed */}
              <span className="text-muted-foreground">Current requests/jobs</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Completed Tasks Stat */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Completed Tasks</p>
              <p className="text-3xl font-semibold mt-1">{completedTasks}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground">Finished work</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Services Stat */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Services</p>
              <p className="text-3xl font-semibold mt-1">{services}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground">Available services</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
