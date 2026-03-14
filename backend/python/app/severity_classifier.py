class SeverityClassifier:
    """
    Rule-based classifier for drug interaction severity.
    """

    @staticmethod
    def classify(description: str) -> str:
        """
        Classify severity based on description keywords.
        
        Args:
            description: Interaction description text
            
        Returns:
            severity level: 'high', 'medium', or 'low'
        """
        description_lower = description.lower()

        # High severity keywords
        high_keywords = [
            "contraindicated",
            "severe",
            "fatal",
            "avoid",
            "death",
            "life-threatening",
            "serious",
            "do not combine",
            "blackbox",
            "black-box",
            "major",
        ]

        # Medium severity keywords
        medium_keywords = [
            "increase",
            "decrease",
            "reduce",
            "enhance",
            "inhibit",
            "potentiate",
            "alter",
            "significant",
            "caution",
            "monitor",
            "risk",
        ]

        # Check for high severity
        for keyword in high_keywords:
            if keyword in description_lower:
                return "high"

        # Check for medium severity
        for keyword in medium_keywords:
            if keyword in description_lower:
                return "medium"

        # Default to low
        return "low"

    @staticmethod
    def get_risk_score(severity: str) -> int:
        """Get numeric risk score for severity level."""
        scores = {"low": 1, "medium": 2, "high": 3}
        return scores.get(severity, 1)

    @staticmethod
    def calculate_overall_risk(severities: list) -> str:
        """Calculate overall risk from multiple interactions."""
        if not severities:
            return "none"

        scores = [SeverityClassifier.get_risk_score(sev) for sev in severities]
        avg_score = sum(scores) / len(scores)

        if avg_score >= 2.5:
            return "high"
        elif avg_score >= 1.5:
            return "medium"
        else:
            return "low"
