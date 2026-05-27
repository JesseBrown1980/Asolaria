---
gmail_message_id: 19bb3c47516e17c3
account: jessebrown.soft1980@gmail.com
date_header: Mon, 12 Jan 2026 19:52:08 +0000
from: Heidi Rasmussen <heidi@freshbenies.com>
to: Jesse Brown <jessebrown.soft1980@gmail.com>
subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown
body_sha256: 1d7b615952b1c164c6f3834e8ea2f9b92afe90976d7233ad2de8da15eb033ad0
snippet: Thanks so much, Jesse! Can you send 2 more time blocks that work? Trying to coordinate with a few people with a lot of moving meetings. Also, note that these blocks are in CT. Does 1/15 9:30 - 11am
---

# Re: Following Up on Senior Tech Engineer Application – Jesse Brown

**From:** Heidi Rasmussen <heidi@freshbenies.com>
**To:** Jesse Brown <jessebrown.soft1980@gmail.com>
**Date:** Mon, 12 Jan 2026 19:52:08 +0000
**SHA256:** `1d7b615952b1c164c6f3834e8ea2f9b92afe90976d7233ad2de8da15eb033ad0`

## Body (extracted text)

Thanks so much, Jesse! Can you send 2 more time blocks that work? Trying to coordinate with a few people with a lot of moving meetings. Also, note that these blocks are in CT. Does 1/15 9:30 - 11am still work for you? [photo] Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 [App Banner Image] This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. [__tpx__] From: Jesse Brown Date: Monday, January 12, 2026 at 1:42 PM To: Heidi Rasmussen Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hello. Thanks for your email. 1/15, 9.30 - 11 am works for me. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 [https://mailtrack.io/trace/mail/591f3425ffd4fd9f44e3dd4b2bf698ab3eba6c2f.png?u=11908622] On Mon, Jan 12, 2026 at 2:40 PM Heidi Rasmussen > wrote: Hi Jesse! We’d like to schedule a 1.5 hour final interview with you and our team. Based on the times below, can you let me know a few blocks that work for you? From there, we’ll get it on the calendar and look forward to chatting further! 1/15 8:30 - 12pm 1/20 8:30 - 10am and 11am - 2pm 1/26 8:30am - 10am and 11am - 2pm 1/27 10am - 2pm 1/30 12pm - 2pm [photo] Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 [App Banner Image] This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. [__tpx__] From: Heidi Rasmussen > Date: Monday, January 5, 2026 at 9:16 AM To: Jesse Brown > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Happy new year, Jesse! Quick update to let you know I have everything I need from you and we’re moving you forward in the interview process. Working on those details over the next couple days, so stay tuned... [photo] Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 [App Banner Image] This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. [__tpx__] From: Jesse Brown > Date: Monday, December 22, 2025 at 2:19 PM To: Heidi Rasmussen > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hello. Sending answers to your questions here. 1. Just finished the test assessment. 2. https://www.loom.com/share/9249386428c74254bb9b98dbdbd7fd4d 3. One project I’m particularly proud of was an end to end modernization of a legacy PHP/MySQL member and broker benefits portal, along with improvements to a companion mobile experience, for a healthcare/benefits client. The problem When I joined, the platform had been in production for years and was technically “working,” but it was creating ongoing drag for both users and the engineering team: * Performance issues: Key screens (eligibility, plan details, claims status) were slow due to N+1 query patterns, missing indexes, and expensive reporting queries. * Legacy fragility: Core business logic was spread across controllers and includes, making changes risky and regressions common. * User confusion: Member and broker workflows applied inconsistent rules across screens, increasing support tickets. * Release risk: Limited automated coverage led to heavy manual QA and a frequent “hotfix” culture. * Mobile friction: Reliability issues and inconsistent behavior across iOS and Android clients. The business goal was clear: improve speed, stability, and clarity while adding new benefit selection and “next best action” workflows, without disrupting production for members. My approach 1. Reestablished a clear source of truth in the backend Before touching the UI, I focused on stabilizing the data and logic layer by auditing slow endpoints and queries, documenting real workflow rules with stakeholders, and introducing a service layer so business logic no longer lived inside controllers or views. 2. Delivered performance improvements without changing behavior I focused on low risk, high impact wins: replacing N+1 loops with set based queries, adding indexes based on EXPLAIN plans, introducing caching for read-heavy lookups with sensible TTLs, and reducing API payload sizes especially important for mobile and slow networks. 3. Modernized incrementally Instead of rewriting the entire system, I used a strangler style approach. New functionality shipped as modular services and internal APIs, legacy routes remained intact, and feature flags enabled phased rollouts from internal users, to small employer groups, to full production. 4. Built release confidence into the workflow To reduce regressions, I added repeatable regression tests for the most brittle workflows, established a device/browser test matrix for member and broker personas, and standardized a clear “definition of done” in Jira (tests, QA scripts, and acceptance criteria). 5. Improved mobile reliability through backend and UX alignment On the mobile side, the biggest gains came from stabilizing session and token refresh flows, enforcing consistent eligibility logic across clients, and adding structured logging so mobile issues could be diagnosed quickly. My role I served as the senior engineer and technical lead for this effort. I owned the architecture and rollout strategy, was hands-on with PHP/MySQL refactoring and performance work, and led a small team of 2–5 developers through code reviews, pairing, and shared standards. I also ran sprint execution in Jira and worked closely with non-technical stakeholders to translate user needs into clear, deliverable specs. Development process Work ran in two week sprints, starting with short discovery sessions and clear acceptance criteria. Changes were delivered in vertical slices (backend, UI, QA), every PR included risk notes, staging closely matched production data, and releases followed a disciplined strategy with feature flags, monitoring, and rollback plans. Results By the end of the project cycle: * ~40% reduction in page load and query latency on the highest traffic screens * ~32% reduction in defects related to refactored modules due to centralized, testable logic * ~28% faster production issue resolution from better logging and clearer ownership * Noticeably fewer member and broker support tickets tied to inconsistent workflows Overall, the system became faster, safer to change, and easier to extend while continuing to deliver new functionality without disrupting users. Looking forward to hearing from you. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 [cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E] On Sat, Dec 20, 2025 at 10:15 AM Jesse Brown > wrote: Sounds good, thanks! Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 [cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E] On Sat, Dec 20, 2025 at 10:12 AM Heidi Rasmussen > wrote: Thanks so much for the reply and estimation, Jesse! To be transparent, we won’t get to final interviews until January since many of us are out of the office as of this week - including me (except here I am sending emails…LOL!). I sent your info to David last night and he’s usually pretty quick to respond, but I’ve got him on my radar just in case. In the meantime, feel free to send the other 2 items as your schedule allows. Thanks again and merry merry! [photo] Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 [App Banner Image] This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. [__tpx__] From: Jesse Brown > Date: Saturday, December 20, 2025 at 7:46 AM To: Heidi Rasmussen > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hello, I can complete the test assessment within one to two days once it’s received. You’re welcome to send it at any time—over the weekend works for me as well. If possible, I’d love to complete the interview process before the holiday season. Thank you. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 [cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E] On Sat, Dec 20, 2025 at 12:11 AM Heidi Rasmussen > wrote: Hi Jesse! I appreciated getting to know more about you and your background last week - and discussing what a possible future looks like together. I’m excited to move our conversation forward! See below for 3 next steps. Once you’ve had some time to review these, please let me know your estimated completion date. 1. You will be contacted by David Dennard at Profiles International who will send you 2 skills assessments to complete online. 2. Please forward a 5-minute video walkthrough of a technical project you're proud of. Start to finish, explain the problem, your approach, your role, the dev process, and the final result. Bonus points if you include screenshots or code snippets. 3. Answer ONE of these questions: * Describe a time you helped reduce tech debt on a legacy system. What did you do and why? * Imagine you are responsible for modernizing a large legacy PHP + Angular application that is critical to the business. What are the first things you'd want to learn or evaluate? As a reminder, if your performance is solid on the above, we’ll move to a more in-depth final interview. Let me know what questions you have…thanks so much and happy holidays, Jesse :-) [photo] Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 [App Banner Image] This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. [__tpx__] From: Heidi Rasmussen > Date: Tuesday, December 9, 2025 at 9:25 PM To: Jesse Brown > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hi Jesse! Thank you for your interest in the Sr. Technical Engineer position with freshbenies. You have an impressive resume - I’d like to learn more about you and set up a 30 minute prescreen interview in the next 2 weeks. To make it easier, feel free to access my calendar and set up a time that works best for you here: https://app.hubspot.com/meetings/heidi103 See below for a few extras about freshbenies, and I look forward to chatting with you soon! * ABOUT: freshbenies and our services on our website: www.freshbenies.com * CORE VALUES: * F – un * R – ight thing doer * E – ducated innovator * S – ervant leader * H – ero of the cause * CORE FOCUS: * Purpose/Passion: We simplify the healthcare & benefits experience. * Our Niche: By driving usage and savings through a best-in-class experience. * TECH ARCHITECTURE: See attached [photo] Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 [App Banner Image] This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. [__tpx__] From: Jesse Brown > Date: Tuesday, December 9, 2025 at 3:21 AM To: Careers > Subject: Following Up on Senior Tech Engineer Application – Jesse Brown Hi there, I hope you're doing well. I’m reaching out to follow up on my application for the Senior Tech Engineer role and to share my resume for your review. With extensive experience maintaining and modernizing large legacy PHP/MySQL systems, leading engineering teams, and delivering scalable, user-centered features across web and mobile, I’m confident I can contribute meaningfully to freshbenies’ client-facing platforms. My background also includes architecting new functionality, improving existing codebases, mentoring mid-level developers, and collaborating closely with cross-functional stakeholders to define clear specs and deliver on deadlines. I’d love the opportunity to discuss how my experience can support your mission to simplify healthcare benefits through stable, intuitive technology. Thank you for your time, and I look forward to connecting. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 === HTML PART === Thanks so much, Jesse! Can you send 2 more time blocks that work? Trying to coordinate with a few people with a lot of moving meetings. Also, note that these blocks are in CT. Does 1/15 9:30 - 11am still work for you? Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. From: Jesse Brown <jessebrown.soft1980@gmail.com> Date: Monday, January 12, 2026 at 1:42 PM To: Heidi Rasmussen <heidi@freshbenies.com> Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hello. Thanks for your email. 1/15, 9.30 - 11 am works for me. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 On Mon, Jan 12, 2026 at 2:40 PM Heidi Rasmussen < heidi@freshbenies.com > wrote: Hi Jesse! We’d like to schedule a 1.5 hour final interview with you and our team. Based on the times below, can you let me know a few blocks that work for you? From there, we’ll get it on the calendar and look forward to chatting further! 1/15 8:30 - 12pm 1/20 8:30 - 10am and 11am - 2pm 1/26 8:30am - 10am and 11am - 2pm 1/27 10am - 2pm 1/30 12pm - 2pm Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. From: Heidi Rasmussen < heidi@freshbenies.com > Date: Monday, January 5, 2026 at 9:16 AM To: Jesse Brown < jessebrown.soft1980@gmail.com > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Happy new year, Jesse! Quick update to let you know I have everything I need from you and we’re moving you forward in the interview process. Working on those details over the next couple days, so stay tuned... Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. From: Jesse Brown < jessebrown.soft1980@gmail.com > Date: Monday, December 22, 2025 at 2:19 PM To: Heidi Rasmussen < heidi@freshbenies.com > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hello. Sending answers to your questions here. 1. Just finished the test assessment. 2. https://www.loom.com/share/9249386428c74254bb9b98dbdbd7fd4d 3. One project I’m particularly proud of was an end to end modernization of a legacy PHP/MySQL member and broker benefits portal , along with improvements to a companion mobile experience, for a healthcare/benefits client. The problem When I joined, the platform had been in production for years and was technically “working,” but it was creating ongoing drag for both users and the engineering team: Performance issues: Key screens (eligibility, plan details, claims status) were slow due to N+1 query patterns, missing indexes, and expensive reporting queries. Legacy fragility: Core business logic was spread across controllers and includes, making changes risky and regressions common. User confusion: Member and broker workflows applied inconsistent rules across screens, increasing support tickets. Release risk: Limited automated coverage led to heavy manual QA and a frequent “hotfix” culture. Mobile friction: Reliability issues and inconsistent behavior across iOS and Android clients. The business goal was clear: improve speed, stability, and clarity while adding new benefit selection and “next best action” workflows, without disrupting production for members. My approach Reestablished a clear source of truth in the backend Before touching the UI, I focused on stabilizing the data and logic layer by auditing slow endpoints and queries, documenting real workflow rules with stakeholders, and introducing a service layer so business logic no longer lived inside controllers or views. Delivered performance improvements without changing behavior I focused on low risk, high impact wins: replacing N+1 loops with set based queries, adding indexes based on EXPLAIN plans, introducing caching for read-heavy lookups with sensible TTLs, and reducing API payload sizes especially important for mobile and slow networks. Modernized incrementally Instead of rewriting the entire system, I used a strangler style approach. New functionality shipped as modular services and internal APIs, legacy routes remained intact, and feature flags enabled phased rollouts from internal users, to small employer groups, to full production. Built release confidence into the workflow To reduce regressions, I added repeatable regression tests for the most brittle workflows, established a device/browser test matrix for member and broker personas, and standardized a clear “definition of done” in Jira (tests, QA scripts, and acceptance criteria). Improved mobile reliability through backend and UX alignment On the mobile side, the biggest gains came from stabilizing session and token refresh flows, enforcing consistent eligibility logic across clients, and adding structured logging so mobile issues could be diagnosed quickly. My role I served as the senior engineer and technical lead for this effort. I owned the architecture and rollout strategy, was hands-on with PHP/MySQL refactoring and performance work, and led a small team of 2–5 developers through code reviews, pairing, and shared standards. I also ran sprint execution in Jira and worked closely with non-technical stakeholders to translate user needs into clear, deliverable specs. Development process Work ran in two week sprints, starting with short discovery sessions and clear acceptance criteria. Changes were delivered in vertical slices (backend, UI, QA), every PR included risk notes, staging closely matched production data, and releases followed a disciplined strategy with feature flags, monitoring, and rollback plans. Results By the end of the project cycle: ~40% reduction in page load and query latency on the highest traffic screens ~32% reduction in defects related to refactored modules due to centralized, testable logic ~28% faster production issue resolution from better logging and clearer ownership Noticeably fewer member and broker support tickets tied to inconsistent workflows Overall, the system became faster, safer to change, and easier to extend while continuing to deliver new functionality without disrupting users. Looking forward to hearing from you. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 On Sat, Dec 20, 2025 at 10:15 AM Jesse Brown < jessebrown.soft1980@gmail.com > wrote: Sounds good, thanks! Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 On Sat, Dec 20, 2025 at 10:12 AM Heidi Rasmussen < heidi@freshbenies.com > wrote: Thanks so much for the reply and estimation, Jesse! To be transparent, we won’t get to final interviews until January since many of us are out of the office as of this week - including me (except here I am sending emails…LOL!). I sent your info to David last night and he’s usually pretty quick to respond, but I’ve got him on my radar just in case. In the meantime, feel free to send the other 2 items as your schedule allows. Thanks again and merry merry! Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. From: Jesse Brown < jessebrown.soft1980@gmail.com > Date: Saturday, December 20, 2025 at 7:46 AM To: Heidi Rasmussen < heidi@freshbenies.com > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hello, I can complete the test assessment within one to two days once it’s received. You’re welcome to send it at any time—over the weekend works for me as well. If possible, I’d love to complete the interview process before the holiday season. Thank you. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21 On Sat, Dec 20, 2025 at 12:11 AM Heidi Rasmussen < heidi@freshbenies.com > wrote: Hi Jesse! I appreciated getting to know more about you and your background last week - and discussing what a possible future looks like together. I’m excited to move our conversation forward! See below for 3 next steps. Once you’ve had some time to review these, please let me know your estimated completion date. You will be contacted by David Dennard at Profiles International who will send you 2 skills assessments to complete online. Please forward a 5-minute video walkthrough of a technical project you're proud of. Start to finish, explain the problem, your approach, your role, the dev process, and the final result. Bonus points if you include screenshots or code snippets. Answer ONE of these questions: Describe a time you helped reduce tech debt on a legacy system. What did you do and why? Imagine you are responsible for modernizing a large legacy PHP + Angular application that is critical to the business. What are the first things you'd want to learn or evaluate? As a reminder, if your performance is solid on the above, we’ll move to a more in-depth final interview. Let me know what questions you have…thanks so much and happy holidays, Jesse :-) Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. From: Heidi Rasmussen < heidi@freshbenies.com > Date: Tuesday, December 9, 2025 at 9:25 PM To: Jesse Brown < jessebrown.soft1980@gmail.com > Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown Hi Jesse! Thank you for your interest in the Sr. Technical Engineer position with freshbenies. You have an impressive resume - I’d like to learn more about you and set up a 30 minute prescreen interview in the next 2 weeks. To make it easier, feel free to access my calendar and set up a time that works best for you here: https://app.hubspot.com/meetings/heidi103 See below for a few extras about freshbenies, and I look forward to chatting with you soon! ABOUT: freshbenies and our services on our website: www.freshbenies.com CORE VALUES: F – un R – ight thing doer E – ducated innovator S – ervant leader H – ero of the cause CORE FOCUS: Purpose/Passion: We simplify the healthcare & benefits experience. Our Niche: By driving usage and savings through a best-in-class experience. TECH ARCHITECTURE: See attached Heidi Rasmussen Co-Founder and CEO heidi@freshbenies.com 972.898.3791 This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited. From: Jesse Brown < jessebrown.soft1980@gmail.com > Date: Tuesday, December 9, 2025 at 3:21 AM To: Careers < careers@freshbenies.com > Subject: Following Up on Senior Tech Engineer Application – Jesse Brown Hi there, I hope you're doing well. I’m reaching out to follow up on my application for the Senior Tech Engineer role and to share my resume for your review. With extensive experience maintaining and modernizing large legacy PHP/MySQL systems, leading engineering teams, and delivering scalable, user-centered features across web and mobile, I’m confident I can contribute meaningfully to freshbenies’ client-facing platforms. My background also includes architecting new functionality, improving existing codebases, mentoring mid-level developers, and collaborating closely with cross-functional stakeholders to define clear specs and deliver on deadlines. I’d love the opportunity to discuss how my experience can support your mission to simplify healthcare benefits through stable, intuitive technology. Thank you for your time, and I look forward to connecting. Jesse Daniel Brown, PhD 251 Lois Ln. Sumter, SC 29150, US + 1 408 915 0923 https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/ https://www.researchgate.net/profile/Jesse-Brown-21

## Raw body (tamper-evident)

```
Thanks so much, Jesse! Can you send 2 more time blocks that work? Trying to coordinate with a few people with a lot of moving meetings. Also, note that these blocks are in CT. Does 1/15 9:30 - 11am still work for you?

[photo]

Heidi Rasmussen
Co-Founder and CEO

heidi@freshbenies.com<tel:heidi@freshbenies.com>

972.898.3791<tel:972.898.3791>

[App Banner Image]

﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.


[__tpx__]
From: Jesse Brown <jessebrown.soft1980@gmail.com>
Date: Monday, January 12, 2026 at 1:42 PM
To: Heidi Rasmussen <heidi@freshbenies.com>
Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown

Hello. Thanks for your email.
1/15, 9.30 - 11 am works for me.

Jesse Daniel Brown, PhD
251 Lois Ln. Sumter, SC 29150, US
+ 1 408 915 0923
https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/
https://www.researchgate.net/profile/Jesse-Brown-21


[https://mailtrack.io/trace/mail/591f3425ffd4fd9f44e3dd4b2bf698ab3eba6c2f.png?u=11908622]
On Mon, Jan 12, 2026 at 2:40 PM Heidi Rasmussen <heidi@freshbenies.com<mailto:heidi@freshbenies.com>> wrote:
Hi Jesse!

We’d like to schedule a 1.5 hour final interview with you and our team. Based on the times below, can you let me know a few blocks that work for you? From there, we’ll get it on the calendar and look forward to chatting further!

1/15 8:30 - 12pm
1/20 8:30 - 10am and 11am - 2pm
1/26 8:30am - 10am and 11am - 2pm
1/27 10am - 2pm
1/30 12pm - 2pm

[photo]

Heidi Rasmussen
Co-Founder and CEO

heidi@freshbenies.com<tel:heidi@freshbenies.com>

972.898.3791<tel:972.898.3791>

[App Banner Image]

﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.


[__tpx__]
From: Heidi Rasmussen <heidi@freshbenies.com<mailto:heidi@freshbenies.com>>
Date: Monday, January 5, 2026 at 9:16 AM
To: Jesse Brown <jessebrown.soft1980@gmail.com<mailto:jessebrown.soft1980@gmail.com>>
Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown

Happy new year, Jesse! Quick update to let you know I have everything I need from you and we’re moving you forward in the interview process. Working on those details over the next couple days, so stay tuned...

[photo]

Heidi Rasmussen
Co-Founder and CEO

heidi@freshbenies.com<tel:heidi@freshbenies.com>

972.898.3791<tel:972.898.3791>

[App Banner Image]

﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.


[__tpx__]
From: Jesse Brown <jessebrown.soft1980@gmail.com<mailto:jessebrown.soft1980@gmail.com>>
Date: Monday, December 22, 2025 at 2:19 PM
To: Heidi Rasmussen <heidi@freshbenies.com<mailto:heidi@freshbenies.com>>
Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown

Hello.
Sending answers to your questions here.

1. Just finished the test assessment.

2. https://www.loom.com/share/9249386428c74254bb9b98dbdbd7fd4d

3.

One project I’m particularly proud of was an end to end modernization of a legacy PHP/MySQL member and broker benefits portal, along with improvements to a companion mobile experience, for a healthcare/benefits client.

The problem

When I joined, the platform had been in production for years and was technically “working,” but it was creating ongoing drag for both users and the engineering team:

  *   Performance issues: Key screens (eligibility, plan details, claims status) were slow due to N+1 query patterns, missing indexes, and expensive reporting queries.

  *   Legacy fragility: Core business logic was spread across controllers and includes, making changes risky and regressions common.

  *   User confusion: Member and broker workflows applied inconsistent rules across screens, increasing support tickets.

  *   Release risk: Limited automated coverage led to heavy manual QA and a frequent “hotfix” culture.

  *   Mobile friction: Reliability issues and inconsistent behavior across iOS and Android clients.

The business goal was clear: improve speed, stability, and clarity while adding new benefit selection and “next best action” workflows, without disrupting production for members.

My approach

  1.  Reestablished a clear source of truth in the backend
Before touching the UI, I focused on stabilizing the data and logic layer by auditing slow endpoints and queries, documenting real workflow rules with stakeholders, and introducing a service layer so business logic no longer lived inside controllers or views.

  2.  Delivered performance improvements without changing behavior
I focused on low risk, high impact wins: replacing N+1 loops with set based queries, adding indexes based on EXPLAIN plans, introducing caching for read-heavy lookups with sensible TTLs, and reducing API payload sizes especially important for mobile and slow networks.

  3.  Modernized incrementally
Instead of rewriting the entire system, I used a strangler style approach. New functionality shipped as modular services and internal APIs, legacy routes remained intact, and feature flags enabled phased rollouts from internal users, to small employer groups, to full production.

  4.  Built release confidence into the workflow
To reduce regressions, I added repeatable regression tests for the most brittle workflows, established a device/browser test matrix for member and broker personas, and standardized a clear “definition of done” in Jira (tests, QA scripts, and acceptance criteria).

  5.  Improved mobile reliability through backend and UX alignment
On the mobile side, the biggest gains came from stabilizing session and token refresh flows, enforcing consistent eligibility logic across clients, and adding structured logging so mobile issues could be diagnosed quickly.

My role

I served as the senior engineer and technical lead for this effort. I owned the architecture and rollout strategy, was hands-on with PHP/MySQL refactoring and performance work, and led a small team of 2–5 developers through code reviews, pairing, and shared standards. I also ran sprint execution in Jira and worked closely with non-technical stakeholders to translate user needs into clear, deliverable specs.

Development process

Work ran in two week sprints, starting with short discovery sessions and clear acceptance criteria. Changes were delivered in vertical slices (backend, UI, QA), every PR included risk notes, staging closely matched production data, and releases followed a disciplined strategy with feature flags, monitoring, and rollback plans.

Results

By the end of the project cycle:

  *   ~40% reduction in page load and query latency on the highest traffic screens

  *   ~32% reduction in defects related to refactored modules due to centralized, testable logic

  *   ~28% faster production issue resolution from better logging and clearer ownership

  *   Noticeably fewer member and broker support tickets tied to inconsistent workflows

Overall, the system became faster, safer to change, and easier to extend while continuing to deliver new functionality without disrupting users.

Looking forward to hearing from you.

Jesse Daniel Brown, PhD
251 Lois Ln. Sumter, SC 29150, US
+ 1 408 915 0923
https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/
https://www.researchgate.net/profile/Jesse-Brown-21


[cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E]
On Sat, Dec 20, 2025 at 10:15 AM Jesse Brown <jessebrown.soft1980@gmail.com<mailto:jessebrown.soft1980@gmail.com>> wrote:
Sounds good, thanks!
Jesse Daniel Brown, PhD
251 Lois Ln. Sumter, SC 29150, US
+ 1 408 915 0923
https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/
https://www.researchgate.net/profile/Jesse-Brown-21


[cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E]
On Sat, Dec 20, 2025 at 10:12 AM Heidi Rasmussen <heidi@freshbenies.com<mailto:heidi@freshbenies.com>> wrote:
Thanks so much for the reply and estimation, Jesse! To be transparent, we won’t get to final interviews until January since many of us are out of the office as of this week - including me (except here I am sending emails…LOL!). I sent your info to David last night and he’s usually pretty quick to respond, but I’ve got him on my radar just in case. In the meantime, feel free to send the other 2 items as your schedule allows. Thanks again and merry merry!

[photo]

Heidi Rasmussen
Co-Founder and CEO

heidi@freshbenies.com<tel:heidi@freshbenies.com>

972.898.3791<tel:972.898.3791>

[App Banner Image]

﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.


[__tpx__]
From: Jesse Brown <jessebrown.soft1980@gmail.com<mailto:jessebrown.soft1980@gmail.com>>
Date: Saturday, December 20, 2025 at 7:46 AM
To: Heidi Rasmussen <heidi@freshbenies.com<mailto:heidi@freshbenies.com>>
Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown


Hello,
I can complete the test assessment within one to two days once it’s received. You’re welcome to send it at any time—over the weekend works for me as well.

If possible, I’d love to complete the interview process before the holiday season. Thank you.


Jesse Daniel Brown, PhD
251 Lois Ln. Sumter, SC 29150, US
+ 1 408 915 0923
https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/
https://www.researchgate.net/profile/Jesse-Brown-21


[cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E]
On Sat, Dec 20, 2025 at 12:11 AM Heidi Rasmussen <heidi@freshbenies.com<mailto:heidi@freshbenies.com>> wrote:

Hi Jesse!



I appreciated getting to know more about you and your background last week - and discussing what a possible future looks like together.



I’m excited to move our conversation forward! See below for 3 next steps. Once you’ve had some time to review these, please let me know your estimated completion date.


  1.  You will be contacted by David Dennard at Profiles International who will send you 2 skills assessments to complete online.

  2.
Please forward a 5-minute video walkthrough of a technical project you're proud of. Start to finish, explain the problem, your approach, your role, the dev process, and the final result. Bonus points if you include screenshots or code snippets.
  3.
Answer ONE of these questions:
     *
Describe a time you helped reduce tech debt on a legacy system. What did you do and why?
     *
Imagine you are responsible for modernizing a large legacy PHP + Angular application that is critical to the business. What are the first things you'd want to learn or evaluate?


As a reminder, if your performance is solid on the above, we’ll move to a more in-depth final interview.


Let me know what questions you have…thanks so much and happy holidays, Jesse :-)


[photo]

Heidi Rasmussen
Co-Founder and CEO

heidi@freshbenies.com<tel:heidi@freshbenies.com>

972.898.3791<tel:972.898.3791>

[App Banner Image]

﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.


[__tpx__]
From: Heidi Rasmussen <heidi@freshbenies.com<mailto:heidi@freshbenies.com>>
Date: Tuesday, December 9, 2025 at 9:25 PM
To: Jesse Brown <jessebrown.soft1980@gmail.com<mailto:jessebrown.soft1980@gmail.com>>
Subject: Re: Following Up on Senior Tech Engineer Application – Jesse Brown

Hi Jesse!

Thank you for your interest in the Sr. Technical Engineer position with freshbenies. You have an impressive resume - I’d like to learn more about you and set up a 30 minute prescreen interview in the next 2 weeks. To make it easier, feel free to access my calendar and set up a time that works best for you here: https://app.hubspot.com/meetings/heidi103


See below for a few extras about freshbenies, and I look forward to chatting with you soon!



  *   ABOUT: freshbenies and our services on our website: www.freshbenies.com<http://www.freshbenies.com/>

  *   CORE VALUES:

     *   F – un

     *   R – ight thing doer

     *   E – ducated innovator

     *   S – ervant leader

     *   H – ero of the cause

  *   CORE FOCUS:

     *   Purpose/Passion: We simplify the healthcare & benefits experience.

     *   Our Niche: By driving usage and savings through a best-in-class experience.

  *   TECH ARCHITECTURE: See attached

[photo]

Heidi Rasmussen
Co-Founder and CEO

heidi@freshbenies.com<tel:heidi@freshbenies.com>

972.898.3791<tel:972.898.3791>

[App Banner Image]

﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.


[__tpx__]
From: Jesse Brown <jessebrown.soft1980@gmail.com<mailto:jessebrown.soft1980@gmail.com>>
Date: Tuesday, December 9, 2025 at 3:21 AM
To: Careers <careers@freshbenies.com<mailto:careers@freshbenies.com>>
Subject: Following Up on Senior Tech Engineer Application – Jesse Brown

Hi there,
I hope you're doing well.
I’m reaching out to follow up on my application for the Senior Tech
Engineer role and to share my resume for your review.
With extensive experience maintaining and modernizing large legacy
PHP/MySQL systems, leading engineering teams, and delivering scalable,
user-centered features across web and mobile, I’m confident I can
contribute meaningfully to freshbenies’ client-facing platforms.
My background also includes architecting new functionality, improving
existing codebases, mentoring mid-level developers, and collaborating
closely with cross-functional stakeholders to define clear specs and
deliver on deadlines.
I’d love the opportunity to discuss how my experience can support your
mission to simplify healthcare benefits through stable, intuitive
technology.
Thank you for your time, and I look forward to connecting.


Jesse Daniel Brown, PhD
251 Lois Ln. Sumter, SC 29150, US
+ 1 408 915 0923
https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/
https://www.researchgate.net/profile/Jesse-Brown-21


=== HTML PART ===
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
<div dir="ltr"><span style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">Thanks so much, Jesse! Can you send 2 more time blocks that work? Trying to coordinate with a few people with a lot of moving meetings. Also,
 note that these blocks are in CT. Does </span><span style="background-color: rgb(255, 255, 255);">1/15 9:30 - 11am still work for you?</span></div>
<div dir="ltr" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
<br>
</div>
<div id="ms-outlook-mobile-signature">
<table dir="ltr" style="box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 0; height: 12px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="width: 100%; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 1px; vertical-align: middle; width: 96px; height: 1px;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="text-align: center; line-height: 1.15; padding: 0.01px 1px 0.01px 0.01px; vertical-align: middle; width: 96px;">
<img src="https://d36urhup7zbd7q.cloudfront.net/u/O6e0Qnqlqyv/29feea8b-dcc5-4b1f-b82a-367018d6f9de__400x400__.jpeg" alt="photo" width="96" height="96" style="width: 96px; height: 96px; border-radius: 0px; display: block; vertical-align: middle;"></td>
</tr>
</tbody>
</table>
</td>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 0.01px 0.01px 12px; vertical-align: top;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.08; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(189, 189, 189); padding: 0.01px 0.01px 12px;">
<p dir="ltr" style="line-height: 108%; margin: 0.1px; font-size: 17px;"><span style="letter-spacing: 0px; font-family: Arial; color: rgb(69, 102, 142);"><b>Heidi Rasmussen</b></span><br>
<span style="font-family: Arial; font-size: 13px; color: rgb(100, 100, 100);"><b>Co-Founder and CEO</b></span></p>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1.15; white-space: nowrap; padding-top: 12px; width: 158px; height: 0px;">
<p dir="ltr" style="line-height: 99%; white-space: nowrap; margin: 1px; font-size: 11px;">
<span style="font-family: Arial; color: rgb(33, 33, 33); line-height: 120%;"><a href="tel:heidi@freshbenies.com" target="_blank" rel="nofollow noreferrer" data-outlook-id="ee844bf0-6d02-45af-ac60-4b9b76899caf" style="color: rgb(33, 33, 33); margin-top: 0px; margin-bottom: 0px;">heidi@freshbenies.com</a></span></p>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1.15; white-space: nowrap; padding-top: 5px; width: 93px; height: 0px;">
<p dir="ltr" style="line-height: 99%; white-space: nowrap; margin: 1px; font-size: 11px;">
<span style="font-family: Arial; color: rgb(33, 33, 33); line-height: 120%;"><a href="tel:972.898.3791" target="_blank" rel="nofollow noreferrer" data-outlook-id="c0027c4f-f3c1-4809-a79f-2cfe77b65dc7" style="color: rgb(33, 33, 33); margin-top: 0px; margin-bottom: 0px;">972.898.3791</a></span></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: normal; width: 100%; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="text-align: left; line-height: normal; height: 0px;">
<p dir="ltr" style="text-align: left; line-height: normal; margin: 1px;"><img src="https://d36urhup7zbd7q.cloudfront.net/u/O6e0Qnqlqyv/99534258-4920-4ad4-9e2c-eb4b3e22253f__900x107__.png" alt="App Banner Image" width="299" height="35" style="width: 299px; height: 35px; margin-top: 0px; margin-bottom: 0px;"></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: normal; border-top-width: 1px; border-top-style: solid; border-top-color: gray; width: 100%; color: gray; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 120%; padding-right: 8px; height: 0px;">
<p dir="ltr" style="line-height: 120%;"><span style="font-family: Arial; font-size: 10px; color: rgb(0, 0, 0);">﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for
 the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.</span></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 0;">
<div dir="ltr" style="line-height: 0; font-family: &quot;ws-id PbRKNDVBLyNv&quot;; font-size: 0.01px;">
&nbsp;</div>
</td>
</tr>
</tbody>
</table>
<img src="https://tracy.srv.wisestamp.com/px/wsid/PbRKNDVBLyNv.png" alt="__tpx__"></div>
<div id="mail-editor-reference-message-container">
<div dir="ltr" class="ms-outlook-mobile-reference-message skipProofing"></div>
<div class="ms-outlook-mobile-reference-message skipProofing" style="text-align: left; padding: 3pt 0in 0in; border-width: 1pt medium medium; border-style: solid none none; border-color: rgb(181, 196, 223) currentcolor currentcolor; font-family: Aptos; font-size: 12pt; color: black;">
<b>From: </b>Jesse Brown &lt;jessebrown.soft1980@gmail.com&gt;<br>
<b>Date: </b>Monday, January 12, 2026 at 1:42 PM<br>
<b>To: </b>Heidi Rasmussen &lt;heidi@freshbenies.com&gt;<br>
<b>Subject: </b>Re: Following Up on Senior Tech Engineer Application – Jesse Brown<br>
<br>
</div>
<div dir="ltr" class="ms-outlook-mobile-reference-message skipProofing" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(0, 0, 0);">
Hello. Thanks for your email.</div>
<div dir="ltr" class="ms-outlook-mobile-reference-message skipProofing" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 16px; color: rgb(0, 0, 0);">
1/15, 9.30 - 11 am works for me.<br>
<br>
</div>
<div dir="ltr" class="gmail_signature">Jesse Daniel Brown, PhD</div>
<div dir="ltr" class="gmail_signature">251 Lois Ln. Sumter, SC 29150, US</div>
<div dir="ltr" class="gmail_signature">+ 1 408 915 0923</div>
<div dir="ltr" class="gmail_signature" style="color: rgb(0, 0, 238);"><u><a href="https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/" target="_blank" data-outlook-id="fa8f1f33-4b46-47b5-959b-3decc8fee293">https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/</a><br>
<a href="https://www.researchgate.net/profile/Jesse-Brown-21" target="_blank" data-outlook-id="654a998b-b59b-4bf5-8eca-da9bd19d0fc6">https://www.researchgate.net/profile/Jesse-Brown-21</a></u></div>
<div dir="ltr" class="ms-outlook-mobile-reference-message skipProofing"><br>
</div>
<div dir="ltr" class="ms-outlook-mobile-reference-message skipProofing"><br>
<img src="https://mailtrack.io/trace/mail/591f3425ffd4fd9f44e3dd4b2bf698ab3eba6c2f.png?u=11908622" style="display: flex;"></div>
<div dir="ltr" class="gmail_attr">On Mon, Jan 12, 2026 at 2:40 PM Heidi Rasmussen &lt;<a href="mailto:heidi@freshbenies.com" data-outlook-id="6fe48b7e-d877-4307-ab9f-7cf36e6c751e">heidi@freshbenies.com</a>&gt; wrote:</div>
<blockquote style="margin: 0px 0px 0px 0.8ex; padding-left: 1ex; border-left-width: 1px; border-left-style: solid; border-left-color: rgb(204, 204, 204);">
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
Hi&nbsp;Jesse!</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
<br>
</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
We’d like to schedule a 1.5 hour final interview with you and our team.&nbsp;Based on the times below, can you let me know a few blocks that work for you? From there, we’ll get it on the calendar and look forward to chatting further!</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
<br>
</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
1/15 8:30 - 12pm</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
1/20 8:30 - 10am and 11am - 2pm</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
1/26 8:30am - 10am and 11am - 2pm</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
1/27 10am - 2pm</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
1/30 12pm - 2pm</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
<br>
</div>
<div id="m_-2487129173236371981ms-outlook-mobile-signature">
<table dir="ltr" style="box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 0; height: 12px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="width: 100%; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 1px; vertical-align: middle; width: 96px; height: 1px;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="text-align: center; line-height: 1.15; padding: 0.01px 1px 0.01px 0.01px; vertical-align: middle; width: 96px;">
<img src="https://d36urhup7zbd7q.cloudfront.net/u/O6e0Qnqlqyv/29feea8b-dcc5-4b1f-b82a-367018d6f9de__400x400__.jpeg" alt="photo" width="96" height="96" style="width: 96px; height: 96px; border-radius: 0px; display: block; vertical-align: middle;"></td>
</tr>
</tbody>
</table>
</td>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 0.01px 0.01px 12px; vertical-align: top;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.08; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(189, 189, 189); padding: 0.01px 0.01px 12px;">
<p dir="ltr" style="line-height: 108%; margin: 0.1px; font-size: 17px;"><span style="letter-spacing: 0px; font-family: Arial; color: rgb(69, 102, 142);"><b>Heidi Rasmussen</b></span><br>
<span style="font-family: Arial; font-size: 13px; color: rgb(100, 100, 100);"><b>Co-Founder and CEO</b></span></p>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1.15; white-space: nowrap; padding-top: 12px; width: 158px; height: 0px;">
<p dir="ltr" style="line-height: 99%; white-space: nowrap; margin: 1px; font-size: 11px;">
<span style="font-family: Arial; color: rgb(33, 33, 33); line-height: 120%;"><a href="tel:heidi@freshbenies.com" target="_blank" rel="nofollow noreferrer" data-outlook-id="9372ba75-a82a-413d-95ca-0e3876063739" style="color: rgb(33, 33, 33); margin-top: 0px; margin-bottom: 0px;">heidi@freshbenies.com</a></span></p>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1.15; white-space: nowrap; padding-top: 5px; width: 93px; height: 0px;">
<p dir="ltr" style="line-height: 99%; white-space: nowrap; margin: 1px; font-size: 11px;">
<span style="font-family: Arial; color: rgb(33, 33, 33); line-height: 120%;"><a href="tel:972.898.3791" target="_blank" rel="nofollow noreferrer" data-outlook-id="cc1f068e-3100-4cde-ae05-a31b51140adb" style="color: rgb(33, 33, 33); margin-top: 0px; margin-bottom: 0px;">972.898.3791</a></span></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: normal; width: 100%; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="text-align: left; line-height: normal; height: 0px;">
<p dir="ltr" style="text-align: left; line-height: normal; margin: 1px;"><img src="https://d36urhup7zbd7q.cloudfront.net/u/O6e0Qnqlqyv/99534258-4920-4ad4-9e2c-eb4b3e22253f__900x107__.png" alt="App Banner Image" width="299" height="35" style="width: 299px; height: 35px; margin-top: 0px; margin-bottom: 0px;"></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: normal; border-top-width: 1px; border-top-style: solid; border-top-color: gray; width: 100%; color: gray; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 120%; padding-right: 8px; height: 0px;">
<p dir="ltr" style="line-height: 120%;"><span style="font-family: Arial; font-size: 10px; color: rgb(0, 0, 0);">﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for
 the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.</span></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 0;">
<div dir="ltr" style="line-height: 0; font-family: &quot;ws-id PbRKNDVBLyNv&quot;; font-size: 0.01px;">
&nbsp;</div>
</td>
</tr>
</tbody>
</table>
<img src="https://tracy.srv.wisestamp.com/px/wsid/PbRKNDVBLyNv.png" alt="__tpx__"></div>
<div id="m_-2487129173236371981mail-editor-reference-message-container">
<div style="text-align: left; padding: 3pt 0in 0in; border-width: 1pt medium medium; border-style: solid none none; border-color: rgb(181, 196, 223) currentcolor currentcolor; font-family: Aptos; font-size: 12pt; color: black;">
<b>From: </b>Heidi Rasmussen &lt;<a href="mailto:heidi@freshbenies.com" target="_blank" data-outlook-id="e9c5678e-810f-418d-b06d-9b670c356c9c">heidi@freshbenies.com</a>&gt;<br>
<b>Date: </b>Monday, January 5, 2026 at 9:16 AM<br>
<b>To: </b>Jesse Brown &lt;<a href="mailto:jessebrown.soft1980@gmail.com" target="_blank" data-outlook-id="f3f6d077-6477-40b1-ac35-640ba66b1ca4">jessebrown.soft1980@gmail.com</a>&gt;<br>
<b>Subject: </b>Re: Following Up on Senior Tech Engineer Application – Jesse Brown<br>
<br>
</div>
<div dir="ltr" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
Happy new year, Jesse! Quick update to let you know I have everything I need from you and we’re moving you forward in the interview process. Working on those details over the next couple days, so stay tuned...<br>
<br>
</div>
<div id="m_-2487129173236371981ms-outlook-mobile-signature">
<table dir="ltr" style="box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 0; height: 12px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="width: 100%; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 1px; vertical-align: middle; width: 96px; height: 1px;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="text-align: center; line-height: 1.15; padding: 0.01px 1px 0.01px 0.01px; vertical-align: middle; width: 96px;">
<img src="https://d36urhup7zbd7q.cloudfront.net/u/O6e0Qnqlqyv/29feea8b-dcc5-4b1f-b82a-367018d6f9de__400x400__.jpeg" alt="photo" width="96" height="96" style="width: 96px; height: 96px; border-radius: 0px; display: block; vertical-align: middle;"></td>
</tr>
</tbody>
</table>
</td>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 0.01px 0.01px 12px; vertical-align: top;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.08; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(189, 189, 189); padding: 0.01px 0.01px 12px;">
<p dir="ltr" style="line-height: 108%; margin: 0.1px; font-size: 17px;"><span style="letter-spacing: 0px; font-family: Arial; color: rgb(69, 102, 142);"><b>Heidi Rasmussen</b></span><br>
<span style="font-family: Arial; font-size: 13px; color: rgb(100, 100, 100);"><b>Co-Founder and CEO</b></span></p>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1.15; white-space: nowrap; padding-top: 12px; width: 158px; height: 0px;">
<p dir="ltr" style="line-height: 99%; white-space: nowrap; margin: 1px; font-size: 11px;">
<span style="font-family: Arial; color: rgb(33, 33, 33); line-height: 120%;"><a href="tel:heidi@freshbenies.com" target="_blank" rel="nofollow noreferrer" data-outlook-id="607bb2f1-1893-4e14-b2c3-2affbd537b55" style="color: rgb(33, 33, 33); margin-top: 0px; margin-bottom: 0px;">heidi@freshbenies.com</a></span></p>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1.15; white-space: nowrap; padding-top: 5px; width: 93px; height: 0px;">
<p dir="ltr" style="line-height: 99%; white-space: nowrap; margin: 1px; font-size: 11px;">
<span style="font-family: Arial; color: rgb(33, 33, 33); line-height: 120%;"><a href="tel:972.898.3791" target="_blank" rel="nofollow noreferrer" data-outlook-id="f12a1243-fe2e-4370-b612-2649c53f88d1" style="color: rgb(33, 33, 33); margin-top: 0px; margin-bottom: 0px;">972.898.3791</a></span></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: normal; width: 100%; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="text-align: left; line-height: normal; height: 0px;">
<p dir="ltr" style="text-align: left; line-height: normal; margin: 1px;"><img src="https://d36urhup7zbd7q.cloudfront.net/u/O6e0Qnqlqyv/99534258-4920-4ad4-9e2c-eb4b3e22253f__900x107__.png" alt="App Banner Image" width="299" height="35" style="width: 299px; height: 35px; margin-top: 0px; margin-bottom: 0px;"></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: normal; border-top-width: 1px; border-top-style: solid; border-top-color: gray; width: 100%; color: gray; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 120%; padding-right: 8px; height: 0px;">
<p dir="ltr" style="line-height: 120%;"><span style="font-family: Arial; font-size: 10px; color: rgb(0, 0, 0);">﻿This electronic communication, including any attachments, may contain confidential and/or legally privileged information that is only intended for
 the recipient(s) names above. If you have received this message in error, please notify the sender immediately and delete the communication and any attachments. Any unauthorized review or use is strictly prohibited.</span></p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1%; padding-top: 16px; height: 0px;"></td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 0;">
<div dir="ltr" style="line-height: 0; font-family: &quot;ws-id PbRKNDVBLyNv&quot;; font-size: 0.01px;">
&nbsp;</div>
</td>
</tr>
</tbody>
</table>
<img src="https://tracy.srv.wisestamp.com/px/wsid/PbRKNDVBLyNv.png" alt="__tpx__"></div>
<div id="m_-2487129173236371981mail-editor-reference-message-container">
<div style="text-align: left; padding: 3pt 0in 0in; border-width: 1pt medium medium; border-style: solid none none; border-color: rgb(181, 196, 223) currentcolor currentcolor; font-family: Aptos; font-size: 12pt; color: black;">
<b>From: </b>Jesse Brown &lt;<a href="mailto:jessebrown.soft1980@gmail.com" target="_blank" data-outlook-id="5448f1e4-c1f3-473f-8a90-37cc2176c07d">jessebrown.soft1980@gmail.com</a>&gt;<br>
<b>Date: </b>Monday, December 22, 2025 at 2:19 PM<br>
<b>To: </b>Heidi Rasmussen &lt;<a href="mailto:heidi@freshbenies.com" target="_blank" data-outlook-id="68ad263a-f801-4cbb-a2b9-4b671e65596a">heidi@freshbenies.com</a>&gt;<br>
<b>Subject: </b>Re: Following Up on Senior Tech Engineer Application – Jesse Brown<br>
<br>
</div>
<div dir="ltr">Hello.</div>
<div dir="ltr">Sending answers&nbsp;to your questions here.</div>
<div dir="ltr"><br>
</div>
<div dir="ltr">1. Just finished the test assessment.</div>
<div dir="ltr"><br>
2. <a href="https://www.loom.com/share/9249386428c74254bb9b98dbdbd7fd4d" target="_blank" data-outlook-id="0c5e5e95-7179-4139-9c1f-8a7c43ebe3ee">
https://www.loom.com/share/9249386428c74254bb9b98dbdbd7fd4d</a></div>
<div dir="ltr"><br>
</div>
<div dir="ltr">3.&nbsp;</div>
<p dir="ltr">One project I’m particularly proud of was an end to end modernization of a legacy
<b>PHP/MySQL member and broker benefits portal</b>, along with improvements to a companion mobile experience, for a healthcare/benefits client.</p>
<p dir="ltr"><b>The problem</b></p>
<p dir="ltr">When I joined, the platform had been in production for years and was technically “working,” but it was creating ongoing drag for both users and the engineering team:</p>
<ul dir="ltr">
<li>
<p dir="ltr" role="presentation"><b>Performance issues:</b>&nbsp;Key screens (eligibility, plan details, claims status) were slow due to N+1 query patterns, missing indexes, and expensive reporting queries.</p>
</li><li>
<p dir="ltr" role="presentation"><b>Legacy fragility:</b>&nbsp;Core business logic was spread across controllers and includes, making changes risky and regressions common.</p>
</li><li>
<p dir="ltr" role="presentation"><b>User confusion:</b>&nbsp;Member and broker workflows applied inconsistent rules across screens, increasing support tickets.</p>
</li><li>
<p dir="ltr" role="presentation"><b>Release risk:</b>&nbsp;Limited automated coverage led to heavy manual QA and a frequent “hotfix” culture.</p>
</li><li>
<p dir="ltr" role="presentation"><b>Mobile friction:</b>&nbsp;Reliability issues and inconsistent behavior across iOS and Android clients.</p>
</li></ul>
<p dir="ltr">The business goal was clear: improve speed, stability, and clarity while adding new benefit selection and “next best action” workflows, without disrupting production for members.</p>
<p dir="ltr"><b>My approach</b></p>
<ol start="1" dir="ltr">
<li>
<p dir="ltr" role="presentation"><b>Reestablished a clear source of truth in the backend</b><br>
Before touching the UI, I focused on stabilizing the data and logic layer by auditing slow endpoints and queries, documenting real workflow rules with stakeholders, and introducing a service layer so business logic no longer lived inside controllers or views.</p>
</li><li>
<p dir="ltr" role="presentation"><b>Delivered performance improvements without changing behavior</b><br>
I focused on low risk, high impact wins: replacing N+1 loops with set based queries, adding indexes based on EXPLAIN plans, introducing caching for read-heavy lookups with sensible TTLs, and reducing API payload sizes especially important for mobile and slow
 networks.</p>
</li><li>
<p dir="ltr" role="presentation"><b>Modernized incrementally</b><br>
Instead of rewriting the entire system, I used a strangler style approach. New functionality shipped as modular services and internal APIs, legacy routes remained intact, and feature flags enabled phased rollouts from internal users, to small employer groups,
 to full production.</p>
</li><li>
<p dir="ltr" role="presentation"><b>Built release confidence into the workflow</b><br>
To reduce regressions, I added repeatable regression tests for the most brittle workflows, established a device/browser test matrix for member and broker personas, and standardized a clear “definition of done” in Jira (tests, QA scripts, and acceptance criteria).</p>
</li><li>
<p dir="ltr" role="presentation"><b>Improved mobile reliability through backend and UX alignment</b><br>
On the mobile side, the biggest gains came from stabilizing session and token refresh flows, enforcing consistent eligibility logic across clients, and adding structured logging so mobile issues could be diagnosed quickly.</p>
</li></ol>
<p dir="ltr"><b>My role</b></p>
<p dir="ltr">I served as the senior engineer and technical lead for this effort. I owned the architecture and rollout strategy, was hands-on with PHP/MySQL refactoring and performance work, and led a small team of 2–5 developers through code reviews, pairing,
 and shared standards. I also ran sprint execution in Jira and worked closely with non-technical stakeholders to translate user needs into clear, deliverable specs.</p>
<p dir="ltr"><b>Development process</b></p>
<p dir="ltr">Work ran in two week sprints, starting with short discovery sessions and clear acceptance criteria. Changes were delivered in vertical slices (backend, UI, QA), every PR included risk notes, staging closely matched production data, and releases
 followed a disciplined strategy with feature flags, monitoring, and rollback plans.</p>
<p dir="ltr"><b>Results</b></p>
<p dir="ltr">By the end of the project cycle:</p>
<ul dir="ltr">
<li>
<p dir="ltr" role="presentation">~40% reduction in page load and query latency on the highest traffic screens</p>
</li><li>
<p dir="ltr" role="presentation">~32% reduction in defects related to refactored modules due to centralized, testable logic</p>
</li><li>
<p dir="ltr" role="presentation">~28% faster production issue resolution from better logging and clearer ownership</p>
</li><li>
<p dir="ltr" role="presentation">Noticeably fewer member and broker support tickets tied to inconsistent workflows</p>
</li></ul>
<p dir="ltr">Overall, the system became faster, safer to change, and easier to extend while continuing to deliver new functionality without disrupting users.</p>
<p dir="ltr">Looking forward to hearing from you.</p>
<div dir="ltr" class="gmail_signature">Jesse Daniel Brown, PhD</div>
<div dir="ltr" class="gmail_signature">251 Lois Ln. Sumter, SC 29150, US</div>
<div dir="ltr" class="gmail_signature">+ 1 408 915 0923</div>
<div dir="ltr" class="gmail_signature" style="color: rgb(0, 0, 238);"><u><a href="https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/" target="_blank" data-outlook-id="d6d95541-d704-4806-8be8-71ae529a03f0">https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/</a><br>
<a href="https://www.researchgate.net/profile/Jesse-Brown-21" target="_blank" data-outlook-id="78be4db7-bce9-46d9-869e-d549f7c64ab6">https://www.researchgate.net/profile/Jesse-Brown-21</a></u></div>
<div dir="ltr"><br>
</div>
<div dir="ltr"><br>
<img src="cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E" style="display: flex;"></div>
<div dir="ltr" class="gmail_attr">On Sat, Dec 20, 2025 at 10:15 AM Jesse Brown &lt;<a href="mailto:jessebrown.soft1980@gmail.com" target="_blank" data-outlook-id="52b6401a-4d8e-47a3-bb01-4280a2766306">jessebrown.soft1980@gmail.com</a>&gt; wrote:</div>
<blockquote style="margin: 0px 0px 0px 0.8ex; padding-left: 1ex; border-left-width: 1px; border-left-style: solid; border-left-color: rgb(204, 204, 204);">
<div dir="ltr" class="gmail_quote">Sounds good, thanks!&nbsp;</div>
<div dir="ltr" class="gmail_signature">Jesse Daniel Brown, PhD</div>
<div dir="ltr" class="gmail_signature">251 Lois Ln. Sumter, SC 29150, US</div>
<div dir="ltr" class="gmail_signature">+ 1 408 915 0923</div>
<div dir="ltr" class="gmail_signature" style="color: rgb(0, 0, 238);"><u><a href="https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/" target="_blank" data-outlook-id="21645fb5-ad37-4c8d-8718-7854cd6fb475">https://www.linkedin.com/in/jesse-daniel-brown-phd-730042387/</a><br>
<a href="https://www.researchgate.net/profile/Jesse-Brown-21" target="_blank" data-outlook-id="4ff275ac-108c-4f54-b349-54bc27e1ace6">https://www.researchgate.net/profile/Jesse-Brown-21</a></u></div>
<div dir="ltr" class="gmail_quote"><br>
</div>
<div dir="ltr" class="gmail_quote"><br>
<img src="cid:03705ABF-20F8-4997-9DA4-FD1AABCE922E" style="display: flex;"></div>
<div dir="ltr" class="gmail_attr">On Sat, Dec 20, 2025 at 10:12 AM Heidi Rasmussen &lt;<a href="mailto:heidi@freshbenies.com" target="_blank" data-outlook-id="0b4cad42-2a38-40ce-9499-d724b85adf9d">heidi@freshbenies.com</a>&gt; wrote:</div>
<blockquote style="margin: 0px 0px 0px 0.8ex; padding-left: 1ex; border-left-width: 1px; border-left-style: solid; border-left-color: rgb(204, 204, 204);">
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
Thanks so much for the reply and estimation, Jesse! To be transparent, we won’t get to final interviews until January since many of us are out of the office as of this week - including me (except here I am sending emails…LOL!). I sent your info to David last
 night and he’s usually pretty quick to respond, but I’ve got him on my radar just in case. In the meantime, feel free to send the other 2 items as your schedule allows. Thanks again and merry merry!&nbsp;</div>
<div dir="ltr" class="gmail_quote" style="font-family: Arial, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0);">
<br>
</div>
<div id="m_-2487129173236371981m_-876808485296817963m_-4622601138542785560m_3493004480223163615m_7666355493933475220ms-outlook-mobile-signature">
<table dir="ltr" style="box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 0; height: 12px;"></td>
</tr>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="width: 100%; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 1px; vertical-align: middle; width: 96px; height: 1px;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="text-align: center; line-height: 1.15; padding: 0.01px 1px 0.01px 0.01px; vertical-align: middle; width: 96px;">
<img src="https://d36urhup7zbd7q.cloudfront.net/u/O6e0Qnqlqyv/29feea8b-dcc5-4b1f-b82a-367018d6f9de__400x400__.jpeg" alt="photo" width="96" height="96" style="width: 96px; height: 96px; border-radius: 0px; display: block; vertical-align: middle;"></td>
</tr>
</tbody>
</table>
</td>
<td dir="ltr" style="line-height: 1.15; padding: 0.01px 0.01px 0.01px 12px; vertical-align: top;">
<table dir="ltr" cellspacing="0" cellpadding="0" style="line-height: 1.15; box-sizing: border-box; border-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td dir="ltr" style="line-height: 1.08; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(189, 189, 189); padding: 0.01px 0.01px 12px;">
<p dir="ltr" style="line-height: 108%; margin: 0.1px; font-size: 17px;"><span style="letter-spacing: 0px; font-family: Arial; color: rgb(69, 102, 142);"><b>Heidi Rasmussen</b></span><br>
<span style="font-family: Arial; font-size: 13px; color: rgb(100, 100, 100);"><b>Co-Founder and CEO</b></span></p>
</td>
</tr>
<tr>
<td dir="ltr" style="line-height: 1.15; white-space: nowrap; padding-top: 12px; width: 158px; height: 0px;">
<p dir="ltr" style="line-height: 99%; white-space: nowrap; margin: 1px; font-size: 11px;">
<span style="font-family: Arial; color: rgb(33, 33, 33); line-height: 120%;"><a href="tel:heidi
```

*(truncated at 50KB — full body is 80688 bytes, sha256 is of the full body)*