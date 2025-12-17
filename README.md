# 돼지 키우는 중입니다 (Pig Idle)

[cloudflarebutton]

## Overview

**Pig Idle** is a mobile-optimized, single-page idle RPG web game built with vanilla HTML/CSS/JS principles but powered by modern React tooling. Players raise a pig character, engage in automatic combat against enemies across progressive stages, earn gold for upgrades, and unlock cosmetic skins. The game persists progress via localStorage and features hidden depth through an admin mode (nickname: "admin") and a sophisticated easter egg system.

Key highlights:
- **Idle Core Loop**: Auto-combat every second, automatic stage progression, offline rewards.
- **Progression**: Upgrade attack power, change pig skins, advance through endless stages.
- **Secrets**: Admin panel for state manipulation, nickname/action/condition-based easter eggs unlocking hidden stages and skins.
- **Polish**: Kid-playful UI with chunky buttons, vibrant colors, smooth animations, and mobile-first responsive design.

## Features

- **Nickname System**: Set/change nickname (localStorage saved). "admin" unlocks hidden controls.
- **Admin Mode**: Gold/attack/stage editing, stage jumps (with validation).
- **Auto-Combat**: 1s intervals deal damage; defeat enemies for gold/stage ups.
- **Upgrades & Skins**: Spend gold on attack boosts; select from basic/muscular/demon/golden pigs + secret unlocks.
- **Easter Eggs**: 
  - Nickname triggers (e.g., "piggod" → massive gold; "dev" → golden pig).
  - Action patterns (e.g., rapid clicks → achievements).
  - Conditions (e.g., attack=777 → visual effects).
  - Secrets: Pig God, Error Pig, Bloodtear Pig skins; hidden stages like Bug Grassland, God's Farm.
- **Persistence**: Full state saved (nickname, gold, attack, level, stage, skins, unlocks, last login).
- **Visuals**: Playful aesthetic with CSS animations, damage popups, shake effects, glows.
- **Mobile-Optimized**: Vertical layout, touch-friendly buttons (44px+ targets), viewport units.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite (build tool)
- **Styling**: Tailwind CSS 3, shadcn/ui components, Framer Motion (animations), Lucide React (icons)
- **State/UI**: React Hook Form, Zod (validation), Sonner (toasts), React Router
- **Data/UI**: TanStack Query (caching), Recharts (if needed), Headless UI/Radix primitives
- **Deployment**: Cloudflare Pages/Workers, Wrangler CLI
- **Dev Tools**: Bun (package manager), ESLint, Prettier
- **Other**: Immer (immutable updates), UUID, clsx, tw-merge

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) installed (recommended package manager)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) for deployment (auto-installed via bun)

### Installation
```bash
git clone <your-repo-url>
cd pig-idle-game
bun install
```

### Local Development
```bash
bun dev
```
Opens at `http://localhost:3000` (or `${PORT}` env var). Supports hot reload.

### Build for Production
```bash
bun build
```
Outputs to `dist/`.

## Usage

- **Play**: Enter nickname → Auto-combat starts. Earn gold → Upgrade attack → Progress stages.
- **Admin**: Set nickname to `admin` → Access panel for cheats/stage jumps.
- **Easter Eggs**: Try nicknames like "piggod", spam upgrades, hit attack=777.
- **Offline Rewards**: Close tab → Reopen for time-based gold bonuses (popup shown).
- **Mobile**: Fully responsive; test on devices (portrait priority).

Demo flow:
1. Fresh load → Nickname modal.
2. Combat arena → Pig (left) vs Enemy (right).
3. HUD: Stats top, buttons bottom.
4. Skins modal → Visual swaps via CSS classes.

## Development

### Scripts
| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server (Vite) |
| `bun build` | Production build |
| `bun lint` | Run ESLint |
| `bun preview` | Local preview of build |
| `bun deploy` | Build + deploy to Cloudflare |

### Project Structure
```
src/
├── pages/     # Routes (HomePage.tsx primary)
├── components/ui/ # shadcn primitives
├── components/    # Custom (ThemeToggle, etc.)
├── hooks/         # Custom hooks (useTheme)
└── lib/           # Utils (cn), error reporting
worker/            # API routes (Hono)
```

### Key Files to Customize
- `src/pages/HomePage.tsx`: Main game UI/logic.
- `src/index.css`: Global styles.
- `tailwind.config.js`: Theme/colors.
- `worker/userRoutes.ts`: Add API endpoints.

### Best Practices
- Use shadcn/ui components (Button, Dialog, Card, etc.).
- Mobile-first: Tailwind responsive utils (`md:`, `lg:`).
- State: React hooks + localStorage (no backend needed).
- Animations: Framer Motion or Tailwind transitions.
- Errors: Handled via ErrorBoundary/RouteErrorBoundary.

## Deployment

Deploy to Cloudflare Pages/Workers in one command:

```bash
bun deploy
```

Or manually:
1. `bun build`
2. `wrangler deploy`

[cloudflarebutton]

**Free tier supported**. Custom domain via Wrangler dashboard.

## Contributing

1. Fork & clone.
2. `bun install`.
3. Create feature branch (`git checkout -b feature/xyz`).
4. Commit (`git commit -m "feat: add xyz"`).
5. Push & PR.

Follow ESLint/Prettier rules. Focus on mobile UX, performance, fun easter eggs.

## License

MIT. See [LICENSE](LICENSE) for details.

## Support

- Issues: GitHub Issues.
- Questions: Discussions tab.

Built with ❤️ for rapid idle game prototyping on Cloudflare. 🚀