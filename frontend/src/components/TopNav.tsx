import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

const TopNav = ({ title }: { title: string }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem("mediclock_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem("mediclock_token");
    localStorage.removeItem("mediclock_user");
    localStorage.removeItem("mediclock_user_id");
    
    // Redirect to login
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-lg flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="font-display font-semibold text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search..."
            className="pl-9 pr-4 py-2 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 rounded-xl hover:bg-accent transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </motion.button>
        
        {/* User Profile Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfile(!showProfile)}
            className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <User className="w-4 h-4 text-primary-foreground" />
          </motion.button>

          {/* Dropdown Menu */}
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-sm font-semibold text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "No email"}</p>
                {user?.role && (
                  <p className="text-xs text-primary mt-1 capitalize">{user.role}</p>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate("/settings");
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <hr className="my-2 border-border" />

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
