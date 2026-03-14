import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Apple, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const meals = [
  { type: "Breakfast", time: "8:00 AM", items: "Oatmeal, banana, green tea", cal: 350 },
  { type: "Lunch", time: "1:00 PM", items: "Grilled chicken salad, quinoa", cal: 550 },
  { type: "Dinner", time: "7:30 PM", items: "Salmon, steamed vegetables, rice", cal: 620 },
  { type: "Snacks", time: "4:00 PM", items: "Almonds, apple, yogurt", cal: 280 },
];

const macros = [
  { name: "Protein", value: 85, color: "#0000FF" },
  { name: "Carbs", value: 220, color: "#22C55E" },
  { name: "Fat", value: 65, color: "#FACC15" },
  { name: "Sugar", value: 45, color: "#EF4444" },
];

const NutritionPage = () => (
  <PageTransition>
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-semibold text-base flex items-center gap-2">
            <Apple className="w-4 h-4 text-primary" /> Today's Meals
          </h3>
          {meals.map((m, i) => (
            <motion.div key={m.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card-hover p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{m.type}</h4>
                <span className="text-xs text-muted-foreground">{m.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">{m.items}</p>
              <p className="text-xs font-semibold text-primary mt-2">{m.cal} kcal</p>
            </motion.div>
          ))}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Meal
          </motion.button>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-base mb-4">Nutrition Summary</h3>
          <div className="mb-4">
            <p className="text-center text-3xl font-bold font-display">1,800</p>
            <p className="text-center text-sm text-muted-foreground">kcal today</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={macros} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                {macros.map((m) => <Cell key={m.name} fill={m.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {macros.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-muted-foreground">{m.name}</span>
                <span className="font-semibold ml-auto">{m.value}g</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </PageTransition>
);

export default NutritionPage;
