#!/bin/bash

cd "$(dirname "$0")"

# Define arrays
colors1=("#667eea" "#f093fb" "#4facfe" "#43e97b" "#fa709a" "#30cfd0" "#a8edea" "#ff9a56" "#fbc2eb" "#fdcbf1" "#a1c4fd" "#d299c2")
colors2=("#764ba2" "#f5576c" "#00f2fe" "#38f9d7" "#fee140" "#330867" "#fed6e3" "#ff6a88" "#a6c1ee" "#e6dee9" "#c2e9fb" "#fef9d7")
emojis=("😊" "🎯" "🚀" "⭐" "🎨" "🎭" "🎪" "🎬" "🎤" "🎸" "🎹" "🎺")

# Create each avatar
for i in {0..11}; do
  num=$((i + 1))
  cat > "avatar${num}.svg" << EOF
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${num}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors1[$i]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors2[$i]};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#grad${num})" />
  <text x="100" y="120" font-size="80" text-anchor="middle" fill="white">${emojis[$i]}</text>
</svg>
EOF
done

echo "✅ Created 12 avatar SVG files"
ls -lh avatar*.svg
