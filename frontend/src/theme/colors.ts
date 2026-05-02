// progctf palette — locked by helmsman.md. Do not invent new colors;
// extend by composing these as CSS variables in global.css.
export const colors = {
  // Deep sea navy — primary background for dark surfaces (Charts, terminal)
  deepSea: '#0c1c2e',
  // Parchment cream — warm light surface (map, island detail)
  parchment: '#f3e6c8',
  // Blood red — destructive actions, first-blood ticker, freeze button
  bloodRed: '#7a1f1f',
  // Brass — accents, focus rings, gold trim
  brass: '#c9a24a',
  // Faded ink — body text on parchment
  fadedInk: '#2b2b2b',

  // Derived shades for hover / disabled / muted states. Computed once so
  // components reference named tokens, never raw hex.
  deepSeaSoft: '#13283f',
  deepSeaDeep: '#08131f',
  parchmentDim: '#e7d6b1',
  parchmentEdge: '#c9b88f',
  brassDim: '#a08236',
  bloodRedDim: '#5a1717',
  fadedInkSoft: '#4a4a4a',
  inkOnDark: '#e8e0cf',
  inkOnDarkDim: '#a89f8c',
} as const;

export type ColorToken = keyof typeof colors;
