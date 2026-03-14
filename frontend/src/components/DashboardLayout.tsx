import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopNav from "@/components/TopNav";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/add-medication": "Add Medication",
  "/drug-interaction": "Drug Interaction",
  "/schedule": "Schedule Generator",
  "/reminders": "Reminders",
  "/suggestions": "Health Suggestions",
  "/nutrition": "Nutrition Tracking",
  "/3d-health": "3D Health Visualization",
  "/voice": "Voice Assistant",
  "/sos": "SOS Emergency",
  "/qr-card": "QR Health Card",
  "/video-call": "Video Call Doctor",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/doctor-dashboard": "Doctor Dashboard",
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || "MediClock";

  useEffect(() => {
    const token = localStorage.getItem("mediclock_token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
