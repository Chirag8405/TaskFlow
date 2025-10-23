#!/bin/bash

# Bundle Analysis Script for Realtime Task Manager
# Analyzes build output, dependencies, and provides optimization recommendations

set -e

echo "🔍 Starting Bundle Analysis..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLIENT_DIR="./client"
SERVER_DIR="./server"
ANALYSIS_DIR="./analysis"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create analysis directory
mkdir -p "$ANALYSIS_DIR"

echo -e "${BLUE}📊 Analyzing Client Bundle...${NC}"

# Navigate to client directory
cd "$CLIENT_DIR"

# Install bundle analyzer if not present
if ! npm list --depth=0 webpack-bundle-analyzer >/dev/null 2>&1; then
    echo "Installing webpack-bundle-analyzer..."
    npm install --save-dev webpack-bundle-analyzer
fi

# Build production bundle
echo "Building production bundle..."
npm run build

# Analyze bundle
echo "Generating bundle analysis..."
npx vite-bundle-analyzer dist --format json --out "../$ANALYSIS_DIR/bundle-stats.json"

# Generate bundle report
cat > "../$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Bundle Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Bundle Analysis Report</h1>
    <p>Generated on: $(date)</p>
EOF

# Analyze dist directory
echo -e "${BLUE}📈 Analyzing Build Output...${NC}"

if [ -d "dist" ]; then
    # Calculate sizes
    TOTAL_SIZE=$(du -sh dist | cut -f1)
    JS_SIZE=$(find dist -name "*.js" -exec du -ch {} + | grep total | cut -f1)
    CSS_SIZE=$(find dist -name "*.css" -exec du -ch {} + | grep total | cut -f1)
    ASSET_SIZE=$(find dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.ico" | xargs du -ch 2>/dev/null | grep total | cut -f1 || echo "0K")
    
    echo -e "${GREEN}Bundle Size Analysis:${NC}"
    echo "Total bundle size: $TOTAL_SIZE"
    echo "JavaScript size: $JS_SIZE"
    echo "CSS size: $CSS_SIZE"
    echo "Assets size: $ASSET_SIZE"
    
    # Add to HTML report
    cat >> "../$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html" << EOF
    <div class="section info">
        <h2>Bundle Size Analysis</h2>
        <div class="metric">Total: $TOTAL_SIZE</div>
        <div class="metric">JavaScript: $JS_SIZE</div>
        <div class="metric">CSS: $CSS_SIZE</div>
        <div class="metric">Assets: $ASSET_SIZE</div>
    </div>
EOF

    # List largest files
    echo -e "${BLUE}📋 Largest Files:${NC}"
    find dist -type f -exec du -h {} + | sort -rh | head -10
    
    # Add largest files to report
    echo '<div class="section"><h2>Largest Files</h2><table><tr><th>Size</th><th>File</th></tr>' >> "../$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html"
    find dist -type f -exec du -h {} + | sort -rh | head -10 | while read size file; do
        echo "<tr><td>$size</td><td>$file</td></tr>" >> "../$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html"
    done
    echo '</table></div>' >> "../$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html"
fi

# Analyze dependencies
echo -e "${BLUE}📦 Analyzing Dependencies...${NC}"

# Check for duplicate dependencies
echo "Checking for duplicate dependencies..."
npm ls --depth=0 > "../$ANALYSIS_DIR/dependencies-$TIMESTAMP.txt" 2>&1 || true

# Analyze package.json
echo "Analyzing package.json..."
if command -v jq &> /dev/null; then
    # Count dependencies
    DEP_COUNT=$(cat package.json | jq '.dependencies | length')
    DEV_DEP_COUNT=$(cat package.json | jq '.devDependencies | length')
    
    echo "Production dependencies: $DEP_COUNT"
    echo "Development dependencies: $DEV_DEP_COUNT"
    
    # Check for outdated packages
    echo "Checking for outdated packages..."
    npm outdated --json > "../$ANALYSIS_DIR/outdated-$TIMESTAMP.json" 2>/dev/null || echo "{}" > "../$ANALYSIS_DIR/outdated-$TIMESTAMP.json"
    
    # Add dependency info to report
    cat >> "../$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html" << EOF
    <div class="section">
        <h2>Dependencies</h2>
        <div class="metric">Production: $DEP_COUNT</div>
        <div class="metric">Development: $DEV_DEP_COUNT</div>
    </div>
EOF
fi

# Analyze for potential optimizations
echo -e "${BLUE}🔧 Optimization Analysis...${NC}"

OPTIMIZATION_REPORT="../$ANALYSIS_DIR/optimizations-$TIMESTAMP.md"
cat > "$OPTIMIZATION_REPORT" << 'EOF'
# Bundle Optimization Recommendations

## Findings and Recommendations

EOF

# Check for common optimization opportunities
echo "## Bundle Size Optimizations" >> "$OPTIMIZATION_REPORT"

if [ -d "dist" ]; then
    # Check for large JS files
    LARGE_JS=$(find dist -name "*.js" -size +500k | wc -l)
    if [ "$LARGE_JS" -gt 0 ]; then
        echo "⚠️  Large JavaScript files detected ($LARGE_JS files > 500KB)"
        echo "- **Large JS Files**: Found $LARGE_JS JavaScript files larger than 500KB. Consider code splitting." >> "$OPTIMIZATION_REPORT"
    fi
    
    # Check for uncompressed files
    UNCOMPRESSED=$(find dist -name "*.js" -o -name "*.css" | xargs file | grep -v gzip | wc -l)
    if [ "$UNCOMPRESSED" -gt 0 ]; then
        echo "⚠️  Uncompressed files detected"
        echo "- **Compression**: Enable gzip/brotli compression for better performance." >> "$OPTIMIZATION_REPORT"
    fi
    
    # Check for source maps in production
    SOURCE_MAPS=$(find dist -name "*.map" | wc -l)
    if [ "$SOURCE_MAPS" -gt 0 ]; then
        echo "⚠️  Source maps found in production build"
        echo "- **Source Maps**: Remove source maps from production build for security and size." >> "$OPTIMIZATION_REPORT"
    fi
fi

# Check for heavy dependencies
echo "## Dependency Optimizations" >> "$OPTIMIZATION_REPORT"

if command -v jq &> /dev/null; then
    # Check for moment.js (heavy date library)
    if cat package.json | jq -r '.dependencies | keys[]' | grep -q "moment"; then
        echo "⚠️  Moment.js detected - consider switching to day.js"
        echo "- **Date Library**: Replace moment.js with day.js for 97% smaller bundle." >> "$OPTIMIZATION_REPORT"
    fi
    
    # Check for lodash (if not tree-shaken)
    if cat package.json | jq -r '.dependencies | keys[]' | grep -q "lodash"; then
        echo "ℹ️  Lodash detected - ensure tree-shaking is working"
        echo "- **Lodash**: Use lodash-es or individual lodash functions to enable tree-shaking." >> "$OPTIMIZATION_REPORT"
    fi
    
    # Check for multiple UI libraries
    UI_LIBS=$(cat package.json | jq -r '.dependencies | keys[]' | grep -E "(antd|material-ui|bootstrap|bulma|semantic-ui)" | wc -l)
    if [ "$UI_LIBS" -gt 1 ]; then
        echo "⚠️  Multiple UI libraries detected"
        echo "- **UI Libraries**: Multiple UI libraries detected. Consider using only one." >> "$OPTIMIZATION_REPORT"
    fi
fi

# Performance recommendations
echo "## Performance Recommendations" >> "$OPTIMIZATION_REPORT"
cat >> "$OPTIMIZATION_REPORT" << 'EOF'

### Code Splitting
- Implement route-based code splitting
- Split vendor chunks from application code
- Use dynamic imports for heavy components

### Tree Shaking
- Ensure all imports are ES6 modules
- Use production builds for tree shaking
- Audit unused code with tools like webpack-bundle-analyzer

### Asset Optimization
- Optimize images (WebP format)
- Use SVG for icons
- Implement lazy loading for images

### Caching Strategy
- Set appropriate cache headers
- Use content hashing for assets
- Implement service worker for offline caching

### Bundle Analysis Tools
- Use webpack-bundle-analyzer regularly
- Monitor bundle size in CI/CD
- Set up budget alerts for size increases

EOF

# Server-side analysis
echo -e "${BLUE}📊 Analyzing Server Bundle...${NC}"
cd "../$SERVER_DIR"

echo "## Server Optimizations" >> "../$OPTIMIZATION_REPORT"

# Check server dependencies
if command -v jq &> /dev/null; then
    SERVER_DEPS=$(cat package.json | jq '.dependencies | length')
    echo "Server dependencies: $SERVER_DEPS"
    
    # Check for unnecessary dependencies in production
    if cat package.json | jq -r '.dependencies | keys[]' | grep -q "nodemon"; then
        echo "⚠️  Development dependencies in production detected"
        echo "- **Dev Dependencies**: Move development tools to devDependencies." >> "../$OPTIMIZATION_REPORT"
    fi
fi

# Check for Docker optimization opportunities
if [ -f "Dockerfile" ]; then
    echo "## Docker Optimizations" >> "../$OPTIMIZATION_REPORT"
    
    # Check for multi-stage build
    if ! grep -q "FROM.*AS" Dockerfile; then
        echo "- **Multi-stage Build**: Use multi-stage Docker builds to reduce image size." >> "../$OPTIMIZATION_REPORT"
    fi
    
    # Check for .dockerignore
    if [ ! -f ".dockerignore" ]; then
        echo "- **Docker Ignore**: Add .dockerignore file to reduce build context." >> "../$OPTIMIZATION_REPORT"
    fi
fi

# Generate final report
cd ..

echo -e "${GREEN}✅ Analysis Complete!${NC}"
echo ""
echo "📁 Reports generated in: $ANALYSIS_DIR/"
echo "   📄 Bundle report: bundle-report-$TIMESTAMP.html"
echo "   📋 Optimization recommendations: optimizations-$TIMESTAMP.md"
echo "   📦 Dependencies: dependencies-$TIMESTAMP.txt"
echo ""

# Finish HTML report
cat >> "$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html" << 'EOF'
    <div class="section">
        <h2>Analysis Complete</h2>
        <p>Check the optimization recommendations file for detailed suggestions.</p>
    </div>
</body>
</html>
EOF

echo -e "${BLUE}🎯 Quick Recommendations:${NC}"
echo "1. Enable gzip compression on server"
echo "2. Implement code splitting for routes"
echo "3. Optimize images and use WebP format"
echo "4. Set up bundle size monitoring in CI/CD"
echo "5. Regular dependency audits and updates"
echo ""

# Optional: Open report in browser
if command -v xdg-open &> /dev/null; then
    read -p "Open bundle report in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "$ANALYSIS_DIR/bundle-report-$TIMESTAMP.html"
    fi
fi

echo -e "${GREEN}🚀 Bundle analysis completed successfully!${NC}"