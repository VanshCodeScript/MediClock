import pandas as pd
import os
from typing import Dict, List, Tuple, Optional
from .severity_classifier import SeverityClassifier
from .alternatives_engine import AlternativesEngine


class InteractionEngine:
    """
    Drug interaction detection engine.
    Loads CSV dataset and provides fast O(1) lookup.
    """

    def __init__(self, csv_path: str):
        """
        Initialize the interaction engine with CSV data.
        
        Args:
            csv_path: Path to drug interactions CSV file
        """
        self.df = None
        self.interaction_dict: Dict[Tuple[str, str], str] = {}
        self.unique_drugs: List[str] = []
        self.classifier = SeverityClassifier()
        self.alternatives_engine = AlternativesEngine()  # Initialize alternatives engine
        
        if os.path.exists(csv_path):
            self._load_data(csv_path)
        else:
            raise FileNotFoundError(f"CSV file not found: {csv_path}")

    def _load_data(self, csv_path: str) -> None:
        """Load and process CSV data into dictionary."""
        try:
            self.df = pd.read_csv(csv_path)
            print(f"✓ Loaded {len(self.df)} drug interactions")
            
            # Normalize column names (handle different CSV formats)
            self.df.columns = self.df.columns.str.strip()
            
            # Build interaction dictionary for O(1) lookup
            for _, row in self.df.iterrows():
                drug1 = str(row.get("Drug 1", "")).strip().lower()
                drug2 = str(row.get("Drug 2", "")).strip().lower()
                description = str(row.get("Interaction Description", "")).strip()
                
                if drug1 and drug2 and description:
                    # Create sorted tuple key for bidirectional lookup
                    key = tuple(sorted([drug1, drug2]))
                    self.interaction_dict[key] = description
            
            # Extract unique drugs
            all_drugs = set(
                pd.concat([
                    self.df["Drug 1"].str.lower().str.strip(),
                    self.df["Drug 2"].str.lower().str.strip()
                ]).unique()
            )
            self.unique_drugs = sorted([d for d in all_drugs if d])
            
            print(f"✓ Built interaction dictionary: {len(self.interaction_dict)} unique pairs")
            print(f"✓ Unique drugs: {len(self.unique_drugs)}")
            
        except Exception as e:
            print(f"✗ Error loading CSV: {e}")
            raise

    def get_interaction(self, drug1: str, drug2: str) -> Optional[str]:
        """
        Get interaction description between two drugs (O(1) lookup).
        
        Args:
            drug1: First drug name
            drug2: Second drug name
            
        Returns:
            Interaction description or None if no interaction found
        """
        drug1 = drug1.strip().lower()
        drug2 = drug2.strip().lower()
        
        # Create sorted tuple key
        key = tuple(sorted([drug1, drug2]))
        
        return self.interaction_dict.get(key)

    def check_interactions(self, drugs: List[str]) -> List[Dict]:
        """
        Check all possible interactions between drugs.
        
        Args:
            drugs: List of drug names
            
        Returns:
            List of interaction dictionaries with alternatives and dynamic risk ratings
        """
        from itertools import combinations
        
        interactions = []
        
        # Generate all drug pairs
        for drug_a, drug_b in combinations(drugs, 2):
            interaction_desc = self.get_interaction(drug_a, drug_b)
            
            if interaction_desc:
                severity = self.classifier.classify(interaction_desc)
                
                # Calculate confidence
                confidence = self._calculate_confidence(interaction_desc)
                
                # Build enriched interaction data
                interaction = {
                    "drugA": drug_a.title(),
                    "drugB": drug_b.title(),
                    "severity": severity,
                    "note": interaction_desc,
                    "mechanism": self._extract_mechanism(interaction_desc),
                    "sideEffects": self._extract_side_effects(interaction_desc),
                    "recommendation": self._get_recommendation(severity),
                    "timeGap": self._get_time_gap(severity),
                    "confidence": confidence,
                }
                
                # Add dynamic risk rating (0-10)
                severity_scores = {"high": 8.0, "medium": 5.0, "low": 2.0}
                base_score = severity_scores.get(severity, 5.0)
                dynamic_risk = base_score * (0.5 + 0.5 * (confidence / 100))
                side_effect_boost = min(len(interaction["sideEffects"] or []) * 0.5, 2.0)
                interaction["dynamicRiskRating"] = min(dynamic_risk + side_effect_boost, 10.0)
                
                # Add safer alternatives for both drugs
                alternatives_by_drug = []
                
                # Get alternatives for drug A
                alts_a = self.alternatives_engine.get_alternatives(drug_a, severity, limit=2)
                if alts_a:
                    alternatives_by_drug.append({
                        "drugName": drug_a.title(),
                        "alternatives": [
                            {"drug": alt.split(" - ")[0].strip(), "reason": alt.split(" - ")[1].strip() if " - " in alt else ""}
                            for alt in alts_a
                        ]
                    })
                
                # Get alternatives for drug B
                alts_b = self.alternatives_engine.get_alternatives(drug_b, severity, limit=2)
                if alts_b:
                    alternatives_by_drug.append({
                        "drugName": drug_b.title(),
                        "alternatives": [
                            {"drug": alt.split(" - ")[0].strip(), "reason": alt.split(" - ")[1].strip() if " - " in alt else ""}
                            for alt in alts_b
                        ]
                    })
                
                interaction["alternativesByDrug"] = alternatives_by_drug if alternatives_by_drug else None
                
                # Also keep simple alternatives list for backward compatibility
                all_simple_alts = []
                all_simple_alts.extend(alts_a)
                all_simple_alts.extend(alts_b)
                interaction["alternatives"] = all_simple_alts if all_simple_alts else None
                
                interactions.append(interaction)
        
        # Sort by severity and dynamic risk (high severity and high risk first)
        severity_order = {"high": 0, "medium": 1, "low": 2}
        interactions.sort(
            key=lambda x: (
                severity_order.get(x["severity"], 3),
                -(x.get("dynamicRiskRating", 5.0))
            )
        )
        
        return interactions

    def _extract_mechanism(self, description: str) -> Optional[str]:
        """
        Extract or infer mechanism from interaction description.
        
        Args:
            description: Interaction description
            
        Returns:
            Mechanism explanation or None
        """
        # Look for key mechanism phrases
        mechanism_keywords = [
            "enzyme", "inhibit", "induce", "compete", "bind", "metabolism",
            "absorption", "elimination", "clearance", "concentration", "decreased",
            "increased", "activity", "effect", "photosensitizing", "photosensitivity",
            "cardiotoxic", "serum", "can be", "may"
        ]
        
        # If description contains mechanism keywords, extract first sentence
        desc_lower = description.lower()
        
        for keyword in mechanism_keywords:
            if keyword in desc_lower:
                # Return the first sentence as mechanism summary
                sentences = description.split(".")
                if sentences:
                    mechanism = sentences[0].strip()
                    if len(mechanism) > 200:
                        mechanism = mechanism[:200] + "..."
                    return mechanism if mechanism else None
        
        return None

    def _extract_side_effects(self, description: str) -> Optional[List[str]]:
        """
        Extract potential side effects from interaction description.
        
        Args:
            description: Interaction description
            
        Returns:
            List of side effects or None
        """
        side_effect_mapping = {
            "photosensitizing": ["photosensitivity", "sun sensitivity", "skin reactions"],
            "cardiotoxic": ["heart toxicity", "cardiac damage", "arrhythmia", "heart failure"],
            "bleeding": ["bleeding risk", "hemorrhage", "bruising", "clotting problems"],
            "concentration": ["increased blood levels", "toxicity risk", "overdose potential"],
            "decreased": ["reduced effectiveness", "treatment failure", "loss of efficacy"],
            "increased": ["enhanced effect", "overdose risk", "toxicity"],
            "seizure": ["seizures", "convulsions", "neurological effects"],
            "renal|kidney": ["kidney damage", "impaired kidney function", "renal toxicity"],
            "hepatic|liver": ["liver damage", "hepatotoxicity", "liver failure"],
            "monitor": ["requires close monitoring", "watch for side effects"],
            "avoid": ["serious risk", "contraindicated combination", "severe reaction"],
            "severe|serious": ["severe side effects", "serious adverse effects", "critical risk"],
            "dizziness|vertigo": ["dizziness", "lightheadedness", "vertigo"],
            "nausea|vomiting": ["nausea", "vomiting", "stomach upset"],
            "fatigue|weakness": ["fatigue", "weakness", "lethargy"],
        }
        
        desc_lower = description.lower()
        effects = set()
        
        for keyword, effect_list in side_effect_mapping.items():
            # Handle pipe-separated keywords (OR relationship)
            if "|" in keyword:
                keyword_options = keyword.split("|")
                if any(kw in desc_lower for kw in keyword_options):
                    effects.update(effect_list)
            elif keyword in desc_lower:
                effects.update(effect_list)
        
        # Return unique effects, limited to 4-5
        return list(effects)[:5] if effects else None

    def _get_recommendation(self, severity: str) -> str:
        """Get recommendation based on severity."""
        recommendations = {
            "high": "Avoid taking together. Consult your doctor immediately before combining.",
            "medium": "Use with caution. Monitor for side effects. Consult your doctor before combining.",
            "low": "Generally safe together, but monitor for any unusual symptoms.",
        }
        return recommendations.get(severity, "Consult your healthcare provider.")

    def _get_time_gap(self, severity: str) -> Optional[str]:
        """Get recommended time gap based on severity."""
        time_gaps = {
            "high": "At least 6-12 hours apart (consult doctor for exact timing)",
            "medium": "At least 2-4 hours apart",
            "low": "Can be taken together or with minimal gap",
        }
        return time_gaps.get(severity)

    def _calculate_confidence(self, description: str) -> float:
        """
        Calculate confidence score based on description detail.
        
        Args:
            description: Interaction description
            
        Returns:
            Confidence score 0-100
        """
        # Longer, more detailed descriptions = higher confidence
        desc_length = len(description)
        
        # Base confidence on description length
        if desc_length < 50:
            confidence = 60.0
        elif desc_length < 100:
            confidence = 75.0
        elif desc_length < 200:
            confidence = 85.0
        else:
            confidence = 92.0
        
        return min(confidence, 99.0)  # Cap at 99%

    def get_drugs_list(self) -> List[str]:
        """Get list of all available drugs."""
        return [d.title() for d in self.unique_drugs]

    def get_statistics(self) -> Dict:
        """Get dataset statistics."""
        return {
            "total_interactions": len(self.interaction_dict),
            "unique_drugs": len(self.unique_drugs),
            "data_loaded": self.df is not None
        }
