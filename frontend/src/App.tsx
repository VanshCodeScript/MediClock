import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import AddMedicationPage from "./pages/AddMedicationPage";
import DrugInteractionPage from "./pages/DrugInteractionPage";
import SchedulePage from "./pages/SchedulePage";
import ReminderPage from "./pages/ReminderPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import NutritionPage from "./pages/NutritionPage";
import HealthVisualization3D from "./pages/HealthVisualization3D";
import VoiceAssistantPage from "./pages/VoiceAssistantPage";
import SOSPage from "./pages/SOSPage";
import QRCardPage from "./pages/QRCardPage";
import VideoCallPage from "./pages/VideoCallPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ChronobiologySchedulerPage from "./pages/ChronobiologySchedulerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-medication" element={<AddMedicationPage />} />
            <Route path="/drug-interaction" element={<DrugInteractionPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/reminders" element={<ReminderPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/3d-health" element={<HealthVisualization3D />} />
            <Route path="/voice" element={<VoiceAssistantPage />} />
            <Route path="/sos" element={<SOSPage />} />
            <Route path="/qr-card" element={<QRCardPage />} />
            <Route path="/video-call" element={<VideoCallPage />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/chronobiology-scheduler" element={<ChronobiologySchedulerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
