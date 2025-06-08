# GeoCities.eth User Guide

## Introduction

GeoCities.eth is a modern revival of the original GeoCities, offering homepages for the cypherpunk internet. Built on Web3 principles, it provides tools for searching, registering, and managing decentralized .eth domains and Basenames, with content creation and hosting powered by blockchain technology. This guide covers how to use GeoCities.eth to search names, create profiles, design websites, and deploy content.

### GeoCities History

GeoCities was the original home for user-generated content on the internet, offering free hosting and creation tools. In 2020, Yahoo’s GeoCities trademark was canceled in the US for non-use. In 2021, GeoCities.eth was registered on the Ethereum Name Service (ENS), launched, and filed for a new trademark, granted by the USPTO in 2022. The brand has since secured the “GeoCities” username on platforms like Instagram, Threads, GitHub, Linktree, TikTok, Reddit, Twitch, Kick, Truth Social, Digg, and Farcaster, reestablishing its presence for the decentralized web.

## Prerequisites

- A modern web browser (e.g., Chrome, Firefox) with JavaScript enabled.
- An Ethereum wallet (e.g., MetaMask) for registering names or deploying content.
- Basic understanding of ENS, Basenames, and IPFS (optional for advanced features).

## Getting Started

### Accessing GeoCities.eth

1. Navigate to [geocities.eth.link](http://geocities.eth.link).
2. Verify JavaScript is enabled for full functionality.
3. Explore the homepage, featuring a search bar, navigation menu, and featured .eth domains.

![GeoCities.eth.link](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1314.png)

## Key Features

### Bring Your Own ID (BYOID)

GeoCities.eth supports decentralized identities:

- **ENS**: Ethereum Name Service domains (e.g., example.eth).
- **Basename**: Subdomains on the Base network (e.g., example.base.eth).
- **WorldID**: Coming soon for additional identity verification.
- **SNS**: Coming soon for social namespace integration.

### Searching ENS/Basename

1. On the homepage, locate the search bar.
2. Enter an ENS or Basename (e.g., `example.eth` or `example.base.eth`).
3. Press **Enter** or click the search icon.
4. View results, displaying registered profiles or a “Register” button for unregistered names.

### Registering a New Name

If a searched name is unregistered:

1. Click the **Register** button on the profile page.
![Register button base](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1348.png)
![Register button ENS](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1350.png)

   - **ENS**: Redirects to the [ENS Manager](https://app.ens.domains) ([ENS Documentation](https://docs.ens.domains)).
 ![ENS register](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1349.png)
  - **Basename**: Redirects to the [Basename Website](https://www.base.org/names) ([Basename Documentation](https://docs.base.org)).
![Basename Register](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1351.png)
3. Follow the respective platform’s instructions to register the name, including costs (refer to linked documentation).

### ENS/Basename Profiles

Registered ENS/Basename profiles are automatically generated from ENS “records,” including:

- **Avatar**: Profile image set in ENS records.
- **Header**: Banner image or text.
- **Links**: Social media or website links, similar to Linktree.
- **Ethereum Follow Protocol (EFP)**: Enables a decentralized social graph, showing followers and following for ENS/Basenames.

![GeoCities.eth](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1359.png)
![GeoCities.base.eth](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1360.png)


To edit a profile:

1. Click the **Edit Records** button on the profile
2. Update Records:
   - **ENS**: Links to [ENS Manager](https://app.ens.domains) ([ENS Documentation for Editing Records](https://docs.ens.domains/v3/user-guides/manage-records)).
![Search Bar Screenshot](images/search-bar.png)
   - **Basename**: Links to [Basename Website](https://www.base.org/names) ([Base Documentation for Editing Records](https://docs.base.org)).
![Search Bar Screenshot](images/search-bar.png)

### Using the 🏗️ Menu

The 🏗️ menu provides tools for designing and deploying websites.

![🏗️ open](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1363.png)

#### EFP (Ethereum Follow Protocol)

- **Follow**: links to [EFP](https://docs.efp.app/intro/)
- ![EFP](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1362.png)

#### Design

Customize your profile or website:

- **Background**: Choose colors or images.
![Background Color](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1364.png)
- **Text**: Modify fonts and colors.
![Text Color](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1365.png)
png)
- **Border**: Adjust border styles.
![Border Color](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1366.png)
- **Effects**: Add animations or visual effects.
![Effects Menu](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1367.png)

#### Website

Create and deploy a decentralized website:

1. **Download**:
   - Click **Download** to generate an HTML/JS file for your ENS or Basename website, styled like a classic GeoCities page.
   - Save the file locally for editing or hosting.
![Download](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1368.png)
2. **Deploy**:
   - Click **Deploy** to upload your website to IPFS.
   - Current option: [Hash Vault](https://hashvault.xyz) ([Hash Vault Documentation](https://hashvault.xyz)).
![HashVault](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1354.png)
   - Other services:
     - [Pinata](https://www.pinata.cloud) ([Pinata Documentation](https://docs.pinata.cloud)).
![Pinata](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1355.png)
     - [Fleek](https://fleek.co) ([Fleek Documentation](https://docs.fleek.co)).
   - GeoCities IPFS deployment: Coming soon.

#### Connect
Link your website to your ENS/Basename:

- **ENS**: Links to [ENS Manager](https://app.ens.domains) ([ENS Documentation for Adding Content Hash](https://docs.ens.domains/v3/user-guides/add-content-hash)).
![ENS Content Hash](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1369.png)
- **Basename**: Links to the Basename smart contract on [Basescan](https://basescan.org/address/0xc6d566a56a1aff6508b41f6c90ff131615583bcd#writeContract#F13)) (not currently available on Basename website).![Search Bar Screenshot](images/search-bar.png)
![Basename Content Hash](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1371.png))

### Coming Soon

- **🪙 Crypto Wallet**: Learn how to set up and use a crypto wallet for GeoCities.eth.
- **🤖 Autonomous Agent**: Understand how autonomous agents interact with GeoCities.eth.

## Troubleshooting

- **Search Not Working**: Ensure the name is correctly formatted (e.g., `example.eth`). Try refreshing the page.
- **Profile Not Displaying**: Verify ENS/Basename records are updated in the respective manager.
- **Deployment Errors**: Check IPFS service status (e.g., Web Vault, Pinata) or ensure your wallet is connected.
- **JavaScript Issues**: Enable JavaScript in your browser settings.

## Additional Resources

- [ENS Documentation](https://docs.ens.domains) for advanced ENS management.
- [Basename Documentation](https://docs.base.org) for Basename setup and costs.
