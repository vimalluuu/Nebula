#!/bin/bash
echo "==================================================="
echo "  VIR 3 - Auto Commit Script"
echo "==================================================="

echo "[1/3] Adding all files..."
git add .

echo "[2/3] Committing changes..."
git commit -m "feat: Complete procurement workflow with audit validation and UX enhancements" -m "- Implemented complete procurement decision flow with mandatory auditor validation" -m "- Added risk-based award controls (CLEARED/FLAGGED/HIGH_RISK)" -m "- Created audit validation system and manual AI risk entry" -m "- Implemented vendor notifications and expanded bid details (click-to-expand)" -m "- Fixed public API data loading and enhanced UI"

echo "[3/3] Pushing to repository..."
git push

echo "==================================================="
echo "  Done!"
echo "==================================================="
read -p "Press enter to close"
