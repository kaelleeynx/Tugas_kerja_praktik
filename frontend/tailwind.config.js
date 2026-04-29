/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ─── Industrial Premium Design Tokens ──────────────────────────────
      colors: {
        // Brand — Safety Orange
        brand: {
          DEFAULT: "var(--brand)",
          hover:   "var(--brand-hover)",
          muted:   "var(--brand-muted)",
        },

        // App surfaces
        app:     "var(--bg-app)",
        surface: "var(--bg-surface)",

        // Text
        "text-main":  "var(--text-main)",
        "text-muted": "var(--text-muted)",

        // Border
        "border-subtle": "var(--border-subtle)",

        // Status
        success: "var(--status-success)",
        warning: "var(--status-warning)",
        danger:  "var(--status-danger)",
        info:    "var(--status-info)",

        // ─── Shadcn/UI tokens (keep for compatibility) ──────────────────
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      // ─── Typography ────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },

      // ─── Industrial Border Radius ──────────────────────────────────────
      borderRadius: {
        // Industrial — tegas, bukan bubbly
        'industrial-sm':   'var(--radius-sm)',      // 2px — checkbox, tag kecil
        'industrial':      'var(--radius-default)', // 4px — input, button
        'industrial-card': 'var(--radius-card)',    // 6px — card, modal
        'industrial-lg':   'var(--radius-modal)',   // 8px — modal besar

        // Shadcn compat
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ─── Box Shadows ───────────────────────────────────────────────────
      boxShadow: {
        'industrial':      'var(--shadow-card)',
        'industrial-lg':   'var(--shadow-elevated)',
      },

      // ─── Animations (shadcn compat) ────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
