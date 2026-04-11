---
gmail_message_id: 19a5096ec9830ca3
account: plasmatoid@gmail.com
date_header: Tue, 04 Nov 2025 12:37:39 -0800 (PST)
from: Mail Delivery Subsystem <mailer-daemon@googlemail.com>
to: plasmatoid@gmail.com
subject: Delivery Status Notification (Failure)
body_sha256: d71be2ce6be2d49213b67239fe6807f6ba74de0e9c85a1fda080c550ecbbc3f3
snippet: Address not found Your message wasn&#39;t delivered to no-reply@aasp.org.br because the address couldn&#39;t be found, or is unable to receive mail. LEARN MORE The response was: The email account that
---

# Delivery Status Notification (Failure)

**From:** Mail Delivery Subsystem <mailer-daemon@googlemail.com>
**To:** plasmatoid@gmail.com
**Date:** Tue, 04 Nov 2025 12:37:39 -0800 (PST)
**SHA256:** `d71be2ce6be2d49213b67239fe6807f6ba74de0e9c85a1fda080c550ecbbc3f3`

## Body (extracted text)

** Address not found ** Your message wasn't delivered to no-reply@aasp.org.br because the address couldn't be found, or is unable to receive mail. Learn more here: https://support.google.com/mail/?p=NoSuchUser The response was: The email account that you tried to reach does not exist. Please try double-checking the recipient's email address for typos or unnecessary spaces. For more information, go to https://support.google.com/mail/?p=NoSuchUser Final-Recipient: rfc822; no-reply@aasp.org.br Action: failed Status: 5.1.3 Diagnostic-Code: smtp; The email account that you tried to reach does not exist. Please try double-checking the recipient's email address for typos or unnecessary spaces. For more information, go to https://support.google.com/mail/?p=NoSuchUser Last-Attempt-Date: Tue, 04 Nov 2025 12:37:39 -0800 (PST) X-Received: by 2002:a17:903:1aed:b0:275:81ca:2c5 with SMTP id d9443c01a7336-2962adedfd0mr12063975ad.59.1762288658098; Tue, 04 Nov 2025 12:37:38 -0800 (PST) ARC-Seal: i=1; a=rsa-sha256; t=1762288658; cv=none; d=google.com; s=arc-20240605; b=lwr29gn54Khn8cdxEPhzkzvbYHyZ5SY0fVb2DyPDGPLiDmwEYRhkHd+dF+sX7uHadJ PCfV0qFtzAevW+hNJuyx3MG6WhMUlF3mCBVQ9wowqYW2TGHdfpJ4dGCrAaWPOmRGQtxl Yj/sGMyrxgOZD+Sibt+cLK9m0HZhdMKPKOx+hbmyeGTc3SgX8ihjWFK7E0M5GWpnN7To tVnZPUIg1tppgLC8gbJ1KxbWHtxb8ZjtK6PQNr8PNldhqgRXFoX293MdBj08t5nkCW2S W5Rl5Phi/Lm+Ph62kmQTHJgxaMynlBntyOUDXSFVpiKK8GALfoLf3JAdS8OAVwPk1JsI 1OKw== ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :dkim-signature; bh=aSW4E1zr7mv13UHnugDq+BWQOrPRESIbAt7kAD/ZTs0=; fh=I33QT7Q8JwJrFKR8hReXq8/dXLs4gg6i2J05GBKToUs=; b=ZjmLrxit3d8RGaPH2xcFKhh8dfDUbCaA3vBN6Dzl7mrxzx7NsIoejgs+snFHY61pgX reeXf5+M9jlJ5XJ7tbpF6lIWG7U00bVZtEjaUbVWLUPD4TfS1GgAdjCNL2xbHfmEzRWP mHa6XLQJWgdsiBNSR4BAF7qye5AofJkqzwx+yynP46EDCf/jxU2peun8wyjE2o5CcWVG W+myjGtPWMGLIMzNBymDKdbZUppfI2H4XbMNv0ShDkGNUhTCo/wic3UaUl1mpFpEHgK5 PZ5hiI9wrSvhF/DpCaiBfLO4X8UklG4hiBK+2GxEg4epQjCTXMVoXBxIAH7aSICDRd80 PTyQ==; dara=google.com ARC-Authentication-Results: i=1; mx.google.com; dkim=pass header.i=@gmail.com header.s=20230601 header.b="Di9X+//F"; spf=pass (google.com: domain of plasmatoid@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=plasmatoid@gmail.com; dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com; dara=neutral header.i=@aasp.org.br Return-Path: Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41]) by mx.google.com with SMTPS id 98e67ed59e1d1-34092d3601dsor7495963a91.10.2025.11.04.12.37.38 for (Google Transport Security); Tue, 04 Nov 2025 12:37:38 -0800 (PST) Received-SPF: pass (google.com: domain of plasmatoid@gmail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41; Authentication-Results: mx.google.com; dkim=pass header.i=@gmail.com header.s=20230601 header.b="Di9X+//F"; spf=pass (google.com: domain of plasmatoid@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=plasmatoid@gmail.com; dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com; dara=neutral header.i=@aasp.org.br DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20230601; t=1762288657; x=1762893457; darn=aasp.org.br; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :from:to:cc:subject:date:message-id:reply-to; bh=aSW4E1zr7mv13UHnugDq+BWQOrPRESIbAt7kAD/ZTs0=; b=Di9X+//Ft4C5klkx/iWAvVs/oxyN1AcZ9qS60tEjfKWzNh0JLidRlldznUCV8dZNLJ qouCYIlz8TmfcU5WK9+88TvRjyxGZhrOgPzZ5Fa1WBWp6x217XcJSrcbLU6V6d30ZHCD BDFNMSvxeLX89OWAhdiVUpbQwfYkEl0+YTWlgOQiX3+JUuON8DwMoFyO51chdmp4SMeo Kct7eL8tICSoCA6sr0xSg+K6gEATxuTeVmWdN11YI+P0eYK8+vEhsVs2ZnL8gnfgd0Xk BUgxNVB8JVki/IpLB8302UBr0XXQ9TZ5dWvRE9rBI2E+n0TY7/PN/Va5b8oxgkAlhnmE HqpA== X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20230601; t=1762288657; x=1762893457; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to; bh=aSW4E1zr7mv13UHnugDq+BWQOrPRESIbAt7kAD/ZTs0=; b=Ybl4RGBplc28LnT1xnzo9OuSbUqZKRuXHUoBm+sP0WGe+GCNrPcdU9Ls2q8DrUh1gI YJB0qyawR1eaLGEhgx9ZWO0Gx7TbLev0EPhH2e7xTo5KjfLOO194OIPxCTMMSmL8nOA8 x///yzl8Q0FCypaxg+08MG0LHFdPSmnMaVX58SuTvOwNwMaQofFKAsUOUb3DjIpRdohg 9w+weHSmQAxUZ29GZrlrJTvnP6Gym1G4Ux7BPtQCae3O5/XSBlWLLpaufL3TAylpvYv9 QTdU472YhT8IedS5zw0b3YeEoEjVf86pn3W7EOZzrm7/ILv0VXRgboKTAJgELjwvVHzm Gz8A== X-Gm-Message-State: AOJu0YwROSzRlUdAK4Mk/MeD26ZyPAhUE6mWCbt4MxXiam3+KXm1EbOZ VtAblGGwflriuDoXpVqP6E7hCLB9GJO1UB2CGkmvVkJ5RL82XTy/S137yRE8tB2OLaoNXm64BPo No13AdZviURq6oa1Iv/27oLaGvv6oTQKep4P0tAQ= X-Gm-Gg: ASbGncvuzMKk6z9olkqe8koNwqhMfurRfFDp6ax8IPAqqvu/mDXQ35tP8xYJ3b1zyRr V1st68q68dN9mDUdwTWJV5sFcoyFO1GrhXZnGud/VcOvoJ/dCcqOwoqxqbpiv7vlo9yvObPtGdc BP90GAW578kSeO4vHbAIq8bF2LsRXni4DwkfOcJIFdf7/isREEbpBSwLnG1nh7WQqVo3NSSbLTP hhO/wBm4btxHpJe60g2UrviIakFDcQl74FNVo9n7i8PkMOXWsZqi/ifTb7x X-Google-Smtp-Source: AGHT+IHMmWuJT+knbTcM4N8/ZJonYpZ86i0mmZ4sE1cHc1S0rH+CZoF3VjBz2hf+jT1JGQeiCmYY9ZYxaYxH8e13r54= X-Received: by 2002:a17:90b:5847:b0:340:b572:3b7d with SMTP id 98e67ed59e1d1-341a6dc595fmr667854a91.19.1762288657398; Tue, 04 Nov 2025 12:37:37 -0800 (PST) MIME-Version: 1.0 References: In-Reply-To: From: Jesse Daniel Brown Date: Tue, 4 Nov 2025 17:37:26 -0300 X-Gm-Features: AWmQ_bnlaTQQw7kwkntQ7862W7Y6VFXU5bQrzNYeaVyrlt1slITsbdjn-MKPMWA Message-ID: Subject: =?UTF-8?B?UmU6IFtBQVNQXSBJbnRpbWHDp8OjbyBjb21wYXJ0aWxoYWRh?= To: no-reply@aasp.org.br Content-Type: multipart/alternative; boundary="0000000000006a80cc0642cacd80" === HTML PART === * { font-family:Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif; } Address not found Your message wasn't delivered to no-reply@aasp.org.br because the address couldn't be found, or is unable to receive mail. LEARN MORE The response was: The email account that you tried to reach does not exist. Please try double-checking the recipient's email address for typos or unnecessary spaces. For more information, go to https://support.google.com/mail/?p=NoSuchUser

## Raw body (tamper-evident)

```

** Address not found **

Your message wasn't delivered to no-reply@aasp.org.br because the address couldn't be found, or is unable to receive mail.

Learn more here: https://support.google.com/mail/?p=NoSuchUser

The response was:

The email account that you tried to reach does not exist. Please try double-checking the recipient's email address for typos or unnecessary spaces. For more information, go to https://support.google.com/mail/?p=NoSuchUser

Final-Recipient: rfc822; no-reply@aasp.org.br
Action: failed
Status: 5.1.3
Diagnostic-Code: smtp; The email account that you tried to reach does not exist. Please try double-checking the recipient's email address for typos or unnecessary spaces. For more information, go to https://support.google.com/mail/?p=NoSuchUser
Last-Attempt-Date: Tue, 04 Nov 2025 12:37:39 -0800 (PST)

X-Received: by 2002:a17:903:1aed:b0:275:81ca:2c5 with SMTP id d9443c01a7336-2962adedfd0mr12063975ad.59.1762288658098;
        Tue, 04 Nov 2025 12:37:38 -0800 (PST)
ARC-Seal: i=1; a=rsa-sha256; t=1762288658; cv=none;
        d=google.com; s=arc-20240605;
        b=lwr29gn54Khn8cdxEPhzkzvbYHyZ5SY0fVb2DyPDGPLiDmwEYRhkHd+dF+sX7uHadJ
         PCfV0qFtzAevW+hNJuyx3MG6WhMUlF3mCBVQ9wowqYW2TGHdfpJ4dGCrAaWPOmRGQtxl
         Yj/sGMyrxgOZD+Sibt+cLK9m0HZhdMKPKOx+hbmyeGTc3SgX8ihjWFK7E0M5GWpnN7To
         tVnZPUIg1tppgLC8gbJ1KxbWHtxb8ZjtK6PQNr8PNldhqgRXFoX293MdBj08t5nkCW2S
         W5Rl5Phi/Lm+Ph62kmQTHJgxaMynlBntyOUDXSFVpiKK8GALfoLf3JAdS8OAVwPk1JsI
         1OKw==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;
        h=to:subject:message-id:date:from:in-reply-to:references:mime-version
         :dkim-signature;
        bh=aSW4E1zr7mv13UHnugDq+BWQOrPRESIbAt7kAD/ZTs0=;
        fh=I33QT7Q8JwJrFKR8hReXq8/dXLs4gg6i2J05GBKToUs=;
        b=ZjmLrxit3d8RGaPH2xcFKhh8dfDUbCaA3vBN6Dzl7mrxzx7NsIoejgs+snFHY61pgX
         reeXf5+M9jlJ5XJ7tbpF6lIWG7U00bVZtEjaUbVWLUPD4TfS1GgAdjCNL2xbHfmEzRWP
         mHa6XLQJWgdsiBNSR4BAF7qye5AofJkqzwx+yynP46EDCf/jxU2peun8wyjE2o5CcWVG
         W+myjGtPWMGLIMzNBymDKdbZUppfI2H4XbMNv0ShDkGNUhTCo/wic3UaUl1mpFpEHgK5
         PZ5hiI9wrSvhF/DpCaiBfLO4X8UklG4hiBK+2GxEg4epQjCTXMVoXBxIAH7aSICDRd80
         PTyQ==;
        dara=google.com
ARC-Authentication-Results: i=1; mx.google.com;
       dkim=pass header.i=@gmail.com header.s=20230601 header.b="Di9X+//F";
       spf=pass (google.com: domain of plasmatoid@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=plasmatoid@gmail.com;
       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com;
       dara=neutral header.i=@aasp.org.br
Return-Path: <plasmatoid@gmail.com>
Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])
        by mx.google.com with SMTPS id 98e67ed59e1d1-34092d3601dsor7495963a91.10.2025.11.04.12.37.38
        for <no-reply@aasp.org.br>
        (Google Transport Security);
        Tue, 04 Nov 2025 12:37:38 -0800 (PST)
Received-SPF: pass (google.com: domain of plasmatoid@gmail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;
Authentication-Results: mx.google.com;
       dkim=pass header.i=@gmail.com header.s=20230601 header.b="Di9X+//F";
       spf=pass (google.com: domain of plasmatoid@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=plasmatoid@gmail.com;
       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com;
       dara=neutral header.i=@aasp.org.br
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20230601; t=1762288657; x=1762893457; darn=aasp.org.br;
        h=to:subject:message-id:date:from:in-reply-to:references:mime-version
         :from:to:cc:subject:date:message-id:reply-to;
        bh=aSW4E1zr7mv13UHnugDq+BWQOrPRESIbAt7kAD/ZTs0=;
        b=Di9X+//Ft4C5klkx/iWAvVs/oxyN1AcZ9qS60tEjfKWzNh0JLidRlldznUCV8dZNLJ
         qouCYIlz8TmfcU5WK9+88TvRjyxGZhrOgPzZ5Fa1WBWp6x217XcJSrcbLU6V6d30ZHCD
         BDFNMSvxeLX89OWAhdiVUpbQwfYkEl0+YTWlgOQiX3+JUuON8DwMoFyO51chdmp4SMeo
         Kct7eL8tICSoCA6sr0xSg+K6gEATxuTeVmWdN11YI+P0eYK8+vEhsVs2ZnL8gnfgd0Xk
         BUgxNVB8JVki/IpLB8302UBr0XXQ9TZ5dWvRE9rBI2E+n0TY7/PN/Va5b8oxgkAlhnmE
         HqpA==
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20230601; t=1762288657; x=1762893457;
        h=to:subject:message-id:date:from:in-reply-to:references:mime-version
         :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to;
        bh=aSW4E1zr7mv13UHnugDq+BWQOrPRESIbAt7kAD/ZTs0=;
        b=Ybl4RGBplc28LnT1xnzo9OuSbUqZKRuXHUoBm+sP0WGe+GCNrPcdU9Ls2q8DrUh1gI
         YJB0qyawR1eaLGEhgx9ZWO0Gx7TbLev0EPhH2e7xTo5KjfLOO194OIPxCTMMSmL8nOA8
         x///yzl8Q0FCypaxg+08MG0LHFdPSmnMaVX58SuTvOwNwMaQofFKAsUOUb3DjIpRdohg
         9w+weHSmQAxUZ29GZrlrJTvnP6Gym1G4Ux7BPtQCae3O5/XSBlWLLpaufL3TAylpvYv9
         QTdU472YhT8IedS5zw0b3YeEoEjVf86pn3W7EOZzrm7/ILv0VXRgboKTAJgELjwvVHzm
         Gz8A==
X-Gm-Message-State: AOJu0YwROSzRlUdAK4Mk/MeD26ZyPAhUE6mWCbt4MxXiam3+KXm1EbOZ
	VtAblGGwflriuDoXpVqP6E7hCLB9GJO1UB2CGkmvVkJ5RL82XTy/S137yRE8tB2OLaoNXm64BPo
	No13AdZviURq6oa1Iv/27oLaGvv6oTQKep4P0tAQ=
X-Gm-Gg: ASbGncvuzMKk6z9olkqe8koNwqhMfurRfFDp6ax8IPAqqvu/mDXQ35tP8xYJ3b1zyRr
	V1st68q68dN9mDUdwTWJV5sFcoyFO1GrhXZnGud/VcOvoJ/dCcqOwoqxqbpiv7vlo9yvObPtGdc
	BP90GAW578kSeO4vHbAIq8bF2LsRXni4DwkfOcJIFdf7/isREEbpBSwLnG1nh7WQqVo3NSSbLTP
	hhO/wBm4btxHpJe60g2UrviIakFDcQl74FNVo9n7i8PkMOXWsZqi/ifTb7x
X-Google-Smtp-Source: AGHT+IHMmWuJT+knbTcM4N8/ZJonYpZ86i0mmZ4sE1cHc1S0rH+CZoF3VjBz2hf+jT1JGQeiCmYY9ZYxaYxH8e13r54=
X-Received: by 2002:a17:90b:5847:b0:340:b572:3b7d with SMTP id
 98e67ed59e1d1-341a6dc595fmr667854a91.19.1762288657398; Tue, 04 Nov 2025
 12:37:37 -0800 (PST)
MIME-Version: 1.0
References: <690a2a24.050a0220.161293.11aeSMTPIN_ADDED_MISSING@mx.google.com>
In-Reply-To: <690a2a24.050a0220.161293.11aeSMTPIN_ADDED_MISSING@mx.google.com>
From: Jesse Daniel Brown <plasmatoid@gmail.com>
Date: Tue, 4 Nov 2025 17:37:26 -0300
X-Gm-Features: AWmQ_bnlaTQQw7kwkntQ7862W7Y6VFXU5bQrzNYeaVyrlt1slITsbdjn-MKPMWA
Message-ID: <CALdg1mPDqFHyK+OHhSygfwJmkBiQSY8Z-qcfQ1PuLCGpuq_tqA@mail.gmail.com>
Subject: =?UTF-8?B?UmU6IFtBQVNQXSBJbnRpbWHDp8OjbyBjb21wYXJ0aWxoYWRh?=
To: no-reply@aasp.org.br
Content-Type: multipart/alternative; boundary="0000000000006a80cc0642cacd80"



=== HTML PART ===

<html>
<head>
<style>
* {
font-family:Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
}
</style>
</head>
<body>
<table cellpadding="0" cellspacing="0" class="email-wrapper" style="padding-top:32px;background-color:#ffffff;"><tbody>
<tr><td>
<table cellpadding=0 cellspacing=0><tbody>
<tr><td style="max-width:560px;padding:24px 24px 32px;background-color:#fafafa;border:1px solid #e0e0e0;border-radius:2px">
<img style="padding:0 24px 16px 0;float:left" width=72 height=72 alt="Error Icon" src="cid:icon.png">
<table style="min-width:272px;padding-top:8px"><tbody>
<tr><td><h2 style="font-size:20px;color:#212121;font-weight:bold;margin:0">
Address not found
</h2></td></tr>
<tr><td style="padding-top:20px;color:#757575;font-size:16px;font-weight:normal;text-align:left">
Your message wasn't delivered to <a style='color:#212121;text-decoration:none'><b>no-reply@aasp.org.br</b></a> because the address couldn't be found, or is unable to receive mail.
</td></tr>
<tr><td style="padding-top:24px;color:#4285F4;font-size:14px;font-weight:bold;text-align:left">
<a style="text-decoration:none" href="https://support.google.com/mail/?p=NoSuchUser">LEARN MORE</a>
</td></tr>
</tbody></table>
</td></tr>
</tbody></table>
</td></tr>
<tr style="border:none;background-color:#fff;font-size:12.8px;width:90%">
<td align="left" style="padding:48px 10px">
The response was:<br/>
<p style="font-family:monospace">
The email account that you tried to reach does not exist. Please try double-checking the recipient's email address for typos or unnecessary spaces. For more information, go to https://support.google.com/mail/?p=NoSuchUser
</p>
</td>
</tr>
</tbody></table>
</body>
</html>


```
