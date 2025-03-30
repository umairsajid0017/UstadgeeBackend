import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  phoneNumber: string;
  fullName: string;
  userTypeId: number;
  profileImage?: string;
};

type LoginData = {
  phoneNumber: string;
  password: string;
};

type RegisterData = {
  phoneNumber: string;
  fullName: string;
  password: string;
  userTypeId: number;
  imageData?: string;
  image_name?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: userData,
    error,
    isLoading,
  } = useQuery<{ success: boolean; user: User } | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const user = userData?.user || null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data?.token) {
        // Store token in localStorage
        localStorage.setItem("token", data.data.token);
        // Invalidate the user query to refetch user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data?.token) {
        // Store token in localStorage
        localStorage.setItem("token", data.data.token);
        // Invalidate the user query to refetch user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        toast({
          title: "Registration successful",
          description: "Your account has been created",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // No actual logout endpoint, just remove token
      localStorage.removeItem("token");
      // Set user data to null
      queryClient.setQueryData(["/api/user"], null);
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
