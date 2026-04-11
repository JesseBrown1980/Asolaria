---
gmail_message_id: 196f4445ec69450e
account: jessebrown.soft1980@gmail.com
date_header: Wed, 21 May 2025 15:13:55 -0400
from: Brian Birkhauser <brian@quickdrawdevelopment.com>
to: Jesse Brown <jessebrown.soft1980@gmail.com>
subject: Fwd: RE: Wifi Sync Updates
body_sha256: c3ba7de5b987c902a20a1834da66a44979783f475febf6751a295933b58ecac0
snippet: Brian. ---------- Forwarded message ---------- From: Bob Salter &lt;BOBS@charm.com&gt; Date: May 21, 2025 at 9:20 AM -0400 To: Brian Birkhauser &lt;brian@quickdrawdevelopment.com&gt;, Natalie Martin
---

# Fwd: RE: Wifi Sync Updates

**From:** Brian Birkhauser <brian@quickdrawdevelopment.com>
**To:** Jesse Brown <jessebrown.soft1980@gmail.com>
**Date:** Wed, 21 May 2025 15:13:55 -0400
**SHA256:** `c3ba7de5b987c902a20a1834da66a44979783f475febf6751a295933b58ecac0`

## Body (extracted text)

Brian. ---------- Forwarded message ---------- From: Bob Salter Date: May 21, 2025 at 9:20 AM -0400 To: Brian Birkhauser , Natalie Martin Subject: RE: Wifi Sync Updates > Unit 4115 did sync at end of day. Took about 25 minutes. Loaded 1900+ sites and 102 plans. Saw same thing, that data on unit were not deleted. Is it not deleting because I selected to Reset assay index? Should I clear data off these units to continue testing? Let me know what you find on your end. > > From: Brian Birkhauser > Sent: Tuesday, May 20, 2025 5:12 PM > To: Natalie Martin ; Bob Salter > Subject: RE: Wifi Sync Updates > > Charm internal QA should be fine. that’s what I’ve been using to test. My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer > Charm internal QA should be fine. that’s what I’ve been using to test. My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer and confirm. It could be it only removes the indexes of the assays it synced. > I’ll try to recreate these scenarios to test. > > Brian. > On May 20, 2025 at 5:04 PM -0400, Bob Salter , wrote: > > > quote_type > > So is been a while since I used two units on Staging site. I want to make sure Charm Internal QA on staging is OK. I have two units4115 and 8597 > > > > These were units that I had previously been maxing out plans and sites and had found that about 1500 sites about 69 plans was limiting before server 3 errors. > > > > I began with adding plans and doing a reset assay index. > > > > Unit 8597 did sync after about 20 minutes. It had 103 plans and about 2000 sites. But there were 33 prior run tests from march that did not clear off the unit that were still findable by the search on the Novalum. Is my expectation correct that these should have cleared? Or is there something about reset assay index that caused that not to happen? Should I clear data off this unit before any more testing? > > > > Unit 4115 had already 1888 sites and took 30 minutes to get through that, it synced existing 49 plans but crashed server 3 on uploading 113 plans. Those plans did not upload so still playing with it. > > > > I haven’t loaded lots of tests on these yet for more testing. > > > > bobs > > > > From: Brian Birkhauser > > Sent: Tuesday, May 20, 2025 1:37 PM > > To: Natalie Martin ; Bob Salter > > Subject: RE: Wifi Sync Updates > > > > Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same. It’s generally not a good idea to mix staging/production data and units. Brian. > > Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same. It’s generally not a good idea to mix staging/production data and units. > > > > Brian. > > On May 20, 2025 at 1:33 PM -0400, Bob Salter , wrote: > > > quote_type > > > How about this. If I can successfully import it into staging site, could filter it and export it and import the information into live? I would risk it if that is the case. It would be a really good test. > > > > > > bobs > > > > > > From: Brian Birkhauser > > > Sent: Tuesday, May 20, 2025 1:30 PM > > > To: Natalie Martin ; Bob Salter > > > Subject: RE: Wifi Sync Updates > > > > > > It will automatically remove the data after it is successfully synced to eBacMap. Brian. On May 20, 2025 at 12: 43 PM -0400, Bob Salter , wrote: Thank you Brian. Will do. Does the data automatically remove > > > It will automatically remove the data after it is successfully synced to eBacMap. > > > > > > Brian. > > > On May 20, 2025 at 12:43 PM -0400, Bob Salter , wrote: > > > > quote_type > > > > Thank you Brian. Will do. Does the data automatically remove or does it ask if you want to remove it before doing so? Reason why I ask is I have a unit, that is Live on Charm Site that has been server 3 for 10 days, and I would like to test that on staging but not lose the data. > > > > Let me know. Thanks > > > > > > > > bobs > > > > > > > > From: Brian Birkhauser > > > > Sent: Tuesday, May 20, 2025 12:32 PM > > > > To: Bob Salter ; Natalie Martin > > > > Subject: Wifi Sync Updates > > > > > > > > Hi Bob, Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing. Please have your team run some tests on the staging ebacmap site and using novalink. ebacmap. com as the > > > > Hi Bob, > > > > Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing. Please have your team run some tests on the staging ebacmap site and using novalink.ebacmap.com as the sync server. He’s increased the number of records that can be sent at a time, implemented removing assays from the unit after a successful transfer of test results, improved the reading/parsing of the data, added some retry ability when things get “stuck” and some other optimizations to improve reliability. From my tests it’s working much smoother. The logic is still in place to only sync plans/sites if data has changed, but when it does it syncs in larger batches. With the logic to delete assays from the device, the reset assay index toggle should no longer be necessary as it will always be reset to 0 after a successful sync. > > > > > > > > As a reminder, encryption is currently turned off on the staging sync server so if you encounter a server 2 error before receiving the message “Connected to eBacMap” then your device is trying to communicate with encrypted data. > > > > > > > > Brian. === HTML PART === Brian. ---------- Forwarded message ---------- From: Bob Salter <BOBS@charm.com> Date: May 21, 2025 at 9:20 AM -0400 To: Brian Birkhauser <brian@quickdrawdevelopment.com>, Natalie Martin <natalie@quickdrawdevelopment.com> Subject: RE: Wifi Sync Updates Unit 4115 did sync at end of day. Took about 25 minutes.&#160; Loaded 1900+ sites and 102 plans.&#160;&#160; Saw same thing, that data on unit were not deleted.&#160; &#160;Is it not deleting because I selected to Reset assay index?&#160; Should I clear data off these units to continue testing?&#160; Let me know what you find on your end.&#160;&#160; &#160; From: Brian Birkhauser <brian@quickdrawdevelopment.com> Sent: Tuesday, May 20, 2025 5:12 PM To: Natalie Martin <natalie@quickdrawdevelopment.com>; Bob Salter <BOBS@charm.com> Subject: RE: Wifi Sync Updates &#160; Charm internal QA should be fine. that’s what I’ve been using to test. &#160;&#160;My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer Charm internal QA should be fine. that’s what I’ve been using to test.&#160;&#160;My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer and confirm. It could be it only removes the indexes of the assays it synced.&#160; &#160; I’ll try to recreate these scenarios to test. &#160; Brian. On May 20, 2025 at 5:04 PM -0400, Bob Salter < BOBS@charm.com >, wrote: So is been a while since I used two units on Staging site.&#160; I want to make sure Charm Internal QA on staging is OK.&#160;&#160; I have two units4115 and 8597 &#160; These were units that I had previously been maxing out plans and sites and had found that about 1500 sites about 69 plans was limiting before server 3 errors.&#160;&#160; &#160;&#160; &#160; I began with adding plans and doing a reset assay index. &#160; Unit 8597 did sync after about 20 minutes.&#160; It had 103 plans and about 2000 sites.&#160; But there were 33 prior run tests from march that did not clear off the unit that were still findable by the search on the Novalum.&#160; Is my expectation correct that these should have cleared?&#160; Or is there something about reset assay index that caused that not to happen?&#160;&#160;&#160; Should I clear data off this unit before any more testing?&#160; &#160; Unit 4115 had already 1888 sites and took 30 minutes to get through that,&#160; it synced existing 49 plans but crashed server 3 on uploading 113 plans.&#160; Those plans did not upload so still playing with it. &#160; I haven’t loaded lots of tests on these yet for more testing. &#160; bobs &#160; From: Brian Birkhauser < brian@quickdrawdevelopment.com > Sent: Tuesday, May 20, 2025 1:37 PM To: Natalie Martin < natalie@quickdrawdevelopment.com >; Bob Salter < BOBS@charm.com > Subject: RE: Wifi Sync Updates &#160; Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same. &#160;&#160;It’s generally not a good idea to mix staging/production data and units. Brian. Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same.&#160;&#160;It’s generally not a good idea to mix staging/production data and units. &#160; Brian. On May 20, 2025 at 1:33 PM -0400, Bob Salter < BOBS@charm.com >, wrote: How about this.&#160; If I can successfully import it into staging site, could filter it and export it and import the information into live?&#160; I would risk it if that is the case. It would be a really good test. &#160; bobs &#160; From: Brian Birkhauser < brian@quickdrawdevelopment.com > Sent: Tuesday, May 20, 2025 1:30 PM To: Natalie Martin < natalie@quickdrawdevelopment.com >; Bob Salter < BOBS@charm.com > Subject: RE: Wifi Sync Updates &#160; It will automatically remove the data after it is successfully synced to eBacMap. Brian. On May 20, 2025 at 12: 43 PM -0400, Bob Salter <BOBS@ charm. com>, wrote: Thank you Brian. &#160; Will do. &#160;&#160; Does the data automatically remove It will automatically remove the data after it is successfully synced to eBacMap. &#160; Brian. On May 20, 2025 at 12:43 PM -0400, Bob Salter < BOBS@charm.com >, wrote: Thank you Brian.&#160; Will do.&#160;&#160; Does the data automatically remove or does it ask if you want to remove it before doing so?&#160; Reason why I ask is I have a unit, that is Live on Charm Site that has been server 3 for 10 days, and I would like to test that on staging but not lose the data.&#160; Let me know.&#160; Thanks &#160; bobs &#160; From: Brian Birkhauser < brian@quickdrawdevelopment.com > Sent: Tuesday, May 20, 2025 12:32 PM To: Bob Salter < BOBS@charm.com >; Natalie Martin < natalie@quickdrawdevelopment.com > Subject: Wifi Sync Updates &#160; Hi Bob,&#160; Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing. &#160;&#160;Please have your team run some tests on the staging ebacmap site and using novalink. ebacmap. com as the Hi Bob,&#160; Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing.&#160;&#160;Please have your team run some tests on the staging ebacmap site and using novalink.ebacmap.com as the sync server.&#160;&#160;He’s increased the number of records that can be sent at a time, implemented removing assays from the unit after a successful transfer of test results, improved the reading/parsing of the data, added some retry ability when things get “stuck” and some other optimizations to improve reliability.&#160;&#160;From my tests it’s working much smoother.&#160;&#160;The logic is still in place to only sync plans/sites if data has changed, but when it does it syncs in larger batches.&#160;&#160;With the logic to delete assays from the device, the reset assay index toggle should no longer be necessary as it will always be reset to 0 after a successful sync. As a reminder, encryption is currently turned off on the staging sync server so if you encounter a server 2 error before receiving the message “Connected to eBacMap” then your device is trying to communicate with encrypted data. &#160; Brian.

## Raw body (tamper-evident)

```

Brian.
---------- Forwarded message ----------
From: Bob Salter <BOBS@charm.com>
Date: May 21, 2025 at 9:20 AM -0400
To: Brian Birkhauser <brian@quickdrawdevelopment.com>, Natalie Martin <natalie@quickdrawdevelopment.com>
Subject: RE: Wifi Sync Updates

> Unit 4115 did sync at end of day. Took about 25 minutes.  Loaded 1900+ sites and 102 plans.   Saw same thing, that data on unit were not deleted.   Is it not deleting because I selected to Reset assay index?  Should I clear data off these units to continue testing?  Let me know what you find on your end.
>
> From: Brian Birkhauser <brian@quickdrawdevelopment.com>
> Sent: Tuesday, May 20, 2025 5:12 PM
> To: Natalie Martin <natalie@quickdrawdevelopment.com>; Bob Salter <BOBS@charm.com>
> Subject: RE: Wifi Sync Updates
>
> Charm internal QA should be fine. that’s what I’ve been using to test.   My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer
> Charm internal QA should be fine. that’s what I’ve been using to test.  My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer and confirm. It could be it only removes the indexes of the assays it synced.
> I’ll try to recreate these scenarios to test.
>
> Brian.
> On May 20, 2025 at 5:04 PM -0400, Bob Salter <BOBS@charm.com>, wrote:
>
> > quote_type
> > So is been a while since I used two units on Staging site.  I want to make sure Charm Internal QA on staging is OK.   I have two units4115 and 8597
> >
> > These were units that I had previously been maxing out plans and sites and had found that about 1500 sites about 69 plans was limiting before server 3 errors.
> >
> > I began with adding plans and doing a reset assay index.
> >
> > Unit 8597 did sync after about 20 minutes.  It had 103 plans and about 2000 sites.  But there were 33 prior run tests from march that did not clear off the unit that were still findable by the search on the Novalum.  Is my expectation correct that these should have cleared?  Or is there something about reset assay index that caused that not to happen?    Should I clear data off this unit before any more testing?
> >
> > Unit 4115 had already 1888 sites and took 30 minutes to get through that,  it synced existing 49 plans but crashed server 3 on uploading 113 plans.  Those plans did not upload so still playing with it.
> >
> > I haven’t loaded lots of tests on these yet for more testing.
> >
> > bobs
> >
> > From: Brian Birkhauser <brian@quickdrawdevelopment.com>
> > Sent: Tuesday, May 20, 2025 1:37 PM
> > To: Natalie Martin <natalie@quickdrawdevelopment.com>; Bob Salter <BOBS@charm.com>
> > Subject: RE: Wifi Sync Updates
> >
> > Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same.   It’s generally not a good idea to mix staging/production data and units. Brian.
> > Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same.  It’s generally not a good idea to mix staging/production data and units.
> >
> > Brian.
> > On May 20, 2025 at 1:33 PM -0400, Bob Salter <BOBS@charm.com>, wrote:
> > > quote_type
> > > How about this.  If I can successfully import it into staging site, could filter it and export it and import the information into live?  I would risk it if that is the case. It would be a really good test.
> > >
> > > bobs
> > >
> > > From: Brian Birkhauser <brian@quickdrawdevelopment.com>
> > > Sent: Tuesday, May 20, 2025 1:30 PM
> > > To: Natalie Martin <natalie@quickdrawdevelopment.com>; Bob Salter <BOBS@charm.com>
> > > Subject: RE: Wifi Sync Updates
> > >
> > > It will automatically remove the data after it is successfully synced to eBacMap. Brian. On May 20, 2025 at 12: 43 PM -0400, Bob Salter <BOBS@ charm. com>, wrote: Thank you Brian.   Will do.    Does the data automatically remove
> > > It will automatically remove the data after it is successfully synced to eBacMap.
> > >
> > > Brian.
> > > On May 20, 2025 at 12:43 PM -0400, Bob Salter <BOBS@charm.com>, wrote:
> > > > quote_type
> > > > Thank you Brian.  Will do.   Does the data automatically remove or does it ask if you want to remove it before doing so?  Reason why I ask is I have a unit, that is Live on Charm Site that has been server 3 for 10 days, and I would like to test that on staging but not lose the data.
> > > > Let me know.  Thanks
> > > >
> > > > bobs
> > > >
> > > > From: Brian Birkhauser <brian@quickdrawdevelopment.com>
> > > > Sent: Tuesday, May 20, 2025 12:32 PM
> > > > To: Bob Salter <BOBS@charm.com>; Natalie Martin <natalie@quickdrawdevelopment.com>
> > > > Subject: Wifi Sync Updates
> > > >
> > > > Hi Bob,  Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing.   Please have your team run some tests on the staging ebacmap site and using novalink. ebacmap. com as the
> > > > Hi Bob,
> > > > Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing.  Please have your team run some tests on the staging ebacmap site and using novalink.ebacmap.com as the sync server.  He’s increased the number of records that can be sent at a time, implemented removing assays from the unit after a successful transfer of test results, improved the reading/parsing of the data, added some retry ability when things get “stuck” and some other optimizations to improve reliability.  From my tests it’s working much smoother.  The logic is still in place to only sync plans/sites if data has changed, but when it does it syncs in larger batches.  With the logic to delete assays from the device, the reset assay index toggle should no longer be necessary as it will always be reset to 0 after a successful sync.
> > > >
> > > > As a reminder, encryption is currently turned off on the staging sync server so if you encounter a server 2 error before receiving the message “Connected to eBacMap” then your device is trying to communicate with encrypted data.
> > > >
> > > > Brian.


=== HTML PART ===
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title></title>
</head>
<body>
<div name="messageSignatureSection"><br />
<div class="matchFont">Brian.</div>
</div>
<div name="messageReplySection">---------- Forwarded message ----------<br />
<b>From:</b> Bob Salter &lt;BOBS@charm.com&gt;<br />
<b>Date:</b> May 21, 2025 at 9:20 AM -0400<br />
<b>To:</b> Brian Birkhauser &lt;brian@quickdrawdevelopment.com&gt;, Natalie Martin &lt;natalie@quickdrawdevelopment.com&gt;<br />
<b>Subject:</b> RE: Wifi Sync Updates<br />
<br />
<blockquote type="cite" style="border-left-color: grey; border-left-width: thin; border-left-style: solid; margin: 5px 5px;padding-left: 10px;">
<div class="WordSection1">
<p class="MsoNormal"><span style="font-size:11.0pt">Unit 4115 did sync at end of day. Took about 25 minutes.&#160; Loaded 1900+ sites and 102 plans.&#160;&#160; Saw same thing, that data on unit were not deleted.&#160; &#160;Is it not deleting because I selected to Reset assay index?&#160; Should I clear data off these units to continue testing?&#160; Let me know what you find on your end.&#160;&#160;</span></p>
<p class="MsoNormal"><span style="font-size:11.0pt">&#160;</span></p>
<div>
<div style="border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt 0in 0in 0in">
<p class="MsoNormal"><b><span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">From:</span></b> <span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">Brian Birkhauser &lt;brian@quickdrawdevelopment.com&gt;<br />
<b>Sent:</b> Tuesday, May 20, 2025 5:12 PM<br />
<b>To:</b> Natalie Martin &lt;natalie@quickdrawdevelopment.com&gt;; Bob Salter &lt;BOBS@charm.com&gt;<br />
<b>Subject:</b> RE: Wifi Sync Updates</span></p>
</div>
</div>
<p class="MsoNormal">&#160;</p>
<div>
<p class="MsoNormal" style="mso-line-height-alt:.75pt"><span style="font-size:1.0pt;color:white">Charm internal QA should be fine. that’s what I’ve been using to test.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">&#160;&#160;My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer</span></p>
</div>
<div>
<p class="MsoNormal" style="mso-line-height-alt:.75pt"><span style="font-size:1.0pt;color:white"></span></p>
</div>
<div name="messageBodySection">
<div>
<p class="MsoNormal">Charm internal QA should be fine. that’s what I’ve been using to test.&#160;&#160;My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer and confirm. It could be it only removes the indexes of the assays it synced.&#160; &#160;<br />
I’ll try to recreate these scenarios to test.</p>
</div>
</div>
<div name="messageSignatureSection">
<p class="MsoNormal">&#160;</p>
<div>
<p class="MsoNormal">Brian.</p>
</div>
</div>
<div name="messageReplySection">
<p class="MsoNormal">On May 20, 2025 at 5:04<span style="font-family:&quot;Arial&quot;,sans-serif"> </span>PM -0400, Bob Salter &lt;<a href="mailto:BOBS@charm.com">BOBS@charm.com</a>&gt;, wrote:<br />
<br /></p>
<blockquote style="border:none;border-left:solid windowtext 1.0pt;padding:0in 0in 0in 8.0pt;margin-left:3.75pt;margin-top:3.75pt;margin-right:3.75pt;margin-bottom:3.75pt">
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">So is been a while since I used two units on Staging site.&#160; I want to make sure Charm Internal QA on staging is OK.&#160;&#160; I have two units4115 and 8597</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">These were units that I had previously been maxing out plans and sites and had found that about 1500 sites about 69 plans was limiting before server 3 errors.&#160;&#160; &#160;&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">I began with adding plans and doing a reset assay index.</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">Unit 8597 did sync after about 20 minutes.&#160; It had 103 plans and about 2000 sites.&#160; But there were 33 prior run tests from march that did not clear off the unit that were still findable by the search on the Novalum.&#160; Is my expectation correct that these should have cleared?&#160; Or is there something about reset assay index that caused that not to happen?&#160;&#160;&#160; Should I clear data off this unit before any more testing?&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">Unit 4115 had already 1888 sites and took 30 minutes to get through that,&#160; it synced existing 49 plans but crashed server 3 on uploading 113 plans.&#160; Those plans did not upload so still playing with it.</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">I haven’t loaded lots of tests on these yet for more testing.</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">bobs</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<div>
<div style="border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt 0in 0in 0in">
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><b><span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">From:</span></b> <span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">Brian Birkhauser &lt;<a href="mailto:brian@quickdrawdevelopment.com">brian@quickdrawdevelopment.com</a>&gt;<br />
<b>Sent:</b> Tuesday, May 20, 2025 1:37 PM<br />
<b>To:</b> Natalie Martin &lt;<a href="mailto:natalie@quickdrawdevelopment.com">natalie@quickdrawdevelopment.com</a>&gt;; Bob Salter &lt;<a href="mailto:BOBS@charm.com">BOBS@charm.com</a>&gt;<br />
<b>Subject:</b> RE: Wifi Sync Updates</span></p>
</div>
</div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">&#160;</p>
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;mso-line-height-alt:.75pt"><span style="font-size:1.0pt;color:white">Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">&#160;&#160;It’s generally not a good idea to mix staging/production data and units. Brian.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span></p>
</div>
<div name="messageBodySection">
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same.&#160;&#160;It’s generally not a good idea to mix staging/production data and units.</p>
</div>
</div>
<div name="messageSignatureSection">
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">&#160;</p>
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">Brian.</p>
</div>
</div>
<div name="messageReplySection">
<p class="MsoNormal" style="mso-margin-top-alt:auto;margin-bottom:12.0pt">On May 20, 2025 at 1:33<span style="font-family:&quot;Arial&quot;,sans-serif"> </span>PM -0400, Bob Salter &lt;<a href="mailto:BOBS@charm.com">BOBS@charm.com</a>&gt;, wrote:</p>
<blockquote style="border:none;border-left:solid windowtext 1.0pt;padding:0in 0in 0in 8.0pt;margin-left:3.75pt;margin-top:3.75pt;margin-right:3.75pt;margin-bottom:3.75pt">
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">How about this.&#160; If I can successfully import it into staging site, could filter it and export it and import the information into live?&#160; I would risk it if that is the case. It would be a really good test.</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">bobs</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<div>
<div style="border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt 0in 0in 0in">
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><b><span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">From:</span></b> <span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">Brian Birkhauser &lt;<a href="mailto:brian@quickdrawdevelopment.com">brian@quickdrawdevelopment.com</a>&gt;<br />
<b>Sent:</b> Tuesday, May 20, 2025 1:30 PM<br />
<b>To:</b> Natalie Martin &lt;<a href="mailto:natalie@quickdrawdevelopment.com">natalie@quickdrawdevelopment.com</a>&gt;; Bob Salter &lt;<a href="mailto:BOBS@charm.com">BOBS@charm.com</a>&gt;<br />
<b>Subject:</b> RE: Wifi Sync Updates</span></p>
</div>
</div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">&#160;</p>
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;mso-line-height-alt:.75pt"><span style="font-size:1.0pt;color:white">It will automatically remove the data after it is successfully synced to eBacMap. Brian. On May 20, 2025 at 12:</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">43 PM -0400, Bob Salter &lt;BOBS@</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">charm.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">com&gt;, wrote: Thank you Brian.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">&#160; Will do.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">&#160;&#160; Does the data automatically remove</span></p>
</div>
<div name="messageBodySection">
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">It will automatically remove the data after it is successfully synced to eBacMap.</p>
</div>
</div>
<div name="messageSignatureSection">
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">&#160;</p>
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">Brian.</p>
</div>
</div>
<div name="messageReplySection">
<p class="MsoNormal" style="mso-margin-top-alt:auto;margin-bottom:12.0pt">On May 20, 2025 at 12:43<span style="font-family:&quot;Arial&quot;,sans-serif"> </span>PM -0400, Bob Salter &lt;<a href="mailto:BOBS@charm.com">BOBS@charm.com</a>&gt;, wrote:</p>
<blockquote style="border:none;border-left:solid windowtext 1.0pt;padding:0in 0in 0in 8.0pt;margin-left:3.75pt;margin-top:3.75pt;margin-right:3.75pt;margin-bottom:3.75pt">
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">Thank you Brian.&#160; Will do.&#160;&#160; Does the data automatically remove or does it ask if you want to remove it before doing so?&#160; Reason why I ask is I have a unit, that is Live on Charm Site that has been server 3 for 10 days, and I would like to test that on staging but not lose the data.&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">Let me know.&#160; Thanks</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">bobs</span></p>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><span style="font-size:11.0pt">&#160;</span></p>
<div>
<div style="border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt 0in 0in 0in">
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto"><b><span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">From:</span></b> <span style="font-size:11.0pt;font-family:&quot;Calibri&quot;,sans-serif">Brian Birkhauser &lt;<a href="mailto:brian@quickdrawdevelopment.com">brian@quickdrawdevelopment.com</a>&gt;<br />
<b>Sent:</b> Tuesday, May 20, 2025 12:32 PM<br />
<b>To:</b> Bob Salter &lt;<a href="mailto:BOBS@charm.com">BOBS@charm.com</a>&gt;; Natalie Martin &lt;<a href="mailto:natalie@quickdrawdevelopment.com">natalie@quickdrawdevelopment.com</a>&gt;<br />
<b>Subject:</b> Wifi Sync Updates</span></p>
</div>
</div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">&#160;</p>
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;mso-line-height-alt:.75pt"><span style="font-size:1.0pt;color:white">Hi Bob,&#160; Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">&#160;&#160;Please have your team run some tests on the staging ebacmap site and using novalink.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">ebacmap.</span><span style="font-size:1.0pt;font-family:&quot;Arial&quot;,sans-serif;color:white"> </span><span style="font-size:1.0pt;color:white">com as the</span></p>
</div>
<div name="messageBodySection">
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">Hi Bob,&#160;<br />
Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing.&#160;&#160;Please have your team run some tests on the staging ebacmap site and using novalink.ebacmap.com as the sync server.&#160;&#160;He’s increased the number of records that can be sent at a time, implemented removing assays from the unit after a successful transfer of test results, improved the reading/parsing of the data, added some retry ability when things get “stuck” and some other optimizations to improve reliability.&#160;&#160;From my tests it’s working much smoother.&#160;&#160;The logic is still in place to only sync plans/sites if data has changed, but when it does it syncs in larger batches.&#160;&#160;With the logic to delete assays from the device, the reset assay index toggle should no longer be necessary as it will always be reset to 0 after a successful sync.<br />
<br />
As a reminder, encryption is currently turned off on the staging sync server so if you encounter a server 2 error before receiving the message “Connected to eBacMap” then your device is trying to communicate with encrypted data.</p>
</div>
</div>
<div name="messageSignatureSection">
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">&#160;</p>
<div>
<p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto">Brian.</p>
</div>
</div>
</div>
</blockquote>
</div>
</div>
</blockquote>
</div>
</div>
</blockquote>
</div>
</div>
</blockquote>
</div>
</body>
</html>


```
