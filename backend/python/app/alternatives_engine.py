"""
Medicine Alternatives Engine
Provides safer alternative medications based on drug interactions and therapeutic categories
"""

class AlternativesEngine:
    """Generate safer alternative medications."""
    
    # Therapeutic alternatives organized by drug category
    ALTERNATIVES_DATABASE = {
        # Pain Management
        "ibuprofen": {
            "category": "NSAID",
            "alternatives": [
                {"drug": "acetaminophen", "reason": "Non-NSAID pain reliever, less GI side effects"},
                {"drug": "naproxen", "reason": "Alternative NSAID with longer half-life"}
            ]
        },
        "aspirin": {
            "category": "NSAID/Antiplatelet",
            "alternatives": [
                {"drug": "clopidogrel", "reason": "Alternative antiplatelet with different mechanism"},
                {"drug": "acetaminophen", "reason": "Non-NSAID alternative for mild pain"}
            ]
        },
        "naproxen": {
            "category": "NSAID",
            "alternatives": [
                {"drug": "ibuprofen", "reason": "Alternative NSAID with shorter half-life"},
                {"drug": "acetaminophen", "reason": "Non-NSAID alternative"}
            ]
        },
        "acetaminophen": {
            "category": "Analgesic",
            "alternatives": [
                {"drug": "ibuprofen", "reason": "NSAID alternative with anti-inflammatory effects"},
                {"drug": "naproxen", "reason": "NSAID alternative"}
            ]
        },
        
        # Anticoagulants
        "warfarin": {
            "category": "Anticoagulant",
            "alternatives": [
                {"drug": "apixaban", "reason": "DOAC with more predictable pharmacokinetics"},
                {"drug": "dabigatran", "reason": "DOAC alternative with direct thrombin inhibition"}
            ]
        },
        "enoxaparin": {
            "category": "Anticoagulant",
            "alternatives": [
                {"drug": "fondaparinux", "reason": "Factor Xa inhibitor with different mechanism"},
                {"drug": "rivaroxaban", "reason": "Oral DOAC alternative"}
            ]
        },
        
        # Antifungals
        "fluconazole": {
            "category": "Azole Antifungal",
            "alternatives": [
                {"drug": "terbinafine", "reason": "Different antifungal class with less drug interactions"},
                {"drug": "itraconazole", "reason": "Alternative azole with different properties"}
            ]
        },
        "ketoconazole": {
            "category": "Azole Antifungal",
            "alternatives": [
                {"drug": "terbinafine", "reason": "Allylamine fungicide, less hepatotoxic"},
                {"drug": "fluconazole", "reason": "Triazole with better safety profile"}
            ]
        },
        
        # Beta-blockers
        "metoprolol": {
            "category": "Beta-blocker",
            "alternatives": [
                {"drug": "atenolol", "reason": "Selective beta-blocker with cardioselective properties"},
                {"drug": "bisoprolol", "reason": "Highly selective with fewer respiratory effects"}
            ]
        },
        "propranolol": {
            "category": "Beta-blocker",
            "alternatives": [
                {"drug": "metoprolol", "reason": "Selective beta-1 blocker"},
                {"drug": "atenolol", "reason": "Long-acting selective beta-blocker"}
            ]
        },
        
        # Statins
        "simvastatin": {
            "category": "Statin",
            "alternatives": [
                {"drug": "pravastatin", "reason": "Hydrophilic statin with fewer drug interactions"},
                {"drug": "rosuvastatin", "reason": "Potent statin metabolized differently"}
            ]
        },
        "atorvastatin": {
            "category": "Statin",
            "alternatives": [
                {"drug": "pravastatin", "reason": "Less hepatic metabolism, fewer interactions"},
                {"drug": "rosuvastatin", "reason": "Potent alternative with different metabolism"}
            ]
        },
        
        # Antibiotics
        "ciprofloxacin": {
            "category": "Fluoroquinolone",
            "alternatives": [
                {"drug": "azithromycin", "reason": "Macrolide antibiotic with different spectrum"},
                {"drug": "amoxicillin", "reason": "Beta-lactam with lower drug interaction potential"}
            ]
        },
        "erythromycin": {
            "category": "Macrolide",
            "alternatives": [
                {"drug": "azithromycin", "reason": "Newer macrolide with longer half-life"},
                {"drug": "clarithromycin", "reason": "Alternative macrolide"}
            ]
        },
        
        # Antihistamines
        "diphenhydramine": {
            "category": "First-generation antihistamine",
            "alternatives": [
                {"drug": "loratadine", "reason": "Non-sedating second-generation antihistamine"},
                {"drug": "cetirizine", "reason": "Non-sedating alternative"}
            ]
        },
        
        # Antidepressants
        "sertraline": {
            "category": "SSRI",
            "alternatives": [
                {"drug": "escitalopram", "reason": "SSRI with fewer drug interactions"},
                {"drug": "paroxetine", "reason": "Alternative SSRI"}
            ]
        },
        "fluoxetine": {
            "category": "SSRI",
            "alternatives": [
                {"drug": "sertraline", "reason": "SSRI with better interaction profile"},
                {"drug": "citalopram", "reason": "Alternative SSRI"}
            ]
        },
    }
    
    # Category-based alternatives for drugs not in database
    CATEGORY_ALTERNATIVES = {
        "NSAID": ["acetaminophen"],
        "Statin": ["ezetimibe"],
        "ACE Inhibitor": ["losartan", "valsartan"],
        "Beta-blocker": ["calcium channel blocker"],
        "Antifungal": ["terbinafine"],
    }
    
    def __init__(self):
        """Initialize alternatives engine."""
        self.alternatives_db = self.ALTERNATIVES_DATABASE
    
    def get_alternatives(self, drug: str, severity: str = "medium", limit: int = 2) -> list:
        """
        Get alternative medications for a given drug.
        
        Args:
            drug: Drug name
            severity: Interaction severity ('low', 'medium', 'high')
            limit: Maximum number of alternatives to return
            
        Returns:
            List of alternative drug recommendations
        """
        drug_lower = drug.lower().strip()
        
        # Look up in alternatives database
        if drug_lower in self.alternatives_db:
            alternatives = self.alternatives_db[drug_lower]["alternatives"]
            # For high severity, prioritize first alternative
            formatted_alts = []
            for alt in alternatives[:limit]:
                formatted_alts.append(
                    f"{alt['drug'].title()} - {alt['reason']}"
                )
            return formatted_alts
        
        # Return empty list if drug not found
        return []
    
    def get_dynamic_risk_score(self, interactions: list, drug_pair: tuple) -> float:
        """
        Calculate dynamic risk score (0-10) based on interaction severity and mechanisms.
        
        Args:
            interactions: List of interaction details
            drug_pair: Tuple of (drug_a, drug_b)
            
        Returns:
            Risk score from 0-10
        """
        severity_scores = {
            "high": 8.0,
            "medium": 5.0,
            "low": 2.0,
        }
        
        # Find the interaction for this drug pair
        for interaction in interactions:
            if (interaction.get("drugA", "").lower() == drug_pair[0].lower() and 
                interaction.get("drugB", "").lower() == drug_pair[1].lower()) or \
               (interaction.get("drugA", "").lower() == drug_pair[1].lower() and 
                interaction.get("drugB", "").lower() == drug_pair[0].lower()):
                
                severity = interaction.get("severity", "medium")
                base_score = severity_scores.get(severity, 5.0)
                
                # Adjust based on confidence
                confidence = interaction.get("confidence", 75) / 100
                adjusted_score = base_score * (0.5 + 0.5 * confidence)
                
                # Adjust based on side effects count
                side_effects = interaction.get("sideEffects", [])
                if side_effects:
                    adjusted_score += min(len(side_effects) * 0.5, 2.0)
                
                return min(adjusted_score, 10.0)
        
        return 3.0  # Default moderate risk
    
    def get_drug_category(self, drug: str) -> str:
        """Get therapeutic category of a drug."""
        drug_lower = drug.lower().strip()
        if drug_lower in self.alternatives_db:
            return self.alternatives_db[drug_lower]["category"]
        return "Unknown"
