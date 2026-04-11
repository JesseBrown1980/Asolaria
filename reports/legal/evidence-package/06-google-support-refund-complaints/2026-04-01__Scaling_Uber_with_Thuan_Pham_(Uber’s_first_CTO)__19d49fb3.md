---
gmail_message_id: 19d49fb3784d7b9b
account: plasmatoid@gmail.com
date_header: Wed, 1 Apr 2026 16:49:59 +0000
from: The Pragmatic Engineer <pragmaticengineer@substack.com>
to: plasmatoid@gmail.com
subject: Scaling Uber with Thuan Pham (Uber’s first CTO)
body_sha256: 892b0abfc22086bf9859b599403bf33adbbc2e85119243521e921e12e5a69565
snippet: Thuan Pham (Uber&#39;s first CTO) on scaling Uber from constant outages to global infrastructure, the shift to microservices and platform teams, and how AI is reshaping engineering. ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏
---

# Scaling Uber with Thuan Pham (Uber’s first CTO)

**From:** The Pragmatic Engineer <pragmaticengineer@substack.com>
**To:** plasmatoid@gmail.com
**Date:** Wed, 1 Apr 2026 16:49:59 +0000
**SHA256:** `892b0abfc22086bf9859b599403bf33adbbc2e85119243521e921e12e5a69565`

## Body (extracted text)

View this post on the web at https://newsletter.pragmaticengineer.com/p/scaling-uber-with-thuan-pham-ubers Stream the latest episode Listen and watch now on YouTube [ https://substack.com/redirect/efc79d3b-c79f-47f9-9348-7fcc90b78878?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], Spotify [ https://substack.com/redirect/627e7155-d2c7-4839-9aac-54d117033de3?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], and Apple [ https://substack.com/redirect/448b9ae5-0b98-45a7-806f-95bfe9d0b65d?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. See the episode transcript at the top of this page, and timestamps for the episode at the bottom. Brought to You by • Statsig [ https://substack.com/redirect/06130039-2728-4625-be67-e756d35fbf91?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – ⁠ The unified platform for flags, analytics, experiments, and more.Stop switching between different tools, and have them all in one place. • WorkOS [ https://substack.com/redirect/dc73132e-2db1-45e1-9bd7-564e6aa65c10?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – Everything you need to make your app enterprise ready. WorkOS gives you APIs to ship enterprise features in days: features like authentication, SSO, SCIM, RBAC, audit logs. Visit WorkOS.com [ https://substack.com/redirect/5aa026e0-cb2a-4e53-a0c9-c6ae4a06a046?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Sonar [ https://substack.com/redirect/27b3e86c-4a82-4a94-a578-b28c823e2616?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – The makers of SonarQube, the industry standard for automated code review. Sonar [ https://substack.com/redirect/27b3e86c-4a82-4a94-a578-b28c823e2616?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] helps reduce outages, improve security, and lower risks associated with AI and agentic coding. See how SonarQube Advanced Security [ https://substack.com/redirect/37be520a-bc28-4cda-ae0c-07095a674653?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] is empowering the Agent Centric Development Cycle (AC/DC) with new capabilities like malicious package detection to provide the same rigorous guardrails for AI agents as you would for a human developer. In this episode Thuan Pham [ https://substack.com/redirect/1fa27a5b-a1f4-4919-a0de-902d26c1d17e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] was Uber’s first and longest-serving CTO, and today he’s the CTO of Faire, a B2B wholesale platform. Back when Thuan joined Uber, it had around 40 engineers and 30,000 rides per day, and the system crashed multiple times a week. Over seven years, he helped rebuild the system, move it from a monolith to microservices, and scaled the engineering organization behind it. I had the privilege of working with Thuan for four of those seven years. Later, the very first issue of The Pragmatic Engineer newsletter was a deepdive into Uber’s Program and Platform split [ https://substack.com/redirect/b78da17f-6b6e-4981-a0d3-2d3f067f94bc?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. This episode of the podcast contains a nice “full circle” moment, where Thuan shares even more details about why Uber chose to embrace that structure. We discuss what it takes to operate and build in that kind of environment. Thuan explains how he divided his time at Uber into three “tours of duty,” from stabilizing a fragile system, to re-architecting it, and scaling the org. We go deep into the platform-and-program split, the Helix app rewrite, and what it took to launch Uber in China in just five months (the original estimate was 18 months). We also cover Uber’s in-house tools and explain why they were necessary to support rapid growth. Finally, we discuss his role today as CTO of Faire, how the company is using AI, and how he sees AI changing software engineering. Key observation from Thuan 14 takeaways from Thuan that I find the most interesting: 1. Your professional reputation is a compounding asset that pays off unpredictably. Bill Gurley recruited Thuan to Uber based on knowing him from a startup a decade earlier. Similarly, when Thuan needed to hire for critical infrastructure teams at Uber, he reached out to engineers at VMware whom he’d previously worked with, and they followed him to the ridesharing app because they trusted him. 2. The program/platform split came before microservices. The concept of cross-functional “program” teams and dedicated “platform” teams became necessary because an org split across backend, frontend and mobile engineers slowed down in execution speed when Uber grew to around 100 engineers. Every feature required negotiating bandwidth across the mobile, backend, and dispatch teams. Thuan, Travis Kalanick, and Jeff Holden literally used color-coded sticky notes with people’s names to reorganize into self-sufficient teams. We cover more about this split in the deepdive, The Platform and Program split at Uber. [ https://substack.com/redirect/b78da17f-6b6e-4981-a0d3-2d3f067f94bc?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] 3. Microservices at Uber were more about surviving hypergrowth than anything else. Uber needed to decompose its massive monolith called “API.” To do so, a simple rule was applied: anything new needed to be built outside of the monolith so that no team blocked another. Teams started to build microservices, but decomposing the monolith took a good two years. Fun fact: in 2026, Uber has somewhat fewer microservices (around 4,500) than back in 2016 (around 5,000). 4. When retiring a monolith, sometimes it gets even bigger before shrinking. After Uber decided to pull services out of the massive monolith, it still kept growing because the business kept adding features! There was an ugly middle phase before the monolith started to shrink. Keep this in mind if you look into decomposing a monolith. 5. Expect multiple rewrites during hypergrowth. The right architecture depends on how fast a product and company are growing. At Uber, repeated rewrites were common because each one “bought” another window of survival for the company. Thuan’s recommendation is to understand that a rewrite simply means a company is outrunning its existing architecture: this is not necessarily a bad thing! 6. Controversial launch advice: start with the hardest launch first. When Uber rolled out in China, Travis insisted on starting with Chengdu, the largest launch city. Looking back, it was scary but also helpful, as launching in the “hardest” city first gave the team confidence and made subsequent city launches much easier. 7. Travis Kalanick spent 30+ hours interviewing Thuan. This took place over two weeks, as a series of one-on-ones. The sessions became a simulation of working together: disagreeing, aligning, and working things out. I’ve yet to hear of such an intense – and technical! – recruitment process by another CEO. 8. Uber is the only major company that had a “Senior 1” and “Senior 2” level – and Thuan is unapologetic. Thuan introduced the Senior 1 (L5A) and Senior 2 (L5B) levels because the jump from senior (L5) to Staff (L6) became very big, and larger than between previous levels. One problem this split level created was that Uber’s L5B was akin to Google’s and Facebook’s L6/E6. Thuan resisted the title inflation of just renaming L5B to ‘Staff’. 9. Name your services clearly; you don’t work at a “Mickey Mouse shop.” As Uber grew more complex, whimsical service names (like “Mustafa”) made navigating systems more tricky, and onboarding for new joiners more painful. Thuan sent a company-wide email which called for professional-sounding naming conventions, and reminded everyone that Uber was not a “Mickey Mouse shop.” The email didn’t fully solve the issue, but did force the growing org to take itself more seriously. 10. Great engineering talent is global, so bring the opportunity to developers. During Thuan’s time, Uber opened nine engineering offices worldwide in order to access world-class talent. For example, the relatively small Denmark office built and operated core parts of Uber’s infrastructure, such as the trip datastore, Schemaless [ https://substack.com/redirect/050d93d0-4691-48fe-b7f7-55e4e64d3edb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. 11. What’s the most important part of a CTO’s job? Thuan thinks that it’s to build a high-talent-density team, and to “see around the corner” 18–24 months in advance. As he puts it: “your team handles the six-month problems, while you figure out what the organization needs to look like two years from now.” 12. The hardest use case of AI in software engineering is building new features on legacy codebases. At Faire, Thuan’s team uses “swarm coding” (orchestrated AI agents working in parallel) and some engineers there have doubled their output in three months. But generating greenfield code is easy; the real challenge is dealing with millions of lines of code and building features on top with all those existing dependencies. 13. AI raises the floor, but doesn’t change what makes engineers great. AI enables people who can’t code to produce decent apps, but great engineers are still finding ways to leverage AI tools and accelerate even more. The differentiators remain the same as before AI: curiosity, fearlessness, and a willingness to innovate and learn new things. 14. Thuan’s career advice: think of it in phases. Each segment of your career has different priorities, which Thuan sees like this: First 5–10 years: seek maximum learning and push yourself hard. Mid-career as a senior/staff engineer: seek roles to make an outsized impact in, perhaps at a smaller company. In leadership roles: teach and coach others, and bring them along with you. The Pragmatic Engineer deepdives relevant for this episode How Uber uses AI for development: inside look [ https://substack.com/redirect/21227aaf-6942-4e9b-b573-b79e6f737dca?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] The Platform and Program split at Uber [ https://substack.com/redirect/b78da17f-6b6e-4981-a0d3-2d3f067f94bc?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] How Uber is measuring engineering productivity [ https://substack.com/redirect/e127bca5-7a2b-495f-bf61-bdcd23419f6c?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Inside Uber’s move to the cloud [ https://substack.com/redirect/bc7b148d-35ec-4eba-bbd9-76bd386a84ea?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Uber’s crazy YOLO app rewrite, from the front seat [ https://substack.com/redirect/a6d34f63-72eb-4eb7-867f-daf44831ccbe?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] How Uber built its observability platform [ https://substack.com/redirect/2dcce228-8481-48e2-b1af-116f0ad5be86?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Developer experience at Uber [ https://substack.com/redirect/3cdbb56c-04ea-4a3f-bab0-ec351035b943?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] with Gautam Korlam Uber’s engineering level change [ https://substack.com/redirect/0964d773-d311-40ed-8401-71b61ca7ef69?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Timestamps (00:00 [ https://substack.com/redirect/1d41f4e2-2690-4ba6-8f7e-19d4c669565c?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Intro (05:32 [ https://substack.com/redirect/714108b4-fe10-4b87-98f5-dc0f60007132?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Getting into tech (16:09 [ https://substack.com/redirect/fca7c536-dbad-4f77-9504-074a8af3fb33?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The dot-com bust (20:42 [ https://substack.com/redirect/0628ed5c-7d19-4cb6-8589-3dadae190584?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) VMware (26:29 [ https://substack.com/redirect/5dc4672d-02a0-42d8-9719-8dabe6593200?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Getting hired by Travis at Uber (33:22 [ https://substack.com/redirect/ca61543e-4555-4f00-a467-a4fe85aa1062?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Early days at Uber and scaling challenges (40:57 [ https://substack.com/redirect/9ba6a7d4-5696-4db2-8924-d7075d2b4ea8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Uber’s China launch (47:12 [ https://substack.com/redirect/a42f05fb-75ca-41cb-9337-4efe6dcb0170?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The platform and program split (50:26 [ https://substack.com/redirect/f1053159-0e0c-4494-a937-5b909aef36a4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) From monolith to microservices (53:38 [ https://substack.com/redirect/f8092550-68c5-4d14-95cb-5909765d938f?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Internal tools at Uber (57:05 [ https://substack.com/redirect/459acae9-1a53-4402-afc2-4b0bf9589beb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Helix: Uber’s mobile app rewrite (59:55 [ https://substack.com/redirect/4a4da544-b7b4-49fd-bf7f-55b719f48ead?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Thuan’s email about naming (1:02:03 [ https://substack.com/redirect/7243e7a1-5f42-43c9-8c42-759b6ed43d88?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Org structure changes under (1:06:34 [ https://substack.com/redirect/aa86ded9-51c6-4b49-aa5d-ab03a01fc187?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Thuan’s work philosophy (1:12:23 [ https://substack.com/redirect/0fb3715f-cf7f-4392-b38a-8df8aae1ba76?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The “three tours of duty” at Uber (1:15:37 [ https://substack.com/redirect/bc0ef404-e1e2-4557-99b2-8c98892cdce8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Why Thuan left Uber (1:17:34 [ https://substack.com/redirect/7be66b71-bfb7-4c77-8d81-fee7600704f0?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Coupang and Nubank (1:21:59 [ https://substack.com/redirect/cfc57253-15c7-4cc8-8c5d-4a7cd9a83700?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Faire (1:25:31 [ https://substack.com/redirect/c1d663bb-b2ae-4a82-b593-20d97b5b47e2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) How Faire uses AI (1:28:24 [ https://substack.com/redirect/e3866bce-cba4-4d52-b354-c500c8bd5818?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) AI’s impact on software engineering (1:31:09 [ https://substack.com/redirect/189e2aa6-1aed-4063-9de4-d1a89b9a75ca?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The role of the CTO (1:35:13 [ https://substack.com/redirect/e0d95de2-f759-468a-988a-dcb1593b1dda?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Career advice References Where to find Thuan Pham: • LinkedIn: https://www.linkedin.com/in/thuanqpham [ https://substack.com/redirect/cdd38e5c-af4c-4f68-87b4-b4e6526719f0?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Mentions during the episode: • HP Labs: https://www.hp.com/hk-en/shop/tech-takes/post/what-is-hp-labs [ https://substack.com/redirect/1e695a32-5592-4884-9340-3570b2226928?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Silicon Graphics: https://en.wikipedia.org/wiki/Silicon_Graphics [ https://substack.com/redirect/e222271c-8113-41da-8513-3dc486a77658?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Miro: https://miro.com [ https://substack.com/redirect/135c6054-11ef-4a92-b052-fa2513064c86?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • VMware: https://www.vmware.com [ https://substack.com/redirect/c4ad3a45-5828-410b-8bf0-2aa827c776d7?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Bill Gurley on LinkedIn: https://www.linkedin.com/in/billgurley [ https://substack.com/redirect/1e96d8be-137b-447c-a9e4-05f274552d3d?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Travis Kalanick on X: https://x.com/travisk [ https://substack.com/redirect/e03857ac-b394-48ec-9287-b5fc6a0c6575?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • DiDi: https://web.didiglobal.com [ https://substack.com/redirect/55e5605b-cd25-4215-8443-0fae75f030fb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • The Platform and Program Split at Uber: A Milestone Special: https://newsletter.pragmaticengineer.com/p/the-platform-and-program-split-at [ https://substack.com/redirect/8027fbfd-9701-43f1-ab4d-f3cb1d03e85e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Rewriting Uber Engineering: The Opportunities Microservices Provide: https://www.uber.com/blog/building-tincup-microservice-implementation [ https://substack.com/redirect/ee45fbaf-d068-40ee-bc03-98094b75a98c?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Up: Portable Microservices Ready for the Cloud: https://www.uber.com/blog/up-portable-microservices-ready-for-the-cloud [ https://substack.com/redirect/097073f3-45e5-4d03-b194-fe046b451a81?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • How Uber Built its Observability Platform: https://newsletter.pragmaticengineer.com/p/how-uber-built-its-observability-platform [ https://substack.com/redirect/2dcce228-8481-48e2-b1af-116f0ad5be86?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • The Uber Engineering Tech Stack, Part I: The Foundation: https://www.uber.com/blog/tech-stack-part-one-foundation [ https://substack.com/redirect/ff91a76f-b204-45c5-9142-f6c5516d2e34?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • How Ringpop from Uber Engineering Helps Distribute Your Application: https://www.uber.com/blog/ringpop-open-source-nodejs-library [ https://substack.com/redirect/d383a5ad-b68c-469f-9d12-cbfe48702488?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • PostgreSQL: https://en.wikipedia.org/wiki/PostgreSQL [ https://substack.com/redirect/49d98cd4-c76a-4171-b98f-78b43c2651cb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • MySQL: https://www.mysql.com [ https://substack.com/redirect/74ee7d64-a340-4a1c-a51e-e359babea13a?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Uber’s Crazy YOLO App Rewrite, From the Front Seat: https://blog.pragmaticengineer.com/uber-app-rewrite-yolo [ https://substack.com/redirect/c7cc9913-3040-4d3b-8cb1-a20faa7c1390?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Hypergrowth startups: Uber and CloudKitchens with Charles-Axel Dein: https://newsletter.pragmaticengineer.com/p/high-growth-startups-uber-and-cloudkitchens [ https://substack.com/redirect/c1b9e584-030d-40c9-b500-336b88b3e25e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Coupang: https://www.aboutcoupang.com [ https://substack.com/redirect/ed2b4b5e-2c04-4b0e-a741-8ec9792520d3?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Nubank: https://international.nubank.com.br [ https://substack.com/redirect/c1f51285-6e9d-4113-8518-8a6359bfe2e8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Max Rhodes on LinkedIn: https://www.linkedin.com/in/max-rhodes [ https://substack.com/redirect/7aa2ea41-825c-4419-beea-4e63fd2ce0a9?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Sequoia: https://sequoiacap.com [ https://substack.com/redirect/dbb3e165-0c83-4d3c-9960-318dbbe62cf7?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] • Wyan Gretzky’s quote: https://www.brainyquote.com/quotes/wayne_gretzky_383282 [ https://substack.com/redirect/19182aa1-3150-44db-82fd-0358ac6e4736?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] — Production and marketing by Pen Name [ https://substack.com/redirect/ff8dd3e6-3ff3-4be8-a906-2628415ae087?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. Unsubscribe https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9uZXdzbGV0dGVyLnByYWdtYXRpY2VuZ2luZWVyLmNvbS9hY3Rpb24vZGlzYWJsZV9lbWFpbD90b2tlbj1leUoxYzJWeVgybGtJam95TURJNE56UTRNaklzSW5CdmMzUmZhV1FpT2pFNU1qWTJOVGMxTUN3aWFXRjBJam94TnpjMU1EWXlOamt5TENKbGVIQWlPakU0TURZMU9UZzJPVElzSW1semN5STZJbkIxWWkwME5UZzNNRGtpTENKemRXSWlPaUprYVhOaFlteGxYMlZ0WVdsc0luMC5YX2tRS0N2QUxNa05oT2VZSm8xd09EUElLVTRDTXpaRG9aQ3hqTmhnTEM0IiwicCI6MTkyNjY1NzUwLCJzIjo0NTg3MDksImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzc1MDYyNjkyLCJleHAiOjIwOTA2Mzg2OTIsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.YFs2ZXZqQuz33k2kCK9Q0Dyjk4adlNvdHC9mba-JX1M? === HTML PART === Scaling Uber with Thuan Pham (Uber&#8217;s first CTO) @media (max-width: 1024px) { .typography .pullquote-align-left, .typography.editor .pullquote-align-left, .typography .pullquote-align-right, .typography.editor .pullquote-align-right, .typography .pullquote-align-wide, .typography.editor .pullquote-align-wide, .typography .pullquote-align-center, .typography.editor .pullquote-align-center { float: none; margin: 0 auto; width: 100%; max-width: 100%; } } @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) { .typography .markup table.image-wrapper img, .typography.editor .markup table.image-wrapper img, .typography .markup table.kindle-wrapper img, .typography.editor .markup table.kindle-wrapper img { max-width: 550px; } } @media (min-width: 1024px) { .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (min-width: 1300px) { .typography .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } .typography .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (max-width: 1024px) { .typography, .typography.editor { /* Disable offset on mobile/tablet */ } .typography .captioned-image-container figure:has(> a.image2-align-left), .typography.editor .captioned-image-container figure:has(> a.image2-align-left), .typography .captioned-image-container figure:has(> a.image2-align-right), .typography.editor .captioned-image-container figure:has(> a.image2-align-right) { float: none; margin: 1em auto; max-width: 100%; width: auto; padding: 0; } .typography .captioned-image-container figure:has(> a.image2-align-left.thefp), .typography.editor .captioned-image-container figure:has(> a.image2-align-left.thefp), .typography .captioned-image-container figure:has(> a.image2-align-right.thefp), .typography.editor .captioned-image-container figure:has(> a.image2-align-right.thefp) { margin: 1em auto; } .typography .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor .captioned-image-container figure:has(> a.image2-offset-left), .typography .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) { margin: 1em auto; } .typography .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, .typography.editor .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, .typography .captioned-image-container figure:has(> a.image2-align-right) .image2-inset, .typography.editor .captioned-image-container figure:has(> a.image2-align-right) .image2-inset { display: block; justify-content: initial; } } @media (max-width: 768px) { .typography .markup div.sponsorship-campaign-embed, .typography.editor .markup div.sponsorship-campaign-embed { margin-top: 24px; margin-bottom: 24px; } .typography .markup div.sponsorship-campaign-embed:first-child, .typography.editor .markup div.sponsorship-campaign-embed:first-child { margin-top: 0px; } } @media screen and (max-width: 650px) { .typography .markup div.youtube-overlay, .typography.editor .markup div.youtube-overlay, .typography .markup div.vimeo-overlay, .typography.editor .markup div.vimeo-overlay { display: none !important; } } @media screen and (max-width: 370px) { .typography .markup div.tiktok-wrap, .typography.editor .markup div.tiktok-wrap { width: calc(95vw - 32px); height: calc((95vw - 32px - 2px) / 0.485714); } } @media screen and (max-width: 650px) { .typography .markup div.embedded-publication-wrap .embedded-publication.show-subscribe, .typography.editor .markup div.embedded-publication-wrap .embedded-publication.show-subscribe { padding: 24px; } } @media screen and (max-width: 650px) { .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe, .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe { padding: 0px 24px; } } @media screen and (max-width: 650px) { .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button { padding: 10px 12px; min-width: 110px; } } @media (max-width: 650px) { .typography .markup .twitter-embed, .typography.editor .markup .twitter-embed, .typography .markup .tweet, .typography.editor .markup .tweet { padding: 12px; } } @media (max-width: 650px) { .typography .markup .twitter-embed .tweet-text, .typography.editor .markup .twitter-embed .tweet-text, .typography .markup .tweet .tweet-text, .typography.editor .markup .tweet .tweet-text { font-size: 14px; line-height: 20px; } } @media (max-width: 650px) { .typography .markup .twitter-embed .tweet-photos-container.two, .typography.editor .markup .twitter-embed .tweet-photos-container.two, .typography .markup .tweet .tweet-photos-container.two, .typography.editor .markup .tweet .tweet-photos-container.two, .typography .markup .twitter-embed .tweet-photos-container.three, .typography.editor .markup .twitter-embed .tweet-photos-container.three, .typography .markup .tweet .tweet-photos-container.three, .typography.editor .markup .tweet .tweet-photos-container.three, .typography .markup .twitter-embed .tweet-photos-container.four, .typography.editor .markup .twitter-embed .tweet-photos-container.four, .typography .markup .tweet .tweet-photos-container.four, .typography.editor .markup .tweet .tweet-photos-container.four { height: 200px; } } @media (max-width: 650px) { .typography .markup .twitter-embed a.expanded-link .expanded-link-img, .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-img, .typography .markup .tweet a.expanded-link .expanded-link-img, .typography.editor .markup .tweet a.expanded-link .expanded-link-img { max-height: 180px; } } @media (max-width: 650px) { .typography .markup .twitter-embed a.expanded-link .expanded-link-description, .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-description, .typography .markup .tweet a.expanded-link .expanded-link-description, .typography.editor .markup .tweet a.expanded-link .expanded-link-description { display: none; } } @media screen and (max-width: 650px) { .typography .markup .apple-podcast-container, .typography.editor .markup .apple-podcast-container { width: unset; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed img.install-substack-app-embed-img, .typography.editor .markup .install-substack-app-embed img.install-substack-app-embed-img { margin: 0 auto 16px auto; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed .install-substack-app-embed-text, .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-text { margin: 0 0 12px 0; max-width: 100%; width: auto; text-align: center; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed .install-substack-app-embed-link, .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-link { display: flex; justify-content: center; } } @media screen and (min-width: 481px) { .share-button-container { height: 38px; } } @media screen and (min-width: 481px) { .share-button-container a.comment { height: 38px; line-height: 38px; padding-right: 10px; } } @media screen and (max-width: 480px) { .share-button-container .separator { display: block; margin: 0; height: 8px; border-left: none; } } @media screen and (max-width: 480px) { .share-button-container a.share.first img { padding-left: 0; } } @media screen and (min-width: 481px) { .share-button-container a.mobile { display: none !important; } } @media screen and (min-width: 541px) { .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container { padding: 36px; height: 680px; } } @media screen and (min-width: 541px) { .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container .footer { position: absolute; bottom: 36px; margin: 0px; } } @media screen and (max-width: 650px) { .header-anchor-parent { display: none; } } @media screen and (max-width: 768px) { .post { padding: 16px 0 0 0; } } @media screen and (max-width: 650px) { .post .post-header .post-label { margin-top: 8px; } } @media screen and (max-width: 650px) { .post .post-header .meta-author-wrap.alternative-meta .meta-right-column .post-meta { margin-top: 6px; } } @media screen and (max-width: 650px) { .post .footer-facepile-container { height: 64px; padding: 0 16px; display: flex; align-items: center; justify-content: flex-start; width: 100%; } } @media screen and (max-width: 650px) { .post .post-footer.use-separators { justify-content: center; } } @media screen and (max-width: 650px) { .post .post-footer.next-prev { height: 64px; justify-content: space-between; box-sizing: border-box; } } @media screen and (max-width: 650px) { .post-contributor-footer .post-contributor-bio-table { display: block; } .post-contributor-footer .post-contributor-bio-table-row { display: flex; flex-direction: row; } .post-contributor-footer .post-contributor-bio-userhead-cell, .post-contributor-footer .post-contributor-bio-body-cell { display: block; } .post-contributor-footer .post-contributor-bio-body-cell { flex-grow: 1; } .post-contributor-footer .post-contributor-bio-body-table { display: block; } .post-contributor-footer .post-contributor-bio-body-table-row { display: block; } .post-contributor-footer .post-contributor-bio-copy-cell, .post-contributor-footer .post-contributor-bio-controls-cell { display: block; } .post-contributor-footer .post-contributor-bio-copy-cell { margin: 0 0 16px 0; } .post-contributor-footer .post-contributor-bio-controls-cell { width: auto; } .post-contributor-footer .post-contributor-bio-controls { margin: auto; } .post-contributor-footer .post-contributor-bio-controls .button.primary { width: 100%; } .post-contributor-footer .post-contributor-bio-text { font-size: 14px; } } @media screen and (min-width: 768px) { .post-silhouette { padding: 32px 0; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-title { margin-top: 10.44225025px; height: 120px; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-meta { width: 75%; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-meta.with-byline-image { margin: 20px 0; } } @media screen and (max-width: 650px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item, .post-meta.alternative-meta .post-meta-item { padding-right: 16px; } } @media screen and (max-width: 370px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item, .post-meta.alternative-meta .post-meta-item { font-size: 14px; } } @media screen and (max-width: 650px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item.guest-author-publication, .post-meta.alternative-meta .post-meta-item.guest-author-publication { display: none; } } @media screen and (max-width: 370px) { .post-meta .post-meta-item .post-meta-button { height: 36px !important; /* important to override in-line height style on emails */ } .post-meta .post-meta-item .post-meta-button .meta-button-label { display: none; } .post-meta .post-meta-item .post-meta-button > svg { margin-right: 0; } } @media screen and (max-width: 370px) { .post-meta .post-meta-item { font-size: 12px; } } @media screen and (max-width: 650px) { .post .floating-subscribe-button { bottom: 20px; right: 20px; } } @media (max-width: 1024px) { body .pullquote-align-left, body .pullquote-align-right, body .pullquote-align-wide, body .pullquote-align-center { float: none; margin: 0 auto; width: 100%; max-width: 100%; } } @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) { body .markup table.image-wrapper img, body .markup table.kindle-wrapper img { max-width: 550px; } } @media (min-width: 1024px) { body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (min-width: 1300px) { body .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } body .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (max-width: 1024px) { body { /* Disable offset on mobile/tablet */ } body .captioned-image-container figure:has(> a.image2-align-left), body .captioned-image-container figure:has(> a.image2-align-right) { float: none; margin: 1em auto; max-width: 100%; width: auto; padding: 0; } body .captioned-image-container figure:has(> a.image2-align-left.thefp), body .captioned-image-container figure:has(> a.image2-align-right.thefp) { margin: 1em auto; } body .captioned-image-container figure:has(> a.image2-offset-left), body .captioned-image-container figure:has(> a.image2-offset-right) { margin: 1em auto; } body .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, body .captioned-image-container figure:has(> a.image2-align-right) .image2-inset { display: block; justify-content: initial; } } @media (max-width: 768px) { body .markup div.sponsorship-campaign-embed { margin-top: 24px; margin-bottom: 24px; } body .markup div.sponsorship-campaign-embed:first-child { margin-top: 0px; } } @media screen and (max-width: 650px) { body .markup div.youtube-overlay, body .markup div.vimeo-overlay { display: none !important; } } @media screen and (max-width: 370px) { body .markup div.tiktok-wrap { width: calc(95vw - 32px); height: calc((95vw - 32px - 2px) / 0.485714); } } @media screen and (max-width: 650px) { body .markup div.embedded-publication-wrap .embedded-publication.show-subscribe { padding: 24px; } } @media screen and (max-width: 650px) { body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, body .markup div.captioned-button-wrap .subscription-widget.show-subscribe { padding: 0px 24px; } } @media screen and (max-width: 650px) { body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, body .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button { padding: 10px 12px; min-width: 110px; } } @media (max-width: 650px) { body .markup .twitter-embed, body .markup .tweet { padding: 12px; } } @media (max-width: 650px) { body .markup .twitter-embed .tweet-text, body .markup .tweet .tweet-text { font-size: 14px; line-height: 20px; } } @media (max-width: 650px) { body .markup .twitter-embed .tweet-photos-container.two, body .markup .tweet .tweet-photos-container.two, body .markup .twitter-embed .tweet-photos-container.three, body .markup .tweet .tweet-photos-container.three, body .markup .twitter-embed .tweet-photos-container.four, body .markup .tweet .tweet-photos-container.four { height: 200px; } } @media (max-width: 650px) { body .markup .twitter-embed a.expanded-link .expanded-link-img, body .markup .tweet a.expanded-link .expanded-link-img { max-height: 180px; } } @media (max-width: 650px) { body .markup .twitter-embed a.expanded-link .expanded-link-description, body .markup .tweet a.expanded-link .expanded-link-description { display: none; } } @media screen and (max-width: 650px) { body .markup .apple-podcast-container { width: unset; } } @media (max-width: 420px) { body .markup .install-substack-app-embed img.install-substack-app-embed-img { margin: 0 auto 16px auto; } } @media (max-width: 420px) { body .markup .install-substack-app-embed .install-substack-app-embed-text { margin: 0 0 12px 0; max-width: 100%; width: auto; text-align: center; } } @media (max-width: 420px) { body .markup .install-substack-app-embed .install-substack-app-embed-link { display: flex; justify-content: center; } } @media screen and (min-width: 500px) { body .header a.logo { width: 42px; height: 42px; border-radius: 12px; } } @media screen and (max-width: 420px) { body .subscription-receipt table:first-of-type .subscription-amount .subscription-discount { width: 72px !important; } } @media screen and (min-width: 481px) { body .share-button-container { height: auto; } } @media screen and (max-width: 480px) { body .share-button-container .separator { display: block !important; margin: 0 !important; height: 8px !important; border-left: none !important; } } @media screen and (max-width: 650px) { .digest .item .post-meta-item.audience { display: none; } } @media screen and (min-width: 500px) { .digest-publication .logo img { width: 42px; height: 42px; border-radius: 8px; } } @media screen and (max-width: 650px) { .comments-page .container .comment-list .collapsed-reply { margin-left: calc(10 + 32px - 24px); } } @media screen and (max-width: 650px) { .comment > .comment-list { padding-left: 24px; } } @media screen and (max-width: 650px) { .finish-magic-login-modal .modal-content .container { padding: 24px 0; } } @media (max-width: 650px) { .reader2-text-b3 { line-height: 24px; } } @media screen and (max-width: 650px) { .reader2-text-h4 { line-height: 24px; } } @media screen and (min-width: 541px) { .user-profile-modal { padding-left: 12px; padding-right: 12px; } } @media screen and (max-width: 650px) { .subscribe-widget form.form .sideBySideWrap button.rightButton { padding: 10px 12px; } } @media screen and (min-width: 541px) { .pub-icon:hover .logo-hover, .feed-item-icon:hover .logo-hover { display: block; } } @media screen and (max-width: 650px) { .post-ufi.single-full-width-button .post-ufi-button-wrapper { width: 100%; padding: 16px; } .post-ufi.single-full-width-button .post-ufi-button-wrapper:empty { display: none; } .post-ufi.single-full-width-button .post-ufi-button { width: 100%; justify-content: center; } } @media screen and (max-width: 768px) { .file-embed-wrapper { padding: 0; } } @media screen and (max-width: 768px) { .file-embed-wrapper-editor { padding: 0; } } @media screen and (max-width: 768px) { .file-embed-wrapper-editor:active { padding: 0; } } @media only screen and (max-width: 650px) { .file-embed-button.wide, .file-embed-error-button.wide { display: none; } } @media only screen and (min-width: 630px) { .file-embed-button.narrow, .file-embed-error-button.narrow { display: none; } } @media screen and (min-width: 541px) { .audio-player-wrapper .audio-player { min-width: 500px; } } @media screen and (max-width: 650px) { .audio-player-wrapper .audio-player .audio-player-progress { border-left-width: 16px; border-right-width: 16px; } } @media screen and (max-width: 650px) { .audio-player-wrapper .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup { top: -54px; } } @media screen and (max-width: 650px) { .audio-player-wrapper-fancy .audio-player .audio-player-progress { border-left-width: 16px; border-right-width: 16px; } } @media screen and (max-width: 650px) { .audio-player-wrapper-fancy .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup { top: -54px; } } @media (min-width: 250px) { .audio-player-wrapper-fancy .audio-player { padding: 32px; } .audio-player-wrapper-fancy .audio-player .btn-group { display: flex; } .audio-player-wrapper-fancy .audio-player .btn-group .button:last-of-type { display: block; } } @media (min-width: 300px) { .audio-player-wrapper-fancy .audio-player .btn-group { display: block; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } } @media (min-width: 350px) { .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo { display: block; } .audio-player-wrapper-fancy .audio-player .audio-player-title { margin-top: 16px; } .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 15%; width: 15%; display: block; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo { display: block; } } @media (min-width: 350px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 25%; width: 25%; display: block; } .audio-player-wrapper-fancy .audio-player .btn-group { display: flex; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } } @media (min-width: 400px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 40%; width: 40%; } } @media (max-width: 400px) { .audio-player-wrapper-fancy .audio-player .btn-group { margin-top: 12px; } .audio-player-wrapper-fancy .audio-player .btn-group .button { font-size: 13px; padding: 6px 12px; height: auto; margin-top: 10px; } } @media (min-width: 600px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 55%; width: 55%; } } @media (max-width: 650px) { .poll-editor-modal { min-width: calc(100% - 20px); } } @media (max-width: 750px) { .poll-embed .poll-anchor-target .poll-anchor-copy-button { left: 8px; top: 45px; } } Thuan Pham (Uber's first CTO) on scaling Uber from constant outages to global infrastructure, the shift to microservices and platform teams, and how AI is reshaping engineering. &#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173; Forwarded this email? Subscribe here for more The Pragmatic Engineer Scaling Uber with Thuan Pham &#8230; 0:00 1:38:55 Listen now Scaling Uber with Thuan Pham (Uber&#8217;s first CTO) Thuan Pham (Uber's first CTO) on scaling Uber from constant outages to global infrastructure, the shift to microservices and platform teams, and how AI is reshaping engineering. Gergely Orosz Apr 1 READ IN APP Stream the latest episode Listen and watch now on YouTube , Spotify , and Apple . See the episode transcript at the top of this page, and timestamps for the episode at the bottom. Brought to You by &#8226; Statsig &#8211; &#8288; The unified platform for flags, analytics, experiments, and more.Stop switching between different tools, and have them all in one place. &#8226; WorkOS &#8211; Everything you need to make your app enterprise ready. WorkOS gives you APIs to ship enterprise features in days: features like authentication, SSO, SCIM, RBAC, audit logs. Visit WorkOS.com &#8226; Sonar &#8211; The makers of SonarQube, the industry standard for automated code review. Sonar helps reduce outages, improve security, and lower risks associated with AI and agentic coding. See how SonarQube Advanced Security is empowering the Agent Centric Development Cycle (AC/DC) with new capabilities like malicious package detection to provide the same rigorous guardrails for AI agents as you would for a human developer. In this episode Thuan Pham was Uber&#8217;s first and longest-serving CTO, and today he&#8217;s the CTO of Faire, a B2B wholesale platform. Back when Thuan joined Uber, it had around 40 engineers and 30,000 rides per day, and the system crashed multiple times a week. Over seven years, he helped rebuild the system, move it from a monolith to microservices, and scaled the engineering organization behind it. I had the privilege of working with Thuan for four of those seven years. Later, the very first issue of The Pragmatic Engineer newsletter was a deepdive into Uber&#8217;s Program and Platform split . This episode of the podcast contains a nice &#8220;full circle&#8221; moment, where Thuan shares even more details about why Uber chose to embrace that structure. We discuss what it takes to operate and build in that kind of environment. Thuan explains how he divided his time at Uber into three &#8220;tours of duty,&#8221; from stabilizing a fragile system, to re-architecting it, and scaling the org. We go deep into the platform-and-program split, the Helix app rewrite, and what it took to launch Uber in China in just five months (the original estimate was 18 months). We also cover Uber&#8217;s in-house tools and explain why they were necessary to support rapid growth. Finally, we discuss his role today as CTO of Faire, how the company is using AI, and how he sees AI changing software engineering. Key observation from Thuan 14 takeaways from Thuan that I find the most interesting: 1. Your professional reputation is a compounding asset that pays off unpredictably . Bill Gurley recruited Thuan to Uber based on knowing him from a startup a decade earlier. Similarly, when Thuan needed to hire for critical infrastructure teams at Uber, he reached out to engineers at VMware whom he&#8217;d previously worked with, and they followed him to the ridesharing app because they trusted him. 2. The program/platform split came before microservices . The concept of cross-functional &#8220;program&#8221; teams and dedicated &#8220;platform&#8221; teams became necessary because an org split across backend, frontend and mobile engineers slowed down in execution speed when Uber grew to around 100 engineers. Every feature required negotiating bandwidth across the mobile, backend, and dispatch teams. Thuan, Travis Kalanick, and Jeff Holden literally used color-coded sticky notes with people&#8217;s names to reorganize into self-sufficient teams. We cover more about this split in the deepdive, The Platform and Program split at Uber. 3. Microservices at Uber were more about surviving hypergrowth than anything else. Uber needed to decompose its massive monolith called &#8220;API.&#8221; To do so, a simple rule was applied: anything new needed to be built outside of the monolith so that no team blocked another. Teams started to build microservices, but decomposing the monolith took a good two years. Fun fact: in 2026, Uber has somewhat fewer microservices (around 4,500) than back in 2016 (around 5,000). 4. When retiring a monolith, sometimes it gets even bigger before shrinking. After Uber decided to pull services out of the massive monolith, it still kept growing because the business kept adding features! There was an ugly middle phase before the monolith started to shrink. Keep this in mind if you look into decomposing a monolith. 5. Expect multiple rewrites during hypergrowth. The right architecture depends on how fast a product and company are growing. At Uber, repeated rewrites were common because each one &#8220;bought&#8221; another window of survival for the company. Thuan&#8217;s recommendation is to understand that a rewrite simply means a company is outrunning its existing architecture: this is not necessarily a bad thing! 6. Controversial launch advice: start with the hardest launch first. When Uber rolled out in China, Travis insisted on starting with Chengdu, the largest launch city. Looking back, it was scary but also helpful, as launching in the &#8220;hardest&#8221; city first gave the team confidence and made subsequent city launches much easier. 7. Travis Kalanick spent 30+ hours interviewing Thuan. This took place over two weeks, as a series of one-on-ones. The sessions became a simulation of working together: disagreeing, aligning, and working things out. I&#8217;ve yet to hear of such an intense &#8211; and technical! &#8211; recruitment process by another CEO. 8. Uber is the only major company that had a &#8220;Senior 1&#8221; and &#8220;Senior 2&#8221; level &#8211; and Thuan is unapologetic. Thuan introduced the Senior 1 (L5A) and Senior 2 (L5B) levels because the jump from senior (L5) to Staff (L6) became very big, and larger than between previous levels. One problem this split level created was that Uber&#8217;s L5B was akin to Google&#8217;s and Facebook&#8217;s L6/E6. Thuan resisted the title inflation of just renaming L5B to &#8216;Staff&#8217;. 9. Name your services clearly; you don&#8217;t work at a &#8220;Mickey Mouse shop.&#8221; As Uber grew more complex, whimsical service names (like &#8220;Mustafa&#8221;) made navigating systems more tricky, and onboarding for new joiners more painful. Thuan sent a company-wide email which called for professional-sounding naming conventions, and reminded everyone that Uber was not a &#8220;Mickey Mouse shop.&#8221; The email didn&#8217;t fully solve the issue, but did force the growing org to take itself more seriously. 10. Great engineering talent is global, so bring the opportunity to developers. During Thuan&#8217;s time, Uber opened nine engineering offices worldwide in order to access world-class talent. For example, the relatively small Denmark office built and operated core parts of Uber&#8217;s infrastructure, such as the trip datastore, Schemaless . 11. What&#8217;s the most important part of a CTO&#8217;s job? Thuan thinks that it&#8217;s to build a high-talent-density team, and to &#8220;see around the corner&#8221; 18&#8211;24 months in advance. As he puts it: &#8220;your team handles the six-month problems, while you figure out what the organization needs to look like two years from now.&#8221; 12. The hardest use case of AI in software engineering is building new features on legacy codebases. At Faire, Thuan&#8217;s team uses &#8220;swarm coding&#8221; (orchestrated AI agents working in parallel) and some engineers there have doubled their output in three months. But generating greenfield code is easy; the real challenge is dealing with millions of lines of code and building features on top with all those existing dependencies. 13. AI raises the floor, but doesn&#8217;t change what makes engineers great. AI enables people who can&#8217;t code to produce decent apps, but great engineers are still finding ways to leverage AI tools and accelerate even more. The differentiators remain the same as before AI: curiosity, fearlessness, and a willingness to innovate and learn new things. 14. Thuan&#8217;s career advice: think of it in phases. Each segment of your career has different priorities, which Thuan sees like this: First 5&#8211;10 years: seek maximum learning and push yourself hard. Mid-career as a senior/staff engineer: seek roles to make an outsized impact in, perhaps at a smaller company. In leadership roles: teach and coach others, and bring them along with you. The Pragmatic Engineer deepdives relevant for this episode How Uber uses AI for development: inside look The Platform and Program split at Uber How Uber is measuring engineering productivity Inside Uber&#8217;s move to the cloud Uber&#8217;s crazy YOLO app rewrite, from the front seat How Uber built its observability platform Developer experience at Uber with Gautam Korlam Uber&#8217;s engineering level change Timestamps ( 00:00 ) Intro ( 05:32 ) Getting into tech ( 16:09 ) The dot-com bust ( 20:42 ) VMware ( 26:29 ) Getting hired by Travis at Uber ( 33:22 ) Early days at Uber and scaling challenges ( 40:57 ) Uber&#8217;s China launch ( 47:12 ) The platform and program split ( 50:26 ) From monolith to microservices ( 53:38 ) Internal tools at Uber ( 57:05 ) Helix: Uber&#8217;s mobile app rewrite ( 59:55 ) Thuan&#8217;s email about naming ( 1:02:03 ) Org structure changes under ( 1:06:34 ) Thuan&#8217;s work philosophy ( 1:12:23 ) The &#8220;three tours of duty&#8221; at Uber ( 1:15:37 ) Why Thuan left Uber ( 1:17:34 ) Coupang and Nubank ( 1:21:59 ) Faire ( 1:25:31 ) How Faire uses AI ( 1:28:24 ) AI&#8217;s impact on software engineering ( 1:31:09 ) The role of the CTO ( 1:35:13 ) Career advice References Where to find Thuan Pham: &#8226; LinkedIn: https://www.linkedin.com/in/thuanqpham Mentions during the episode: &#8226; HP Labs: https://www.hp.com/hk-en/shop/tech-takes/post/what-is-hp-labs &#8226; Silicon Graphics: https://en.wikipedia.org/wiki/Silicon_Graphics &#8226; Miro: https://miro.com &#8226; VMware: https://www.vmware.com &#8226; Bill Gurley on LinkedIn: https://www.linkedin.com/in/billgurley &#8226; Travis Kalanick on X: https://x.com/travisk &#8226; DiDi: https://web.didiglobal.com &#8226; The Platform and Program Split at Uber: A Milestone Special: https://newsletter.pragmaticengineer.com/p/the-platform-and-program-split-at &#8226; Rewriting Uber Engineering: The Opportunities Microservices Provide: https://www.uber.com/blog/building-tincup-microservice-implementation &#8226; Up: Portable Microservices Ready for the Cloud: https://www.uber.com/blog/up-portable-microservices-ready-for-the-cloud &#8226; How Uber Built its Observability Platform: https://newsletter.pragmaticengineer.com/p/how-uber-built-its-observability-platform &#8226; The Uber Engineering Tech Stack, Part I: The Foundation: https://www.uber.com/blog/tech-stack-part-one-foundation &#8226; How Ringpop from Uber Engineering Helps Distribute Your Application: https://www.uber.com/blog/ringpop-open-source-nodejs-library &#8226; PostgreSQL: https://en.wikipedia.org/wiki/PostgreSQL &#8226; MySQL: https://www.mysql.com &#8226; Uber&#8217;s Crazy YOLO App Rewrite, From the Front Seat: https://blog.pragmaticengineer.com/uber-app-rewrite-yolo &#8226; Hypergrowth startups: Uber and CloudKitchens with Charles-Axel Dein: https://newsletter.pragmaticengineer.com/p/high-growth-startups-uber-and-cloudkitchens &#8226; Coupang: https://www.aboutcoupang.com &#8226; Nubank: https://international.nubank.com.br &#8226; Max Rhodes on LinkedIn: https://www.linkedin.com/in/max-rhodes &#8226; Sequoia: https://sequoiacap.com &#8226; Wyan Gretzky&#8217;s quote: https://www.brainyquote.com/quotes/wayne_gretzky_383282 &#8212; Production and marketing by Pen Name . You&#8217;re on the free list for The Pragmatic Engineer . For the full experience, become a paying subscriber . Many readers expense this newsletter within their company&#8217;s training/learning/development budget. If you have such a budget, here&#8217;s an email you could send to your manager . Upgrade to paid This post is public, so feel free to share and forward it. Share The Pragmatic Engineer If you enjoyed this post, you might enjoy my book, The Software Engineer's Guidebook : navigating senior, tech lead, staff and principal positions at tech companies and startups. Share Like Comment Restack &#169; 2026 Gergely Orosz 548 Market Street PMB 72296, San Francisco, CA 94104 Unsubscribe

## Raw body (tamper-evident)

```
View this post on the web at https://newsletter.pragmaticengineer.com/p/scaling-uber-with-thuan-pham-ubers

Stream the latest episode
Listen and watch now on YouTube [ https://substack.com/redirect/efc79d3b-c79f-47f9-9348-7fcc90b78878?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], Spotify [ https://substack.com/redirect/627e7155-d2c7-4839-9aac-54d117033de3?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], and Apple [ https://substack.com/redirect/448b9ae5-0b98-45a7-806f-95bfe9d0b65d?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. See the episode transcript at the top of this page, and timestamps for the episode at the bottom.
Brought to You by
• Statsig [ https://substack.com/redirect/06130039-2728-4625-be67-e756d35fbf91?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – ⁠ The unified platform for flags, analytics, experiments, and more.Stop switching between different tools, and have them all in one place.
• WorkOS [ https://substack.com/redirect/dc73132e-2db1-45e1-9bd7-564e6aa65c10?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – Everything you need to make your app enterprise ready. WorkOS gives you APIs to ship enterprise features in days: features like authentication, SSO, SCIM, RBAC, audit logs. Visit WorkOS.com [ https://substack.com/redirect/5aa026e0-cb2a-4e53-a0c9-c6ae4a06a046?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Sonar [ https://substack.com/redirect/27b3e86c-4a82-4a94-a578-b28c823e2616?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] – The makers of SonarQube, the industry standard for automated code review. Sonar [ https://substack.com/redirect/27b3e86c-4a82-4a94-a578-b28c823e2616?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] helps reduce outages, improve security, and lower risks associated with AI and agentic coding. See how SonarQube Advanced Security [ https://substack.com/redirect/37be520a-bc28-4cda-ae0c-07095a674653?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] is empowering the Agent Centric Development Cycle (AC/DC) with new capabilities like malicious package detection to provide the same rigorous guardrails for AI agents as you would for a human developer.
In this episode
Thuan Pham [ https://substack.com/redirect/1fa27a5b-a1f4-4919-a0de-902d26c1d17e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] was Uber’s first and longest-serving CTO, and today he’s the CTO of Faire, a B2B wholesale platform. Back when Thuan joined Uber, it had around 40 engineers and 30,000 rides per day, and the system crashed multiple times a week. Over seven years, he helped rebuild the system, move it from a monolith to microservices, and scaled the engineering organization behind it. I had the privilege of working with Thuan for four of those seven years. Later, the very first issue of The Pragmatic Engineer newsletter was a deepdive into Uber’s Program and Platform split [ https://substack.com/redirect/b78da17f-6b6e-4981-a0d3-2d3f067f94bc?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. This episode of the podcast contains a nice “full circle” moment, where Thuan shares even more details about why Uber chose to embrace that structure.
We discuss what it takes to operate and build in that kind of environment. Thuan explains how he divided his time at Uber into three “tours of duty,” from stabilizing a fragile system, to re-architecting it, and scaling the org.
We go deep into the platform-and-program split, the Helix app rewrite, and what it took to launch Uber in China in just five months (the original estimate was 18 months). We also cover Uber’s in-house tools and explain why they were necessary to support rapid growth.
Finally, we discuss his role today as CTO of Faire, how the company is using AI, and how he sees AI changing software engineering.
Key observation from Thuan
14 takeaways from Thuan that I find the most interesting:
1. Your professional reputation is a compounding asset that pays off unpredictably. Bill Gurley recruited Thuan to Uber based on knowing him from a startup a decade earlier. Similarly, when Thuan needed to hire for critical infrastructure teams at Uber, he reached out to engineers at VMware whom he’d previously worked with, and they followed him to the ridesharing app because they trusted him.
2. The program/platform split came before microservices. The concept of cross-functional “program” teams and dedicated “platform” teams became necessary because an org split across backend, frontend and mobile engineers slowed down in execution speed when Uber grew to around 100 engineers. Every feature required negotiating bandwidth across the mobile, backend, and dispatch teams. Thuan, Travis Kalanick, and Jeff Holden literally used color-coded sticky notes with people’s names to reorganize into self-sufficient teams. We cover more about this split in the deepdive, The Platform and Program split at Uber. [ https://substack.com/redirect/b78da17f-6b6e-4981-a0d3-2d3f067f94bc?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
3. Microservices at Uber were more about surviving hypergrowth than anything else. Uber needed to decompose its massive monolith called “API.” To do so, a simple rule was applied: anything new needed to be built outside of the monolith so that no team blocked another. Teams started to build microservices, but decomposing the monolith took a good two years. Fun fact: in 2026, Uber has somewhat fewer microservices (around 4,500) than back in 2016 (around 5,000).
4. When retiring a monolith, sometimes it gets even bigger before shrinking. After Uber decided to pull services out of the massive monolith, it still kept growing because the business kept adding features! There was an ugly middle phase before the monolith started to shrink. Keep this in mind if you look into decomposing a monolith.
5. Expect multiple rewrites during hypergrowth. The right architecture depends on how fast a product and company are growing. At Uber, repeated rewrites were common because each one “bought” another window of survival for the company. Thuan’s recommendation is to understand that a rewrite simply means a company is outrunning its existing architecture: this is not necessarily a bad thing!
6. Controversial launch advice: start with the hardest launch first. When Uber rolled out in China, Travis insisted on starting with Chengdu, the largest launch city. Looking back, it was scary but also helpful, as launching in the “hardest” city first gave the team confidence and made subsequent city launches much easier.
7. Travis Kalanick spent 30+ hours interviewing Thuan. This took place over two weeks, as a series of one-on-ones. The sessions became a simulation of working together: disagreeing, aligning, and working things out. I’ve yet to hear of such an intense – and technical! – recruitment process by another CEO.
8. Uber is the only major company that had a “Senior 1” and “Senior 2” level – and Thuan is unapologetic. Thuan introduced the Senior 1 (L5A) and Senior 2 (L5B) levels because the jump from senior (L5) to Staff (L6) became very big, and larger than between previous levels. One problem this split level created was that Uber’s L5B was akin to Google’s and Facebook’s L6/E6. Thuan resisted the title inflation of just renaming L5B to ‘Staff’.
9. Name your services clearly; you don’t work at a “Mickey Mouse shop.” As Uber grew more complex, whimsical service names (like “Mustafa”) made navigating systems more tricky, and onboarding for new joiners more painful. Thuan sent a company-wide email which called for professional-sounding naming conventions, and reminded everyone that Uber was not a “Mickey Mouse shop.” The email didn’t fully solve the issue, but did force the growing org to take itself more seriously.
10. Great engineering talent is global, so bring the opportunity to developers. During Thuan’s time, Uber opened nine engineering offices worldwide in order to access world-class talent. For example, the relatively small Denmark office built and operated core parts of Uber’s infrastructure, such as the trip datastore, Schemaless [ https://substack.com/redirect/050d93d0-4691-48fe-b7f7-55e4e64d3edb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ].
11. What’s the most important part of a CTO’s job? Thuan thinks that it’s to build a high-talent-density team, and to “see around the corner” 18–24 months in advance. As he puts it: “your team handles the six-month problems, while you figure out what the organization needs to look like two years from now.”
12. The hardest use case of AI in software engineering is building new features on legacy codebases. At Faire, Thuan’s team uses “swarm coding” (orchestrated AI agents working in parallel) and some engineers there have doubled their output in three months. But generating greenfield code is easy; the real challenge is dealing with millions of lines of code and building features on top with all those existing dependencies.
13. AI raises the floor, but doesn’t change what makes engineers great. AI enables people who can’t code to produce decent apps, but great engineers are still finding ways to leverage AI tools and accelerate even more. The differentiators remain the same as before AI: curiosity, fearlessness, and a willingness to innovate and learn new things.
14. Thuan’s career advice: think of it in phases. Each segment of your career has different priorities, which Thuan sees like this:
First 5–10 years: seek maximum learning and push yourself hard.
Mid-career as a senior/staff engineer: seek roles to make an outsized impact in, perhaps at a smaller company.
In leadership roles: teach and coach others, and bring them along with you.
The Pragmatic Engineer deepdives relevant for this episode
How Uber uses AI for development: inside look [ https://substack.com/redirect/21227aaf-6942-4e9b-b573-b79e6f737dca?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
The Platform and Program split at Uber [ https://substack.com/redirect/b78da17f-6b6e-4981-a0d3-2d3f067f94bc?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
How Uber is measuring engineering productivity [ https://substack.com/redirect/e127bca5-7a2b-495f-bf61-bdcd23419f6c?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Inside Uber’s move to the cloud [ https://substack.com/redirect/bc7b148d-35ec-4eba-bbd9-76bd386a84ea?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Uber’s crazy YOLO app rewrite, from the front seat [ https://substack.com/redirect/a6d34f63-72eb-4eb7-867f-daf44831ccbe?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
How Uber built its observability platform [ https://substack.com/redirect/2dcce228-8481-48e2-b1af-116f0ad5be86?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Developer experience at Uber [ https://substack.com/redirect/3cdbb56c-04ea-4a3f-bab0-ec351035b943?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] with Gautam Korlam
Uber’s engineering level change [ https://substack.com/redirect/0964d773-d311-40ed-8401-71b61ca7ef69?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Timestamps
(00:00 [ https://substack.com/redirect/1d41f4e2-2690-4ba6-8f7e-19d4c669565c?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Intro
(05:32 [ https://substack.com/redirect/714108b4-fe10-4b87-98f5-dc0f60007132?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Getting into tech
(16:09 [ https://substack.com/redirect/fca7c536-dbad-4f77-9504-074a8af3fb33?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The dot-com bust
(20:42 [ https://substack.com/redirect/0628ed5c-7d19-4cb6-8589-3dadae190584?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) VMware
(26:29 [ https://substack.com/redirect/5dc4672d-02a0-42d8-9719-8dabe6593200?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Getting hired by Travis at Uber
(33:22 [ https://substack.com/redirect/ca61543e-4555-4f00-a467-a4fe85aa1062?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Early days at Uber and scaling challenges
(40:57 [ https://substack.com/redirect/9ba6a7d4-5696-4db2-8924-d7075d2b4ea8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Uber’s China launch
(47:12 [ https://substack.com/redirect/a42f05fb-75ca-41cb-9337-4efe6dcb0170?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The platform and program split
(50:26 [ https://substack.com/redirect/f1053159-0e0c-4494-a937-5b909aef36a4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) From monolith to microservices
(53:38 [ https://substack.com/redirect/f8092550-68c5-4d14-95cb-5909765d938f?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Internal tools at Uber
(57:05 [ https://substack.com/redirect/459acae9-1a53-4402-afc2-4b0bf9589beb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Helix: Uber’s mobile app rewrite
(59:55 [ https://substack.com/redirect/4a4da544-b7b4-49fd-bf7f-55b719f48ead?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Thuan’s email about naming
(1:02:03 [ https://substack.com/redirect/7243e7a1-5f42-43c9-8c42-759b6ed43d88?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Org structure changes under
(1:06:34 [ https://substack.com/redirect/aa86ded9-51c6-4b49-aa5d-ab03a01fc187?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Thuan’s work philosophy
(1:12:23 [ https://substack.com/redirect/0fb3715f-cf7f-4392-b38a-8df8aae1ba76?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The “three tours of duty” at Uber
(1:15:37 [ https://substack.com/redirect/bc0ef404-e1e2-4557-99b2-8c98892cdce8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Why Thuan left Uber
(1:17:34 [ https://substack.com/redirect/7be66b71-bfb7-4c77-8d81-fee7600704f0?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Coupang and Nubank
(1:21:59 [ https://substack.com/redirect/cfc57253-15c7-4cc8-8c5d-4a7cd9a83700?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Faire
(1:25:31 [ https://substack.com/redirect/c1d663bb-b2ae-4a82-b593-20d97b5b47e2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) How Faire uses AI
(1:28:24 [ https://substack.com/redirect/e3866bce-cba4-4d52-b354-c500c8bd5818?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) AI’s impact on software engineering
(1:31:09 [ https://substack.com/redirect/189e2aa6-1aed-4063-9de4-d1a89b9a75ca?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) The role of the CTO
(1:35:13 [ https://substack.com/redirect/e0d95de2-f759-468a-988a-dcb1593b1dda?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]) Career advice
References
Where to find Thuan Pham:
• LinkedIn: https://www.linkedin.com/in/thuanqpham [ https://substack.com/redirect/cdd38e5c-af4c-4f68-87b4-b4e6526719f0?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Mentions during the episode:
• HP Labs: https://www.hp.com/hk-en/shop/tech-takes/post/what-is-hp-labs [ https://substack.com/redirect/1e695a32-5592-4884-9340-3570b2226928?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Silicon Graphics: https://en.wikipedia.org/wiki/Silicon_Graphics [ https://substack.com/redirect/e222271c-8113-41da-8513-3dc486a77658?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Miro: https://miro.com [ https://substack.com/redirect/135c6054-11ef-4a92-b052-fa2513064c86?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• VMware: https://www.vmware.com [ https://substack.com/redirect/c4ad3a45-5828-410b-8bf0-2aa827c776d7?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Bill Gurley on LinkedIn: https://www.linkedin.com/in/billgurley [ https://substack.com/redirect/1e96d8be-137b-447c-a9e4-05f274552d3d?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Travis Kalanick on X: https://x.com/travisk [ https://substack.com/redirect/e03857ac-b394-48ec-9287-b5fc6a0c6575?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• DiDi: https://web.didiglobal.com [ https://substack.com/redirect/55e5605b-cd25-4215-8443-0fae75f030fb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• The Platform and Program Split at Uber: A Milestone Special: https://newsletter.pragmaticengineer.com/p/the-platform-and-program-split-at [ https://substack.com/redirect/8027fbfd-9701-43f1-ab4d-f3cb1d03e85e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Rewriting Uber Engineering: The Opportunities Microservices Provide: https://www.uber.com/blog/building-tincup-microservice-implementation [ https://substack.com/redirect/ee45fbaf-d068-40ee-bc03-98094b75a98c?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Up: Portable Microservices Ready for the Cloud: https://www.uber.com/blog/up-portable-microservices-ready-for-the-cloud [ https://substack.com/redirect/097073f3-45e5-4d03-b194-fe046b451a81?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• How Uber Built its Observability Platform: https://newsletter.pragmaticengineer.com/p/how-uber-built-its-observability-platform [ https://substack.com/redirect/2dcce228-8481-48e2-b1af-116f0ad5be86?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• The Uber Engineering Tech Stack, Part I: The Foundation: https://www.uber.com/blog/tech-stack-part-one-foundation [ https://substack.com/redirect/ff91a76f-b204-45c5-9142-f6c5516d2e34?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• How Ringpop from Uber Engineering Helps Distribute Your Application: https://www.uber.com/blog/ringpop-open-source-nodejs-library [ https://substack.com/redirect/d383a5ad-b68c-469f-9d12-cbfe48702488?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• PostgreSQL: https://en.wikipedia.org/wiki/PostgreSQL [ https://substack.com/redirect/49d98cd4-c76a-4171-b98f-78b43c2651cb?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• MySQL: https://www.mysql.com [ https://substack.com/redirect/74ee7d64-a340-4a1c-a51e-e359babea13a?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Uber’s Crazy YOLO App Rewrite, From the Front Seat: https://blog.pragmaticengineer.com/uber-app-rewrite-yolo [ https://substack.com/redirect/c7cc9913-3040-4d3b-8cb1-a20faa7c1390?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Hypergrowth startups: Uber and CloudKitchens with Charles-Axel Dein: https://newsletter.pragmaticengineer.com/p/high-growth-startups-uber-and-cloudkitchens [ https://substack.com/redirect/c1b9e584-030d-40c9-b500-336b88b3e25e?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Coupang: https://www.aboutcoupang.com [ https://substack.com/redirect/ed2b4b5e-2c04-4b0e-a741-8ec9792520d3?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Nubank: https://international.nubank.com.br [ https://substack.com/redirect/c1f51285-6e9d-4113-8518-8a6359bfe2e8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Max Rhodes on LinkedIn: https://www.linkedin.com/in/max-rhodes [ https://substack.com/redirect/7aa2ea41-825c-4419-beea-4e63fd2ce0a9?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Sequoia: https://sequoiacap.com [ https://substack.com/redirect/dbb3e165-0c83-4d3c-9960-318dbbe62cf7?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
• Wyan Gretzky’s quote: https://www.brainyquote.com/quotes/wayne_gretzky_383282 [ https://substack.com/redirect/19182aa1-3150-44db-82fd-0358ac6e4736?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
—
Production and marketing by Pen Name [ https://substack.com/redirect/ff8dd3e6-3ff3-4be8-a906-2628415ae087?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ].

Unsubscribe https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9uZXdzbGV0dGVyLnByYWdtYXRpY2VuZ2luZWVyLmNvbS9hY3Rpb24vZGlzYWJsZV9lbWFpbD90b2tlbj1leUoxYzJWeVgybGtJam95TURJNE56UTRNaklzSW5CdmMzUmZhV1FpT2pFNU1qWTJOVGMxTUN3aWFXRjBJam94TnpjMU1EWXlOamt5TENKbGVIQWlPakU0TURZMU9UZzJPVElzSW1semN5STZJbkIxWWkwME5UZzNNRGtpTENKemRXSWlPaUprYVhOaFlteGxYMlZ0WVdsc0luMC5YX2tRS0N2QUxNa05oT2VZSm8xd09EUElLVTRDTXpaRG9aQ3hqTmhnTEM0IiwicCI6MTkyNjY1NzUwLCJzIjo0NTg3MDksImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzc1MDYyNjkyLCJleHAiOjIwOTA2Mzg2OTIsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.YFs2ZXZqQuz33k2kCK9Q0Dyjk4adlNvdHC9mba-JX1M?


=== HTML PART ===
<html lang="en" dir="ltr" style="scrollbar-width: thin;scrollbar-color: rgb(219,219,219)rgb(255,255,255);"><head><meta charset="utf-8"><title>Scaling Uber with Thuan Pham (Uber&#8217;s first CTO)</title><style>
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
}</style></head><body class="email-body" style="font-kerning: auto;--image-offset-margin: -120px;"><img src="https://eotrx.substackcdn.com/o/272f6037770e3f3b/p.gif?token=eyJtIjoiPDIwMjYwNDAxMTY0OTU5LjMuY2U0MjZiOGZjNTM1YjUxNUBtZy1kMS5zdWJzdGFjay5jb20-IiwidSI6MjAyODc0ODIyLCJyIjoicGxhc21hdG9pZEBnbWFpbC5jb20iLCJkIjoibWctZDEuc3Vic3RhY2suY29tIiwicCI6MTkyNjY1NzUwLCJ0IjoicG9kY2FzdCIsImEiOiJldmVyeW9uZSIsInMiOjQ1ODcwOSwiYyI6InBvc3QiLCJmIjp0cnVlLCJwb3NpdGlvbiI6InRvcCIsImlhdCI6MTc3NTA2MjY5MiwiZXhwIjoxNzc3NjU0NjkyLCJpc3MiOiJwdWItMCIsInN1YiI6ImVvIn0.So8apQWeKrM8CXKg5T4VgQ7yy3pCcR4JyBe_RUyc0_0" alt="" width="1" height="1" border="0" style="height:1px !important;width:1px !important;border-width:0 !important;margin-top:0 !important;margin-bottom:0 !important;margin-right:0 !important;margin-left:0 !important;padding-top:0 !important;padding-bottom:0 !important;padding-right:0 !important;padding-left:0 !important;"/><div class="preview" style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Thuan Pham (Uber's first CTO) on scaling Uber from constant outages to global infrastructure, the shift to microservices and platform teams, and how AI is reshaping engineering.</div><div class="preview" style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#17
```

*(truncated at 50KB — full body is 144970 bytes, sha256 is of the full body)*