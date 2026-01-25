// src/theme/theme.ts

export const theme = {
  colors: {
    background: '#FFFFFF',      // Pure White
    text: '#000000',            // Stark Black
    textSecondary: '#666666',   // Dark Grey for supporting text
    border: '#E5E5E5',          // Very light grey for dividers
    error: '#D32F2F',           // Classic red
    success: '#00C851',
  },
  spacing: {
    s: 12,
    m: 24, // Generous spacing
    l: 48,
    xl: 64,
  },
  typography: {
    // Large, bold, editorial headers
    header: {
      fontSize: 32,
      fontWeight: '900',
      textTransform: 'uppercase', 
      letterSpacing: 1, 
      color: '#000000',
    },
    // Used for button text and tabs
    button: {
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    // Clean, readable body text
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: '#000000',
    }
  },
  borderRadius: {
    none: 0, // Sharp corners (Zara style)
    s: 4,
  }
};