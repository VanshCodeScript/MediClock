import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Search, Loader } from "lucide-react";
import { getDrugsList } from "@/services/interactionService";

interface DrugSelectorProps {
  selectedDrugs: string[];
  onDrugsChange: (drugs: string[]) => void;
  onCheck: () => void;
  isLoading?: boolean;
}

export const DrugSelector = ({
  selectedDrugs,
  onDrugsChange,
  onCheck,
  isLoading = false,
}: DrugSelectorProps) => {
  const [drugsList, setDrugsList] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------------------------------- */
  /* Load Drug List */
  /* ---------------------------------- */

  useEffect(() => {
    const loadDrugs = async () => {
      try {
        setIsLoadingDrugs(true);
        const drugs = await getDrugsList();
        setDrugsList(drugs);
      } catch (error) {
        console.error("Failed to load drugs list:", error);
      } finally {
        setIsLoadingDrugs(false);
      }
    };

    loadDrugs();
  }, []);

  /* ---------------------------------- */
  /* Close dropdown when clicking outside */
  /* ---------------------------------- */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---------------------------------- */
  /* Filter Drugs */
  /* ---------------------------------- */

  const filteredDrugs = drugsList.filter(
    (drug) =>
      drug.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedDrugs.includes(drug)
  );

  /* ---------------------------------- */
  /* Handlers */
  /* ---------------------------------- */

  const handleAddDrug = (drug: string) => {
    if (selectedDrugs.includes(drug)) return;

    onDrugsChange([...selectedDrugs, drug]);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleRemoveDrug = (drug: string) => {
    onDrugsChange(selectedDrugs.filter((d) => d !== drug));
  };

  /* ---------------------------------- */
  /* Render */
  /* ---------------------------------- */

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Select Medicines
        </label>

        {/* Search Input */}

        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>

              <input
                type="text"
                placeholder={
                  isLoading
                    ? "Checking interactions..."
                    : "Search and select medicines..."
                }
                value={searchTerm}
                disabled={isLoading}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!isLoading) setIsOpen(true);
                }}
                onFocus={() => {
                  if (!isLoading) setIsOpen(true);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Dropdown */}

          {isOpen && searchTerm && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              {isLoadingDrugs ? (
                <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading medicines...
                </div>
              ) : filteredDrugs.length > 0 ? (
                filteredDrugs.map((drug) => (
                  <button
                    key={drug}
                    onClick={() => handleAddDrug(drug)}
                    className="w-full text-left px-4 py-2.5 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 text-sm"
                  >
                    {drug}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No medicines found
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Selected Drugs */}

      {selectedDrugs.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Selected ({selectedDrugs.length})
          </label>

          <div className="flex flex-wrap gap-2">
            {selectedDrugs.map((drug) => (
              <motion.div
                key={drug}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/70 text-sm font-medium"
              >
                {drug}

                <button
                  onClick={() => handleRemoveDrug(drug)}
                  disabled={isLoading}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Check Button */}

      <button
        onClick={onCheck}
        disabled={selectedDrugs.length < 2 || isLoading}
        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Analyzing Interactions...
          </>
        ) : (
          <>
            Check Interactions
            {selectedDrugs.length >= 2 && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">
                {selectedDrugs.length} drugs
              </span>
            )}
          </>
        )}
      </button>

      {selectedDrugs.length < 2 && (
        <p className="text-xs text-muted-foreground text-center">
          Select at least 2 medicines to check interactions
        </p>
      )}
    </motion.div>
  );
};