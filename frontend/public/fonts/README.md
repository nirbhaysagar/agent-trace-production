# Fonts Directory

This directory contains the custom fonts used in AgentTrace.

## Required Fonts

### Bricolage Grotesque Variable Font
- **File**: `BricolageGrotesque-Variable.ttf`
- **Type**: Variable font (weight range: 200-800)
- **Usage**: Primary font for hero section, headlines, and main content
- **CSS Classes**: 
  - `.bricolage-grotesque-hero` (weight: 600)
  - `.bricolage-grotesque-subtitle` (weight: 400)
  - `.bricolage-grotesque-light` (weight: 300)

### Parkinsans Variable Font
- **File**: `Parkinsans-Variable.ttf`
- **Type**: Variable font (weight range: 300-800)
- **Usage**: Secondary font for specific elements
- **CSS Class**: `font-parkinsans`

## Installation Instructions

1. Download the Bricolage Grotesque Variable font file
2. Place it in this directory as `BricolageGrotesque-Variable.ttf`
3. Download the Parkinsans Variable font file
4. Place it in this directory as `Parkinsans-Variable.ttf`
5. The fonts will be automatically loaded via CSS `@font-face` declarations

## Font Loading

The fonts are configured in:
- `src/styles/globals.css` - Font face declarations
- `tailwind.config.js` - Font family configuration
- Used with CSS classes in components

## Fallback Fonts

If the custom fonts are not available, the system will fallback to:
1. Inter
2. system-ui
3. sans-serif

