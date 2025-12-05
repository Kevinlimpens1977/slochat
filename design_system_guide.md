# DaCapo Emerald UI — Enterprise Design System (v3)
Versie: 3.0  
Auteur: Kevin + ChatGPT  
Doel: Eén consistente UI voor *alle* DaCapo tools

---

# 0. PRINCIPES
- Rustig, modern, schaalbaar  
- Emerald-first kleuren  
- Zachte gradients  
- Pill-shaped knoppen  
- Transparante glass-panels  
- Geen harde zwarttinten, altijd `gray-900`  
- Alles responsive-first  
- Alles component-driven  

---

# 1. TAILWIND CONFIG (VOLLEDIG)
```js
export default {
  theme: {
    extend: {
      colors: {
        accent: '#95C11F',
        emerald: {
          50:'#ECFDF5',100:'#D1FAE5',200:'#A7F3D0',
          300:'#6EE7B7',400:'#34D399',500:'#10B981',
          600:'#059669',700:'#047857',800:'#065F46',900:'#064E3B',
        },
        gray: {
          50:'#F9FAFB',100:'#F3F4F6',200:'#E5E7EB',300:'#D1D5DB',
          400:'#9CA3AF',500:'#6B7280',600:'#4B5563',700:'#374151',
          800:'#1F2937',900:'#111827'
        }
      },
      fontFamily:{ sans:['Inter'], display:['Inter'] },
      borderRadius:{ '2xl':'1rem', full:'9999px' },
      boxShadow:{ soft:'0 8px 24px rgba(0,0,0,0.06)' }
    },
  },
};
```

---

# 2. GLOBAL CSS

```css
@layer components {

  .app-header {
    @apply fixed top-0 left-0 w-full z-50 
    bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-soft;
  }

  .emerald-container {
    @apply bg-gradient-to-br from-emerald-50 to-green-50
    border-2 border-emerald-200 rounded-2xl p-6 shadow-sm;
  }

  .glass-panel {
    @apply bg-white/80 backdrop-blur-md border border-emerald-200 
    rounded-2xl transition-all duration-200 shadow-soft;
  }
  .glass-panel:hover { @apply bg-white/90 border-emerald-300; }

  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-full
    px-4 h-10 bg-white text-gray-800 border border-emerald-200
    whitespace-nowrap font-medium text-sm transition-all duration-200;
  }
  .btn:hover { @apply bg-emerald-50 border-emerald-300; transform:translateY(-1px); }

  .btn-primary {
    @apply bg-emerald-600 text-white border-emerald-600;
  }
  .btn-primary:hover { @apply bg-emerald-700; }

  .input {
    @apply w-full px-3 h-10 rounded-2xl bg-white border-2 border-emerald-200
    focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400;
  }
}

body {
  @apply bg-gradient-to-b from-[#f2f3f5] to-[#e8e8ea]
  bg-fixed text-gray-900 antialiased;
}
```

---

# 3. UI COMPONENTEN → STANDAARDSTRUCTUUR

## Button
```jsx
export function Button({children,...props}) {
  return <button className="btn" {...props}>{children}</button>;
}
```

## PrimaryButton
```jsx
export function PrimaryButton({children,...props}) {
  return <button className="btn-primary" {...props}>{children}</button>;
}
```

## EmeraldContainer
```jsx
export function EmeraldContainer({children}) {
  return <div className="emerald-container">{children}</div>;
}
```

## Card
```jsx
export function Card({children}) {
  return <div className="glass-panel p-6">{children}</div>;
}
```

## PageHeader
```jsx
export function PageHeader({icon:Icon,title,subtitle}) {
  return (
    <div className="emerald-container mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 shadow-lg">
          <Icon size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-semibold">{title}</h1>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
```

---

# 4. NAVIGATION BAR (STICKY)

```jsx
export function AdminNav() {
  const items = [
    {label:'Jarigen', href:'/jarigen', icon:Calendar},
    {label:'Woord v/d Dag', href:'/woord', icon:BookOpen},
    {label:'Nieuwsbrief Personeel', href:'/personeel', icon:Users},
    {label:'Nieuwsbrief Ouders', href:'/ouders', icon:Users2},
  ];

  return (
    <div className="emerald-container sticky top-20 z-40 mb-6">
      <div className="flex flex-wrap gap-3">
        {items.map(i=>(
          <Link key={i.label} href={i.href} className="btn">
            <i.icon size={18} className="text-emerald-600"/> {i.label}
          </Link>
        ))}
        <button className="btn-primary"><LogOut size={18}/> Uitloggen</button>
      </div>
    </div>
  );
}
```

---

# 5. KLEURENPALET
- **Emerald Light:** #ECFDF5  
- **Emerald Medium:** #10B981  
- **Emerald Dark:** #047857  
- **Accent Groen:** #95C11F  
- **Grijs (typografie):** gray-900, gray-700, gray-600  

---

# 6. TYPOGRAFIE
- Headers → `font-display text-gray-900`
- Body → `text-gray-700`
- Labels → `text-[11px] uppercase tracking-wide font-bold text-emerald-700`

---

# 7. ICONEN
Lucide React  
- Headers: 28px  
- Buttons: 18px  
- strokeWidth: 2  

---

# 8. RESPONSIVE REGELS
- Desktop: navigatie nooit op 2 regels  
- Mobile: navigatie mag wrappen  
- Cards: desktop 2–3 kolommen, mobiel 1 kolom  

---

# 9. STRUCTUUR DIE ALLE PROJECTEN MOET GEBRUIKEN
```
/components
  /ui
    Button.jsx
    PrimaryButton.jsx
    Card.jsx
    EmeraldContainer.jsx
    PageHeader.jsx
    AdminNav.jsx

/styles
  globals.css
  design-system.md

/layout
  AppHeader.jsx
  PageLayout.jsx
```

---

# 10. INSTALLATIE – IN NIEUW PROJECT
```
npx create-next-app myapp
npm install lucide-react tailwindcss
cp -r components/ui ./src/components/ui
cp styles/globals.css ./src/app/globals.css
cp design-system.md .
```

---

# EINDE DESIGN SYSTEM V3
