"""
Google Gemini AI service for CivicResolve.
Provides intelligent complaint analysis, priority detection, department recommendation,
and duplicate complaint identification with graceful fallback.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# System prompt for structured civic complaint analysis
ANALYSIS_SYSTEM_INSTRUCTION = """
You are an expert Civic Infrastructure Engineer and Municipal Operations Specialist working for a city government's grievance resolution platform named CivicResolve.

Analyze the citizen complaint carefully. Evaluate:
1. Potential danger to citizens (electrocution risk, traffic collisions, open drains, collapse risks).
2. Impact on public infrastructure.
3. Number of people potentially affected.
4. Health and environmental risks (disease outbreak, toxic waste, water contamination).
5. Urgency of municipal intervention.

IMPORTANT RULES:
- issue_category MUST be EXACTLY one of:
  ["Road Infrastructure", "Waste Management", "Water Supply", "Electricity and Streetlights", "Drainage and Sanitation", "Public Safety", "Other Civic Issues"]
- priority MUST be EXACTLY one of:
  ["Critical", "High", "Medium", "Low"]
- severity_score MUST be an integer between 1 and 10 (10 being immediate mortal danger/disaster).
- public_safety_risk MUST be one of:
  ["High", "Medium", "Low", "None"]
- department MUST be one of:
  ["Road Maintenance Department", "Sanitation Department", "Water Supply Department", "Electricity Department", "Drainage Department", "Public Safety Department", "General Administration"]
- Do NOT invent facts or claim an authority has already verified the issue.
- Do NOT guarantee resolution times; specify reasonable estimates like "24-48 hours", "3-5 business days", or "Immediate (under 12 hours)".

Return ONLY valid JSON matching this schema:
{
  "issue_category": "string",
  "detected_problem": "string",
  "priority": "string",
  "severity_score": 5,
  "public_safety_risk": "string",
  "department": "string",
  "reason_for_classification": "string",
  "recommended_action": "string",
  "estimated_resolution_time": "string"
}
"""


def _get_gemini_client():
    """Configure and return Gemini generative model if API key is provided."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY.strip())
        return genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
            system_instruction=ANALYSIS_SYSTEM_INSTRUCTION,
        )
    except Exception as e:
        logger.error(f"Failed to initialize Gemini model: {e}")
        return None


def _fallback_analysis(title: str, description: str, location: str) -> Dict[str, Any]:
    """
    Robust fallback analyzer if Gemini API is unavailable or rate limited.
    Guarantees the system stays 100% operational.
    """
    text = f"{title} {description}".lower()

    # Rule-based heuristics for fallback
    if any(k in text for k in ["spark", "wire", "electric", "shock", "current", "pole down", "live wire"]):
        category = "Electricity and Streetlights"
        priority = "Critical" if any(k in text for k in ["live wire", "spark", "shock", "fire"]) else "High"
        department = "Electricity Department"
        severity = 9 if priority == "Critical" else 7
        safety_risk = "High"
        detected = "Electrical hazard or streetlight malfunction"
        action = "Dispatch emergency electrical inspection team immediately to secure the area."
        est_time = "Immediate (under 12 hours)" if priority == "Critical" else "24-48 hours"

    elif any(k in text for k in ["pothole", "crater", "road", "tar", "asphalt", "cave-in", "pavement", "divider"]):
        category = "Road Infrastructure"
        priority = "High" if any(k in text for k in ["deep", "huge", "accident", "cave-in", "highway"]) else "Medium"
        department = "Road Maintenance Department"
        severity = 7 if priority == "High" else 5
        safety_risk = "Medium"
        detected = "Damaged road surface or pothole hazard"
        action = "Inspect road condition, place safety barricades, and schedule cold-mix or resurfacing patch work."
        est_time = "3-5 business days"

    elif any(k in text for k in ["garbage", "trash", "waste", "dump", "bin", "smell", "debris", "litter"]):
        category = "Waste Management"
        priority = "High" if any(k in text for k in ["overflowing", "medical", "dead animal", "rot"]) else "Medium"
        department = "Sanitation Department"
        severity = 6 if priority == "High" else 4
        safety_risk = "Medium"
        detected = "Waste accumulation or overflowing garbage disposal point"
        action = "Deploy municipal compactor truck and sanitation workers for prompt waste clearing and sanitization."
        est_time = "24-48 hours"

    elif any(k in text for k in ["water", "leak", "pipe", "pipeline", "burst", "drinking", "contamination", "no water"]):
        category = "Water Supply"
        priority = "Critical" if any(k in text for k in ["burst", "flooding", "contaminated", "dirty"]) else "High"
        department = "Water Supply Department"
        severity = 8 if priority == "Critical" else 6
        safety_risk = "Medium"
        detected = "Water supply leakage or distribution disruption"
        action = "Isolate pipeline section, deploy plumbing maintenance crew to repair breach, and flush lines."
        est_time = "24-48 hours"

    elif any(k in text for k in ["drain", "sewage", "gutter", "clog", "overflow", "manhole", "stench"]):
        category = "Drainage and Sanitation"
        priority = "Critical" if any(k in text for k in ["open manhole", "flooding house"]) else "High"
        department = "Drainage Department"
        severity = 8 if priority == "Critical" else 6
        safety_risk = "High" if "manhole" in text else "Medium"
        detected = "Blocked drain, open manhole, or sewage overflow"
        action = "Deploy suction de-silting unit, verify manhole covers, and clear drainage blockages."
        est_time = "24-48 hours"

    elif any(k in text for k in ["danger", "theft", "unauthorized", "harassment", "dark alley", "collapse", "unsafe"]):
        category = "Public Safety"
        priority = "High"
        department = "Public Safety Department"
        severity = 7
        safety_risk = "High"
        detected = "Public space safety concern or structural safety risk"
        action = "Coordinate with municipal patrol and civic safety engineers to assess risk and reinforce safety measures."
        est_time = "24-48 hours"

    else:
        category = "Other Civic Issues"
        priority = "Medium"
        department = "General Administration"
        severity = 4
        safety_risk = "Low"
        detected = "General civic grievance requiring inspection"
        action = "Assign field inspector for preliminary on-site assessment and department routing."
        est_time = "5-7 business days"

    return {
        "issue_category": category,
        "detected_problem": detected,
        "priority": priority,
        "severity_score": severity,
        "public_safety_risk": safety_risk,
        "department": department,
        "reason_for_classification": f"Automated analysis of report details: '{title}' at location '{location}'.",
        "recommended_action": action,
        "estimated_resolution_time": est_time,
        "raw_response": "FALLBACK_ENGINE",
    }


def analyze_complaint(title: str, description: str, location: str) -> Dict[str, Any]:
    """
    Analyze a civic complaint using Google Gemini AI with resilient error handling.
    """
    model = _get_gemini_client()
    if not model:
        logger.warning("Gemini API not configured. Using intelligent fallback engine.")
        return _fallback_analysis(title, description, location)

    prompt = f"""
CITIZEN GRIEVANCE REPORT:
Title: {title}
Location: {location}
Detailed Description:
{description}

Analyze this report and output the structured JSON.
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean any accidental markdown wrap
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)

        # Validate required fields
        required_fields = [
            "issue_category", "detected_problem", "priority", "severity_score",
            "public_safety_risk", "department", "reason_for_classification",
            "recommended_action", "estimated_resolution_time"
        ]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing field {field} in Gemini response")

        # Clamp severity score
        data["severity_score"] = max(1, min(10, int(data.get("severity_score", 5))))
        data["raw_response"] = "GEMINI_2_0_FLASH"
        return data

    except Exception as e:
        logger.error(f"Gemini analysis error: {e}. Falling back to fallback engine.")
        fallback = _fallback_analysis(title, description, location)
        fallback["raw_response"] = f"FALLBACK_AFTER_GEMINI_ERROR: {str(e)[:100]}"
        return fallback


def check_duplicate_complaints(
    new_title: str, new_description: str, new_location: str, existing_complaints: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Check if a new complaint might be a duplicate of existing complaints in the area.
    """
    if not existing_complaints:
        return []

    model = _get_gemini_client()
    if not model:
        # Fallback simple title/description similarity
        duplicates = []
        words_new = set(re.findall(r"\w+", f"{new_title} {new_description}".lower()))
        for item in existing_complaints:
            words_existing = set(re.findall(r"\w+", f"{item.get('title', '')} {item.get('description', '')}".lower()))
            overlap = len(words_new.intersection(words_existing))
            if overlap >= 4:
                duplicates.append({
                    "complaint_id": item.get("complaint_id"),
                    "title": item.get("title"),
                    "similarity_reason": f"Shares common keywords ({overlap} matching terms) in the same civic vicinity."
                })
        return duplicates[:3]

    simplified_existing = [
        {
            "complaint_id": c.get("complaint_id"),
            "title": c.get("title"),
            "description": (c.get("description") or "")[:200],
            "location": c.get("location_text"),
        }
        for c in existing_complaints[:10]
    ]

    prompt = f"""
Compare this NEW citizen complaint:
Title: {new_title}
Description: {new_description}
Location: {new_location}

Against these EXISTING active complaints in the area:
{json.dumps(simplified_existing, indent=2)}

Identify any existing complaints that report the SAME real-world civic incident or problem at or near the same location.
Return a JSON array of duplicates. Each object must have:
- "complaint_id": string
- "title": string
- "similarity_reason": short explanation of why it is likely duplicate.

If no duplicates exist, return [].
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        result = json.loads(text)
        if isinstance(result, list):
            return result
        return []
    except Exception as e:
        logger.error(f"Duplicate detection error: {e}")
        return []
