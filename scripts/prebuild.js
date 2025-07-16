#!/usr/bin/env node

// Pre-build script to ensure clean dependency resolution
const fs = require('fs');
const path = require('path');

console.log('🔧 Running pre-build checks...');

// Check if problematic packages exist in node_modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const problematicPackages = [
    '',
    '@op-engineering/op-sqlite'
];

problematicPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
        console.log(`⚠️  Found problematic package: ${pkg}`);
        console.log(`   Removing: ${pkgPath}`);
        fs.rmSync(pkgPath, { recursive: true, force: true });
    }
});

console.log('✅ Pre-build checks completed');