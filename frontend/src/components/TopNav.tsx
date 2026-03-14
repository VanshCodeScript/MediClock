import { Bell, Search, User } from "lucide-react";
import { motion } from "framer-motion";

const TopNav = ({ title }: { title: string }) => (
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
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center"
      >
        <User className="w-4 h-4 text-primary-foreground" />
      </motion.button>
    </div>
  </header>
);

export default TopNav;
