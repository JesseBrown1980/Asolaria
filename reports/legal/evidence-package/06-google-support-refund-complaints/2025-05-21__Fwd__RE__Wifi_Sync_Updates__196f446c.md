---
gmail_message_id: 196f446ce811159f
account: jessebrown.soft1980@gmail.com
date_header: Wed, 21 May 2025 15:16:42 -0400
from: Jesse Brown <jessebrown.soft1980@gmail.com>
to: Plasmatoid@gmail.com
subject: Fwd: RE: Wifi Sync Updates
body_sha256: bb1df952757ac0523de41df2d07a2b8586d0a525d1d0704dafe6a1f3be72e6ae
snippet: ---------- Forwarded message --------- From: Brian Birkhauser &lt;brian@quickdrawdevelopment.com&gt; Date: Wed, May 21, 2025 at 3:14 PM Subject: Fwd: RE: Wifi Sync Updates To: Jesse Brown &lt;
---

# Fwd: RE: Wifi Sync Updates

**From:** Jesse Brown <jessebrown.soft1980@gmail.com>
**To:** Plasmatoid@gmail.com
**Date:** Wed, 21 May 2025 15:16:42 -0400
**SHA256:** `bb1df952757ac0523de41df2d07a2b8586d0a525d1d0704dafe6a1f3be72e6ae`

## Body (extracted text)

---------- Forwarded message --------- From: Brian Birkhauser Date: Wed, May 21, 2025 at 3:14 PM Subject: Fwd: RE: Wifi Sync Updates To: Jesse Brown Brian. ---------- Forwarded message ---------- From: Bob Salter Date: May 21, 2025 at 9:20 AM -0400 To: Brian Birkhauser , Natalie Martin Subject: RE: Wifi Sync Updates Unit 4115 did sync at end of day. Took about 25 minutes. Loaded 1900+ sites and 102 plans. Saw same thing, that data on unit were not deleted. Is it not deleting because I selected to Reset assay index? Should I clear data off these units to continue testing? Let me know what you find on your end. From: Brian Birkhauser Sent: Tuesday, May 20, 2025 5:12 PM To: Natalie Martin ; Bob Salter Subject: RE: Wifi Sync Updates Charm internal QA should be fine. that’s what I’ve been using to test. My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer Charm internal QA should be fine. that’s what I’ve been using to test. My expectation would be that all assays would have been removed after a successful sync, but I’ll have to go back and look at the code and speak with our developer and confirm. It could be it only removes the indexes of the assays it synced. I’ll try to recreate these scenarios to test. Brian. On May 20, 2025 at 5:04 PM -0400, Bob Salter , wrote: So is been a while since I used two units on Staging site. I want to make sure Charm Internal QA on staging is OK. I have two units4115 and 8597 These were units that I had previously been maxing out plans and sites and had found that about 1500 sites about 69 plans was limiting before server 3 errors. I began with adding plans and doing a reset assay index. Unit 8597 did sync after about 20 minutes. It had 103 plans and about 2000 sites. But there were 33 prior run tests from march that did not clear off the unit that were still findable by the search on the Novalum. Is my expectation correct that these should have cleared? Or is there something about reset assay index that caused that not to happen? Should I clear data off this unit before any more testing? Unit 4115 had already 1888 sites and took 30 minutes to get through that, it synced existing 49 plans but crashed server 3 on uploading 113 plans. Those plans did not upload so still playing with it. I haven’t loaded lots of tests on these yet for more testing. bobs From: Brian Birkhauser Sent: Tuesday, May 20, 2025 1:37 PM To: Natalie Martin ; Bob Salter Subject: RE: Wifi Sync Updates Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same. It’s generally not a good idea to mix staging/production data and units. Brian. Do you have the exact same plans and sites on the staging as production for that unit? That’s the only way that will work is if all the data is the same. It’s generally not a good idea to mix staging/production data and units. Brian. On May 20, 2025 at 1:33 PM -0400, Bob Salter , wrote: How about this. If I can successfully import it into staging site, could filter it and export it and import the information into live? I would risk it if that is the case. It would be a really good test. bobs From: Brian Birkhauser Sent: Tuesday, May 20, 2025 1:30 PM To: Natalie Martin ; Bob Salter Subject: RE: Wifi Sync Updates It will automatically remove the data after it is successfully synced to eBacMap. Brian. On May 20, 2025 at 12: 43 PM -0400, Bob Salter , wrote: Thank you Brian. Will do. Does the data automatically remove It will automatically remove the data after it is successfully synced to eBacMap. Brian. On May 20, 2025 at 12:43 PM -0400, Bob Salter , wrote: Thank you Brian. Will do. Does the data automatically remove or does it ask if you want to remove it before doing so? Reason why I ask is I have a unit, that is Live on Charm Site that has been server 3 for 10 days, and I would like to test that on staging but not lose the data. Let me know. Thanks bobs From: Brian Birkhauser Sent: Tuesday, May 20, 2025 12:32 PM To: Bob Salter ; Natalie Martin Subject: Wifi Sync Updates Hi Bob, Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing. Please have your team run some tests on the staging ebacmap site and using novalink. ebacmap. com as the Hi Bob, Our developer has completed the wifi sync updates and I’ve deployed them to the staging sync server for testing. Please have your team run some tests on the staging ebacmap site and using novalink.ebacmap.com as the sync server. He’s increased the number of records that can be sent at a time, implemented removing assays from the unit after a successful transfer of test results, improved the reading/parsing of the data, added some retry ability when things get “stuck” and some other optimizations to improve reliability. From my tests it’s working much smoother. The logic is still in place to only sync plans/sites if data has changed, but when it does it syncs in larger batches. With the logic to delete assays from the device, the reset assay index toggle should no longer be necessary as it will always be reset to 0 after a successful sync. As a reminder, encryption is currently turned off on the staging sync server so if you encounter a server 2 error before receiving the message “Connected to eBacMap” then your device is trying to communicate with encrypted data. Brian.

## Raw body (tamper-evident)

```
---------- Forwarded message ---------
From: Brian Birkhauser <brian@quickdrawdevelopment.com>
Date: Wed, May 21, 2025 at 3:14 PM
Subject: Fwd: RE: Wifi Sync Updates
To: Jesse Brown <jessebrown.soft1980@gmail.com>



Brian.
---------- Forwarded message ----------
From: Bob Salter <BOBS@charm.com>
Date: May 21, 2025 at 9:20 AM -0400
To: Brian Birkhauser <brian@quickdrawdevelopment.com>, Natalie Martin
<natalie@quickdrawdevelopment.com>
Subject: RE: Wifi Sync Updates

Unit 4115 did sync at end of day. Took about 25 minutes.  Loaded 1900+
sites and 102 plans.   Saw same thing, that data on unit were not
deleted.   Is it not deleting because I selected to Reset assay index?
 Should I clear data off these units to continue testing?  Let me know
what you find on your end.



From: Brian Birkhauser <brian@quickdrawdevelopment.com>
Sent: Tuesday, May 20, 2025 5:12 PM
To: Natalie Martin <natalie@quickdrawdevelopment.com>; Bob Salter
<BOBS@charm.com>
Subject: RE: Wifi Sync Updates



Charm internal QA should be fine. that’s what I’ve been using to test.
  My expectation would be that all assays would have been removed
after a successful sync, but I’ll have to go back and look at the code
and speak with our developer

Charm internal QA should be fine. that’s what I’ve been using to test.
My expectation would be that all assays would have been removed after
a successful sync, but I’ll have to go back and look at the code and
speak with our developer and confirm. It could be it only removes the
indexes of the assays it synced.
I’ll try to recreate these scenarios to test.



Brian.

On May 20, 2025 at 5:04 PM -0400, Bob Salter <BOBS@charm.com>, wrote:

So is been a while since I used two units on Staging site.  I want to
make sure Charm Internal QA on staging is OK.   I have two units4115
and 8597



These were units that I had previously been maxing out plans and sites
and had found that about 1500 sites about 69 plans was limiting before
server 3 errors.



I began with adding plans and doing a reset assay index.



Unit 8597 did sync after about 20 minutes.  It had 103 plans and about
2000 sites.  But there were 33 prior run tests from march that did not
clear off the unit that were still findable by the search on the
Novalum.  Is my expectation correct that these should have cleared?
Or is there something about reset assay index that caused that not to
happen?    Should I clear data off this unit before any more testing?



Unit 4115 had already 1888 sites and took 30 minutes to get through
that,  it synced existing 49 plans but crashed server 3 on uploading
113 plans.  Those plans did not upload so still playing with it.



I haven’t loaded lots of tests on these yet for more testing.



bobs



From: Brian Birkhauser <brian@quickdrawdevelopment.com>
Sent: Tuesday, May 20, 2025 1:37 PM
To: Natalie Martin <natalie@quickdrawdevelopment.com>; Bob Salter
<BOBS@charm.com>
Subject: RE: Wifi Sync Updates



Do you have the exact same plans and sites on the staging as
production for that unit? That’s the only way that will work is if all
the data is the same.   It’s generally not a good idea to mix
staging/production data and units. Brian.

Do you have the exact same plans and sites on the staging as
production for that unit? That’s the only way that will work is if all
the data is the same.  It’s generally not a good idea to mix
staging/production data and units.



Brian.

On May 20, 2025 at 1:33 PM -0400, Bob Salter <BOBS@charm.com>, wrote:

How about this.  If I can successfully import it into staging site,
could filter it and export it and import the information into live?  I
would risk it if that is the case. It would be a really good test.



bobs



From: Brian Birkhauser <brian@quickdrawdevelopment.com>
Sent: Tuesday, May 20, 2025 1:30 PM
To: Natalie Martin <natalie@quickdrawdevelopment.com>; Bob Salter
<BOBS@charm.com>
Subject: RE: Wifi Sync Updates



It will automatically remove the data after it is successfully synced
to eBacMap. Brian. On May 20, 2025 at 12: 43 PM -0400, Bob Salter
<BOBS@ charm. com>, wrote: Thank you Brian.   Will do.    Does the
data automatically remove

It will automatically remove the data after it is successfully synced
to eBacMap.



Brian.

On May 20, 2025 at 12:43 PM -0400, Bob Salter <BOBS@charm.com>, wrote:

Thank you Brian.  Will do.   Does the data automatically remove or
does it ask if you want to remove it before doing so?  Reason why I
ask is I have a unit, that is Live on Charm Site that has been server
3 for 10 days, and I would like to test that on staging but not lose
the data.

Let me know.  Thanks



bobs



From: Brian Birkhauser <brian@quickdrawdevelopment.com>
Sent: Tuesday, May 20, 2025 12:32 PM
To: Bob Salter <BOBS@charm.com>; Natalie Martin
<natalie@quickdrawdevelopment.com>
Subject: Wifi Sync Updates



Hi Bob,  Our developer has completed the wifi sync updates and I’ve
deployed them to the staging sync server for testing.   Please have
your team run some tests on the staging ebacmap site and using
novalink. ebacmap. com as the

Hi Bob,
Our developer has completed the wifi sync updates and I’ve deployed
them to the staging sync server for testing.  Please have your team
run some tests on the staging ebacmap site and using
novalink.ebacmap.com as the sync server.  He’s increased the number of
records that can be sent at a time, implemented removing assays from
the unit after a successful transfer of test results, improved the
reading/parsing of the data, added some retry ability when things get
“stuck” and some other optimizations to improve reliability.  From my
tests it’s working much smoother.  The logic is still in place to only
sync plans/sites if data has changed, but when it does it syncs in
larger batches.  With the logic to delete assays from the device, the
reset assay index toggle should no longer be necessary as it will
always be reset to 0 after a successful sync.

As a reminder, encryption is currently turned off on the staging sync
server so if you encounter a server 2 error before receiving the
message “Connected to eBacMap” then your device is trying to
communicate with encrypted data.



Brian.


```
