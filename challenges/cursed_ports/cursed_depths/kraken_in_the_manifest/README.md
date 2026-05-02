# Kraken in the Manifest

The *Sunken Compass Trading Co.* runs a sleek little Express-based admin API for its shipping department — a "shipping calculator" microservice that lets clerks update freight quotes, partner discounts, and rendering preferences for the printable bill-of-lading. The whole thing runs on Node.js with a homebrew JSON-merge helper the lead clerk wrote three years ago and was, by all accounts, very proud of.

The bill-of-lading is rendered server-side from an EJS template using a context object the merge helper assembles from user input. Most fields are sanitized. Some are not. The kraken in the manifest is whatever's been let into Node's prototype by way of that helper. (You may have heard of the *Smuggler's Manifest* in calmer waters — same word, much darker dock.)

Find the path from a shipping-rate update to the Treasure file at `/treasure` on the host filesystem.

**Endpoint:** {provided at Voyage start}
