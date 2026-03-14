import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Apple, Plus, Camera, Upload, Sparkles, Loader2, UtensilsCrossed, Flame, Beef, Wheat, Droplet, Check } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useRef, useCallback } from "react";

const initialMeals = [
  { type: "Breakfast", time: "8:00 AM", items: "Oatmeal, banana, green tea", cal: 350 },
  { type: "Lunch", time: "1:00 PM", items: "Grilled chicken salad, quinoa", cal: 550 },
  { type: "Dinner", time: "7:30 PM", items: "Salmon, steamed vegetables, rice", cal: 620 },
  { type: "Snacks", time: "4:00 PM", items: "Almonds, apple, yogurt", cal: 280 },
];

const initialMacros = {
  protein: 85,
  carbs: 220,
  fat: 65,
  sugar: 45,
};

interface AnalysisResult {
  foodItems: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const NutritionPage = () => {
  const [meals, setMeals] = useState(initialMeals);
  const [macroTotals, setMacroTotals] = useState(initialMacros);
  const [totalCal, setTotalCal] = useState(1800);

  // AI Analyzer state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const macros = [
    { name: "Protein", value: macroTotals.protein, color: "#0000FF" },
    { name: "Carbs", value: macroTotals.carbs, color: "#22C55E" },
    { name: "Fat", value: macroTotals.fat, color: "#FACC15" },
    { name: "Sugar", value: macroTotals.sugar, color: "#EF4444" },
  ];

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setResult(null);
    setAdded(false);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const analyzeMeal = useCallback(async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch("http://localhost:5001/api/nutrition/analyze-meal", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze meal. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [selectedFile]);

  const addToDaily = useCallback(() => {
    if (!result) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    setMeals((prev) => [...prev, {
      type: "AI Analyzed",
      time: timeStr,
      items: result.foodItems.join(", "),
      cal: result.calories,
    }]);
    setTotalCal((prev) => prev + result.calories);
    setMacroTotals((prev) => ({
      protein: prev.protein + result.protein,
      carbs: prev.carbs + result.carbs,
      fat: prev.fat + result.fat,
      sugar: prev.sugar,
    }));
    setAdded(true);
  }, [result]);

  const clearAnalyzer = useCallback(() => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    setAdded(false);
    setError(null);
  }, []);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* AI Meal Analyzer Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-base">Analyze Your Meal</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Upload or capture a photo of your meal to automatically estimate calories and nutrients.
          </p>

          {/* Upload / Camera buttons + preview area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: image area */}
            <div>
              {!selectedImage ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-muted/30 min-h-[200px]">
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 gradient-blue text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Upload Food Image
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-medium flex items-center gap-2 hover:border-primary/30 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Use Camera
                    </motion.button>
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-2xl overflow-hidden bg-muted"
                >
                  <img
                    src={selectedImage}
                    alt="Meal preview"
                    className="w-full h-[220px] object-cover rounded-2xl"
                  />
                  <button
                    onClick={clearAnalyzer}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-xs font-bold hover:bg-card transition-colors"
                  >
                    ✕
                  </button>
                </motion.div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />

              {selectedImage && !result && !analyzing && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={analyzeMeal}
                  className="w-full mt-3 py-3 gradient-blue text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/15"
                >
                  <Sparkles className="w-4 h-4" /> Analyze Meal
                </motion.button>
              )}
            </div>

            {/* Right: results / loading */}
            <div className="flex flex-col justify-center min-h-[200px]">
              <AnimatePresence mode="wait">
                {analyzing && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3 py-8"
                  >
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Analyzing your meal...</p>
                  </motion.div>
                )}

                {error && !analyzing && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600"
                  >
                    {error}
                  </motion.div>
                )}

                {result && !analyzing && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    {/* Detected foods */}
                    <div className="flex items-center gap-2 mb-1">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Detected Foods</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {result.foodItems.map((item) => (
                        <span key={item} className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-medium capitalize">
                          {item}
                        </span>
                      ))}
                    </div>

                    {/* Nutrition stats grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Calories", value: result.calories, unit: "kcal", icon: Flame, color: "text-orange-500" },
                        { label: "Protein", value: result.protein, unit: "g", icon: Beef, color: "text-primary" },
                        { label: "Carbs", value: result.carbs, unit: "g", icon: Wheat, color: "text-emerald-500" },
                        { label: "Fat", value: result.fat, unit: "g", icon: Droplet, color: "text-amber-500" },
                      ].map((stat) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="p-3 rounded-xl bg-muted/50 flex items-center gap-2.5"
                        >
                          <stat.icon className={`w-4 h-4 ${stat.color} flex-shrink-0`} />
                          <div>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className="text-sm font-bold font-display">{stat.value} <span className="text-xs font-normal text-muted-foreground">{stat.unit}</span></p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Add to daily button */}
                    {!added ? (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addToDaily}
                        className="w-full mt-2 py-2.5 gradient-blue text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add to Today's Meals
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 status-green border"
                      >
                        <Check className="w-4 h-4" /> Added to Today's Meals
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {!analyzing && !result && !error && !selectedImage && (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground"
                  >
                    <Camera className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Upload a food photo to get instant nutrition estimates powered by AI</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Existing meals + nutrition summary layout (preserved) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <Apple className="w-4 h-4 text-primary" /> Today's Meals
            </h3>
            {meals.map((m, i) => (
              <motion.div key={`${m.type}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card-hover p-4">
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
              <p className="text-center text-3xl font-bold font-display">{totalCal.toLocaleString()}</p>
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
};

export default NutritionPage;
