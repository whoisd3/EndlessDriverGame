// Performance testing and profiling script
const fs = require('fs');
const path = require('path');

console.log('🎮 Endless Driver Game - Performance Analysis\n');

// Check file sizes
function checkFileSize(filename) {
    const filepath = path.join(__dirname, filename);
    try {
        const stats = fs.statSync(filepath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✓ ${filename}: ${sizeKB} KB`);
        return stats.size;
    } catch (err) {
        console.log(`✗ ${filename}: File not found`);
        return 0;
    }
}

// Analyze asset sizes
console.log('📊 Asset Size Analysis:');
console.log('------------------------');
const htmlSize = checkFileSize('index.html');
const jsSize = checkFileSize('game.js');
const cssSize = checkFileSize('styles.css');

const totalSize = htmlSize + jsSize + cssSize;
console.log(`\nTotal size: ${(totalSize / 1024).toFixed(2)} KB`);

// Check for minified versions
console.log('\n📦 Minified Versions:');
console.log('------------------------');
const jsMinSize = checkFileSize('game.min.js');
const cssMinSize = checkFileSize('styles.min.css');

if (jsMinSize > 0) {
    const savings = ((1 - jsMinSize / jsSize) * 100).toFixed(1);
    console.log(`  JS minification savings: ${savings}%`);
}

if (cssMinSize > 0) {
    const savings = ((1 - cssMinSize / cssSize) * 100).toFixed(1);
    console.log(`  CSS minification savings: ${savings}%`);
}

// Check for performance optimizations
console.log('\n⚡ Performance Features:');
console.log('------------------------');

const gameCode = fs.readFileSync('game.js', 'utf-8');
const cssCode = fs.readFileSync('styles.css', 'utf-8');
const htmlCode = fs.readFileSync('index.html', 'utf-8');

const features = [
    {
        name: 'requestAnimationFrame',
        check: gameCode.includes('requestAnimationFrame'),
        description: 'Optimal frame timing'
    },
    {
        name: 'Canvas desynchronized',
        check: gameCode.includes('desynchronized'),
        description: 'Low-latency rendering'
    },
    {
        name: 'GPU acceleration (translateZ)',
        check: cssCode.includes('translateZ'),
        description: 'Hardware-accelerated transforms'
    },
    {
        name: 'will-change property',
        check: cssCode.includes('will-change'),
        description: 'Browser optimization hints'
    },
    {
        name: 'Touch event optimization',
        check: gameCode.includes('passive: false'),
        description: 'Optimized touch handling'
    },
    {
        name: 'Dynamic pixel ratio',
        check: gameCode.includes('getOptimalPixelRatio'),
        description: 'Resolution scaling'
    },
    {
        name: 'Viewport meta tags',
        check: htmlCode.includes('viewport'),
        description: 'Mobile viewport optimization'
    },
    {
        name: 'FPS monitoring',
        check: gameCode.includes('updateFPS'),
        description: 'Performance tracking'
    }
];

features.forEach(feature => {
    const status = feature.check ? '✓' : '✗';
    console.log(`${status} ${feature.name} - ${feature.description}`);
});

// Performance recommendations
console.log('\n💡 Performance Score:');
console.log('------------------------');
const implementedFeatures = features.filter(f => f.check).length;
const score = Math.round((implementedFeatures / features.length) * 100);

console.log(`Score: ${score}/100`);

if (score === 100) {
    console.log('🌟 Excellent! All performance optimizations are implemented.');
} else if (score >= 80) {
    console.log('✅ Good! Most optimizations are in place.');
} else {
    console.log('⚠️  Consider implementing more performance optimizations.');
}

// Mobile-specific checks
console.log('\n📱 Mobile Optimization Checks:');
console.log('------------------------');

const mobileChecks = [
    {
        name: 'Touch controls',
        check: htmlCode.includes('joystick-container'),
        status: htmlCode.includes('joystick-container') ? '✓' : '✗'
    },
    {
        name: 'Responsive layout',
        check: cssCode.includes('@media'),
        status: cssCode.includes('@media') ? '✓' : '✗'
    },
    {
        name: 'Swipe gestures',
        check: gameCode.includes('touchstart'),
        status: gameCode.includes('touchstart') ? '✓' : '✗'
    },
    {
        name: 'Prevent zoom',
        check: htmlCode.includes('user-scalable=no'),
        status: htmlCode.includes('user-scalable=no') ? '✓' : '✗'
    }
];

mobileChecks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
});

console.log('\n✨ Performance analysis complete!\n');

// Exit successfully
process.exit(0);
