# ![GeoCities](https://github.com/user-attachments/assets/367bd0a9-38b1-4961-98bf-1a6c28489198)

## A website builder and search engine for the decentralized web

Welcome to GeoCities, a modern, decentralized website builder that brings back the nostalgic spirit of the original GeoCities while ensuring your site can never be shut down again.  GeoCities is your home on the decentralized web, GeoCities uses Ethereum Name Service (ENS) for website names that are also crypto wallets, InterPlanetary File System (IPFS) for decentralized hosting, and Ethereum Follow Protocol (EFP) for a decentralized social graph and website following system—think of it as a decentralized RSS feed for the new web.

## About GeoCities

The original GeoCities, once owned by Yahoo, was a beloved platform for creating personal websites but was shut down in 2009 due to its reliance on centralized servers. In 2020, the USPTO canceled Yahoo’s GeoCities trademark, and in 2022, we successfully registered the GeoCities trademark. Leveraging this trademark, we’ve worked with legal teams at the largest tech companies to secure GeoCities-branded usernames across the web, including GitHub, Instagram, TikTok, Reddit, Twitch, Kick, LinkedIn, Linktree, and many others, ensuring a unified presence for our decentralized vision.

The new GeoCities ensures your website is yours forever by leveraging:

- **ENS**: You own your website name as an ENS domain, a decentralized naming system on Ethereum.
- **IPFS**: Your website is hosted on IPFS, a peer-to-peer network that can’t be censored or taken down.
- **EFP**: Follow other GeoCities websites using a decentralized social graph, creating a network of discoverable sites.

## What is ENS?

Ethereum Name Service (ENS) is a decentralized naming system on the Ethereum blockchain. It maps human-readable names (e.g., `yourname.eth`) to machine-readable identifiers like Ethereum addresses, IPFS content hashes, and other records. When you own an ENS name, you truly own your website’s domain—no central authority can take it away. ENS is the foundation of the decentralized web because it replaces traditional DNS with a censorship-resistant, user-controlled system. In GeoCities, your ENS name or Basename:
- Acts as your website’s domain (e.g., `yourname.eth`).
- Stores onchain records like your avatar, banner, and profile data.
- Provides a built-in crypto wallet, enabling seamless Ethereum transactions on your site.

## Decentralized Hosting with IPFS

InterPlanetary File System (IPFS) is a peer-to-peer protocol for storing and sharing content. Unlike traditional web hosting, where a single server can be shut down, IPFS distributes your website across a global network of nodes. When you deploy your GeoCities website:
- Your site’s HTML, CSS, and JS are uploaded to IPFS via services like Web3Hash or Pinata, creating a unique Content Identifier (CID).
- The CID is linked to your ENS name, ensuring your site is accessible via `yourname.eth`.
- Anyone can access your site as long as at least one node in the IPFS network has a copy—no central point of failure.

## Decentralized Social Graph and Website Following with EFP

Ethereum Follow Protocol (EFP) is a decentralized social graph protocol on Ethereum. In GeoCities, EFP powers a unique feature: the ability to follow other websites on the decentralized web. It’s like a decentralized RSS feed for GeoCities sites. When you follow another user’s ENS name:
- EFP records the follow relationship onchain.
- Others can discover your site through the social graph.

## Building Your GeoCities Website

GeoCities websites combine old-school web design with modern decentralization. Each site is a lightweight (~20-25kb) HTML/CSS/JS file styled in the retro GeoCities aesthetic—think banners, glowing text, and nostalgic effects like snow or stars.

### Website Layout
- **Banner**: A pixelated image fetched from your ENS header record.
- **Avatar**: Your ENS avatar displayed next to your ENS name.
- **Profile Info**:
  - ENS Name (e.g., `yourname.eth`).
  - Name, Bio, links, and other details from your ENS text records.
  - Follower/Following counts fetched via EFP API.
- **Customization**: Options to change Background, Text, Border colors, and Effects (glow, snow, stars, rainbow, neon) using a simple interface.

### How It Works
1. **ENS Records**: Your site dynamically fetches ENS records (avatar, banner, text) using the Web3 Bio API, ensuring your site updates automatically when you change your ENS profile.
2. **EFP Data**: Follower and following counts are pulled from the EFP API, showing your site’s place in the decentralized social graph.
3. **Retro Design**: The HTML/CSS/JS bundle uses old-school GeoCities styling while embedding modern API calls to display dynamic data.

## Usage

GeoCities is accessible directly via the ENS gateway at [geocities.eth.limo](https://geocities.eth.limo). No installation is required—just follow these steps:

1. **Visit GeoCities**: Go to [geocities.eth.limo](https://geocities.eth.limo) in your browser.
2. **Search Your Name**: Enter your ENS name or Basename in the search bar to load your profile.
3. **Customize**: Use the Background, Text, Border, and Effect options to personalize your page with retro styles.
4. **Download**: Click "Download Website" to get a ~25kb HTML file with embedded CSS/JS.
5. **Deploy to IPFS**: Use services like Web3Hash or Pinata to upload your site to IPFS and get a CID or content hash.
6. **Connect to ENS/Basename**: Link the IPFS CID to your ENS or Basename using the ENS app (app.ens.domains) and adding it to the "content hash" record.
7. **Follow Other Sites**: Use EFP to follow other GeoCities sites, building your decentralized network.

## Contributing
We welcome contributions to enhance GeoCities! To contribute:
1. Fork the repository.
2. Create a branch:
3. Commit your changes:
4. Push and submit a pull request.
5. Keep your changes lightweight and frontend-only.

## Support
- Report issues in the [Issues](https://github.com/geocities/app/issues) tab.
- Follow us on social platforms.

## Acknowledgments
- Powered by ENS, IPFS, Web3 Bio API, and EFP API.
- Inspired by the original GeoCities and the decentralized web.
- 🚧Under Construction🚧

Last updated: May 28, 2025
