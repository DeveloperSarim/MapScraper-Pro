#!/bin/bash
echo ""
echo " ================================"
echo "  MapScraper Pro - Starting..."
echo " ================================"
echo ""
echo " Server: http://localhost:8788"
echo " Press Ctrl+C to stop."
echo ""

# Open browser after 1 second
(sleep 1 && open "http://localhost:8788") &

# Start server
python3 -m http.server 8788
