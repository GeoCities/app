# GeoCities

## Introduction

GeoCities is a modern revival of the original GeoCities, offering homepages for the cypherpunk internet. 

These docs cover how to use GeoCities to search the cypherpunk internet, register ENS and Basenames, manage ENS records, Follow ENS/Basenames, and deploy decentralized websites and content connected to ENS/Basenames.

### GeoCities History

GeoCities was the original home for user-generated content on the internet, offering free hosting and creation tools. In 2020, Yahoo’s GeoCities trademark was canceled in the US for non-use. In 2021, GeoCities.eth was registered on the Ethereum Name Service (ENS), launched, and filed for a new trademark, granted by the USPTO in 2022. The brand has since secured the “GeoCities” username on platforms like Instagram, Threads, GitHub, Linktree, TikTok, Reddit, Twitch, Kick, Truth Social, Digg, and Farcaster, reestablishing its presence for the decentralized web.

If you don't believe me or don't get it, I don't have time to try to convince you, sorry. 

## Prerequisites

- A modern web browser (e.g., Chrome, safari) with JavaScript enabled.
- An Ethereum wallet (e.g., MetaMask, Coinbase Wallet) for registering names, managing records, and deploying content.
- Basic understanding of ENS, Basenames, and IPFS (optional for advanced features).

## Getting Started

### Accessing GeoCities

1. Navigate to [geocities.eth.limo](http://geocities.eth.limo) or [geocities.eth.link](http://geocities.eth.link).
2. Verify JavaScript is enabled for full functionality.
3. Explore the homepage, featuring a search bar, navigation menu, and featured .eth domains.

![GeoCities Homepage](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1314.png)

## Key Features

### Bring Your Own ID (BYOID)

GeoCities supports decentralized identities:

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

2. ENS/Basename
 - **ENS**: Redirects to the [ENS Manager](https://app.ens.domains), see [ENS Documentation] (https://docs.ens.domains) for more details. ![ENS register](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1349.png)
  - **Basename**: Redirects to the [Basename Website] (https://www.base.org/names), see [Basename Documentation] (https://docs.base.org) for more details.
![Basename Register](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1351.png)
3. Follow the respective platform’s instructions, or detailed documentation linked above, to register a new name.

### ENS/Basename Profiles

ENS and Basename profiles are automatically generated from “records” including:

- **Avatar**: Profile image.
- **Header**: Banner image.
- **Links**: Social media or website links.
- **Ethereum Follow Protocol (EFP)**: A opensource decentralized social graph, for followers and following data integrated into ENS and Basenames.

![GeoCities.eth](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1359.png)
![GeoCities.base.eth](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1360.png)


To edit a profile:

1. Click the **Edit Records** button on the profile
2. Update Records:
   - **ENS**: Links to [ENS Manager](https://app.ens.domains)
     - [ENS Documentation for Editing Records](https://docs.ens.domains/v3/user-guides/manage-records)
![ENS Records](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1369.png)
   - **Basename**: Links to [Basename Website](https://www.base.org/names)
     - [Base Documentation for Editing Records](https://docs.base.org)
![Basename Records](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1343.jpeg)

### 🏗️ 

The GeoCities 🏗️ button opens a dropdown menu with tools for designing and deploying GeoCities decentralized websites.

![🏗️ open](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1363.png)

#### EFP (Ethereum Follow Protocol)

- **Follow Button**: links to [EFP](https://docs.efp.app/intro/)
- ![EFP](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1362.png)

#### Design

Customize your profile or website:

- **Background Button**: Choose custom background colors.
![Background Color](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1364.png)
- **Text Button**: Modify fonts colors.
![Text Color](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1365.png)
png)
- **Border Button**: Adjust border styles.
![Border Color](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1366.png)
- **Effects**: Add animations or visual effects.
![Effects Menu](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1367.png)

#### Website

Download and deploy a GeoCities decentralized website:

1. **Download Button**:
   - Click **Download** to generate and download a HTML file with your GeoCities website for your ENS or Basename.
   - Save the file locally.
![Download](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1368.png)
2. **Deploy Button**:
   - Click **Deploy** to upload your website to IPFS.
   - Current link: [Pinata](https://www.pinata.cloud) ([Pinata Documentation](https://docs.pinata.cloud)).
![Pinata](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1355.png)
   - Other decentralized storage services:
     - [Hash Vault](https://hashvault.xyz) ([Hash Vault Documentation](https://hashvault.xyz)).
![HashVault](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1354.png)
     - [Fleek](https://fleek.co) ([Fleek Documentation](https://docs.fleek.co)).
   - GeoCities IPFS deployment: Coming soon.

3. **Connect Button**:
Link your website to your ENS or Basename:

- **ENS**: Links to [ENS Manager](https://app.ens.domains)
  - [ENS Documentation for Adding Content Hash](https://docs.ens.domains/v3/user-guides/add-content-hash)
![ENS Content Hash](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1369.png)

- **Basename**: Links to the Basename smart contract on [Basescan](https://basescan.org/address/0xc6d566a56a1aff6508b41f6c90ff131615583bcd#writeContract#F13) (UI not currently available on Basename website). Connect your wallet and paste the Basename Node for your name & Contenthash, see detailed instructions below to get your Basename Node and GeoCities decentralized website Contenthash.
![Basename Smart Contract Contenthash](https://raw.githubusercontent.com/GeoCities/app/refs/heads/main/assets/screenshots/IMG_1371.png)
  - **Basename Node**: Decode your Basename in Basescan to obtain the "node" for the Basename.
    - Search your Basename on Basescan.
    - Click the "transaction hash" under "related transaction" for the "register" action of the Basename.
    - Click the "logs" tab.
    - Scroll down to "Basename: Basenames: L2 Resolver" and copy the "node" where the Basename is displayed in the "data" box, click the dropdown button next to the "1:node" box and select "hex", then copy the node that begins with "0x".
  - **ContentHash for Basename Smart Contract**: After deploying your GeoCities website file to IPFS you will get a "CID" which must be converted to a  Contenthash.
    - **[CID Tool](https://adraffy.github.io/cid.js/test/demo.html)**: Use this tool to obtain the contenthash using your CID.


### 🪙
GeoCities crypto wallet coming soon.

### 🤖
GeoCities AI & Autonomous Agents coming soon.

## Troubleshooting

- **Search Not Working**: Ensure the name is correctly formatted (e.g., `example.eth`). Try refreshing the page.
- **Profile Not Displaying**: Verify ENS/Basename records are updated in the respective manager.
- **Deployment Errors**: Check IPFS service status (e.g., HashVault, Pinata) or ensure your wallet is connected.
- **JavaScript Issues**: Enable JavaScript in your browser settings.

## Additional Resources

- [ENS Documentation](https://docs.ens.domains) for advanced ENS management.
- [Basename Documentation](https://docs.base.org) for Basename setup and costs.
