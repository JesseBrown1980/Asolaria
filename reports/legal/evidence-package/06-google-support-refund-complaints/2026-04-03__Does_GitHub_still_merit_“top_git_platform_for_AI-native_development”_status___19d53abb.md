---
gmail_message_id: 19d53abb6a5ad120
account: plasmatoid@gmail.com
date_header: Fri, 3 Apr 2026 13:59:18 +0000
from: The Pragmatic Engineer <pragmaticengineer+the-pulse@substack.com>
to: plasmatoid@gmail.com
subject: Does GitHub still merit “top git platform for AI-native development” status?
body_sha256: 337ecbc4dacf07c0169851e4639e3674175217bbe3ade832d468d97e0693fb17
snippet: Availability has dropped to one nine (~90% – !!), partly due to not being able to handle increased traffic from AI coding agents. There&#39;s also no CEO and an apparent lack of direction. ͏ ͏ ͏ ͏ ͏ ͏
---

# Does GitHub still merit “top git platform for AI-native development” status?

**From:** The Pragmatic Engineer <pragmaticengineer+the-pulse@substack.com>
**To:** plasmatoid@gmail.com
**Date:** Fri, 3 Apr 2026 13:59:18 +0000
**SHA256:** `337ecbc4dacf07c0169851e4639e3674175217bbe3ade832d468d97e0693fb17`

## Body (extracted text)

View this post on the web at https://newsletter.pragmaticengineer.com/p/does-github-still-merit-top-git-platform Hi, this is Gergely with a bonus, free issue of the Pragmatic Engineer Newsletter. In every issue, I cover Big Tech and startups through the lens of senior engineers and engineering leaders. Today, we cover one out of four topics from last week’s The Pulse [ https://substack.com/redirect/fac4c45d-d940-46a9-8271-e4481891a692?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] issue. Full subscribers received the article below eight days ago. If you’ve been forwarded this email, you can subscribe here [ https://substack.com/redirect/b9b62d47-c97f-4035-a129-631096aad92e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. We’re used to highly reliable systems which target four-nines of availability (99.99%, meaning about 52 minutes of downtime per year), and for it to be embarrassing to barely hit three nines (around 9 hours of downtime per year.) And yet, in the past month, GitHub’s reliability is down to one nine! Here’s data from the third-party, “missing GitHub status page [ https://substack.com/redirect/a904219b-45df-42a3-9118-8be84fda60e6?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]”, which was built after GitHub stopped updating its own status page due to terrible availability. Recently, things have looked poor: This means that for every 30 days, GitHub had issues on 3 days, or issues/degradations for 2.5 hours daily (around 10% of the time.) GitHub seems unable to keep up with the massive increase in infra load from agents. One software engineer built a clever website called “Claude’s Code [ https://substack.com/redirect/99755674-3002-4bfa-8296-2b90864abef6?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]” that tracks Claude Code bot contributions across GitHub. Growth in the past three months has been enormous: Stream of GitHub outages from infra overload GitHub’s CTO, Vladimir Fedorov, addressed availability issues in a blog post [ https://substack.com/redirect/0b7ffe77-ff01-4e01-88a5-d98ed516cf85?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] and covered three major incidents: 2 February [ https://substack.com/redirect/f144a176-a178-44fa-8448-638b9cf20dfa?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: security policies unintentionally blocked access to virtual machine metadata 9 February [ https://substack.com/redirect/e253babd-95f9-44fa-984d-7d87fb627780?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: a database cluster got overloaded 5 March [ https://substack.com/redirect/d0c1857a-385d-4d41-909c-a9de82b4c9d7?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: writes failed on a Redis cluster Software engineer Lori Hochstein did a helpful analysis [ https://substack.com/redirect/e61aa038-2e93-4a4a-be8c-db9f33a56030?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] of these outages and the CTO’s response, and has interesting observations: Saturation: the database cluster incident (9 Feb) was a case of the database getting saturated, due to higher-than-expected usage. Databases are harder to scale up than stateless services. GitHub also underestimated how much additional traffic there would be. Failover + telemetry gap: the 2 Feb incident was a combination of an infra issue in one region failing over to a healthy region, and making things worse with a telemetry gap (incorrect security policies were applied in the new regions which blocked access to VM metadata) Failover + configuration issue: the 5 March incident was uncannily similar: after a failover, a configuration issue blocked writes on a Redis cluster It is certainly nice to get details from GitHub on these outages. It feels to me that infra strains are causing more infra issues → they trigger constraints faster → failovers are not as smooth as they should be. Could it be because GitHub keeps changing their existing systems? Startup shows GitHub how it’s done While GitHub struggles to keep up with the increase in load from AI agents generating more code and pull requests, a new startup called Pierre Computer claims to have built an “AI-native” solution for AI agents pushing code, which scales far beyond what GitHub can do. Pierre was founded by Jacob Thornton [ https://substack.com/redirect/9b29f7eb-e1e2-4382-89f7-c5f121304831?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: formerly an engineer at Coinbase, Medium, and Twitter, and also the creator of the once-very popular Bootstrap [ https://substack.com/redirect/a3d27091-da7a-4552-b420-5585182d3d20?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] CSS library. Here’s what Pierre supports, which GitHub does not: “In October [2025], Github shared they were averaging ~230 new repos per minute. Last week we [at Pierre Computer] hit a sustained peak of > 15,000 repos per minute for 3 hours. And in the last 30 days customers have created > 9M repos” These are incredible numbers – if also self-reported – and something that GitHub clearly cannot get close to, at least not today! There are few details about customers, while the product – called Code.storage [ https://substack.com/redirect/5d59484d-61b7-40fd-b33d-60659740038b?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – seems to be in closed beta. Still, this is the type of “git for AI agents” that GitHub has failed to build, and the type of infrastructure it needs badly. Has GitHub lost focus and purpose? GitHub’s reliability issues are acute enough that, if it keeps up, teams will start giving alternatives like small startups such as Pierre a try, or perhaps even consider self-hosting Git. But how did the largest Git host in the world neglect its customers, and fail to prepare its infra for an increase in code commits and pull requests? Mitchell Hashimoto, founder of Ghostty, and a heavy user of GitHub himself, had advice on what he would do if he was in charge of GitHub, after growing frustrated with the state of its core offering. He writes [ https://substack.com/redirect/eac2c9ac-77e5-463d-a5f1-98db7bad099d?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] (emphasis mine) “Here’s what I’d do if I was in charge of GitHub, in order: 1. Establish a North Star plan around being critical infrastructure for agentic code lifecycles and determine a set of ways to measure that. 2. Fire everyone who works on or advocates for Copilot and shut it down. It’s not about the people, I’m sure there’s many talented people; you’re just working at the wrong company. 3. Buy Pierre and launch agentic repo hosting as the first agentic product. Repos would be separate from the legacy web product to start, since they’re likely burdened with legacy cross product interactions. 4. Re-evaluate all product lines and initiatives against the new North Star. I suspect 50% get cut (to make room for different ones). The big idea is all agentic interactions should critically rely on GitHub APIs. Code review should be agentic but the labs should be building that into GH (not bolted in through GHA like today, real first class platform primitives). GH should absolutely launch an agent chat primitive, agent mailboxes are obviously good. GH should be a platform and not an agent itself. This is going to be very obviously lacking since I only have external ideas to work off of and have no idea how GitHub internals are working, what their KPIs are or what North Star they define, etc. But, with imperfect information, this is what I’d do.” My sense is that GitHub has three concurrent problems: GitHub and Copilot are entangled with Microsoft’s internal politics. GitHub’s Copilot in 2021 was the first massively successful “AI product.” Microsoft took the “Copilot” brand and used it across all of their product lines, creating low-quality AI integrations. Simultaneously, internal Microsoft orgs like Azure and Microsoft AI were trying to get their hands on GitHub, which is one of the most positive developer brands at Microsoft. GitHub has no leader, seemingly by design. GitHub’s last CEO was Thomas Dohmke, who stepped down voluntarily, and Microsoft never backfilled the CEO role; instead carrying out a reorg to make GitHub part of Microsoft’s AI group and stripping its independence. It seems the “Microsoft AI” side won that battle. GitHub has no focus, and is stuck chasing Copilot as a revenue source. GitHub has no CEO and is caught up in internal politics, so, what can GitHub teams do? The safest bet is to increase revenue and the best way to do that is by investing more into GitHub Copilot, and ignoring long-term issues like reliability. I agree with Mitchell: GitHub has no “North Star” and we see a large org being dysfunctional. That lack of vision – and CEO – is hitting hard: GitHub Copilot went from the most-used AI agent in 2021, to be overtaken by Claude Code, and is soon to be overtaken by Cursor. As a platform, GitHub has no vision for how to evolve to support AI agents. Sure, GitHub has an MCP server, but it has no “AI-native git platform” that can handle the massive load AI agents generate. GitHub keeps shipping small features and improvements without direction. For example, in October 2025, they started to work on [ https://substack.com/redirect/59c9db93-1b0d-4f55-8910-dacd7f9357da?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] stacked diffs. However, when it ships, the stacked diffs workflow might be mostly obsolete – at least with AI agents! It’s easy to win a market when you do one thing better than anyone else in the world. Right now, GitHub is doing too many things and doing a subpar job with Copilot, its platform, and AI infra. Read the full issue of last week’s The Pulse [ https://substack.com/redirect/fac4c45d-d940-46a9-8271-e4481891a692?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], or check out this week’s The Pulse [ https://substack.com/redirect/b8b7a902-41c8-4e24-a0e7-0da3982af74a?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. Catch up with recent The Pragmatic Engineer issues: Scaling Uber with Thuan Pham [ https://substack.com/redirect/86cd445a-af5c-4051-b040-6fd7bd663944?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] (Uber’s first CTO — podcast). We went into topics like scaling Uber from constant outages to global infrastructure, the shift to microservices and platform teams, and how AI is reshaping engineering. Building WhatsApp with Jean Lee [ https://substack.com/redirect/7807fb0d-22cc-428f-8848-da513b7ac5f4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] (podcast): Jean Lee, engineer #19 at WhatsApp, on scaling the app with a tiny team, the Facebook acquisition, and what it reveals about the future of engineering. What will the Staff Engineer role look like in 2027 and beyond [ https://substack.com/redirect/6d1c84ac-d5d3-4b5f-b1f8-2ef55a901cc5?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]? What happens to the Staff engineer role when agents write more code? Actually, they could be more in demand than ever! Unsubscribe https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9uZXdzbGV0dGVyLnByYWdtYXRpY2VuZ2luZWVyLmNvbS9hY3Rpb24vZGlzYWJsZV9lbWFpbD90b2tlbj1leUoxYzJWeVgybGtJam95TURJNE56UTRNaklzSW5CdmMzUmZhV1FpT2pFNU16QTNNVGcxTlN3aWFXRjBJam94TnpjMU1qSTFNalUwTENKbGVIQWlPakU0TURZM05qRXlOVFFzSW1semN5STZJbkIxWWkwME5UZzNNRGtpTENKemRXSWlPaUprYVhOaFlteGxYMlZ0WVdsc0luMC5BeXFmQVpuU1JSNURkRnhianZ3SnplWEdCemFuU2FMUXpXVWIwUUl1c3RnIiwicCI6MTkzMDcxODU1LCJzIjo0NTg3MDksImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzc1MjI1MjU0LCJleHAiOjIwOTA4MDEyNTQsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.DcRmqaJNq8lUhBA4fDduS3QpQRs3hXkoEBdmAETw7wU? === HTML PART === Does GitHub still merit &#8220;top git platform for AI-native development&#8221; status? @media (max-width: 1024px) { .typography .pullquote-align-left, .typography.editor .pullquote-align-left, .typography .pullquote-align-right, .typography.editor .pullquote-align-right, .typography .pullquote-align-wide, .typography.editor .pullquote-align-wide, .typography .pullquote-align-center, .typography.editor .pullquote-align-center { float: none; margin: 0 auto; width: 100%; max-width: 100%; } } @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) { .typography .markup table.image-wrapper img, .typography.editor .markup table.image-wrapper img, .typography .markup table.kindle-wrapper img, .typography.editor .markup table.kindle-wrapper img { max-width: 550px; } } @media (min-width: 1024px) { .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (min-width: 1300px) { .typography .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } .typography .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (max-width: 1024px) { .typography, .typography.editor { /* Disable offset on mobile/tablet */ } .typography .captioned-image-container figure:has(> a.image2-align-left), .typography.editor .captioned-image-container figure:has(> a.image2-align-left), .typography .captioned-image-container figure:has(> a.image2-align-right), .typography.editor .captioned-image-container figure:has(> a.image2-align-right) { float: none; margin: 1em auto; max-width: 100%; width: auto; padding: 0; } .typography .captioned-image-container figure:has(> a.image2-align-left.thefp), .typography.editor .captioned-image-container figure:has(> a.image2-align-left.thefp), .typography .captioned-image-container figure:has(> a.image2-align-right.thefp), .typography.editor .captioned-image-container figure:has(> a.image2-align-right.thefp) { margin: 1em auto; } .typography .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor .captioned-image-container figure:has(> a.image2-offset-left), .typography .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) { margin: 1em auto; } .typography .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, .typography.editor .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, .typography .captioned-image-container figure:has(> a.image2-align-right) .image2-inset, .typography.editor .captioned-image-container figure:has(> a.image2-align-right) .image2-inset { display: block; justify-content: initial; } } @media (max-width: 768px) { .typography .markup div.sponsorship-campaign-embed, .typography.editor .markup div.sponsorship-campaign-embed { margin-top: 24px; margin-bottom: 24px; } .typography .markup div.sponsorship-campaign-embed:first-child, .typography.editor .markup div.sponsorship-campaign-embed:first-child { margin-top: 0px; } } @media screen and (max-width: 650px) { .typography .markup div.youtube-overlay, .typography.editor .markup div.youtube-overlay, .typography .markup div.vimeo-overlay, .typography.editor .markup div.vimeo-overlay { display: none !important; } } @media screen and (max-width: 370px) { .typography .markup div.tiktok-wrap, .typography.editor .markup div.tiktok-wrap { width: calc(95vw - 32px); height: calc((95vw - 32px - 2px) / 0.485714); } } @media screen and (max-width: 650px) { .typography .markup div.embedded-publication-wrap .embedded-publication.show-subscribe, .typography.editor .markup div.embedded-publication-wrap .embedded-publication.show-subscribe { padding: 24px; } } @media screen and (max-width: 650px) { .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe, .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe { padding: 0px 24px; } } @media screen and (max-width: 650px) { .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button { padding: 10px 12px; min-width: 110px; } } @media (max-width: 650px) { .typography .markup .twitter-embed, .typography.editor .markup .twitter-embed, .typography .markup .tweet, .typography.editor .markup .tweet { padding: 12px; } } @media (max-width: 650px) { .typography .markup .twitter-embed .tweet-text, .typography.editor .markup .twitter-embed .tweet-text, .typography .markup .tweet .tweet-text, .typography.editor .markup .tweet .tweet-text { font-size: 14px; line-height: 20px; } } @media (max-width: 650px) { .typography .markup .twitter-embed .tweet-photos-container.two, .typography.editor .markup .twitter-embed .tweet-photos-container.two, .typography .markup .tweet .tweet-photos-container.two, .typography.editor .markup .tweet .tweet-photos-container.two, .typography .markup .twitter-embed .tweet-photos-container.three, .typography.editor .markup .twitter-embed .tweet-photos-container.three, .typography .markup .tweet .tweet-photos-container.three, .typography.editor .markup .tweet .tweet-photos-container.three, .typography .markup .twitter-embed .tweet-photos-container.four, .typography.editor .markup .twitter-embed .tweet-photos-container.four, .typography .markup .tweet .tweet-photos-container.four, .typography.editor .markup .tweet .tweet-photos-container.four { height: 200px; } } @media (max-width: 650px) { .typography .markup .twitter-embed a.expanded-link .expanded-link-img, .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-img, .typography .markup .tweet a.expanded-link .expanded-link-img, .typography.editor .markup .tweet a.expanded-link .expanded-link-img { max-height: 180px; } } @media (max-width: 650px) { .typography .markup .twitter-embed a.expanded-link .expanded-link-description, .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-description, .typography .markup .tweet a.expanded-link .expanded-link-description, .typography.editor .markup .tweet a.expanded-link .expanded-link-description { display: none; } } @media screen and (max-width: 650px) { .typography .markup .apple-podcast-container, .typography.editor .markup .apple-podcast-container { width: unset; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed img.install-substack-app-embed-img, .typography.editor .markup .install-substack-app-embed img.install-substack-app-embed-img { margin: 0 auto 16px auto; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed .install-substack-app-embed-text, .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-text { margin: 0 0 12px 0; max-width: 100%; width: auto; text-align: center; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed .install-substack-app-embed-link, .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-link { display: flex; justify-content: center; } } @media screen and (min-width: 481px) { .share-button-container { height: 38px; } } @media screen and (min-width: 481px) { .share-button-container a.comment { height: 38px; line-height: 38px; padding-right: 10px; } } @media screen and (max-width: 480px) { .share-button-container .separator { display: block; margin: 0; height: 8px; border-left: none; } } @media screen and (max-width: 480px) { .share-button-container a.share.first img { padding-left: 0; } } @media screen and (min-width: 481px) { .share-button-container a.mobile { display: none !important; } } @media screen and (min-width: 541px) { .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container { padding: 36px; height: 680px; } } @media screen and (min-width: 541px) { .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container .footer { position: absolute; bottom: 36px; margin: 0px; } } @media screen and (max-width: 650px) { .header-anchor-parent { display: none; } } @media screen and (max-width: 768px) { .post { padding: 16px 0 0 0; } } @media screen and (max-width: 650px) { .post .post-header .post-label { margin-top: 8px; } } @media screen and (max-width: 650px) { .post .post-header .meta-author-wrap.alternative-meta .meta-right-column .post-meta { margin-top: 6px; } } @media screen and (max-width: 650px) { .post .footer-facepile-container { height: 64px; padding: 0 16px; display: flex; align-items: center; justify-content: flex-start; width: 100%; } } @media screen and (max-width: 650px) { .post .post-footer.use-separators { justify-content: center; } } @media screen and (max-width: 650px) { .post .post-footer.next-prev { height: 64px; justify-content: space-between; box-sizing: border-box; } } @media screen and (max-width: 650px) { .post-contributor-footer .post-contributor-bio-table { display: block; } .post-contributor-footer .post-contributor-bio-table-row { display: flex; flex-direction: row; } .post-contributor-footer .post-contributor-bio-userhead-cell, .post-contributor-footer .post-contributor-bio-body-cell { display: block; } .post-contributor-footer .post-contributor-bio-body-cell { flex-grow: 1; } .post-contributor-footer .post-contributor-bio-body-table { display: block; } .post-contributor-footer .post-contributor-bio-body-table-row { display: block; } .post-contributor-footer .post-contributor-bio-copy-cell, .post-contributor-footer .post-contributor-bio-controls-cell { display: block; } .post-contributor-footer .post-contributor-bio-copy-cell { margin: 0 0 16px 0; } .post-contributor-footer .post-contributor-bio-controls-cell { width: auto; } .post-contributor-footer .post-contributor-bio-controls { margin: auto; } .post-contributor-footer .post-contributor-bio-controls .button.primary { width: 100%; } .post-contributor-footer .post-contributor-bio-text { font-size: 14px; } } @media screen and (min-width: 768px) { .post-silhouette { padding: 32px 0; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-title { margin-top: 10.44225025px; height: 120px; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-meta { width: 75%; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-meta.with-byline-image { margin: 20px 0; } } @media screen and (max-width: 650px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item, .post-meta.alternative-meta .post-meta-item { padding-right: 16px; } } @media screen and (max-width: 370px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item, .post-meta.alternative-meta .post-meta-item { font-size: 14px; } } @media screen and (max-width: 650px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item.guest-author-publication, .post-meta.alternative-meta .post-meta-item.guest-author-publication { display: none; } } @media screen and (max-width: 370px) { .post-meta .post-meta-item .post-meta-button { height: 36px !important; /* important to override in-line height style on emails */ } .post-meta .post-meta-item .post-meta-button .meta-button-label { display: none; } .post-meta .post-meta-item .post-meta-button > svg { margin-right: 0; } } @media screen and (max-width: 370px) { .post-meta .post-meta-item { font-size: 12px; } } @media screen and (max-width: 650px) { .post .floating-subscribe-button { bottom: 20px; right: 20px; } } @media (max-width: 1024px) { body .pullquote-align-left, body .pullquote-align-right, body .pullquote-align-wide, body .pullquote-align-center { float: none; margin: 0 auto; width: 100%; max-width: 100%; } } @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) { body .markup table.image-wrapper img, body .markup table.kindle-wrapper img { max-width: 550px; } } @media (min-width: 1024px) { body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (min-width: 1300px) { body .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } body .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (max-width: 1024px) { body { /* Disable offset on mobile/tablet */ } body .captioned-image-container figure:has(> a.image2-align-left), body .captioned-image-container figure:has(> a.image2-align-right) { float: none; margin: 1em auto; max-width: 100%; width: auto; padding: 0; } body .captioned-image-container figure:has(> a.image2-align-left.thefp), body .captioned-image-container figure:has(> a.image2-align-right.thefp) { margin: 1em auto; } body .captioned-image-container figure:has(> a.image2-offset-left), body .captioned-image-container figure:has(> a.image2-offset-right) { margin: 1em auto; } body .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, body .captioned-image-container figure:has(> a.image2-align-right) .image2-inset { display: block; justify-content: initial; } } @media (max-width: 768px) { body .markup div.sponsorship-campaign-embed { margin-top: 24px; margin-bottom: 24px; } body .markup div.sponsorship-campaign-embed:first-child { margin-top: 0px; } } @media screen and (max-width: 650px) { body .markup div.youtube-overlay, body .markup div.vimeo-overlay { display: none !important; } } @media screen and (max-width: 370px) { body .markup div.tiktok-wrap { width: calc(95vw - 32px); height: calc((95vw - 32px - 2px) / 0.485714); } } @media screen and (max-width: 650px) { body .markup div.embedded-publication-wrap .embedded-publication.show-subscribe { padding: 24px; } } @media screen and (max-width: 650px) { body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, body .markup div.captioned-button-wrap .subscription-widget.show-subscribe { padding: 0px 24px; } } @media screen and (max-width: 650px) { body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, body .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button { padding: 10px 12px; min-width: 110px; } } @media (max-width: 650px) { body .markup .twitter-embed, body .markup .tweet { padding: 12px; } } @media (max-width: 650px) { body .markup .twitter-embed .tweet-text, body .markup .tweet .tweet-text { font-size: 14px; line-height: 20px; } } @media (max-width: 650px) { body .markup .twitter-embed .tweet-photos-container.two, body .markup .tweet .tweet-photos-container.two, body .markup .twitter-embed .tweet-photos-container.three, body .markup .tweet .tweet-photos-container.three, body .markup .twitter-embed .tweet-photos-container.four, body .markup .tweet .tweet-photos-container.four { height: 200px; } } @media (max-width: 650px) { body .markup .twitter-embed a.expanded-link .expanded-link-img, body .markup .tweet a.expanded-link .expanded-link-img { max-height: 180px; } } @media (max-width: 650px) { body .markup .twitter-embed a.expanded-link .expanded-link-description, body .markup .tweet a.expanded-link .expanded-link-description { display: none; } } @media screen and (max-width: 650px) { body .markup .apple-podcast-container { width: unset; } } @media (max-width: 420px) { body .markup .install-substack-app-embed img.install-substack-app-embed-img { margin: 0 auto 16px auto; } } @media (max-width: 420px) { body .markup .install-substack-app-embed .install-substack-app-embed-text { margin: 0 0 12px 0; max-width: 100%; width: auto; text-align: center; } } @media (max-width: 420px) { body .markup .install-substack-app-embed .install-substack-app-embed-link { display: flex; justify-content: center; } } @media screen and (min-width: 500px) { body .header a.logo { width: 42px; height: 42px; border-radius: 12px; } } @media screen and (max-width: 420px) { body .subscription-receipt table:first-of-type .subscription-amount .subscription-discount { width: 72px !important; } } @media screen and (min-width: 481px) { body .share-button-container { height: auto; } } @media screen and (max-width: 480px) { body .share-button-container .separator { display: block !important; margin: 0 !important; height: 8px !important; border-left: none !important; } } @media screen and (max-width: 650px) { .digest .item .post-meta-item.audience { display: none; } } @media screen and (min-width: 500px) { .digest-publication .logo img { width: 42px; height: 42px; border-radius: 8px; } } @media screen and (max-width: 650px) { .comments-page .container .comment-list .collapsed-reply { margin-left: calc(10 + 32px - 24px); } } @media screen and (max-width: 650px) { .comment > .comment-list { padding-left: 24px; } } @media screen and (max-width: 650px) { .finish-magic-login-modal .modal-content .container { padding: 24px 0; } } @media (max-width: 650px) { .reader2-text-b3 { line-height: 24px; } } @media screen and (max-width: 650px) { .reader2-text-h4 { line-height: 24px; } } @media screen and (min-width: 541px) { .user-profile-modal { padding-left: 12px; padding-right: 12px; } } @media screen and (max-width: 650px) { .subscribe-widget form.form .sideBySideWrap button.rightButton { padding: 10px 12px; } } @media screen and (min-width: 541px) { .pub-icon:hover .logo-hover, .feed-item-icon:hover .logo-hover { display: block; } } @media screen and (max-width: 650px) { .post-ufi.single-full-width-button .post-ufi-button-wrapper { width: 100%; padding: 16px; } .post-ufi.single-full-width-button .post-ufi-button-wrapper:empty { display: none; } .post-ufi.single-full-width-button .post-ufi-button { width: 100%; justify-content: center; } } @media screen and (max-width: 768px) { .file-embed-wrapper { padding: 0; } } @media screen and (max-width: 768px) { .file-embed-wrapper-editor { padding: 0; } } @media screen and (max-width: 768px) { .file-embed-wrapper-editor:active { padding: 0; } } @media only screen and (max-width: 650px) { .file-embed-button.wide, .file-embed-error-button.wide { display: none; } } @media only screen and (min-width: 630px) { .file-embed-button.narrow, .file-embed-error-button.narrow { display: none; } } @media screen and (min-width: 541px) { .audio-player-wrapper .audio-player { min-width: 500px; } } @media screen and (max-width: 650px) { .audio-player-wrapper .audio-player .audio-player-progress { border-left-width: 16px; border-right-width: 16px; } } @media screen and (max-width: 650px) { .audio-player-wrapper .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup { top: -54px; } } @media screen and (max-width: 650px) { .audio-player-wrapper-fancy .audio-player .audio-player-progress { border-left-width: 16px; border-right-width: 16px; } } @media screen and (max-width: 650px) { .audio-player-wrapper-fancy .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup { top: -54px; } } @media (min-width: 250px) { .audio-player-wrapper-fancy .audio-player { padding: 32px; } .audio-player-wrapper-fancy .audio-player .btn-group { display: flex; } .audio-player-wrapper-fancy .audio-player .btn-group .button:last-of-type { display: block; } } @media (min-width: 300px) { .audio-player-wrapper-fancy .audio-player .btn-group { display: block; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } } @media (min-width: 350px) { .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo { display: block; } .audio-player-wrapper-fancy .audio-player .audio-player-title { margin-top: 16px; } .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 15%; width: 15%; display: block; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo { display: block; } } @media (min-width: 350px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 25%; width: 25%; display: block; } .audio-player-wrapper-fancy .audio-player .btn-group { display: flex; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } } @media (min-width: 400px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 40%; width: 40%; } } @media (max-width: 400px) { .audio-player-wrapper-fancy .audio-player .btn-group { margin-top: 12px; } .audio-player-wrapper-fancy .audio-player .btn-group .button { font-size: 13px; padding: 6px 12px; height: auto; margin-top: 10px; } } @media (min-width: 600px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 55%; width: 55%; } } @media (max-width: 650px) { .poll-editor-modal { min-width: calc(100% - 20px); } } @media (max-width: 750px) { .poll-embed .poll-anchor-target .poll-anchor-copy-button { left: 8px; top: 45px; } } Availability has dropped to one nine (~90% &#8211; !!), partly due to not being able to handle increased traffic from AI coding agents. There&#8217;s also no CEO and an apparent lack of direction. &#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173; Forwarded this email? Subscribe here for more Does GitHub still merit &#8220;top git platform for AI-native development&#8221; status? Availability has dropped to one nine (~90% &#8211; !!), partly due to not being able to handle increased traffic from AI coding agents. There&#8217;s also no CEO and an apparent lack of direction. Gergely Orosz Apr 3 READ IN APP Hi, this is Gergely with a bonus, free issue of the Pragmatic Engineer Newsletter. In every issue, I cover Big Tech and startups through the lens of senior engineers and engineering leaders. Today, we cover one out of four topics from last week&#8217;s The Pulse issue. Full subscribers received the article below eight days ago. If you&#8217;ve been forwarded this email, you can subscribe here . We&#8217;re used to highly reliable systems which target four-nines of availability (99.99%, meaning about 52 minutes of downtime per year), and for it to be embarrassing to barely hit three nines (around 9 hours of downtime per year.) And yet, in the past month, GitHub&#8217;s reliability is down to one nine! Here&#8217;s data from the third-party, &#8220; missing GitHub status page &#8221;, which was built after GitHub stopped updating its own status page due to terrible availability. Recently, things have looked poor: GitHub down at one nine. Source: The Missing GitHub Status Page This means that for every 30 days, GitHub had issues on 3 days, or issues/degradations for 2.5 hours daily (around 10% of the time.) GitHub seems unable to keep up with the massive increase in infra load from agents. One software engineer built a clever website called &#8220; Claude&#8217;s Code &#8221; that tracks Claude Code bot contributions across GitHub. Growth in the past three months has been enormous: Load from Claude Code has 6x&#8217;d in 3 months. Source: Claude&#8217;s Code Stream of GitHub outages from infra overload GitHub&#8217;s CTO, Vladimir Fedorov, addressed availability issues in a blog post and covered three major incidents: 2 February : security policies unintentionally blocked access to virtual machine metadata 9 February : a database cluster got overloaded 5 March : writes failed on a Redis cluster Software engineer Lori Hochstein did a helpful analysis of these outages and the CTO&#8217;s response, and has interesting observations: Saturation : the database cluster incident (9 Feb) was a case of the database getting saturated, due to higher-than-expected usage. Databases are harder to scale up than stateless services. GitHub also underestimated how much additional traffic there would be. Failover + telemetry gap : the 2 Feb incident was a combination of an infra issue in one region failing over to a healthy region, and making things worse with a telemetry gap (incorrect security policies were applied in the new regions which blocked access to VM metadata) Failover + configuration issue : the 5 March incident was uncannily similar: after a failover, a configuration issue blocked writes on a Redis cluster It is certainly nice to get details from GitHub on these outages. It feels to me that infra strains are causing more infra issues &#8594; they trigger constraints faster &#8594; failovers are not as smooth as they should be. Could it be because GitHub keeps changing their existing systems? Startup shows GitHub how it&#8217;s done While GitHub struggles to keep up with the increase in load from AI agents generating more code and pull requests, a new startup called Pierre Computer claims to have built an &#8220;AI-native&#8221; solution for AI agents pushing code, which scales far beyond what GitHub can do. Pierre was founded by Jacob Thornton : formerly an engineer at Coinbase, Medium, and Twitter, and also the creator of the once-very popular Bootstrap CSS library. Here&#8217;s what Pierre supports, which GitHub does not: &#8220;In October [2025], Github shared they were averaging ~230 new repos per minute. Last week we [at Pierre Computer] hit a sustained peak of > 15,000 repos per minute for 3 hours. And in the last 30 days customers have created > 9M repos&#8221; These are incredible numbers &#8211; if also self-reported &#8211; and something that GitHub clearly cannot get close to, at least not today! There are few details about customers, while the product &#8211; called Code.storage &#8211; seems to be in closed beta. Still, this is the type of &#8220;git for AI agents&#8221; that GitHub has failed to build, and the type of infrastructure it needs badly. Has GitHub lost focus and purpose? GitHub&#8217;s reliability issues are acute enough that, if it keeps up, teams will start giving alternatives like small startups such as Pierre a try, or perhaps even consider self-hosting Git. But how did the largest Git host in the world neglect its customers, and fail to prepare its infra for an increase in code commits and pull requests? Mitchell Hashimoto, founder of Ghostty, and a heavy user of GitHub himself, had advice on what he would do if he was in charge of GitHub, after growing frustrated with the state of its core offering. He writes (emphasis mine) &#8220;Here&#8217;s what I&#8217;d do if I was in charge of GitHub, in order: 1. Establish a North Star plan around being critical infrastructure for agentic code lifecycles and determine a set of ways to measure that. 2. Fire everyone who works on or advocates for Copilot and shut it down. It&#8217;s not about the people, I&#8217;m sure there&#8217;s many talented people; you&#8217;re just working at the wrong company. 3. Buy Pierre and launch agentic repo hosting as the first agentic product. Repos would be separate from the legacy web product to start, since they&#8217;re likely burdened with legacy cross product interactions. 4. Re-evaluate all product lines and initiatives against the new North Star. I suspect 50% get cut (to make room for different ones). The big idea is all agentic interactions should critically rely on GitHub APIs. Code review should be agentic but the labs should be building that into GH (not bolted in through GHA like today, real first class platform primitives). GH should absolutely launch an agent chat primitive, agent mailboxes are obviously good. GH should be a platform and not an agent itself. This is going to be very obviously lacking since I only have external ideas to work off of and have no idea how GitHub internals are working, what their KPIs are or what North Star they define, etc. But, with imperfect information, this is what I&#8217;d do.&#8221; My sense is that GitHub has three concurrent problems: GitHub and Copilot are entangled with Microsoft&#8217;s internal politics. GitHub&#8217;s Copilot in 2021 was the first massively successful &#8220;AI product.&#8221; Microsoft took the &#8220;Copilot&#8221; brand and used it across all of their product lines, creating low-quality AI integrations. Simultaneously, internal Microsoft orgs like Azure and Microsoft AI were trying to get their hands on GitHub, which is one of the most positive developer brands at Microsoft. GitHub has no leader, seemingly by design. GitHub&#8217;s last CEO was Thomas Dohmke, who stepped down voluntarily, and Microsoft never backfilled the CEO role; instead carrying out a reorg to make GitHub part of Microsoft&#8217;s AI group and stripping its independence. It seems the &#8220;Microsoft AI&#8221; side won that battle. GitHub has no focus, and is stuck chasing Copilot as a revenue source. GitHub has no CEO and is caught up in internal politics, so, what can GitHub teams do? The safest bet is to increase revenue and the best way to do that is by investing more into GitHub Copilot, and ignoring long-term issues like reliability. I agree with Mitchell: GitHub has no &#8220;North Star&#8221; and we see a large org being dysfunctional. That lack of vision &#8211; and CEO &#8211; is hitting hard: GitHub Copilot went from the most-used AI agent in 2021, to be overtaken by Claude Code, and is soon to be overtaken by Cursor. As a platform, GitHub has no vision for how to evolve to support AI agents. Sure, GitHub has an MCP server, but it has no &#8220;AI-native git platform&#8221; that can handle the massive load AI agents generate. GitHub keeps shipping small features and improvements without direction. For example, in October 2025, they started to work on stacked diffs. However, when it ships, the stacked diffs workflow might be mostly obsolete &#8211; at least with AI agents! It&#8217;s easy to win a market when you do one thing better than anyone else in the world. Right now, GitHub is doing too many things and doing a subpar job with Copilot, its platform, and AI infra. Read the full issue of last week&#8217;s The Pulse , or check out this week&#8217;s The Pulse . Catch up with recent The Pragmatic Engineer issues: Scaling Uber with Thuan Pham (Uber&#8217;s first CTO &#8212; podcast). We went into topics like scaling Uber from constant outages to global infrastructure, the shift to microservices and platform teams, and how AI is reshaping engineering. Building WhatsApp with Jean Lee (podcast): Jean Lee, engineer #19 at WhatsApp, on scaling the app with a tiny team, the Facebook acquisition, and what it reveals about the future of engineering. What will the Staff Engineer role look like in 2027 and beyond ? What happens to the Staff engineer role when agents write more code? Actually, they could be more in demand than ever! You&#8217;re on the free list for The Pragmatic Engineer . For the full experience, become a paying subscriber . Many readers expense this newsletter within their company&#8217;s training/learning/development budget. If you have such a budget, here&#8217;s an email you could send to your manager . Upgrade to paid This post is public, so feel free to share and forward it. Share The Pragmatic Engineer If you enjoyed this post, you might enjoy my book, The Software Engineer's Guidebook : navigating senior, tech lead, staff and principal positions at tech companies and startups. Share Like Restack &#169; 2026 Gergely Orosz 548 Market Street PMB 72296, San Francisco, CA 94104 Unsubscribe

## Raw body (tamper-evident)

```
View this post on the web at https://newsletter.pragmaticengineer.com/p/does-github-still-merit-top-git-platform

Hi, this is Gergely with a bonus, free issue of the Pragmatic Engineer Newsletter. In every issue, I cover Big Tech and startups through the lens of senior engineers and engineering leaders. Today, we cover one out of four topics from last week’s The Pulse [ https://substack.com/redirect/fac4c45d-d940-46a9-8271-e4481891a692?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] issue. Full subscribers received the article below eight days ago. If you’ve been forwarded this email, you can subscribe here [ https://substack.com/redirect/b9b62d47-c97f-4035-a129-631096aad92e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ].
We’re used to highly reliable systems which target four-nines of availability (99.99%, meaning about 52 minutes of downtime per year), and for it to be embarrassing to barely hit three nines (around 9 hours of downtime per year.) And yet, in the past month, GitHub’s reliability is down to one nine!
Here’s data from the third-party, “missing GitHub status page [ https://substack.com/redirect/a904219b-45df-42a3-9118-8be84fda60e6?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]”, which was built after GitHub stopped updating its own status page due to terrible availability. Recently, things have looked poor:
This means that for every 30 days, GitHub had issues on 3 days, or issues/degradations for 2.5 hours daily (around 10% of the time.)
GitHub seems unable to keep up with the massive increase in infra load from agents. One software engineer built a clever website called “Claude’s Code [ https://substack.com/redirect/99755674-3002-4bfa-8296-2b90864abef6?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]” that tracks Claude Code bot contributions across GitHub. Growth in the past three months has been enormous:
Stream of GitHub outages from infra overload
GitHub’s CTO, Vladimir Fedorov, addressed availability issues in a blog post [ https://substack.com/redirect/0b7ffe77-ff01-4e01-88a5-d98ed516cf85?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] and covered three major incidents:
2 February [ https://substack.com/redirect/f144a176-a178-44fa-8448-638b9cf20dfa?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: security policies unintentionally blocked access to virtual machine metadata
9 February [ https://substack.com/redirect/e253babd-95f9-44fa-984d-7d87fb627780?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: a database cluster got overloaded
5 March [ https://substack.com/redirect/d0c1857a-385d-4d41-909c-a9de82b4c9d7?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: writes failed on a Redis cluster
Software engineer Lori Hochstein did a helpful analysis [ https://substack.com/redirect/e61aa038-2e93-4a4a-be8c-db9f33a56030?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] of these outages and the CTO’s response, and has interesting observations:
Saturation: the database cluster incident (9 Feb) was a case of the database getting saturated, due to higher-than-expected usage. Databases are harder to scale up than stateless services. GitHub also underestimated how much additional traffic there would be.
Failover + telemetry gap: the 2 Feb incident was a combination of an infra issue in one region failing over to a healthy region, and making things worse with a telemetry gap (incorrect security policies were applied in the new regions which blocked access to VM metadata)
Failover + configuration issue: the 5 March incident was uncannily similar: after a failover, a configuration issue blocked writes on a Redis cluster
It is certainly nice to get details from GitHub on these outages. It feels to me that infra strains are causing more infra issues → they trigger constraints faster → failovers are not as smooth as they should be. Could it be because GitHub keeps changing their existing systems?
Startup shows GitHub how it’s done
While GitHub struggles to keep up with the increase in load from AI agents generating more code and pull requests, a new startup called Pierre Computer claims to have built an “AI-native” solution for AI agents pushing code, which scales far beyond what GitHub can do. Pierre was founded by Jacob Thornton [ https://substack.com/redirect/9b29f7eb-e1e2-4382-89f7-c5f121304831?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]: formerly an engineer at Coinbase, Medium, and Twitter, and also the creator of the once-very popular Bootstrap [ https://substack.com/redirect/a3d27091-da7a-4552-b420-5585182d3d20?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] CSS library.
Here’s what Pierre supports, which GitHub does not:
“In October [2025], Github shared they were averaging ~230 new repos per minute.
Last week we [at Pierre Computer] hit a sustained peak of > 15,000 repos per minute for 3 hours.
And in the last 30 days customers have created > 9M repos”
These are incredible numbers – if also self-reported – and something that GitHub clearly cannot get close to, at least not today! There are few details about customers, while the product – called Code.storage [ https://substack.com/redirect/5d59484d-61b7-40fd-b33d-60659740038b?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – seems to be in closed beta.
Still, this is the type of “git for AI agents” that GitHub has failed to build, and the type of infrastructure it needs badly.
Has GitHub lost focus and purpose?
GitHub’s reliability issues are acute enough that, if it keeps up, teams will start giving alternatives like small startups such as Pierre a try, or perhaps even consider self-hosting Git. But how did the largest Git host in the world neglect its customers, and fail to prepare its infra for an increase in code commits and pull requests?
Mitchell Hashimoto, founder of Ghostty, and a heavy user of GitHub himself, had advice on what he would do if he was in charge of GitHub, after growing frustrated with the state of its core offering. He writes [ https://substack.com/redirect/eac2c9ac-77e5-463d-a5f1-98db7bad099d?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] (emphasis mine)
“Here’s what I’d do if I was in charge of GitHub, in order:
1. Establish a North Star plan around being critical infrastructure for agentic code lifecycles and determine a set of ways to measure that.
2. Fire everyone who works on or advocates for Copilot and shut it down. It’s not about the people, I’m sure there’s many talented people; you’re just working at the wrong company.
3. Buy Pierre and launch agentic repo hosting as the first agentic product. Repos would be separate from the legacy web product to start, since they’re likely burdened with legacy cross product interactions.
4. Re-evaluate all product lines and initiatives against the new North Star. I suspect 50% get cut (to make room for different ones).
The big idea is all agentic interactions should critically rely on GitHub APIs. Code review should be agentic but the labs should be building that into GH (not bolted in through GHA like today, real first class platform primitives). GH should absolutely launch an agent chat primitive, agent mailboxes are obviously good. GH should be a platform and not an agent itself.
This is going to be very obviously lacking since I only have external ideas to work off of and have no idea how GitHub internals are working, what their KPIs are or what North Star they define, etc.
But, with imperfect information, this is what I’d do.”
My sense is that GitHub has three concurrent problems:
GitHub and Copilot are entangled with Microsoft’s internal politics. GitHub’s Copilot in 2021 was the first massively successful “AI product.” Microsoft took the “Copilot” brand and used it across all of their product lines, creating low-quality AI integrations. Simultaneously, internal Microsoft orgs like Azure and Microsoft AI were trying to get their hands on GitHub, which is one of the most positive developer brands at Microsoft.
GitHub has no leader, seemingly by design. GitHub’s last CEO was Thomas Dohmke, who stepped down voluntarily, and Microsoft never backfilled the CEO role; instead carrying out a reorg to make GitHub part of Microsoft’s AI group and stripping its independence. It seems the “Microsoft AI” side won that battle.
GitHub has no focus, and is stuck chasing Copilot as a revenue source. GitHub has no CEO and is caught up in internal politics, so, what can GitHub teams do? The safest bet is to increase revenue and the best way to do that is by investing more into GitHub Copilot, and ignoring long-term issues like reliability.
I agree with Mitchell: GitHub has no “North Star” and we see a large org being dysfunctional. That lack of vision – and CEO – is hitting hard:
GitHub Copilot went from the most-used AI agent in 2021, to be overtaken by Claude Code, and is soon to be overtaken by Cursor.
As a platform, GitHub has no vision for how to evolve to support AI agents. Sure, GitHub has an MCP server, but it has no “AI-native git platform” that can handle the massive load AI agents generate.
GitHub keeps shipping small features and improvements without direction. For example, in October 2025, they started to work on [ https://substack.com/redirect/59c9db93-1b0d-4f55-8910-dacd7f9357da?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] stacked diffs. However, when it ships, the stacked diffs workflow might be mostly obsolete – at least with AI agents!
It’s easy to win a market when you do one thing better than anyone else in the world. Right now, GitHub is doing too many things and doing a subpar job with Copilot, its platform, and AI infra.
Read the full issue of last week’s The Pulse [ https://substack.com/redirect/fac4c45d-d940-46a9-8271-e4481891a692?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], or check out this week’s The Pulse [ https://substack.com/redirect/b8b7a902-41c8-4e24-a0e7-0da3982af74a?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ].
Catch up with recent The Pragmatic Engineer issues:
Scaling Uber with Thuan Pham [ https://substack.com/redirect/86cd445a-af5c-4051-b040-6fd7bd663944?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] (Uber’s first CTO — podcast). We went into topics like scaling Uber from constant outages to global infrastructure, the shift to microservices and platform teams, and how AI is reshaping engineering.
Building WhatsApp with Jean Lee [ https://substack.com/redirect/7807fb0d-22cc-428f-8848-da513b7ac5f4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] (podcast): Jean Lee, engineer #19 at WhatsApp, on scaling the app with a tiny team, the Facebook acquisition, and what it reveals about the future of engineering.
What will the Staff Engineer role look like in 2027 and beyond [ https://substack.com/redirect/6d1c84ac-d5d3-4b5f-b1f8-2ef55a901cc5?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]? What happens to the Staff engineer role when agents write more code? Actually, they could be more in demand than ever!

Unsubscribe https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9uZXdzbGV0dGVyLnByYWdtYXRpY2VuZ2luZWVyLmNvbS9hY3Rpb24vZGlzYWJsZV9lbWFpbD90b2tlbj1leUoxYzJWeVgybGtJam95TURJNE56UTRNaklzSW5CdmMzUmZhV1FpT2pFNU16QTNNVGcxTlN3aWFXRjBJam94TnpjMU1qSTFNalUwTENKbGVIQWlPakU0TURZM05qRXlOVFFzSW1semN5STZJbkIxWWkwME5UZzNNRGtpTENKemRXSWlPaUprYVhOaFlteGxYMlZ0WVdsc0luMC5BeXFmQVpuU1JSNURkRnhianZ3SnplWEdCemFuU2FMUXpXVWIwUUl1c3RnIiwicCI6MTkzMDcxODU1LCJzIjo0NTg3MDksImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzc1MjI1MjU0LCJleHAiOjIwOTA4MDEyNTQsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.DcRmqaJNq8lUhBA4fDduS3QpQRs3hXkoEBdmAETw7wU?

=== HTML PART ===
<html lang="en" dir="ltr" style="scrollbar-width: thin;scrollbar-color: rgb(219,219,219)rgb(255,255,255);"><head><meta charset="utf-8"><title>Does GitHub still merit &#8220;top git platform for AI-native development&#8221; status?</title><style>
@media (max-width: 1024px) {
  .typography .pullquote-align-left,
  .typography.editor .pullquote-align-left,
  .typography .pullquote-align-right,
  .typography.editor .pullquote-align-right,
  .typography .pullquote-align-wide,
  .typography.editor .pullquote-align-wide,
  .typography .pullquote-align-center,
  .typography.editor .pullquote-align-center {
    float: none;
    margin: 0 auto;
    width: 100%;
    max-width: 100%;
  }
}
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .typography .markup table.image-wrapper img,
  .typography.editor .markup table.image-wrapper img,
  .typography .markup table.kindle-wrapper img,
  .typography.editor .markup table.kindle-wrapper img {
    max-width: 550px;
  }
}
@media (min-width: 1024px) {
  .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left),
  .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) {
    margin-left: var(--image-offset-margin);
  }
  .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right),
  .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) {
    margin-right: var(--image-offset-margin);
  }
}
@media (min-width: 1300px) {
  .typography .captioned-image-container figure:has(> a.image2-offset-left),
  .typography.editor .captioned-image-container figure:has(> a.image2-offset-left) {
    margin-left: var(--image-offset-margin);
  }
  .typography .captioned-image-container figure:has(> a.image2-offset-right),
  .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) {
    margin-right: var(--image-offset-margin);
  }
}
@media (max-width: 1024px) {
  .typography,
  .typography.editor {
    /* Disable offset on mobile/tablet */
  }
  .typography .captioned-image-container figure:has(> a.image2-align-left),
  .typography.editor .captioned-image-container figure:has(> a.image2-align-left),
  .typography .captioned-image-container figure:has(> a.image2-align-right),
  .typography.editor .captioned-image-container figure:has(> a.image2-align-right) {
    float: none;
    margin: 1em auto;
    max-width: 100%;
    width: auto;
    padding: 0;
  }
  .typography .captioned-image-container figure:has(> a.image2-align-left.thefp),
  .typography.editor .captioned-image-container figure:has(> a.image2-align-left.thefp),
  .typography .captioned-image-container figure:has(> a.image2-align-right.thefp),
  .typography.editor .captioned-image-container figure:has(> a.image2-align-right.thefp) {
    margin: 1em auto;
  }
  .typography .captioned-image-container figure:has(> a.image2-offset-left),
  .typography.editor .captioned-image-container figure:has(> a.image2-offset-left),
  .typography .captioned-image-container figure:has(> a.image2-offset-right),
  .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) {
    margin: 1em auto;
  }
  .typography .captioned-image-container figure:has(> a.image2-align-left) .image2-inset,
  .typography.editor .captioned-image-container figure:has(> a.image2-align-left) .image2-inset,
  .typography .captioned-image-container figure:has(> a.image2-align-right) .image2-inset,
  .typography.editor .captioned-image-container figure:has(> a.image2-align-right) .image2-inset {
    display: block;
    justify-content: initial;
  }
}
@media (max-width: 768px) {
  .typography .markup div.sponsorship-campaign-embed,
  .typography.editor .markup div.sponsorship-campaign-embed {
    margin-top: 24px;
    margin-bottom: 24px;
  }
  .typography .markup div.sponsorship-campaign-embed:first-child,
  .typography.editor .markup div.sponsorship-campaign-embed:first-child {
    margin-top: 0px;
  }
}
@media screen and (max-width: 650px) {
  .typography .markup div.youtube-overlay,
  .typography.editor .markup div.youtube-overlay,
  .typography .markup div.vimeo-overlay,
  .typography.editor .markup div.vimeo-overlay {
    display: none !important;
  }
}
@media screen and (max-width: 370px) {
  .typography .markup div.tiktok-wrap,
  .typography.editor .markup div.tiktok-wrap {
    width: calc(95vw - 32px);
    height: calc((95vw - 32px - 2px) / 0.485714);
  }
}
@media screen and (max-width: 650px) {
  .typography .markup div.embedded-publication-wrap .embedded-publication.show-subscribe,
  .typography.editor .markup div.embedded-publication-wrap .embedded-publication.show-subscribe {
    padding: 24px;
  }
}
@media screen and (max-width: 650px) {
  .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe,
  .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe,
  .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe,
  .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe,
  .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe,
  .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe {
    padding: 0px 24px;
  }
}
@media screen and (max-width: 650px) {
  .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button,
  .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button,
  .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button,
  .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button,
  .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button,
  .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button {
    padding: 10px 12px;
    min-width: 110px;
  }
}
@media (max-width: 650px) {
  .typography .markup .twitter-embed,
  .typography.editor .markup .twitter-embed,
  .typography .markup .tweet,
  .typography.editor .markup .tweet {
    padding: 12px;
  }
}
@media (max-width: 650px) {
  .typography .markup .twitter-embed .tweet-text,
  .typography.editor .markup .twitter-embed .tweet-text,
  .typography .markup .tweet .tweet-text,
  .typography.editor .markup .tweet .tweet-text {
    font-size: 14px;
    line-height: 20px;
  }
}
@media (max-width: 650px) {
  .typography .markup .twitter-embed .tweet-photos-container.two,
  .typography.editor .markup .twitter-embed .tweet-photos-container.two,
  .typography .markup .tweet .tweet-photos-container.two,
  .typography.editor .markup .tweet .tweet-photos-container.two,
  .typography .markup .twitter-embed .tweet-photos-container.three,
  .typography.editor .markup .twitter-embed .tweet-photos-container.three,
  .typography .markup .tweet .tweet-photos-container.three,
  .typography.editor .markup .tweet .tweet-photos-container.three,
  .typography .markup .twitter-embed .tweet-photos-container.four,
  .typography.editor .markup .twitter-embed .tweet-photos-container.four,
  .typography .markup .tweet .tweet-photos-container.four,
  .typography.editor .markup .tweet .tweet-photos-container.four {
    height: 200px;
  }
}
@media (max-width: 650px) {
  .typography .markup .twitter-embed a.expanded-link .expanded-link-img,
  .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-img,
  .typography .markup .tweet a.expanded-link .expanded-link-img,
  .typography.editor .markup .tweet a.expanded-link .expanded-link-img {
    max-height: 180px;
  }
}
@media (max-width: 650px) {
  .typography .markup .twitter-embed a.expanded-link .expanded-link-description,
  .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-description,
  .typography .markup .tweet a.expanded-link .expanded-link-description,
  .typography.editor .markup .tweet a.expanded-link .expanded-link-description {
    display: none;
  }
}
@media screen and (max-width: 650px) {
  .typography .markup .apple-podcast-container,
  .typography.editor .markup .apple-podcast-container {
    width: unset;
  }
}
@media (max-width: 420px) {
  .typography .markup .install-substack-app-embed img.install-substack-app-embed-img,
  .typography.editor .markup .install-substack-app-embed img.install-substack-app-embed-img {
    margin: 0 auto 16px auto;
  }
}
@media (max-width: 420px) {
  .typography .markup .install-substack-app-embed .install-substack-app-embed-text,
  .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-text {
    margin: 0 0 12px 0;
    max-width: 100%;
    width: auto;
    text-align: center;
  }
}
@media (max-width: 420px) {
  .typography .markup .install-substack-app-embed .install-substack-app-embed-link,
  .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-link {
    display: flex;
    justify-content: center;
  }
}
@media screen and (min-width: 481px) {
  .share-button-container {
    height: 38px;
  }
}
@media screen and (min-width: 481px) {
  .share-button-container a.comment {
    height: 38px;
    line-height: 38px;
    padding-right: 10px;
  }
}
@media screen and (max-width: 480px) {
  .share-button-container .separator {
    display: block;
    margin: 0;
    height: 8px;
    border-left: none;
  }
}
@media screen and (max-width: 480px) {
  .share-button-container a.share.first img {
    padding-left: 0;
  }
}
@media screen and (min-width: 481px) {
  .share-button-container a.mobile {
    display: none !important;
  }
}
@media screen and (min-width: 541px) {
  .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container {
    padding: 36px;
    height: 680px;
  }
}
@media screen and (min-width: 541px) {
  .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container .footer {
    position: absolute;
    bottom: 36px;
    margin: 0px;
  }
}
@media screen and (max-width: 650px) {
  .header-anchor-parent {
    display: none;
  }
}
@media screen and (max-width: 768px) {
  .post {
    padding: 16px 0 0 0;
  }
}
@media screen and (max-width: 650px) {
  .post .post-header .post-label {
    margin-top: 8px;
  }
}
@media screen and (max-width: 650px) {
  .post .post-header .meta-author-wrap.alternative-meta .meta-right-column .post-meta {
    margin-top: 6px;
  }
}
@media screen and (max-width: 650px) {
  .post .footer-facepile-container {
    height: 64px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
  }
}
@media screen and (max-width: 650px) {
  .post .post-footer.use-separators {
    justify-content: center;
  }
}
@media screen and (max-width: 650px) {
  .post .post-footer.next-prev {
    height: 64px;
    justify-content: space-between;
    box-sizing: border-box;
  }
}
@media screen and (max-width: 650px) {
  .post-contributor-footer .post-contributor-bio-table {
    display: block;
  }
  .post-contributor-footer .post-contributor-bio-table-row {
    display: flex;
    flex-direction: row;
  }
  .post-contributor-footer .post-contributor-bio-userhead-cell,
  .post-contributor-footer .post-contributor-bio-body-cell {
    display: block;
  }
  .post-contributor-footer .post-contributor-bio-body-cell {
    flex-grow: 1;
  }
  .post-contributor-footer .post-contributor-bio-body-table {
    display: block;
  }
  .post-contributor-footer .post-contributor-bio-body-table-row {
    display: block;
  }
  .post-contributor-footer .post-contributor-bio-copy-cell,
  .post-contributor-footer .post-contributor-bio-controls-cell {
    display: block;
  }
  .post-contributor-footer .post-contributor-bio-copy-cell {
    margin: 0 0 16px 0;
  }
  .post-contributor-footer .post-contributor-bio-controls-cell {
    width: auto;
  }
  .post-contributor-footer .post-contributor-bio-controls {
    margin: auto;
  }
  .post-contributor-footer .post-contributor-bio-controls .button.primary {
    width: 100%;
  }
  .post-contributor-footer .post-contributor-bio-text {
    font-size: 14px;
  }
}
@media screen and (min-width: 768px) {
  .post-silhouette {
    padding: 32px 0;
  }
}
@media screen and (max-width: 650px) {
  .post-silhouette .post-silhouette-title {
    margin-top: 10.44225025px;
    height: 120px;
  }
}
@media screen and (max-width: 650px) {
  .post-silhouette .post-silhouette-meta {
    width: 75%;
  }
}
@media screen and (max-width: 650px) {
  .post-silhouette .post-silhouette-meta.with-byline-image {
    margin: 20px 0;
  }
}
@media screen and (max-width: 650px) {
  .use-theme-bg .post-meta.alternative-meta .post-meta-item,
  .post-meta.alternative-meta .post-meta-item {
    padding-right: 16px;
  }
}
@media screen and (max-width: 370px) {
  .use-theme-bg .post-meta.alternative-meta .post-meta-item,
  .post-meta.alternative-meta .post-meta-item {
    font-size: 14px;
  }
}
@media screen and (max-width: 650px) {
  .use-theme-bg .post-meta.alternative-meta .post-meta-item.guest-author-publication,
  .post-meta.alternative-meta .post-meta-item.guest-author-publication {
    display: none;
  }
}
@media screen and (max-width: 370px) {
  .post-meta .post-meta-item .post-meta-button {
    height: 36px !important;
    /* important to override in-line height style on emails */
  }
  .post-meta .post-meta-item .post-meta-button .meta-button-label {
    display: none;
  }
  .post-meta .post-meta-item .post-meta-button > svg {
    margin-right: 0;
  }
}
@media screen and (max-width: 370px) {
  .post-meta .post-meta-item {
    font-size: 12px;
  }
}
@media screen and (max-width: 650px) {
  .post .floating-subscribe-button {
    bottom: 20px;
    right: 20px;
  }
}
@media (max-width: 1024px) {
  body .pullquote-align-left,
  body .pullquote-align-right,
  body .pullquote-align-wide,
  body .pullquote-align-center {
    float: none;
    margin: 0 auto;
    width: 100%;
    max-width: 100%;
  }
}
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  body .markup table.image-wrapper img,
  body .markup table.kindle-wrapper img {
    max-width: 550px;
  }
}
@media (min-width: 1024px) {
  body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) {
    margin-left: var(--image-offset-margin);
  }
  body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) {
    margin-right: var(--image-offset-margin);
  }
}
@media (min-width: 1300px) {
  body .captioned-image-container figure:has(> a.image2-offset-left) {
    margin-left: var(--image-offset-margin);
  }
  body .captioned-image-container figure:has(> a.image2-offset-right) {
    margin-right: var(--image-offset-margin);
  }
}
@media (max-width: 1024px) {
  body {
    /* Disable offset on mobile/tablet */
  }
  body .captioned-image-container figure:has(> a.image2-align-left),
  body .captioned-image-container figure:has(> a.image2-align-right) {
    float: none;
    margin: 1em auto;
    max-width: 100%;
    width: auto;
    padding: 0;
  }
  body .captioned-image-container figure:has(> a.image2-align-left.thefp),
  body .captioned-image-container figure:has(> a.image2-align-right.thefp) {
    margin: 1em auto;
  }
  body .captioned-image-container figure:has(> a.image2-offset-left),
  body .captioned-image-container figure:has(> a.image2-offset-right) {
    margin: 1em auto;
  }
  body .captioned-image-container figure:has(> a.image2-align-left) .image2-inset,
  body .captioned-image-container figure:has(> a.image2-align-right) .image2-inset {
    display: block;
    justify-content: initial;
  }
}
@media (max-width: 768px) {
  body .markup div.sponsorship-campaign-embed {
    margin-top: 24px;
    margin-bottom: 24px;
  }
  body .markup div.sponsorship-campaign-embed:first-child {
    margin-top: 0px;
  }
}
@media screen and (max-width: 650px) {
  body .markup div.youtube-overlay,
  body .markup div.vimeo-overlay {
    display: none !important;
  }
}
@media screen and (max-width: 370px) {
  body .markup div.tiktok-wrap {
    width: calc(95vw - 32px);
    height: calc((95vw - 32px - 2px) / 0.485714);
  }
}
@media screen and (max-width: 650px) {
  body .markup div.embedded-publication-wrap .embedded-publication.show-subscribe {
    padding: 24px;
  }
}
@media screen and (max-width: 650px) {
  body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe,
  body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe,
  body .markup div.captioned-button-wrap .subscription-widget.show-subscribe {
    padding: 0px 24px;
  }
}
@media screen and (max-width: 650px) {
  body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button,
  body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button,
  body .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button {
    padding: 10px 12px;
    min-width: 110px;
  }
}
@media (max-width: 650px) {
  body .markup .twitter-embed,
  body .markup .tweet {
    padding: 12px;
  }
}
@media (max-width: 650px) {
  body .markup .twitter-embed .tweet-text,
  body .markup .tweet .tweet-text {
    font-size: 14px;
    line-height: 20px;
  }
}
@media (max-width: 650px) {
  body .markup .twitter-embed .tweet-photos-container.two,
  body .markup .tweet .tweet-photos-container.two,
  body .markup .twitter-embed .tweet-photos-container.three,
  body .markup .tweet .tweet-photos-container.three,
  body .markup .twitter-embed .tweet-photos-container.four,
  body .markup .tweet .tweet-photos-container.four {
    height: 200px;
  }
}
@media (max-width: 650px) {
  body .markup .twitter-embed a.expanded-link .expanded-link-img,
  body .markup .tweet a.expanded-link .expanded-link-img {
    max-height: 180px;
  }
}
@media (max-width: 650px) {
  body .markup .twitter-embed a.expanded-link .expanded-link-description,
  body .markup .tweet a.expanded-link .expanded-link-description {
    display: none;
  }
}
@media screen and (max-width: 650px) {
  body .markup .apple-podcast-container {
    width: unset;
  }
}
@media (max-width: 420px) {
  body .markup .install-substack-app-embed img.install-substack-app-embed-img {
    margin: 0 auto 16px auto;
  }
}
@media (max-width: 420px) {
  body .markup .install-substack-app-embed .install-substack-app-embed-text {
    margin: 0 0 12px 0;
    max-width: 100%;
    width: auto;
    text-align: center;
  }
}
@media (max-width: 420px) {
  body .markup .install-substack-app-embed .install-substack-app-embed-link {
    display: flex;
    justify-content: center;
  }
}
@media screen and (min-width: 500px) {
  body .header a.logo {
    width: 42px;
    height: 42px;
    border-radius: 12px;
  }
}
@media screen and (max-width: 420px) {
  body .subscription-receipt table:first-of-type .subscription-amount .subscription-discount {
    width: 72px !important;
  }
}
@media screen and (min-width: 481px) {
  body .share-button-container {
    height: auto;
  }
}
@media screen and (max-width: 480px) {
  body .share-button-container .separator {
    display: block !important;
    margin: 0 !important;
    height: 8px !important;
    border-left: none !important;
  }
}
@media screen and (max-width: 650px) {
  .digest .item .post-meta-item.audience {
    display: none;
  }
}
@media screen and (min-width: 500px) {
  .digest-publication .logo img {
    width: 42px;
    height: 42px;
    border-radius: 8px;
  }
}
@media screen and (max-width: 650px) {
  .comments-page .container .comment-list .collapsed-reply {
    margin-left: calc(10 + 32px - 24px);
  }
}
@media screen and (max-width: 650px) {
  .comment > .comment-list {
    padding-left: 24px;
  }
}
@media screen and (max-width: 650px) {
  .finish-magic-login-modal .modal-content .container {
    padding: 24px 0;
  }
}
@media (max-width: 650px) {
  .reader2-text-b3 {
    line-height: 24px;
  }
}
@media screen and (max-width: 650px) {
  .reader2-text-h4 {
    line-height: 24px;
  }
}
@media screen and (min-width: 541px) {
  .user-profile-modal {
    padding-left: 12px;
    padding-right: 12px;
  }
}
@media screen and (max-width: 650px) {
  .subscribe-widget form.form .sideBySideWrap button.rightButton {
    padding: 10px 12px;
  }
}
@media screen and (min-width: 541px) {
  .pub-icon:hover .logo-hover,
  .feed-item-icon:hover .logo-hover {
    display: block;
  }
}
@media screen and (max-width: 650px) {
  .post-ufi.single-full-width-button .post-ufi-button-wrapper {
    width: 100%;
    padding: 16px;
  }
  .post-ufi.single-full-width-button .post-ufi-button-wrapper:empty {
    display: none;
  }
  .post-ufi.single-full-width-button .post-ufi-button {
    width: 100%;
    justify-content: center;
  }
}
@media screen and (max-width: 768px) {
  .file-embed-wrapper {
    padding: 0;
  }
}
@media screen and (max-width: 768px) {
  .file-embed-wrapper-editor {
    padding: 0;
  }
}
@media screen and (max-width: 768px) {
  .file-embed-wrapper-editor:active {
    padding: 0;
  }
}
@media only screen and (max-width: 650px) {
  .file-embed-button.wide,
  .file-embed-error-button.wide {
    display: none;
  }
}
@media only screen and (min-width: 630px) {
  .file-embed-button.narrow,
  .file-embed-error-button.narrow {
    display: none;
  }
}
@media screen and (min-width: 541px) {
  .audio-player-wrapper .audio-player {
    min-width: 500px;
  }
}
@media screen and (max-width: 650px) {
  .audio-player-wrapper .audio-player .audio-player-progress {
    border-left-width: 16px;
    border-right-width: 16px;
  }
}
@media screen and (max-width: 650px) {
  .audio-player-wrapper .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup {
    top: -54px;
  }
}
@media screen and (max-width: 650px) {
  .audio-player-wrapper-fancy .audio-player .audio-player-progress {
    border-left-width: 16px;
    border-right-width: 16px;
  }
}
@media screen and (max-width: 650px) {
  .audio-player-wrapper-fancy .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup {
    top: -54px;
  }
}
@media (min-width: 250px) {
  .audio-player-wrapper-fancy .audio-player {
    padding: 32px;
  }
  .audio-player-wrapper-fancy .audio-player .btn-group {
    display: flex;
  }
  .audio-player-wrapper-fancy .audio-player .btn-group .button:last-of-type {
    display: block;
  }
}
@media (min-width: 300px) {
  .audio-player-wrapper-fancy .audio-player .btn-group {
    display: block;
  }
  .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type {
    display: block;
  }
}
@media (min-width: 350px) {
  .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo {
    display: block;
  }
  .audio-player-wrapper-fancy .audio-player .audio-player-title {
    margin-top: 16px;
  }
  .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container {
    padding-top: 15%;
    width: 15%;
    display: block;
  }
  .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type {
    display: block;
  }
  .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo {
    display: block;
  }
}
@media (min-width: 350px) {
  .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container {
    padding-top: 25%;
    width: 25%;
    display: block;
  }
  .audio-player-wrapper-fancy .audio-player .btn-group {
    display: flex;
  }
  .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type {
    display: block;
  }
}
@media (min-width: 400px) {
  .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container {
    padding-top: 40%;
    width: 40%;
  }
}
@media (max-width: 400px) {
  .audio-player-wrapper-fancy .audio-player .btn-group {
    margin-top: 12px;
  }
  .audio-player-wrapper-fancy .audio-player .btn-group .button {
    font-size: 13px;
    padding: 6px 12px;
    height: auto;
    margin-top: 10px;
  }
}
@media (min-width: 600px) {
  .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container {
    padding-top: 55%;
    width: 55%;
  }
}
@media (max-width: 650px) {
  .poll-editor-modal {
    min-width: calc(100% - 20px);
  }
}
@media (max-width: 750px) {
  .poll-embed .poll-anchor-target .poll-anchor-copy-button {
    left: 8px;
    top: 45px;
  }
}</style></head><body class="email-body" style="font-kerning: auto;--image-offset-margin: -120px;"><img src="https://eotrx.substackcdn.com/o/9039a66b6e6e8909/p.gif?token=eyJtIjoiPDIwMjYwNDAzMTM1OTE4LjMuYzRmZGFhZjExZWE2MDEwZkBtZy1kMC5zdWJzdGFjay5jb20-IiwidSI6MjAyODc0ODIyLCJyIjoicGxhc21hdG9pZEBnbWFpbC5jb20iLCJkIjoibWctZDAuc3Vic3RhY2suY29tIiwicCI6MTkzMDcxODU1LCJ0IjoibmV3c2xldHRlciIsImEiOiJvbmx5X2ZyZWUiLCJzIjo0NTg3MDksImMiOiJwb3N0IiwiZiI6dHJ1ZSwicG9zaXRpb24iOiJ0b3AiLCJpYXQiOjE3NzUyMjUyNTQsImV4cCI6MTc3NzgxNzI1NCwiaXNzIjoicHViLTAiLCJzdWIiOiJlbyJ9.DxAdgmQWBBLA86X1l9hflzZI1zQSIlnibD6cLpXIfuM" alt="" width="1" height="1" border="0" style="height:1px !important;width:1px !important;border-width:0 !important;margin-top:0 !important;margin-bottom:0 !important;margin-right:0 !important;margin-left:0 !important;padding-top:0 !important;padding-bottom:0 !important;padding-right:0 !important;padding-left:0 !important;"/><div class="preview" style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Availability has dropped to one nine (~90% &#8211; !!), partly due to not being able to handle increased traffic from AI coding agents. There&#8217;s also no CEO and an apparent lack of direction.</div><div class="preview" style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;</div><table class="email-body-container" role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td></td><td class="content" width="550"></td><td></td></tr><tr><td></td><td class="content" width="550" align="left"><div style="font-size: 16px;line-height: 26px;max-width: 550px;width: 100%;margin: 0 auto;overflow-wrap: break-word;"><table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td align="right" style="height:20px;"><table role="presentation" width="auto" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td style="vertical-align:middle;"><span class="pencraft pc-reset reset-IxiVJZ tw-font-body tw-text-ssm tw-text-substack-secondary" style="font-family: SF Pro Text, -apple-system, system-ui, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;font-size: 13px;color: unset;list-style: none;text-decoration: unset;margin: 0;"><div class="pencraft pc-reset align-right-VJbKw5 size-12-mmZ61m reset-IxiVJZ" style="list-style: none;color: unset;text-align: right;font-size: 12px;line-height: 16px;text-decoration: unset;margin: 0;"><span class="pencraft pc-reset reset-IxiVJZ" translated="" style="list-style: none;color: unset;text-decoration: unset;margin: 0;">Forwarded this email? <a class="pencraft pc-reset decoration-underline-ClTkYc reset-IxiVJZ" href="https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9uZXdzbGV0dGVyLnByYWdtYXRpY2VuZ2luZWVyLmNvbS9zdWJzY3JpYmU_dXRtX3NvdXJjZT1lbWFpbCZ1dG1fY2FtcGFpZ249ZW1haWwtc3Vic2NyaWJlJnI9M2NzYjdxJm5leHQ9aHR0cHMlM0ElMkYlMkZuZXdzbGV0dGVyLnByYWdtYXRpY2VuZ2luZWVyLmNvbSUyRnAlMkZkb2VzLWdpdGh1Yi1zdGlsbC1tZXJpdC10b3AtZ2l0LXBsYXRmb3JtIiwicCI6MTkzMDcxODU1LCJzIjo0NTg3MDksImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzc1MjI1MjU0LCJleHAiOjIwOTA4MDEyNTQsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.S-ZDboaAjYOPupz_rNKlYAY-pAqBAIn_YtuwJ27spl8?" style="list-style: none;color: unset;text-decoration: unset;margin: 0;-webkit-text-decoration-line: underline;text-decoration-line: underline;">Subscribe here</a> for more</span></div></span></td></tr></tbody></table></td></tr></tbody></table><table class="header graphic-header" role="presentation" style="border-spacing: 0;padding: 16px 0 32px;"><tbody><tr><td align="center" style="text-align: center;padding: 0;"><a href="https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9uZXdzbGV0dGVyLnByYWdtYXRpY2VuZ2luZWVyLmNvbS9wL2RvZXMtZ2l0aHViLXN0aWxsLW1lcml0LXRvcC1naXQtcGxhdGZvcm0_dXRtX2NhbXBhaWduPWVtYWlsLWhhbGYtcG9zdCZyPTNjc2I3cSZ0b2tlbj1leUoxYzJWeVgybGtJam95TURJNE56UTRNaklzSW5CdmMzUmZhV1FpT2pFNU16QTNNVGcxTlN3aWFXRjBJam94TnpjMU1qSTFNalUwTENKbGVIQWlPakUzTnpjNE1UY3lOVFFzSW1semN5STZJbkIxWWkwME5UZzNNRGtpTENKemRXSWlPaUp3YjNOMExYSmxZV04wYVc5dUluMC5SNFZfVXN6am16V3VNVUl0Ulp4c3k0OTBNQWFLcGVfVTBheE5tSThEMXAwIiwicCI6MTkzMDcxODU1LCJzIjo0NTg3MDksImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzc1MjI1MjU0LCJleHAiOjIwOTA4MDEyNTQsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.uiDpqldEjG763ENOA_0jZfBIojgOAh8R1fIhy6s58s8?"><img class="header-image" role="presentation" width="550" height="110" src="https://substackcdn.com/image/fetch/$s_!XLTi!,w_1100,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F3f6c431d-310a-45a0-90fe-3dc43354ef38_1100x220.png" style="border: none !important;vertical-align: middle;max-width: 550px;display: block;margin: 0 auto;height: auto;width: 100%;"></a></td></tr></tbody></table><div class="post typography" dir="auto" style="--image-offset-margin: -120px;padding: 32px 0 0 0;font-size: 16px;line-height: 26px;"><div class="post-header" role="region" aria-label="Post header" style="font-size: 16px;line-height: 26px;"><h1 class="post-title published title-X77sOw" dir="auto" style="direction: auto;text-align: start;unicode-bidi: isolate;color: rgb(54,55,55);font-family: Lora,sans-serif;font-weight: 600;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: antialiased;-webkit-appearance: optimizelegibility;-moz-appearance: optimizelegibility;appearance: optimizelegibility;margin: 0;line-height: 36px;font-size: 32px;"><a href="https://substack.com/app-link/post?publication_id=458709&post_id=193071855&utm_source=post-email-title&utm_campaign=email-post-title&isFreemail=true&r=3csb7q&token=eyJ1c2VyX2lkIjoyMDI4NzQ4MjIsInBvc3RfaWQiOjE5MzA3MTg1NSwiaWF0IjoxNzc1MjI1MjU0LCJleHAiOjE3Nzc4MTcyNTQsImlzcyI6InB1Yi00NTg3MDkiLCJzdWIiOiJwb3N0LXJlYWN0aW9uIn0.R4V_UszjmzWuMUItRZxsy490MAaKpe_U0axNmI8D1p0" style="color: rgb(54,55,55);text-decoration: none;">Does GitHub still merit &#8220;top git platform for AI-native development&#8221; status?</a></h1><h3 class="subtitle subtitle-HEEcLo" dir="auto" style="direction: auto;text-align: start;unicode-bidi: isolate;font-family: 'SF Pro Display',-apple-system-headline,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';font-weight: normal;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: antialiased;-webkit-appearance: optimizelegibility;-moz-appearance: optimizelegibility;appearance: optimizelegibility;margin: 4px 0 0;color: #777777;line-height: 24px;font-size: 18px;margin-top: 12px;">Availability has dropped to one nine (~90% &#8211; !!), partly due to not being able to handle increased traffic from AI coding agents. There&#8217;s also no CEO and an apparent lack of direction.</h3><table class="post-meta" role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 1em 0;height: 20px;align-items: center;"><tbody><tr><
```

*(truncated at 50KB — full body is 105891 bytes, sha256 is of the full body)*