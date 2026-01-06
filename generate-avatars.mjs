import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';

const colors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#30cfd0', '#330867'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a56', '#ff6a88'],
    ['#fbc2eb', '#a6c1ee'],
    ['#fdcbf1', '#e6dee9'],
    ['#a1c4fd', '#c2e9fb'],
    ['#d299c2', '#fef9d7']
];

const emojis = ['😊', '🎯', '🚀', '⭐', '🎨', '🎭', '🎪', '🎬', '🎤', '🎸', '🎹', '🎺'];

colors.forEach((color, i) => {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, color[0]);
    gradient.addColorStop(1, color[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);

    // Add emoji
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojis[i], 100, 100);

    // Save
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(join('public', `avatar${i + 1}.png`), buffer);
    console.log(`Created avatar${i + 1}.png`);
});

console.log('All avatars created successfully!');
