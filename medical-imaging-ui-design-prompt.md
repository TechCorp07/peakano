# Medical Imaging Training Platform - UI/UX Design Prompt

## Instructions for Claude Opus

You are a senior UI/UX designer and frontend developer tasked with redesigning a Medical Imaging Annotation Training Platform. The design should blend the aesthetics of **Webflow** (for the landing page hero section) and **RedBrick AI** (for the application dashboard and annotation tools).

---

## Design Philosophy

### Overall Vision
Create a professional, clinical-grade medical imaging platform that feels:
- **Trustworthy** — Healthcare professionals need to feel confident in the tool
- **Efficient** — Minimize cognitive load for annotation tasks
- **Modern** — Contemporary design that doesn't feel dated
- **Accessible** — Clear contrast, readable typography, intuitive navigation

### Design Inspiration Sources

**Webflow (Landing Page Only)**
- Reference: https://webflow.com
- Use for: Hero section, marketing pages, public-facing content
- Key elements: Bold typography, gradient backgrounds, smooth animations, floating UI mockups, compelling CTAs

**RedBrick AI (Application Interface)**
- Reference: https://redbrickai.com
- Use for: Dashboard, annotation workspace, courses, assessments, all authenticated views
- Key elements: Dark theme, 4-zone layout, PACS-like viewer, minimal chrome, tool-focused design

---

## Color Palette

### Landing Page (Webflow-Inspired)
```css
/* Light, airy, trustworthy medical feel */
--landing-bg-primary: #FFFFFF;
--landing-bg-secondary: #F8FAFC;
--landing-gradient-start: #EEF2FF;    /* Soft indigo */
--landing-gradient-end: #E0F2FE;      /* Soft sky blue */
--landing-text-primary: #0F172A;      /* Slate 900 */
--landing-text-secondary: #64748B;    /* Slate 500 */
--landing-accent: #4F46E5;            /* Indigo 600 */
--landing-accent-hover: #4338CA;      /* Indigo 700 */
--landing-success: #10B981;           /* Emerald 500 */
```

### Application Interface (RedBrick AI-Inspired)
```css
/* Dark, focused, clinical theme */
--app-bg-primary: #0D1117;            /* Deep dark blue-black */
--app-bg-secondary: #161B22;          /* Slightly lighter panels */
--app-bg-elevated: #21262D;           /* Cards, dropdowns, modals */
--app-border: #30363D;                /* Subtle borders */
--app-text-primary: #E6EDF3;          /* High contrast text */
--app-text-secondary: #8B949E;        /* Muted text */
--app-text-muted: #6E7681;            /* Very muted */
--app-accent: #58A6FF;                /* Bright blue for actions */
--app-accent-hover: #79C0FF;          /* Lighter on hover */
--app-success: #3FB950;               /* Green for success */
--app-warning: #D29922;               /* Amber for warnings */
--app-error: #F85149;                 /* Red for errors */
--app-annotation-colors: [            /* For segmentation labels */
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];
```

---

## Typography

### Landing Page
```css
/* Bold, modern, attention-grabbing */
--font-display: 'Inter', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;

/* Sizes */
--text-hero: 4rem;        /* 64px - Main headline */
--text-h1: 3rem;          /* 48px */
--text-h2: 2.25rem;       /* 36px */
--text-h3: 1.5rem;        /* 24px */
--text-body: 1.125rem;    /* 18px */
--text-small: 0.875rem;   /* 14px */

/* Weights */
--font-bold: 700;
--font-semibold: 600;
--font-medium: 500;
--font-regular: 400;
```

### Application Interface
```css
/* Clean, readable, efficient */
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Sizes - Smaller for dense UI */
--text-xl: 1.25rem;       /* 20px - Page titles */
--text-lg: 1rem;          /* 16px - Section headers */
--text-base: 0.875rem;    /* 14px - Default UI text */
--text-sm: 0.75rem;       /* 12px - Labels, metadata */
--text-xs: 0.625rem;      /* 10px - Tiny labels */
```

---

## Page-by-Page Design Specifications

### 1. Landing Page (Webflow-Inspired)

#### Hero Section
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]                            [Features] [Pricing] [Login] [CTA]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ┌──────────────────────┐                         │
│   HEADLINE         │                      │                         │
│   (Bold, 64px)     │   Floating UI        │                         │
│                    │   Mockup with        │                         │
│   Subheadline      │   subtle shadow      │                         │
│   (Muted, 18px)    │   and rotation       │                         │
│                    │                      │                         │
│   [Primary CTA]    │   (Shows annotation  │                         │
│   [Secondary CTA]  │    workspace)        │                         │
│                    └──────────────────────┘                         │
│                                                                      │
│   ~~~~~~~~~~~~ Gradient Background (subtle) ~~~~~~~~~~~~            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Design Elements:**
- **Gradient Background**: Subtle diagonal gradient from soft indigo to sky blue
- **Floating Mockup**: 3D-rotated screenshot of the annotation workspace with:
  - Soft box shadow (0 25px 50px -12px rgba(0, 0, 0, 0.25))
  - Slight rotation (rotateY(-5deg) rotateX(5deg))
  - Glassmorphism effect on the frame
- **Headline**: "Master Medical Image Annotation" or similar
  - Use gradient text effect for emphasis
  - Font weight: 700
- **CTA Buttons**: 
  - Primary: Solid indigo with white text, rounded-full
  - Secondary: Ghost/outline style
- **Smooth Animations**: 
  - Fade-in-up for text (staggered)
  - Fade-in with slight scale for mockup
  - Subtle floating animation on mockup (translateY oscillation)

#### Social Proof Section
```
┌─────────────────────────────────────────────────────────────────────┐
│          "Trusted by medical professionals worldwide"               │
│                                                                      │
│   [Logo 1]   [Logo 2]   [Logo 3]   [Logo 4]   [Logo 5]             │
│                                                                      │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                            │
│   │  60%    │  │  1000+  │  │  50+    │                            │
│   │ Faster  │  │ Images  │  │ Courses │                            │
│   └─────────┘  └─────────┘  └─────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
```

#### Features Section
- Use card-based layout with icons
- Hover effects with subtle lift and shadow
- Three columns on desktop, stack on mobile

---

### 2. Authentication Pages (Transitional Design)

Use a **split-screen layout**:
```
┌───────────────────────────┬────────────────────────────────────────┐
│                           │                                        │
│   Beautiful gradient      │        [Logo]                         │
│   or image background     │                                        │
│   with floating           │        Welcome back                   │
│   testimonial card        │        Sign in to continue            │
│                           │                                        │
│   "RedBrick AI has        │        ┌────────────────────────┐     │
│    transformed our        │        │ Email                  │     │
│    annotation workflow"   │        └────────────────────────┘     │
│    - Dr. Jane Smith       │        ┌────────────────────────┐     │
│                           │        │ Password               │     │
│                           │        └────────────────────────┘     │
│                           │                                        │
│                           │        [Sign In Button]               │
│                           │                                        │
│                           │        Don't have account? Sign up    │
│                           │                                        │
└───────────────────────────┴────────────────────────────────────────┘
```

---

### 3. Dashboard (RedBrick AI-Inspired)

**Layout: Dark theme with clear hierarchy**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Courses  Annotation  Assessments    [User] [⚙️] │  ← Top Navigation
├────────────┬────────────────────────────────────────────────────────┤
│            │                                                        │
│  Quick     │   Welcome back, Emmanuel                              │
│  Actions   │                                                        │
│  ────────  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  📚 Learn  │   │ Courses  │ │Annotations│ │  Score   │ │  Certs   ││  ← Stats Cards
│  🔬 Anno.  │   │    3     │ │    47    │ │   89%    │ │    2     ││
│  📝 Test   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│            │                                                        │
│  Recent    │   Continue Learning                                   │
│  ────────  │   ┌─────────────────────────────────────────────────┐│
│  Case #42  │   │  [Course Card]  [Course Card]  [Course Card]    ││
│  Case #41  │   └─────────────────────────────────────────────────┘│
│  Case #40  │                                                        │
│            │   Recent Annotations                                  │
│            │   ┌─────────────────────────────────────────────────┐│
│            │   │  [Case Preview] [Case Preview] [Case Preview]   ││
│            │   └─────────────────────────────────────────────────┘│
│            │                                                        │
└────────────┴────────────────────────────────────────────────────────┘
```

**Design Elements:**
- **Sidebar**: Collapsible, 240px wide, darker than main content
- **Stats Cards**: 
  - Background: `--app-bg-elevated`
  - Border: 1px solid `--app-border`
  - Subtle glow on hover
  - Icon + Number + Label stack
- **Cards**: Rounded corners (8px), subtle border, hover lift effect
- **Progress Indicators**: Circular or linear progress bars with accent color

---

### 4. Annotation Workspace (RedBrick AI 4-Zone Layout)

**This is the most critical interface — emulate RedBrick AI's professional layout**

#### Overall Layout Structure

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ [←Back] │ Draw▼ │ Smart▼ │ View▼ │ Layout▼ │ Adjust▼ │          [Save] [Submit] [?]  │  ← Top Toolbar
├─────────────────┬─────────────────────────────────────────────────┬───────────────────┤
│                 │                                                 │                   │
│  CASE INFO      │       ┌─────────────┬─────────────┐            │  CONTEXT PANEL    │
│  ────────────   │       │             │             │            │  ─────────────    │
│  📋 Lung CT     │       │   Axial     │  Sagittal   │            │                   │
│     #1042       │       │   View      │   View      │            │  (Dynamic based   │
│                 │       │             │             │            │   on selected     │
│  Patient: J.D.  │       ├─────────────┼─────────────┤            │   tool)           │
│  Study Date:    │       │             │             │            │                   │
│  12/20/2025     │       │  Coronal    │    3D       │            │                   │
│                 │       │   View      │   View      │            │                   │
│  STRUCTURES     │       │             │             │            │                   │
│  ────────────   │       └─────────────┴─────────────┘            │                   │
│                 │                                                 │                   │
│  Labeled:       │       [Slice: 127/256] ○────────●──○           │                   │
│  ● Lung Left    │                                                 │                   │
│  ● Lung Right   │                                                 │                   │
│                 │                                                 │                   │
│  To Label:      │                                                 │                   │
│  ○ Tumor        │                                                 │                   │
│  ○ Airways      │                                                 │                   │
│  ○ Nodules      │                                                 │                   │
│                 │                                                 │                   │
└─────────────────┴─────────────────────────────────────────────────┴───────────────────┘
    Left Sidebar                    Main Canvas (Viewports)            Right Context Panel
    (240px fixed)                   (Flexible, takes remaining)        (280px, collapsible)
```

---

#### Top Toolbar Design (48-56px height)

**Single Row Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  │  Draw ▼  │  Smart ▼  │  View ▼  │  Layout ▼  │  Adjust ▼  │  [💾 Save] [✓ Submit] [?]  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
     ↑                            ↑                                                    ↑
  Back to                  Tool Dropdowns                                      Action Buttons
  case list              (expand on click)                                    (right-aligned)
```

**Dropdown Menus (appear below toolbar when clicked):**
```
       Draw ▼              Smart ▼              View ▼            Layout ▼          Adjust ▼
         │                    │                    │                  │                 │
         ▼                    ▼                    ▼                  ▼                 ▼
    ┌────────┐          ┌─────────┐          ┌─────────┐        ┌─────────┐      ┌──────────┐
    │Freehand│          │Magic    │          │ MPR     │        │ 1×1     │      │ Window/  │
    │Brush   │          │Wand     │          │Crosshair│        │ 1×2     │      │ Level    │
    │Eraser  │          │Region   │          │ Overlay │        │ 2×2     │      │ Opacity  │
    │Polygon │          │Growing  │          │ Zoom    │        │ 2×3     │      │          │
    │        │          │Interpol.│          │ Pan     │        │ 3×3     │      │          │
    └────────┘          └─────────┘          └─────────┘        └─────────┘      └──────────┘
```

**Toolbar Specifications:**
- **Background**: `--app-bg-secondary` (#161B22)
- **Height**: 48-56px
- **Border**: 1px solid `--app-border` at bottom
- **Layout**: Flexbox with `justify-between` (tools left, actions right)
- **All items on single horizontal row**

**Implementation:**
```jsx
<header className="h-14 bg-[#161B22] border-b border-gray-700 flex items-center justify-between px-4">
  {/* Left Section: Back + Tool Dropdowns */}
  <div className="flex items-center gap-1">
    <button className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md">
      <ArrowLeft size={16} />
      <span className="text-sm">Back</span>
    </button>
    
    <div className="w-px h-6 bg-gray-700 mx-2" /> {/* Divider */}
    
    <DropdownMenu label="Draw" icon={Pencil} items={['Freehand', 'Brush', 'Eraser', 'Polygon']} />
    <DropdownMenu label="Smart" icon={Wand2} items={['Magic Wand', 'Region Growing', 'Interpolation']} />
    <DropdownMenu label="View" icon={Eye} items={['MPR', 'Crosshair', 'Overlay', 'Zoom', 'Pan']} />
    <DropdownMenu label="Layout" icon={LayoutGrid} items={['1×1', '1×2', '2×2', '2×3', '3×3']} />
    <DropdownMenu label="Adjust" icon={SlidersHorizontal} items={['Window/Level', 'Opacity']} />
  </div>
  
  {/* Right Section: Save, Submit, Help (all on same row) */}
  <div className="flex items-center gap-2">
    <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md">
      <Save size={16} />
      Save
    </button>
    <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md">
      <Check size={16} />
      Submit
    </button>
    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md" title="Help">
      <HelpCircle size={18} />
    </button>
  </div>
</header>
```

**Dropdown Menu Styling:**
```css
/* Dropdown Trigger */
.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: var(--app-text-secondary);
  font-size: 14px;
  border-radius: 6px;
  transition: all 150ms;
}

.dropdown-trigger:hover {
  color: var(--app-text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-trigger.active {
  color: var(--app-accent);
  background: rgba(88, 166, 255, 0.15);
}

/* Dropdown Panel */
.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  padding: 4px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

/* Dropdown Item */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--app-text-secondary);
  border-radius: 4px;
  cursor: pointer;
}

.dropdown-item:hover {
  color: var(--app-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-item.selected {
  color: var(--app-accent);
  background: rgba(88, 166, 255, 0.1);
}

/* Keyboard shortcut hint */
.dropdown-item .shortcut {
  margin-left: auto;
  font-size: 11px;
  color: var(--app-text-muted);
  font-family: var(--font-mono);
}
```

**Dropdown Items with Shortcuts:**
```
Draw ▼
├── Freehand ........... F
├── Brush .............. B
├── Eraser ............. E
└── Polygon ............ P

Smart ▼
├── Magic Wand ......... W
├── Region Growing ..... G
└── Interpolation ...... I

View ▼
├── MPR ................ M
├── Crosshair .......... C
├── Overlay ............ O
├── Zoom ............... Z
└── Pan ................ Space+Drag

Layout ▼
├── 1×1 ................ 1
├── 1×2 ................ 2
├── 2×2 ................ 3
├── 2×3 ................ 4
└── 3×3 ................ 5

Adjust ▼
├── Window/Level ....... (Context Panel)
└── Opacity ............ (Context Panel)
```

---

#### Left Sidebar Design (240px)

```
┌─────────────────────┐
│                     │
│  CASE INFORMATION   │
│  ─────────────────  │
│                     │
│  📋 Lung CT #1042   │  ← Case identifier (prominent)
│                     │
│  Patient: J. Doe    │  ← Basic metadata
│  Study: 12/20/2025  │
│  Series: 3 of 5     │
│  Modality: CT       │
│                     │
│  ─────────────────  │  ← Divider
│                     │
│  STRUCTURES         │
│  ─────────────────  │
│                     │
│  ✓ Labeled (2)      │  ← Section header with count
│  ┌─────────────────┐│
│  │ ● Lung Left     ││  ← Green dot = completed
│  │ ● Lung Right    ││
│  └─────────────────┘│
│                     │
│  ○ To Label (3)     │  ← Section header with count
│  ┌─────────────────┐│
│  │ ○ Tumor         ││  ← Hollow dot = pending
│  │ ○ Airways       ││
│  │ ○ Nodules       ││
│  └─────────────────┘│
│                     │
│  ─────────────────  │
│                     │
│  ATTRIBUTES         │
│  ─────────────────  │
│                     │
│  Quality: ★★★★☆     │
│                     │
│  Notes:             │
│  ┌─────────────────┐│
│  │ Add notes...    ││
│  └─────────────────┘│
│                     │
└─────────────────────┘
```

**Left Sidebar Specifications:**
- **Width**: 240px (fixed, not collapsible)
- **Background**: `--app-bg-secondary` (#161B22)
- **Border**: 1px solid `--app-border` on right edge
- **Padding**: 16px

**Case Information Section:**
```jsx
<div className="p-4 border-b border-gray-700">
  <div className="flex items-center gap-2 mb-3">
    <FileText size={18} className="text-blue-400" />
    <span className="font-semibold text-white">Lung CT #1042</span>
  </div>
  <div className="space-y-1 text-sm text-gray-400">
    <p>Patient: <span className="text-gray-300">J. Doe</span></p>
    <p>Study: <span className="text-gray-300">12/20/2025</span></p>
    <p>Series: <span className="text-gray-300">3 of 5</span></p>
    <p>Modality: <span className="text-gray-300">CT</span></p>
  </div>
</div>
```

**Structures Section:**
```jsx
<div className="p-4">
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
    Structures
  </h3>
  
  {/* Labeled Structures */}
  <div className="mb-4">
    <div className="flex items-center gap-2 text-sm text-green-400 mb-2">
      <CheckCircle size={14} />
      <span>Labeled (2)</span>
    </div>
    <div className="space-y-1 ml-5">
      <StructureItem label="Lung Left" color="#4ECDC4" completed />
      <StructureItem label="Lung Right" color="#45B7D1" completed />
    </div>
  </div>
  
  {/* To Label Structures */}
  <div>
    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
      <Circle size={14} />
      <span>To Label (3)</span>
    </div>
    <div className="space-y-1 ml-5">
      <StructureItem label="Tumor" color="#FF6B6B" />
      <StructureItem label="Airways" color="#96CEB4" />
      <StructureItem label="Nodules" color="#FFEAA7" />
    </div>
  </div>
</div>
```

**Structure Item Component:**
```jsx
const StructureItem = ({ label, color, completed, active }) => (
  <button className={`
    flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-left
    ${active ? 'bg-blue-500/20 text-white' : 'text-gray-300 hover:bg-white/5'}
  `}>
    <span 
      className={`w-3 h-3 rounded-full ${completed ? '' : 'border-2'}`}
      style={{ 
        backgroundColor: completed ? color : 'transparent',
        borderColor: color 
      }}
    />
    <span>{label}</span>
    {completed && <Check size={12} className="ml-auto text-green-400" />}
  </button>
);
```

---

#### Right Context Panel Design (280px, collapsible)

**The context panel dynamically shows controls based on the currently selected tool.**

```
┌───────────────────────┐
│  CONTEXT PANEL    [×] │  ← Collapse button
│  ───────────────────  │
│                       │
│  {Dynamic Content     │
│   Based on Selected   │
│   Tool}               │
│                       │
└───────────────────────┘
```

**Context Panel States:**

**State 1: Brush Tool Selected**
```
┌───────────────────────┐
│  🖌️ Brush Settings [×]│
│  ───────────────────  │
│                       │
│  Size                 │
│  ○──────────●───○     │
│  8    [24px]    64    │
│                       │
│  Opacity              │
│  ○────────●─────○     │
│  0%   [75%]    100%   │
│                       │
│  Shape                │
│  [● Circle] [○ Square]│
│                       │
│  ─────────────────    │
│                       │
│  Quick Sizes          │
│  [S] [M] [L] [XL]     │
│                       │
│  ─────────────────    │
│                       │
│  Keyboard Hints       │
│  [ + ] Increase size  │
│  [ - ] Decrease size  │
│  [Shift] Straight line│
│                       │
└───────────────────────┘
```

**State 2: Window/Level Selected (from Adjust menu)**
```
┌───────────────────────┐
│  🌗 Window/Level  [×] │
│  ───────────────────  │
│                       │
│  Window Width         │
│  ○────────●─────○     │
│  1    [1500]    4000  │
│                       │
│  Window Level         │
│  ○──────●───────○     │
│  -1000 [-600]  +1000  │
│                       │
│  ─────────────────    │
│                       │
│  Presets              │
│  ┌─────────────────┐  │
│  │ 🫁 Lung         │  │
│  │ 🦴 Bone         │  │
│  │ 🧠 Brain        │  │
│  │ 🫀 Soft Tissue  │  │
│  │ 💉 Contrast     │  │
│  └─────────────────┘  │
│                       │
│  [Reset to Default]   │
│                       │
└───────────────────────┘
```

**State 3: Magic Wand Selected**
```
┌───────────────────────┐
│  🪄 Magic Wand    [×] │
│  ───────────────────  │
│                       │
│  Threshold            │
│  ○────────●─────○     │
│  0    [50]     255    │
│                       │
│  Tolerance            │
│  ○──────●───────○     │
│  1    [15]      50    │
│                       │
│  Mode                 │
│  [● Single] [○ Add]   │
│  [○ Subtract]         │
│                       │
│  ─────────────────    │
│                       │
│  Options              │
│  ☑ Contiguous only    │
│  ☐ Apply to all slices│
│                       │
└───────────────────────┘
```

**State 4: Region Growing Selected**
```
┌───────────────────────┐
│  🌱 Region Growing [×]│
│  ───────────────────  │
│                       │
│  Seed Point           │
│  Click on image to    │
│  place seed point     │
│                       │
│  Current: (128, 256)  │
│                       │
│  ─────────────────    │
│                       │
│  Threshold Range      │
│  Lower: [-150]        │
│  Upper: [150]         │
│                       │
│  ─────────────────    │
│                       │
│  Options              │
│  ☑ 3D Growing         │
│  ☐ Show preview       │
│                       │
│  [Apply] [Clear Seed] │
│                       │
└───────────────────────┘
```

**State 5: Interpolation Selected**
```
┌───────────────────────┐
│  📐 Interpolation [×] │
│  ───────────────────  │
│                       │
│  Interpolate between  │
│  annotated slices     │
│                       │
│  Start Slice: [42]    │
│  End Slice: [78]      │
│                       │
│  Method               │
│  [● Linear]           │
│  [○ Shape-based]      │
│  [○ B-spline]         │
│                       │
│  ─────────────────    │
│                       │
│  Preview              │
│  [Show Preview]       │
│                       │
│  [Apply Interpolation]│
│                       │
└───────────────────────┘
```

**State 6: Layout Selected**
```
┌───────────────────────┐
│  📐 Layout        [×] │
│  ───────────────────  │
│                       │
│  Grid Configuration   │
│                       │
│  ┌───┐ ┌─┬─┐ ┌─┬─┐   │
│  │1×1│ │1│2│ │ │ │   │
│  └───┘ └─┴─┘ ├─┼─┤   │
│              │ │ │   │
│  Current     └─┴─┘   │
│              2×2     │
│                       │
│  ─────────────────    │
│                       │
│  Viewport Assignment  │
│  ┌─────────────────┐  │
│  │ V1: Axial    ▼  │  │
│  │ V2: Sagittal ▼  │  │
│  │ V3: Coronal  ▼  │  │
│  │ V4: 3D       ▼  │  │
│  └─────────────────┘  │
│                       │
│  [Reset Layout]       │
│                       │
└───────────────────────┘
```

**State 7: No Tool Selected (Default)**
```
┌───────────────────────┐
│  ℹ️ Information   [×] │
│  ───────────────────  │
│                       │
│  Select a tool from   │
│  the toolbar to see   │
│  its settings here.   │
│                       │
│  ─────────────────    │
│                       │
│  Quick Actions        │
│  [🔄 Reset View]      │
│  [📏 Toggle Ruler]    │
│  [🎯 Center Image]    │
│                       │
│  ─────────────────    │
│                       │
│  Current View Info    │
│  Slice: 127/256       │
│  Zoom: 100%           │
│  W/L: 1500/-600       │
│                       │
└───────────────────────┘
```

**Context Panel Implementation:**
```jsx
const ContextPanel = ({ activeTool, isCollapsed, onCollapse }) => {
  return (
    <aside className={`
      h-full bg-[#161B22] border-l border-gray-700
      transition-all duration-200
      ${isCollapsed ? 'w-0 overflow-hidden' : 'w-[280px]'}
    `}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            {getToolIcon(activeTool)}
            {getToolLabel(activeTool)}
          </h2>
          <button 
            onClick={onCollapse}
            className="p-1 text-gray-400 hover:text-white rounded"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Dynamic Content */}
        {activeTool === 'brush' && <BrushSettings />}
        {activeTool === 'window-level' && <WindowLevelSettings />}
        {activeTool === 'magic-wand' && <MagicWandSettings />}
        {activeTool === 'region-growing' && <RegionGrowingSettings />}
        {activeTool === 'interpolation' && <InterpolationSettings />}
        {activeTool === 'layout' && <LayoutSettings />}
        {!activeTool && <DefaultInfo />}
      </div>
    </aside>
  );
};
```

---

#### Main Canvas (Flexible Width)

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│     ┌─────────────────────┬─────────────────────┐            │
│     │ Axial           [▼] │ Sagittal        [▼] │            │
│     │                     │                     │            │
│     │                     │                     │            │
│     │    (DICOM IMAGE)    │    (DICOM IMAGE)    │            │
│     │                     │                     │            │
│     │                     │                     │            │
│     │              S: 127 │              S: 256 │            │
│     ├─────────────────────┼─────────────────────┤            │
│     │ Coronal         [▼] │ 3D Volume       [▼] │            │
│     │                     │                     │            │
│     │                     │                     │            │
│     │    (DICOM IMAGE)    │    (3D RENDER)      │            │
│     │                     │                     │            │
│     │                     │                     │            │
│     │              S: 128 │              [🔄]   │            │
│     └─────────────────────┴─────────────────────┘            │
│                                                               │
│     ◀ ○───────────────────●─────────────────────○ ▶         │
│       1                  127                   256            │
│                     Slice Navigator                           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Canvas Specifications:**
- **Background**: Pure black `#000000`
- **Viewport grid**: Configurable 1×1 to 3×3
- **Each viewport has**:
  - View type dropdown (top-left)
  - Slice indicator (bottom-right)
  - Hover controls for viewport-specific actions
- **Slice navigator**: Below viewport grid

---

#### Interaction Design

**Keyboard Shortcuts (Discoverable via toolbar dropdown hints):**
| Key | Action |
|-----|--------|
| `B` | Brush tool |
| `F` | Freehand tool |
| `E` | Eraser |
| `P` | Polygon |
| `W` | Magic Wand |
| `G` | Region Growing |
| `I` | Interpolation |
| `M` | Toggle MPR |
| `C` | Toggle Crosshairs |
| `O` | Toggle Overlay |
| `Z` | Zoom mode |
| `Space+Drag` | Pan |
| `1-5` | Layout presets |
| `Ctrl+S` | Save |
| `Ctrl+Enter` | Submit |
| `+/-` | Brush size |
| `[/]` | Opacity |
| `↑/↓` | Previous/Next slice |
| `Scroll` | Navigate slices |
| `?` | Show help |

**Mouse Interactions:**
- **Left Click + Drag**: Apply active tool
- **Right Click**: Context menu
- **Scroll Wheel**: Navigate slices
- **Ctrl + Scroll**: Zoom
- **Middle Click + Drag**: Pan
- **Shift + Drag**: Constrain to straight line (for brush)

---

### 5. Course Viewer (RedBrick AI-Inspired)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [←Courses] Lung CT Annotation Basics          [Progress: 45%]       │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  Modules     │   ┌──────────────────────────────────────────────┐  │
│  ──────────  │   │                                              │  │
│  ✓ Intro     │   │                                              │  │
│  ✓ Anatomy   │   │         VIDEO / CONTENT AREA                 │  │
│  ● Windowing │   │                                              │  │
│  ○ Tools     │   │                                              │  │
│  ○ Practice  │   │                                              │  │
│  ○ Quiz      │   └──────────────────────────────────────────────┘  │
│              │                                                      │
│              │   Lesson 3: Window/Level Adjustment                 │
│              │   ─────────────────────────────────────             │
│              │                                                      │
│              │   Understanding window and level settings is        │
│              │   crucial for proper visualization of CT images...  │
│              │                                                      │
│              │   [Previous]                      [Mark Complete →] │
│              │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Buttons

```jsx
// Primary Button (Landing)
<button className="
  px-6 py-3 
  bg-indigo-600 hover:bg-indigo-700 
  text-white font-semibold 
  rounded-full 
  shadow-lg shadow-indigo-500/25
  transition-all duration-200
  hover:scale-105
">
  Get Started
</button>

// Primary Button (App)
<button className="
  px-4 py-2 
  bg-blue-600 hover:bg-blue-500 
  text-white text-sm font-medium 
  rounded-md 
  transition-colors
">
  Submit
</button>

// Ghost Button (App)
<button className="
  px-4 py-2 
  text-gray-300 hover:text-white 
  hover:bg-white/10 
  text-sm font-medium 
  rounded-md 
  transition-colors
">
  Cancel
</button>
```

### Cards

```jsx
// Landing Page Card
<div className="
  p-6 
  bg-white 
  rounded-2xl 
  border border-gray-100 
  shadow-sm 
  hover:shadow-lg 
  hover:-translate-y-1 
  transition-all duration-300
">
  {/* Card content */}
</div>

// App Dashboard Card
<div className="
  p-4 
  bg-[#21262D] 
  rounded-lg 
  border border-[#30363D] 
  hover:border-[#58A6FF]/50 
  transition-colors
">
  {/* Card content */}
</div>
```

### Form Inputs

```jsx
// Landing Page Input
<input className="
  w-full px-4 py-3 
  bg-white 
  border border-gray-200 
  rounded-lg 
  text-gray-900 
  placeholder-gray-400
  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
  transition-shadow
" />

// App Interface Input
<input className="
  w-full px-3 py-2 
  bg-[#0D1117] 
  border border-[#30363D] 
  rounded-md 
  text-gray-100 text-sm
  placeholder-gray-500
  focus:ring-1 focus:ring-[#58A6FF] focus:border-[#58A6FF]
  transition-colors
" />
```

---

## Animation Specifications

### Landing Page Animations

```css
/* Hero text fade-in-up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Floating mockup */
@keyframes float {
  0%, 100% { transform: translateY(0) rotateY(-5deg) rotateX(5deg); }
  50% { transform: translateY(-10px) rotateY(-5deg) rotateX(5deg); }
}

/* Gradient shift */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### App Interface Animations

```css
/* Keep animations subtle and fast in the app */
/* 150-200ms transitions max */

/* Sidebar collapse */
.sidebar-collapsed {
  width: 64px;
  transition: width 200ms ease;
}

/* Tool selection */
.tool-active {
  background: rgba(88, 166, 255, 0.15);
  border-left: 2px solid #58A6FF;
}

/* Loading states */
@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large monitors */
```

**Landing Page**: Fully responsive, stack on mobile
**App Interface**: Minimum supported width 1024px (show message on smaller screens that annotation tools require a larger display)

---

## Accessibility Requirements

1. **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI elements
2. **Focus States**: Visible focus rings on all interactive elements
3. **Keyboard Navigation**: Full keyboard support in annotation workspace
4. **Screen Reader**: ARIA labels for all tools and regions
5. **Reduced Motion**: Respect `prefers-reduced-motion` media query

---

## Implementation Notes

### Tech Stack
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with custom theme
- **Components**: shadcn/ui as base, heavily customized
- **Icons**: Lucide React
- **Animations**: Framer Motion for complex animations, CSS for simple ones
- **Medical Imaging**: Cornerstone3D for DICOM rendering

### CSS Custom Properties Setup

```css
:root {
  /* Landing page theme */
  --landing-primary: theme('colors.indigo.600');
  /* ... etc */
}

[data-theme="app"] {
  /* App dark theme */
  --background: #0D1117;
  --foreground: #E6EDF3;
  /* ... etc */
}
```

### Key Files to Create/Modify

1. `tailwind.config.ts` - Extend with custom colors and spacing
2. `src/app/globals.css` - CSS variables and base styles
3. `src/components/ui/*` - Customize shadcn components
4. `src/components/layout/AppLayout.tsx` - 4-zone annotation layout
5. `src/components/medical/DicomViewer/*` - Medical imaging components

---

## Summary Checklist

- [ ] Landing hero with Webflow-style gradient and floating mockup
- [ ] Dark theme for all authenticated views
- [ ] 4-zone annotation workspace layout
- [ ] Collapsible sidebars with tool organization
- [ ] Viewport grid system for medical images
- [ ] Context-sensitive right panel
- [ ] Consistent button and card styles
- [ ] Smooth but subtle animations
- [ ] Full keyboard shortcut support
- [ ] Responsive down to 1024px for app, fully responsive for landing

---

## Reference Links

- **RedBrick AI**: https://redbrickai.com (for annotation interface inspiration)
- **RedBrick Docs**: https://docs.redbrickai.com (for UI patterns)
- **Webflow**: https://webflow.com (for landing page inspiration)

---

*This prompt should be used when asking Claude Opus to generate specific component code, page layouts, or styling decisions for the Medical Imaging Training Platform.*
