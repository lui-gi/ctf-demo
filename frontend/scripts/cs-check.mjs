/**
 * Capture cutscene + GSAP-powered sections.
 * Sequence: cutscene → sign spawn → gold unlock from sign → settled.
 * Then scroll past the hero to see GSAP entrance animations.
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
const OUT = new URL('../.seam-screenshots/', import.meta.url).pathname
await mkdir(OUT, { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push('PE: ' + e.message))
p.on('console', (m) => m.type() === 'error' && errs.push('CE: ' + m.text()))
await p.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' })

const snap = async (name, delay) => {
  await p.waitForTimeout(delay)
  await p.screenshot({ path: `${OUT}cs-${name}.png`, fullPage: false })
}

await snap('t0',       200)  // 0.2s
await snap('t25',     2300)  // 2.5s sunset peak
await snap('t52',     2700)  // 5.2s full night
await snap('signing',  600)  // 5.8s sign spawning
await snap('unlock',   600)  // 6.4s unlock pop
await snap('coins',    700)  // 7.1s mid coin arcs
await snap('settled', 1500)  // 8.6s past lock

// Hover state
await p.hover('.cs-wordmark')
await p.waitForTimeout(500)
await p.screenshot({ path: `${OUT}cs-hover.png`, fullPage: false })
await p.mouse.move(0, 0)
await p.waitForTimeout(500)

// Scroll past hero — should trigger GSAP entrance animations.
await p.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'instant' }))
await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}cs-countdown.png`, fullPage: false })

await p.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.7, behavior: 'instant' }))
await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}cs-prize.png`, fullPage: false })

await p.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.6, behavior: 'instant' }))
await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}cs-whatisctf.png`, fullPage: false })

await p.evaluate(() => window.scrollTo({ top: window.innerHeight * 3.6, behavior: 'instant' }))
await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}cs-challenges.png`, fullPage: false })

await p.evaluate(() => window.scrollTo({ top: window.innerHeight * 4.6, behavior: 'instant' }))
await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}cs-sponsors.png`, fullPage: false })

await p.evaluate(() => window.scrollTo({ top: 99999, behavior: 'instant' }))
await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}cs-cta.png`, fullPage: false })

await p.evaluate(() => window.scrollTo(0, 0))
await p.waitForTimeout(400)
await p.screenshot({ path: `${OUT}cs-fullpage.png`, fullPage: true })

await b.close()
if (errs.length) { console.error(errs.join('\n')); process.exit(1) }
console.log('shots saved')
