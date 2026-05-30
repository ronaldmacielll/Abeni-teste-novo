#!/usr/bin/env node

/**
 * Coverage Check Script
 * 
 * This script checks if test coverage meets the required thresholds:
 * - Services (lib/services, lib/jobs): 80%
 * - Components (modules, app): 70%
 * - Global: 70%
 * 
 * Usage: node scripts/check-coverage.js
 */

const fs = require('fs')
const path = require('path')

const COVERAGE_FILE = path.join(__dirname, '../coverage/coverage-summary.json')

const THRESHOLDS = {
  global: {
    lines: 70,
    statements: 70,
    functions: 70,
    branches: 70,
  },
  services: {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 80,
  },
  components: {
    lines: 70,
    statements: 70,
    functions: 70,
    branches: 70,
  },
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`
}

function checkThreshold(actual, threshold, metric) {
  if (actual >= threshold) {
    return `✅ ${metric}: ${formatPercent(actual)} (threshold: ${threshold}%)`
  } else {
    return `❌ ${metric}: ${formatPercent(actual)} (threshold: ${threshold}%)`
  }
}

function main() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error('❌ Coverage file not found. Run "npm run test:coverage" first.')
    process.exit(1)
  }

  const coverage = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'))
  const global = coverage.total

  console.log('\n📊 Test Coverage Report\n')
  console.log('=' .repeat(60))

  // Global coverage
  console.log('\n🌍 Global Coverage (70% threshold):')
  console.log('-'.repeat(60))
  let globalPassed = true
  for (const [metric, threshold] of Object.entries(THRESHOLDS.global)) {
    const actual = global[metric].pct
    console.log(checkThreshold(actual, threshold, metric))
    if (actual < threshold) globalPassed = false
  }

  // Services coverage
  console.log('\n🔧 Services Coverage (80% threshold):')
  console.log('-'.repeat(60))
  let servicesPassed = true
  for (const [metric, threshold] of Object.entries(THRESHOLDS.services)) {
    const actual = global[metric].pct
    console.log(checkThreshold(actual, threshold, metric))
    if (actual < threshold) servicesPassed = false
  }

  // Components coverage
  console.log('\n🎨 Components Coverage (70% threshold):')
  console.log('-'.repeat(60))
  let componentsPassed = true
  for (const [metric, threshold] of Object.entries(THRESHOLDS.components)) {
    const actual = global[metric].pct
    console.log(checkThreshold(actual, threshold, metric))
    if (actual < threshold) componentsPassed = false
  }

  console.log('\n' + '='.repeat(60))

  // Summary
  console.log('\n📋 Summary:')
  console.log(`  Global: ${globalPassed ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Services: ${servicesPassed ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Components: ${componentsPassed ? '✅ PASS' : '❌ FAIL'}`)

  // Detailed file coverage
  console.log('\n📁 File Coverage Details:')
  console.log('-'.repeat(60))
  
  const files = Object.entries(coverage)
    .filter(([key]) => key !== 'total')
    .sort(([a], [b]) => a.localeCompare(b))

  for (const [file, fileCoverage] of files) {
    const lines = fileCoverage.lines.pct
    const status = lines >= 80 ? '✅' : lines >= 70 ? '⚠️' : '❌'
    console.log(`${status} ${file}: ${formatPercent(lines)}`)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Exit code
  if (globalPassed && servicesPassed && componentsPassed) {
    console.log('✅ All coverage thresholds met!\n')
    process.exit(0)
  } else {
    console.log('❌ Some coverage thresholds not met.\n')
    console.log('To improve coverage:')
    console.log('  1. Run: npm run test:coverage')
    console.log('  2. Open: coverage/index.html')
    console.log('  3. Add tests for uncovered code (red lines)\n')
    process.exit(1)
  }
}

main()
