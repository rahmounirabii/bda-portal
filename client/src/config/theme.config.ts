/**
 * BDA Portal Theme Configuration
 * Corporate color palette based on BDA logo
 */

export const bdaTheme = {
  // Primary colors from BDA logo
  colors: {
    primary: {
      // Sky Blue (B letter)
      sky: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#1E9BF5', // Main sky blue from logo
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      // Royal Blue (D letter)
      royal: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2C5282', // Main royal blue from logo
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      // Navy Blue (A letter)
      navy: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1E3A5F', // Main navy from logo
        900: '#0f172a',
      },
    },
    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#1E9BF5',
  },

  // Gradients
  gradients: {
    primary: 'from-[#1E9BF5] via-[#2C5282] to-[#1E3A5F]', // Sky -> Royal -> Navy
    skyToRoyal: 'from-[#1E9BF5] to-[#2C5282]',
    royalToNavy: 'from-[#2C5282] to-[#1E3A5F]',
    skyToNavy: 'from-[#1E9BF5] to-[#1E3A5F]',
  },

  // Typography
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },

  // Spacing & Layout
  spacing: {
    headerHeight: '64px',
    sidebarWidth: '256px',
  },
};

// Helper function to get gradient classes
export const getBdaGradient = (variant: keyof typeof bdaTheme.gradients = 'primary') => {
  return `bg-gradient-to-r ${bdaTheme.gradients[variant]}`;
};

// Helper function for button variants
export const getBdaButtonClass = (variant: 'sky' | 'royal' | 'navy' = 'royal') => {
  const variantClasses = {
    sky: 'bg-[#1E9BF5] hover:bg-[#0284c7] text-white',
    royal: 'bg-[#2C5282] hover:bg-[#1e40af] text-white',
    navy: 'bg-[#1E3A5F] hover:bg-[#0f172a] text-white',
  };
  return variantClasses[variant];
};

export default bdaTheme;
