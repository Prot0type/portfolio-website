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
- Alternating alignment left/right
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

## 10. Next Iteration Candidates

- Tune animation pacing and corner-L interpolation
- Refine mobile breakpoints and visual polish
- Improve lint pipeline compatibility with current Next CLI behavior
- Decide static vs compute hosting for project detail pages after CMS growth
