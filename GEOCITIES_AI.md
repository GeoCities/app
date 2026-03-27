# GeoCities AI

## Concept

GeoCities AI is a personal website builder where you describe yourself and AI builds your site. No code. No templates. No drag-and-drop. Just a conversation.

Every site is published to IPFS — permanent, decentralized, yours. GeoCities emails you a weekly digest of who visited, where they came from, and what they read.

---

## How It Works

### 1. Onboarding

The user has a short conversation with the AI:

> "I'm a jazz musician in New Orleans. I love vintage synthesizers, sci-fi novels, and my cat Biscuit. I want something warm and a little retro."

The AI generates a complete personal site — layout, color palette, copy, sections, and a custom subdomain (`biscuit-jazz.geocities.ai`). The whole flow takes under two minutes.

### 2. Editing by Chat

There is no visual editor. To change something, you talk to it:

> "Make the background darker. Add a section for my upcoming shows. Remove the blog."

Changes render in a live preview. Accepted changes are published to IPFS as a new version. Old versions remain accessible via their original CID — nothing is ever deleted.

### 3. Living Pages

Users connect external sources to keep their page current:

- Spotify → "What I'm listening to"
- GitHub → Recent projects
- Letterboxd → What I'm watching
- RSS feed → Latest writing
- Manual → Gig listings, links, whatever

The AI writes a short weekly "what I'm into" update from connected sources. Pages feel alive without maintenance.

### 4. Neighborhoods

AI clusters users by genuine interest overlap — not self-reported tags. A jazz musician who also reads sci-fi and codes on weekends ends up in a neighborhood with people who share that specific shape of interests.

Neighborhoods have a shared directory page, also AI-generated and auto-updated. Discovery feels like stumbling across something, not searching for it.

### 5. Guestbooks

Every site gets a guestbook. Visitors can leave a note. The AI helps visitors write something real — prompts them, removes spam, keeps the warmth. Site owners get notified by email when someone signs.

---

## IPFS Publishing

Every site is a static HTML/CSS bundle published to IPFS on each save.

- Sites are content-addressed — the URL reflects the exact content
- GeoCities pins sites on its own nodes; users can also pin their own
- Custom domains map to the latest CID via DNSLink
- Old versions are permanently accessible via direct CID links
- No takedowns, no server downtime, no hosting fees

Publishing is invisible to the user. They click "Publish" and get a link.

---

## Email Analytics

GeoCities does not show a dashboard. Instead, it emails you.

### Weekly Digest (every Monday)

```
Your GeoCities Weekly — biscuit-jazz.geocities.ai

Visitors this week: 142  (+23 from last week)
Most read section:  Upcoming Shows
Top referrers:      Farcaster, Google, Direct
New guestbook entries: 3

Your neighborhood: New Orleans / Music / Sci-Fi
  — 4 new neighbors joined this week
```

### Milestone Emails

- First 10 visitors
- First guestbook entry
- 100 / 1,000 / 10,000 visitors
- Page anniversary

### What Is Not Tracked

- No individual user profiling
- No cookies
- No fingerprinting
- Analytics are aggregate-only, delivered to the owner, never sold

---

## Monetization

| Tier | Price | What You Get |
|------|-------|--------------|
| Free | $0 | `name.geocities.ai` subdomain, IPFS publishing, weekly email digest, 1 connected source |
| Personal | $8/mo | Custom domain, 5 connected sources, guestbook, neighborhood listing |
| Plus | $16/mo | Priority AI edits, version history browser, monthly deep analytics email |

No ads. Ever. The vibe depends on it.

---

## Acquisition Thesis

### Why GeoCities

The brand carries instant recognition and genuine nostalgia. "GeoCities is back" writes its own press. The name communicates personal websites, neighborhoods, and the early web's creative chaos — exactly the identity this product needs.

### Target Acquirers

| Acquirer | Why They Buy |
|----------|-------------|
| Automattic (WordPress) | Personal web distribution, AI onboarding layer |
| Squarespace / Wix | Defensive acquisition, AI-first competitor |
| Google | Consumer identity + IPFS/web3 hedge |
| Cloudflare | IPFS infrastructure + consumer brand |
| AI-native startup | Distribution and brand for personal AI agents |

### Valuation Range

| Stage | ARR | Estimated Exit |
|-------|-----|---------------|
| Launch, early traction | — | $5–15M (brand + concept) |
| 50K active pages | $500K | $20–40M |
| 200K active pages | $2M+ | $60–150M |

The brand compresses the time to acquisition. A no-name competitor needs to prove the concept first. GeoCities gets the press hit on day one.

---

## What Makes It Defensible

- **Brand**: GeoCities is a known quantity. Competitors start from zero.
- **Neighborhoods**: AI-generated community clusters are hard to replicate without the user base.
- **IPFS permanence**: A structural commitment to user ownership that Squarespace cannot make.
- **Email-only analytics**: A privacy stance that becomes a feature, not a limitation.
- **Tone**: Weird, personal, warm. Deliberately not corporate. That requires density of the right users — a flywheel that compounds.

---

## Build Order

1. AI page generation from conversational prompt
2. IPFS publish pipeline
3. Subdomain routing (`name.geocities.ai`)
4. Weekly email digest (aggregate analytics)
5. Connected sources (Spotify, GitHub, RSS)
6. Guestbook
7. Neighborhood clustering + directory
8. Custom domain support
9. Paid tier + billing
