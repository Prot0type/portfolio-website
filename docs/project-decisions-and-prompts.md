# Portfolio Project Decisions and Prompt Log

Last updated: 2026-02-09

## 1. Project Goal

Build a portfolio platform for Ishani Churi (UX designer) with:

- Responsive website for desktop/mobile
- Custom CMS with admin-only access
- Dynamic interactions and animations
- AWS-hosted infrastructure via CDK (Python)
- Staging and production workflows
- Local development/testing support

## 2. Locked Technical Decisions

### 2.1 Stack

- Frontend apps: Next.js + TypeScript
- Backend API: FastAPI on AWS Lambda
- Data: DynamoDB (projects) + S3 (media/images)
- Auth: Amazon Cognito (single admin model)
- Infra as code: AWS CDK in Python
- CI/CD: GitHub Actions

### 2.2 AWS Topology

- Region: `us-west-2` for app resources
- Temporary endpoints first (CloudFront/API endpoint), custom domains later
- Public path routing style: `/api/*` on each site domain (no separate `api.` subdomain)
- Environments: `staging` and `prod` in same AWS account

### 2.3 Domains (for later custom domain activation)

- `ishanichuri.com`
- `staging.ishanichuri.com`
- `cms.ishanichuri.com`
- `cms-staging.ishanichuri.com`

### 2.4 CMS/Auth Decisions

- Custom CMS (not external SaaS CMS)
- Single admin role
- Admin seed email: `shardulchuri7@gmail.com`
- Draft support included in V1

### 2.5 Monitoring/Analytics

- Minimal CloudWatch monitoring
- Track website views in CloudWatch custom metric
- Keep infra/simple budget target low

## 3. Data Model Decisions (Current)

Project fields currently include:

- `project_id`
- `title`
- `description`
- `tags` (first tag required and treated as primary tag)
- `category` (required enum): `Personal | College | Work | Freelance`
- `project_date`
- `images[]`
- `is_highlighted` (boolean)
- `status`: `draft | published`
- `sort_order`
- `extra`
- `created_at`, `updated_at`

Validation decisions:

- Category is required
- At least one tag is required
- First tag acts as primary tag
- Status transitions validate required category + primary tag

## 4. UX/UI Decisions (Iteration 2)

### 4.1 Global Direction

- Move from dark theme to light minimalistic aesthetic
- Use pale duck egg blue family as base background direction
- Use Fredoka as the default site font
- Use Stalemate font for:
  - `ishani churi` hero text
  - `thank you`

### 4.2 Navigation

- Left side panel (drawer) opened from top-left hamburger button
- Real paths:
  - `/` Home
  - `/projects`
  - `/timeline`
  - `/contact`
- Clicking current route in panel closes panel
- Outside overlay closes panel and blocks background interaction while open

### 4.3 Home Animation/Flow

- Opening: centered lowercase `ishani`/`churi` on two lines
- Black box around name
- On scroll down:
  - box lines physically break into two corner `L` shapes (top-right and bottom-left)
  - `L` shapes move to viewport corners and stay there
  - `ishani churi` fades out
  - lower page content stays hidden until the name fade is complete
- End section:
  - mirrored reverse movement of corner `L`s back inward
  - centered box re-forms
  - text is `thank you`
  - only social SVG icons (larger, no label text) below the text

### 4.4 Projects Experience

- Home page carousel shows highlighted projects only
- Carousel auto-scrolls right-to-left slowly
- Pause on hover
- Hover expands card and reveals:
  - title
  - category
  - primary tag
- Category labels color-differentiated
- Cards click through to detail page (`/projects/[id]`)

### 4.5 Projects Page

- Search box filters by project title
- Tag filters filter by selected tags
- Shows all published projects

### 4.6 Contact Page

- Four icon cards (LinkedIn, Instagram, Behance, Email)
- Centered page layout and centered contact card stack
- Heading on contact page uses Fredoka (not Stalemate script style)
- Small top-right back button returns to home
- Static corner `L` markers (top-right and bottom-left) on contact page to preserve "inside the box" feeling
- Hover interaction dims other cards to ~50% opacity
- Uses provided SVG icons

### 4.7 Timeline

- Placeholder page only for now

## 5. Assets and Links Provided

### 5.1 Social Links

- LinkedIn: `https://www.linkedin.com/in/ishanichuri/`
- Behance: `https://www.behance.net/ishanichuri`
- Instagram: `https://www.instagram.com/ishanichuri/`
- Email: `ishanichuri@gmail.com`

### 5.2 Local Assets

Source folder supplied by user:

- `files_to_move_somewhere_else/svgs/*.svg`
- `files_to_move_somewhere_else/Stalemate/Stalemate-Regular.ttf`
- `files_to_move_somewhere_else/Fredoka/*`

Moved/used in site:

- `apps/site/public/icons/*.svg`
- `apps/site/src/app/fonts/Stalemate-Regular.ttf`
- `apps/site/src/app/fonts/Fredoka-VariableFont_wdth,wght.ttf`
- `apps/site/src/app/fonts/Fredoka-OFL.txt`
- `apps/site/src/app/fonts/Stalemate-OFL.txt`
- temporary source folder removed from repo after migration

## 6. Local Testing Decisions

- Local API mode: `DATA_BACKEND=memory`, `DISABLE_AUTH=true`
- CMS local auth bypass: `NEXT_PUBLIC_ENABLE_AUTH=false`
- CMS image upload local fallback implemented:
  - if presigned S3 upload unavailable in local mode, image uses browser object URL
  - avoids blocking CMS iteration when AWS is not configured

## 7. Deployment and Promotion Decisions

- Staging auto-deploy from `main`
- Production deploy is manual promotion workflow (selected ref)
- Domain can be attached later after DNS and ACM setup

## 8. Important Constraint

Current site is static-export oriented. Dynamic project detail routes are pre-rendered from known IDs at build time.

Implication:

- In production static hosting mode, new project IDs may require a rebuild/redeploy to appear as dedicated static detail pages.

## 9. Prompt Log (Condensed)

This section preserves user intent from key prompts.

### Prompt A: Initial project ask

User asked for end-to-end AWS-hosted portfolio app with:

- responsive site
- CMS
- dynamic interactions (scroll/drag/fade/carousels)
- external social links
- infra code + backend
- local testing
- AWS auth for CMS
- CI/CD test-to-prod flow
- CloudWatch monitoring

### Prompt B: Architecture preferences

User chose:

- custom CMS
- staging publicly visible
- `us-west-2`
- same AWS account for staging/prod
- CDK Python
- GitHub Actions
- admin-only role
- drafts in V1
- project fields with strong image support
- placeholders for now (no videos)
- balanced motion

### Prompt C: Domain + routing decisions

User confirmed:

- temporary endpoints first
- `/api/*` path style
- domains listed in section 2.3

### Prompt D: Iteration 2 large redesign

User requested:

- lighter minimal style with pale duck egg blue direction
- custom scroll opening/closing box animation around `ishani churi`
- end message / contact closeout sequence
- side nav panel with 4 real pages
- projects search + tag filters
- contact layout with provided SVG icons and opacity interactions
- CMS enhancements:
  - highlighted project toggle
  - required category
  - first required primary tag
  - validation before draft/publish
  - highlighted-only carousel on home
  - clickable carousel cards with hover metadata

### Prompt E: Pre-change safety checkpoint

User requested committing current baseline before iteration 2.

Baseline commit pushed:

- `afb770d`

### Prompt F: Iteration 3 animation/font correction pass

User requested:

- fix opening so corner `L`s clearly break from the original center box (no abrupt corner appearance)
- delay lower content reveal until `ishani churi` has fully faded out
- slow down fade timing and corner travel (more scroll distance)
- mirror opening behavior at page end with centered boxed `thank you`
- remove social text labels from end sequence and keep only larger SVG icons
- apply Fredoka everywhere except `ishani churi` and `thank you` (Stalemate)
- move assets out of temporary `files_to_move_somewhere_else` into stable app paths
- keep this prompt and resulting decisions documented

### Prompt G: Frame continuity correction

User requested:

- opening frame should not fade independently
- box lines must become the corner `L`s directly
- ending (`thank you`) should follow the same frame continuity behavior

### Prompt H: Checkpoint commit request

User requested:

- document that box animation behavior is now working as expected
- create a checkpoint commit named `Box Animation Functionality working`

### Prompt I: Contact page tidy pass + persistent logging instruction

User requested:

- document every future prompt and outcome by default
- contact page should use Fredoka instead of Stalemate
- center everything on the contact page
- add a small top-right back button
- show static corner `L`s on contact page (non-animated), matching the in-box visual language

Outcome implemented:

- contact header now uses Fredoka styling and centered layout
- contact content is centered on page with centered card stack
- small back button added at top-right linking to `/`
- static frame corner `L`s rendered on contact page (top-right and bottom-left)

### Prompt J: Contact text alignment bug

User requested:

- investigate why contact page words were not visually aligned
- fix alignment before adding requested contact-page animation

Outcome implemented:

- contact card copy area now uses a dedicated left-aligned grid column
- consistent label/handle line-height and spacing applied
- icon box made non-shrinking and text block top-aligned for stable row alignment

### Prompt K: Contact section fade-up entrance

User requested:

- add a subtle fade-in with small vertical motion for the entire contact content block

Outcome implemented:

- `contact-page-inner` now animates in with a short fade-up on load
- reduced-motion fallback added to disable the animation and render fully visible content

### Prompt L: Collapsed social blocks with hover expansion

User requested:

- reduce the visual length of the four contact blocks
- keep only SVGs visible by default
- on hover over an SVG, expand horizontally to reveal the full card content
- document this change

Outcome implemented:

- contact cards now start in a compact icon-only collapsed state
- hover/focus expands each card horizontally and reveals the label/handle text
- expanded width reduced to a shorter max width compared with previous version
- touch-device fallback keeps cards expanded for usability

### Prompt M: Contact icon visibility + alignment polish

User requested:

- fix poor icon visibility in collapsed state
- correct alignment issues between collapsed and expanded states
- make SVGs black and larger initially
- when card expands into black box, make icons white and smaller
- document the prompt and outcome

Outcome implemented:

- collapsed state now uses larger black icons with stronger visibility
- expanded state transitions icons to smaller white treatment inside the dark card
- collapsed cards now use true icon-only spacing (no hidden-text gap), fixing alignment drift
- expanded max width further reduced for a tighter layout

### Prompt N: Contact row alignment correction follow-up

User requested:

- alignment still looked incorrect after previous adjustments
- keep prompt/outcome documentation updated

Outcome implemented:

- contact rows now anchor to a fixed left edge within a centered stack
- collapsed icon-only rows and expanded rows share the same icon column reference
- cards now expand horizontally to the right, reducing perceived lateral jump

### Prompt O: Center-anchored responsive contact interaction

User requested:

- remove viewport-fragile alignment behavior
- keep unhovered SVGs centered
- keep expanded black box centered as well
- ensure behavior works for desktop and mobile

Outcome implemented:

- contact cards now use center-anchored collapsed and expanded states
- responsive sizing moved to `clamp`/`min` variables instead of fixed pixel assumptions
- collapsed icons remain centered and visible, while expanded cards open in-place around center
- touch-device fallback keeps expanded state centered and usable

### Prompt P: Back button icon reorganization + corner placement

User requested:

- use `temp_folder_to_reorganize/circle-chevron-left-solid-full.svg` for back button
- move button inside top-right corner `L`
- reorganize that SVG into an appropriate project asset path (rename allowed)

Outcome implemented:

- SVG moved into site icon assets as `apps/site/public/icons/back-circle-chevron-left.svg`
- contact back button now uses that SVG icon
- back button repositioned into the top-right corner `L` area (icon button instead of text)

### Prompt Q: Back icon visual cleanup

User requested:

- remove the extra circle around the back SVG
- make the back SVG bigger
- move the back icon further inside the top-right `L`

Outcome implemented:

- removed outer button chrome, leaving icon-only back control styling
- increased icon render size via responsive sizing
- nudged icon deeper inside the corner `L` with responsive inset offsets

### Prompt R: Contact component approval + checkpoint commit request

User requested:

- confirm this current contact component styling as accepted
- document this acceptance
- create a checkpoint commit titled `completed title page`

Outcome implemented:

- recorded acceptance of current contact-page component treatment
- prepared checkpoint commit with requested title

## 10. Next Iteration Candidates

- Tune animation pacing and corner-L interpolation
- Refine mobile breakpoints and visual polish
- Improve lint pipeline compatibility with current Next CLI behavior
- Decide static vs compute hosting for project detail pages after CMS growth
