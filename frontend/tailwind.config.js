/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
            "login-primary": "#144bb8",
            "background-light": "#f3f4f6",
            "background-dark": "#111621",
            "surface-light": "#ffffff",
            "surface-dark": "#1e2532",
            "primary-dark": "#0f3a91",
            "card-light": "#ffffff",
            "card-dark": "#1e2430",
            "text-main-light": "#0e121b",
            "text-main-dark": "#ffffff",
            "text-secondary-light": "#4e6797",
            "text-secondary-dark": "#94a3b8",
            "border-light": "#e7ebf3",
            "border-dark": "#2e3645",
            "text-light": "#0e121b",
            "text-dark": "#f8f9fc",
            "muted-light": "#4e6797",
            "muted-dark": "#94a3b8",
            error: "#ac3434",
            "surface-container-high": "#e3e7ff",
            secondary: "#742fe5",
            "primary-container": "#acbfff",
            "on-secondary-fixed": "#5100b3",
            "on-tertiary-fixed-variant": "#00644c",
            "on-secondary-fixed-variant": "#702ae1",
            surface: "#faf8ff",
            "surface-container": "#ebedff",
            "inverse-primary": "#618bff",
            "tertiary-dim": "#005f48",
            "on-error-container": "#65000b",
            "outline-variant": "#a4b1de",
            "on-surface-variant": "#515e86",
            "secondary-container": "#eaddff",
            "inverse-on-surface": "#969cb5",
            "inverse-surface": "#070d20",
            "on-background": "#243156",
            "on-error": "#fff7f6",
            "tertiary-fixed-dim": "#6ee4bb",
            "error-dim": "#70030f",
            "surface-container-low": "#f2f3ff",
            "on-primary-fixed": "#002265",
            "on-primary": "#faf8ff",
            "surface-container-lowest": "#ffffff",
            "on-tertiary": "#e5fff2",
            "primary-fixed-dim": "#98b1ff",
            "on-tertiary-fixed": "#004533",
            "surface-tint": "#0053dc",
            background: "#faf8ff",
            "secondary-dim": "#681ad9",
            "on-secondary-container": "#6617d7",
            "on-primary-fixed-variant": "#003ca5",
            "on-surface": "#243156",
            "on-primary-container": "#003592",
            primary: "#0053dc",
            "secondary-fixed": "#eaddff",
            tertiary: "#006c52",
            "on-tertiary-container": "#005a43",
            "primary-dim": "#0049c2",
            "on-secondary": "#fdf7ff",
            "surface-container-highest": "#dbe1ff",
            "secondary-fixed-dim": "#deccff",
            "surface-bright": "#faf8ff",
            "error-container": "#f56965",
            "primary-fixed": "#acbfff",
            outline: "#6d79a4",
            "tertiary-fixed": "#7df2c9",
            "surface-dim": "#cfd9ff",
            "surface-variant": "#dbe1ff",
            "tertiary-container": "#7df2c9",
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
            DEFAULT: "1rem",
            xl: "3rem",
            full: "9999px",
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
        fontFamily: {
            "display": ["Inter", "sans-serif"],
            headline: ["Manrope"],
            body: ["Inter"],
            label: ["Inter"],
        },
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
