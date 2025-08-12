
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Notebook from "./pages/Notebook";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute fallback={<Auth />}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notebook" 
        element={
          <ProtectedRoute fallback={<Auth />}>
            <Notebook />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notebook/:id" 
        element={
          <ProtectedRoute fallback={<Auth />}>
            <Notebook />
          </ProtectedRoute>
        } 
      />
      <Route path="/auth" element={<Auth />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
