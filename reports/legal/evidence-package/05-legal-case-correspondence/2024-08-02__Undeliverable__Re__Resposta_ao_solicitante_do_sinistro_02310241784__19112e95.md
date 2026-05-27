---
gmail_message_id: 19112e956d97d38a
account: plasmatoid@gmail.com
date_header: Fri, 2 Aug 2024 11:46:05 +0000
from: <postmaster@sura.com>
to: <plasmatoid@gmail.com>
subject: Undeliverable: Re: Resposta ao solicitante do sinistro 02310241784
body_sha256: 9ba825f168c9720da4c2ebf283b417043835a08b21742dd26350be0f457ec486
snippet: Delivery has failed to these recipients or groups: fernanda.nicola@segurossura.com.br Your message couldn&#39;t be delivered. Despite repeated attempts to contact the recipient&#39;s email system it
---

# Undeliverable: Re: Resposta ao solicitante do sinistro 02310241784

**From:** <postmaster@sura.com>
**To:** <plasmatoid@gmail.com>
**Date:** Fri, 2 Aug 2024 11:46:05 +0000
**SHA256:** `9ba825f168c9720da4c2ebf283b417043835a08b21742dd26350be0f457ec486`

## Body (extracted text)

Delivery has failed to these recipients or groups: fernanda.nicola@segurossura.com.br Your message couldn't be delivered. Despite repeated attempts to contact the recipient's email system it didn't respond. Contact the recipient by some other means (by phone, for example) and ask them to tell their email admin that it appears that their email system isn't accepting connection requests from your email system. Give them the error details shown below. It's likely that the recipient's email admin is the only one who can fix this problem. For more information and tips to fix this issue see this article: https://go.microsoft.com/fwlink/?LinkId=389361. Diagnostic information for administrators: Generating server: CO1PR13MB4918.namprd13.prod.outlook.com Total retry attempts: 10 fernanda.nicola@segurossura.com.br Remote server returned '550 5.4.300 Message expired -> 421 Service Temporarily Unavailable' Original message headers: Received: from BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22) by CO1PR13MB4918.namprd13.prod.outlook.com (2603:10b6:303:f9::11) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Fri, 2 Aug 2024 03:30:56 +0000 Received: from LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22) by BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22; Thu, 1 Aug 2024 22:52:02 +0000 ARC-Seal: i=1; a=rsa-sha256; s=arcselector10001; d=microsoft.com; cv=none; b=sXUFZ7fclbZEp/70Q4JeP17ssHtVmXc/242jYlO16N/bp3k6RlvtdHSiTRGX8kwDEgrkpdftsK2k6WC1DpXOp9n/MNv/xCmivRuVmzLbxUy9EuFVFUcszAj4sSpcfDeHU0e1+QyFExGE0K3AmrtmEtDMN29fuzh0rcXUQVxRW4gcg4rAWnHzmMUnjIMWprWKsS5F+zw48p4D4hKLku9UcNPobqmswXTKu53tlVcw8U3Eu6WuEPrqJUUg7jiQ9HHn+J281FvzGmNXtK3n1+yv22ViEJamb6iiqi8C8gl5PhN478ss+6dKZ1gd0gg7ZfdN62FowA9QyIgFWY+QuuBBMA== ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=microsoft.com; s=arcselector10001; h=From:Date:Subject:Message-ID:Content-Type:MIME-Version:X-MS-Exchange-AntiSpam-MessageData-ChunkCount:X-MS-Exchange-AntiSpam-MessageData-0:X-MS-Exchange-AntiSpam-MessageData-1; bh=5hHw/AKaP7jRauBe3VisP5spgvm9xbUpaQ4sya9hdL8=; b=CqIST2DyBkCuqKSefXirO5ovP+VQygCbvyvA0F8b175QTENH1u0r1z3bqoYtl6BW2o+KRK4lUQQTSTIyDFdvndjOJznsLEz0xjlGu+07Rf3FWvxz+5Q8LsxfsiVHCaYjpDVl+7/5ltxQzv7WA98zxh8cSLq2TTBy2Ir+pcVJJb7Cyrat2B4FqyznvWQ9F26OZsv59HEcTFgAkpfqmbzWr6ETJQOdKiVu9XTb9vVXtnfAtz93C5Meji6VsCCtJQauQ58rSYDc7H/bPRZkN99oYv+JwwNOcSNjlThVYWEZLE3O6CF86e7gFWOyrVgGZYKw2e2RwHMeDus9mjND/kahGg== ARC-Authentication-Results: i=1; mx.microsoft.com 1; spf=pass (sender ip is 209.85.216.43) smtp.rcpttodomain=segurossura.com.br smtp.mailfrom=gmail.com; dmarc=pass (p=none sp=quarantine pct=100) action=none header.from=gmail.com; dkim=pass (signature was verified) header.d=gmail.com; arc=none (0) Received: from CH0PR03CA0440.namprd03.prod.outlook.com (2603:10b6:610:10e::29) by LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Thu, 1 Aug 2024 11:46:05 +0000 Received: from DS3PEPF000099E1.namprd04.prod.outlook.com (2603:10b6:610:10e:cafe::ea) by CH0PR03CA0440.outlook.office365.com (2603:10b6:610:10e::29) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22 via Frontend Transport; Thu, 1 Aug 2024 11:46:05 +0000 Authentication-Results: spf=pass (sender IP is 209.85.216.43) smtp.mailfrom=gmail.com; dkim=pass (signature was verified) header.d=gmail.com;dmarc=pass action=none header.from=gmail.com;compauth=pass reason=100 Received-SPF: Pass (protection.outlook.com: domain of gmail.com designates 209.85.216.43 as permitted sender) receiver=protection.outlook.com; client-ip=209.85.216.43; helo=mail-pj1-f43.google.com; pr=C Received: from mail-pj1-f43.google.com (209.85.216.43) by DS3PEPF000099E1.mail.protection.outlook.com (10.167.17.196) with Microsoft SMTP Server (version=TLS1_3, cipher=TLS_AES_256_GCM_SHA384) id 15.20.7828.19 via Frontend Transport; Thu, 1 Aug 2024 11:46:04 +0000 Received: by mail-pj1-f43.google.com with SMTP id 98e67ed59e1d1-2cd16900ec5so1232757a91.3; Thu, 01 Aug 2024 04:46:04 -0700 (PDT) DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20230601; t=1722512764; x=1723117564; darn=segurossura.com.br; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :from:to:cc:subject:date:message-id:reply-to; bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=; b=A0cbUhhjafsrfA9p/cq9icXU/1ncYY8K8jVuR4ZagiWy/YbW20P6EmMlRCRaz0ZKon A9YFGuSOGZG4B2x35iXiWZtiupHHUemynAaFf+YixLqSj5isn1mc6ClUBKy+/6xGdmnY xQc4pX5KOTOMo6eZN7ANQ2iY71U3cL9Ityw7kPz8AWRRsQExW7r3dPCo3X5ZW4dTFbRM fh200AJi19+ZgEoVjJB25oF5HyMnu73CvIC5UdgfqvVn+aW2icc8+oc3VZ5Dgje8ueMy w264ltqgT6XD4b0QLOGC4Vs4Y8+J9ZKwi4wLY064wT0MadCbzEewNqcM7IbdRf0Ub6WM 0kVg== X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20230601; t=1722512764; x=1723117564; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to; bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=; b=JGVoDywd10zH3viUvBMPGaG4elTPwXjGy7SCl6ZdSUu16BbWthvWbE7ft1077U1mW8 mM+QZtu+DWVZ1Qct2C0I4wk7oA7AM1aH4mGE2AzK9zoX4UxfjWxMP9SteBouGtpwp9kb uKMtu2EcBRA3PpxomDZvOHG6/VhWSejDtdNkJ5sbcrHREgZDPQnUkznIRga03r7VkrF0 bIonyluSrOKLcpTsF0CVFWfneZ5T1G5pjQ9u0/qvkNvexSSZwS4rdxWIFdCGDfN0TTiy lSOpMF53T5n8RNzJ9330b9fjAzrCPtGL1XsxNDwEaodKfeJBs+uznU55OoM+V0fZ6iap ESfA== X-Forwarded-Encrypted: i=1; AJvYcCX4GpMRqz7LHWj8bvwiggBpGAxFazAX4NcF4nWAA9C+AbrqteKg877SI7bJAy29i5mMvo1IPS+dyHgBGsV33JNWH1wIhXyqCP8W35WbRbMpNbyzwjrR35zuEEmNgj+g/+qm0SswlQAoKIW3vapRF60bQnjSZxT3HyrLT92wTB/8bPWCwB6qvgKwcUE3pjZ8Nd+rSSrpnFHianucduITmm7MRTE7G/tYED3a8USvEHkfaHJkMz1dmZ59OB/vvd6oBDtsJeI6LuD7AXjk9yq205To X-Gm-Message-State: AOJu0YyvP/KaxmIHMG3JUp3vwL2LMGgjac0F/e5M0AZNiUe0klwgoUgs nMbzH9FTdMpd4fV1lHl1p22MH1N5DsSOLfoIkUqggJvBIguLHop9UblCYjFx/FbxHYi21y8ydZn DydqOiDyt3i57SmyzCtfe5dWPdJ8= X-Google-Smtp-Source: AGHT+IEvggNBVdzXvnI4ZvwwFULNyMGcnSE+De8SL9h9q/KKuPRHfKSweg60n7E8F2beccoHCTHa7tAUIKb4KHack3U= X-Received: by 2002:a05:6a20:7f9d:b0:1c4:84ee:63d1 with SMTP id adf61e73a8af0-1c68d05bb3fmr1854789637.9.1722512763403; Thu, 01 Aug 2024 04:46:03 -0700 (PDT) MIME-Version: 1.0 References: In-Reply-To: From: Jesse Daniel Brown Date: Thu, 1 Aug 2024 08:45:51 -0300 Message-ID: Subject: Re: Resposta ao solicitante do sinistro 02310241784 To: sinistrosura@tmagestao.com.br, Sinistro Auto , =?UTF-8?B?TWFyw61saWEgRmFsY8Ojbw==?= , patricia.fontes@bvaa.adv.br, Fernando Aguilera , fernanda.nicola@segurossura.com.br, sac@segurossura.com.br, Ouvidoria Content-Type: multipart/alternative; boundary="00000000000062450e061e9dc18a" Return-Path: plasmatoid@gmail.com X-EOPAttributedMessage: 0 X-EOPTenantAttributedMessage: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581:0 X-MS-PublicTrafficType: Email X-MS-TrafficTypeDiagnostic: DS3PEPF000099E1:EE_|LV3PR13MB6334:EE_|BL0PR13MB4401:EE_|CO1PR13MB4918:EE_ X-MS-Office365-Filtering-Correlation-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e X-LD-Processed: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581,ExtFwd X-MS-Exchange-AtpMessageProperties: SA|SL X-Microsoft-Antispam: BCL:0;ARA:13230040|7093399012|69100299015; X-Microsoft-Antispam-Message-Info: =?utf-8?B?bzkyQ3A4UEcweFJGRGgyWkM4azRiT0gwcTM1U00zNGJxUWtnUzZOZ1NUeitT?= =?utf-8?B?YkVjREFHc3pzQ2RSSmMwY0c5VytUU3Y3UG01ZlRRT3NJRUdtSzJSKzRqTGRT?= =?utf-8?B?V29PZU1XdVllSDZDZG14T2VEYTdoWWs0Ullia3hNNGVocHRFRDREcjE5b0Z2?= =?utf-8?B?NXhNdm0xTDZ0Uko3VVZqMHJmNGY4bFVDUDlURkJyTStRVlNYV09vcGlrQSt1?= =?utf-8?B?bnBXSHIxNmpYRFhHOUdYcFMwMk1IeVNtaHBXNWdOZVZLckdYdXJNaHVPZ2JJ?= =?utf-8?B?NzJVKzhTcGFpeGhRZXNuZm5xZjU5SHB2dFZPNHBiSlBub2pxc0FvTTFVSTZV?= =?utf-8?B?VHJrM3EzZTl4QWp1UVB0NGNPOExSRHVLcmFRdnpLQ24vaGs0VmhDajBsM0Z6?= =?utf-8?B?NitWTHYyK1JiVHQ5SzVrZTBKUlJGcTk1cDFZcWdWcGN2MGxJbkZBTStOeFlZ?= =?utf-8?B?MDNCamQyU3J0VmI0RWw0Ukl3NEFvUlFrQlg1T3NsUFlHMTE0QVR5V2g4QUpn?= =?utf-8?B?UWVjRnNJVTRBNmRNeTNsRkVnNjFYM1lHL25ncTlnUU5LT0ZIUGRNNlBPY0Zn?= =?utf-8?B?a2xsMUpiNUpQWTNPNE1YUWVpQXZ4Q1FneFY1SERMNW0yNFdQZDkvTjA4Vk5I?= =?utf-8?B?VEt4Mk1qb0RvYkluUDFGVmhLdjhxSzBPb2VUTVV6YmI0VmhQNHhQSzF6UHk0?= =?utf-8?B?V3JWcThGOGZTR1hFSnZXTy9BZS9BM3BHNE55ZVZNZnhKVm1CRko1dlBCcWlr?= =?utf-8?B?OHkwWktReEJ4c2ZVcTN4Qm41SXFEaVp0cXRScHlsemNxaVFjZmxQRitmb1pl?= =?utf-8?B?RlJNNTdRZW13eUNKSFVLTjBESVQvV1NQaDh6dVNGTXpSVXBHOUNNRFNHdDc1?= =?utf-8?B?WXIwdmtZUkFrd0tiLzRKa1JtOTFxRGlNaFp4WmRHTURSamY2T28zN21NUWhH?= =?utf-8?B?QUtxQmpLOHR4VGhra3BIdjJJUGRodlJ6UUI0c0FaSVliYkJGaGNWZVVQcWMz?= =?utf-8?B?YXB0WFBYcVYzU1NyT2g0eWNPbGtQWkVYR2hqT21JRVp0TDVKYmdyMDVCcC94?= =?utf-8?B?M3Vsb0dBQzVIUzNsb0h2UGNmc2tWcTk5QkZDbm9wbXUxRjJaa29Fanl2WVlK?= =?utf-8?B?Wm85c1lHcUQwSUV1dk9XbmlyaTB1SHVOMjVOR2xhbEIzQ25RWVZ5ZEZ3Q1B5?= =?utf-8?B?WmJSOW1nUzhOWkhzVXY3d0o5MmlOeS9JQkQxOFVxY3NlWjhrQzdOTjFmZVhy?= =?utf-8?B?cWhBNFFubEJZKzIxcFFsVlc3MmpWK1RNUm1SWXV5Vkw1TkkwejVCZE9rZTdh?= =?utf-8?B?bDRxTDN1N0xIQ1IrL1ZEbkRyM25jdWlqdWdLM01NYkZUdVFTaWl3MHhoUzZq?= =?utf-8?B?RUh2Qm1kVVBTY1AzczJOTzFVZmR5MkVPYTNnc0YycG1HTTdtblA1K2R6YUdy?= =?utf-8?B?Z01jOXdqOTVXSzlqa2JJVlVsdU9xcWZGR0tCQjE5WTI4dEdnWVRoSUxnckxI?= =?utf-8?B?ZmRCa0xkY2FDOG9Ic05kbDIwSk02UUJjV1ZIWXVOMjkrNGR2N0NwV2trdHBZ?= =?utf-8?B?T2Vsd3RTOForeFFMTDlFRFE1ZnRkTFIvVzIzYm44VE1qNmgyUUxZTWlWV3Yy?= =?utf-8?B?TXZUSjMxOU85Z1dLMWZuU043T0dhUG1uTFBGTGJuc3N5dkpZTU12aWw4anRv?= =?utf-8?B?ZFZrRkxreEg0US84anpKVXR6RWgwbEp6QWhTcVZWYnNJVGwzNWZnQnVsTWJz?= =?utf-8?B?dG1WKzY5QkRGYzdJWGtiek9wd1dNUVlvLytFVndSVHp5RkFmRVFya0Zqd0lO?= =?utf-8?B?NVhpZEZNN1JWME00ajNzekY1SHp6SjNNSEpJNnpGNFFyb0EwR3NqTTlENnZM?= =?utf-8?B?RFRkZjZlWjMxekdpUjN5OVE0SWFzZnk2SG9KTXJXUjhaeE1WTXpXbjBLYm1z?= =?utf-8?B?Zk9zNU5HVTEwUzNaY3pRR2JPOWZHNVc3VEVheDg5RlE0RTVFY1NOc1N5RjNi?= =?utf-8?B?aGlBV3g5T3ZMM3ZHSUlzbkFlK2dQMXFYWThiN2dDZ0E5cm1PVU14bXRvbzF6?= =?utf-8?B?WGs2ZCtQdFZLMEJNODMrWEJRKy90emNHZ2ZDaG9iaW9ZL0tZSG44ejQzLzlQ?= =?utf-8?B?elJFT3ZDYmZ0VWlweTRweHg5Vm1oWnJtYkRHckt6V3c3Um4vS3NCbEEweGp4?= =?utf-8?B?OTZmUmkwNmdTZytqcjlycEhZNHFZSFNSYzlQa2k1MUMyMWlqTW5TRzNnK2Uy?= =?utf-8?B?VWxvOWdZNzhkMEQ1RXg2QTl5emdYMkJkaWlCams0YUZkZitZUkMzMklZU3Rt?= =?utf-8?B?TVUyQUJCS2JKdjFSOHV4TXZtcmdLMy9PcngvM2U2QkxPZDZRVWhwbGVOTUtQ?= =?utf-8?B?ZTg4cHEvRkxacGgxeWl4MExsMGFKL2w2dHR4aitGNC94Y2Z3cGpGRUIvNmVO?= =?utf-8?B?ZjZmZlAxemlJSEtNLzZ1cHFVNW5xVGtUUXZIdXNFQXh5TGlTdDFEbmNxaTlI?= =?utf-8?B?L3E3dEJGc3lQZndld3liM2lUdjhuSnh6T1lRdStKeEtHNzh0aHdVbHIxbTBa?= =?utf-8?B?czh3S1l2MVdiTi8wdzgzVnFEWDZYdWdHL2NzbEdrbEZsNEdKTzE3NEN4M3Vl?= =?utf-8?B?Rlh0Sm5mWCs3cU5ieEpkRmZURTcrdElDdFBRYzRLMHdzdll0bmtodVNnSmFX?= =?utf-8?B?TmN4M1VOK21rWUlyTkRzNzRuVE9QYWtVQ0E9PQ==?= X-Forefront-Antispam-Report: CIP:209.85.216.43;CTRY:US;LANG:pt;SCL:1;SRV:;IPV:NLI;SFV:NSPM;H:mail-pj1-f43.google.com;PTR:mail-pj1-f43.google.com;CAT:NONE;SFS:(13230040)(7093399012)(69100299015);DIR:INB; X-MS-Exchange-CrossTenant-OriginalArrivalTime: 01 Aug 2024 11:46:04.8858 (UTC) X-MS-Exchange-CrossTenant-Network-Message-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e X-MS-Exchange-CrossTenant-Id: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581 X-MS-Exchange-CrossTenant-AuthSource: DS3PEPF000099E1.namprd04.prod.outlook.com X-MS-Exchange-CrossTenant-AuthAs: Anonymous X-MS-Exchange-CrossTenant-FromEntityHeader: Internet X-MS-Exchange-Transport-CrossTenantHeadersStamped: LV3PR13MB6334 X-OrganizationHeadersPreserved: LV3PR13MB6334.namprd13.prod.outlook.com X-OriginatorOrg: sura.com X-CrossPremisesHeadersFilteredByDsnGenerator: CO1PR13MB4918.namprd13.prod.outlook.com Final-Recipient: rfc822;fernanda.nicola@segurossura.com.br Action: failed Status: 5.4.300 Diagnostic-Code: smtp;550 5.4.300 Message expired -> 421 Service Temporarily Unavailable AVISO: Você recebeu um e-mail externo. Verifique o remetente, não baixe anexos desconhecidos, não clique em links suspeitos e não entregue seus nomes de usuários ou senhas. Se você RECEBER UM EMAIL SUSPEITO , salve e anexe o e-mail original e envie para correond@suramericana.com.co , para que ocorra o bloqueio, caso tenha dúvidas entre em contato com o Service Desk. Subject: Re: Sinistro 02310241784 - Contestação e Documentação Adicional Prezada Dra. Marília Falcão, Sura, e sinistros departmento, Referente ao sinistro 02310241784, gostaria de esclarecer algumas questões levantadas na sua última comunicação. 1. Vistoria pela Companhia: Conforme mencionado, o veículo passou por diversas inspeções independentes devido às restrições de licenciamento. Anexamos os relatórios de inspeção e o parecer técnico (Manifestação) que indicam danos extensivos e sugerem a perda total do veículo, contrariando a avaliação inicial. 2. Determinação da Perda Total: O relatório técnico anexado demonstra claramente os danos estruturais significativos, incluindo danos nas longarinas traseiras, painel traseiro, assoalho do porta-malas, painel dianteiro e outros componentes. Estes danos comprometem a segurança e a integridade estrutural do veículo, justificando a alegação de perda total. 3. Valor Pleiteado: O valor solicitado é baseado em avaliações detalhadas e justificadas, que consideram a depreciação do veículo e os custos reais dos reparos necessários. O valor proposto inicialmente pela seguradora é insuficiente frente às evidências documentais. 4. Documentação de Lucros Cessantes e Danos Corporais: Anexamos novamente a documentação que comprova os lucros cessantes e os danos corporais sofridos. Estes documentos já foram submetidos anteriormente e estão detalhados nos anexos. 5. Nova Vistoria: Várias vistorias foram realizadas e as evidências são claras quanto ao estado do veículo. Uma nova vistoria pela seguradora parece desnecessária e apenas prolonga a resolução do sinistro. Solicito, portanto, uma reavaliação do caso com base nas evidências anexadas e uma revisão da proposta de indenização. Estou à disposição para qualquer esclarecimento adicional e para discutir a questão de forma mais detalhada, se necessário. Atenciosamente, Jesse Daniel Brown On Mon, Jul 29, 2024 at 10:26 AM > wrote: Prezado(a) jesse, Segue resposta sobre o andamento do sinistro 02310241784 Conforme informamos, você não realizou vistoria pela Cia. pois seu veículo foi apreendido por restrições (licenciamento), o senhor mesmo providenciou laudo de engenheiro e não foi constatado a perda total do seu veículo, está pleiteando um valor superior ao regulado e para resolver a situação a área de sinistro documentou em seu e-mail a necessidade de vistoria, pois podemos aprovar o orçamento na oficina que escolher após a regulação que só é feita em vistoria. Acionamos o escritório jurídico BVAA para intermediar e realizar as tratativas de Lucros Cessantes e Danos Corporais mas nenhum documento comprobatório a esses pleitos foi recebido. Informações, por favor, acionar Dra. Marilia Falcão Advogada Gestora - Núcleo de Acordos Telefone: 55 (81) 99112-3987 marilia.falcao@bvaa.adv.br Mantemos o valor proposto, caso não aceite, será necessário agendar vistoria, para agendamento de vistoria, acionar a central de atendimento, pelo telefone 11 3003 7727 São Paulo e capitais ou 0800 7049399 demais regiões opção 01 e 06. A Seguros Sura agradece o seu contato, qualquer duvida permanecemos a disposição. Favor não responder este email! Departamento de Sinistros Seguros Sura === HTML PART === Delivery has failed to these recipients or groups: fernanda.nicola@segurossura.com.br Your message couldn't be delivered. Despite repeated attempts to contact the recipient's email system it didn't respond. Contact the recipient by some other means (by phone, for example) and ask them to tell their email admin that it appears that their email system isn't accepting connection requests from your email system. Give them the error details shown below. It's likely that the recipient's email admin is the only one who can fix this problem. For more information and tips to fix this issue see this article: https://go.microsoft.com/fwlink/?LinkId=389361. Diagnostic information for administrators: Generating server: CO1PR13MB4918.namprd13.prod.outlook.com Total retry attempts: 10 fernanda.nicola@segurossura.com.br Remote server returned '550 5.4.300 Message expired -> 421 Service Temporarily Unavailable' Original message headers: Received: from BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22) by CO1PR13MB4918.namprd13.prod.outlook.com (2603:10b6:303:f9::11) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Fri, 2 Aug 2024 03:30:56 +0000 Received: from LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22) by BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22; Thu, 1 Aug 2024 22:52:02 +0000 ARC-Seal: i=1; a=rsa-sha256; s=arcselector10001; d=microsoft.com; cv=none; b=sXUFZ7fclbZEp/70Q4JeP17ssHtVmXc/242jYlO16N/bp3k6RlvtdHSiTRGX8kwDEgrkpdftsK2k6WC1DpXOp9n/MNv/xCmivRuVmzLbxUy9EuFVFUcszAj4sSpcfDeHU0e1+QyFExGE0K3AmrtmEtDMN29fuzh0rcXUQVxRW4gcg4rAWnHzmMUnjIMWprWKsS5F+zw48p4D4hKLku9UcNPobqmswXTKu53tlVcw8U3Eu6WuEPrqJUUg7jiQ9HHn+J281FvzGmNXtK3n1+yv22ViEJamb6iiqi8C8gl5PhN478ss+6dKZ1gd0gg7ZfdN62FowA9QyIgFWY+QuuBBMA== ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=microsoft.com; s=arcselector10001; h=From:Date:Subject:Message-ID:Content-Type:MIME-Version:X-MS-Exchange-AntiSpam-MessageData-ChunkCount:X-MS-Exchange-AntiSpam-MessageData-0:X-MS-Exchange-AntiSpam-MessageData-1; bh=5hHw/AKaP7jRauBe3VisP5spgvm9xbUpaQ4sya9hdL8=; b=CqIST2DyBkCuqKSefXirO5ovP+VQygCbvyvA0F8b175QTENH1u0r1z3bqoYtl6BW2o+KRK4lUQQTSTIyDFdvndjOJznsLEz0xjlGu+07Rf3FWvxz+5Q8LsxfsiVHCaYjpDVl+7/5ltxQzv7WA98zxh8cSLq2TTBy2Ir+pcVJJb7Cyrat2B4FqyznvWQ9F26OZsv59HEcTFgAkpfqmbzWr6ETJQOdKiVu9XTb9vVXtnfAtz93C5Meji6VsCCtJQauQ58rSYDc7H/bPRZkN99oYv+JwwNOcSNjlThVYWEZLE3O6CF86e7gFWOyrVgGZYKw2e2RwHMeDus9mjND/kahGg== ARC-Authentication-Results: i=1; mx.microsoft.com 1; spf=pass (sender ip is 209.85.216.43) smtp.rcpttodomain=segurossura.com.br smtp.mailfrom=gmail.com; dmarc=pass (p=none sp=quarantine pct=100) action=none header.from=gmail.com; dkim=pass (signature was verified) header.d=gmail.com; arc=none (0) Received: from CH0PR03CA0440.namprd03.prod.outlook.com (2603:10b6:610:10e::29) by LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Thu, 1 Aug 2024 11:46:05 +0000 Received: from DS3PEPF000099E1.namprd04.prod.outlook.com (2603:10b6:610:10e:cafe::ea) by CH0PR03CA0440.outlook.office365.com (2603:10b6:610:10e::29) with Microsoft SMTP Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22 via Frontend Transport; Thu, 1 Aug 2024 11:46:05 +0000 Authentication-Results: spf=pass (sender IP is 209.85.216.43) smtp.mailfrom=gmail.com; dkim=pass (signature was verified) header.d=gmail.com;dmarc=pass action=none header.from=gmail.com;compauth=pass reason=100 Received-SPF: Pass (protection.outlook.com: domain of gmail.com designates 209.85.216.43 as permitted sender) receiver=protection.outlook.com; client-ip=209.85.216.43; helo=mail-pj1-f43.google.com; pr=C Received: from mail-pj1-f43.google.com (209.85.216.43) by DS3PEPF000099E1.mail.protection.outlook.com (10.167.17.196) with Microsoft SMTP Server (version=TLS1_3, cipher=TLS_AES_256_GCM_SHA384) id 15.20.7828.19 via Frontend Transport; Thu, 1 Aug 2024 11:46:04 +0000 Received: by mail-pj1-f43.google.com with SMTP id 98e67ed59e1d1-2cd16900ec5so1232757a91.3; Thu, 01 Aug 2024 04:46:04 -0700 (PDT) DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20230601; t=1722512764; x=1723117564; darn=segurossura.com.br; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :from:to:cc:subject:date:message-id:reply-to; bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=; b=A0cbUhhjafsrfA9p/cq9icXU/1ncYY8K8jVuR4ZagiWy/YbW20P6EmMlRCRaz0ZKon A9YFGuSOGZG4B2x35iXiWZtiupHHUemynAaFf+YixLqSj5isn1mc6ClUBKy+/6xGdmnY xQc4pX5KOTOMo6eZN7ANQ2iY71U3cL9Ityw7kPz8AWRRsQExW7r3dPCo3X5ZW4dTFbRM fh200AJi19+ZgEoVjJB25oF5HyMnu73CvIC5UdgfqvVn+aW2icc8+oc3VZ5Dgje8ueMy w264ltqgT6XD4b0QLOGC4Vs4Y8+J9ZKwi4wLY064wT0MadCbzEewNqcM7IbdRf0Ub6WM 0kVg== X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20230601; t=1722512764; x=1723117564; h=to:subject:message-id:date:from:in-reply-to:references:mime-version :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to; bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=; b=JGVoDywd10zH3viUvBMPGaG4elTPwXjGy7SCl6ZdSUu16BbWthvWbE7ft1077U1mW8 mM+QZtu+DWVZ1Qct2C0I4wk7oA7AM1aH4mGE2AzK9zoX4UxfjWxMP9SteBouGtpwp9kb uKMtu2EcBRA3PpxomDZvOHG6/VhWSejDtdNkJ5sbcrHREgZDPQnUkznIRga03r7VkrF0 bIonyluSrOKLcpTsF0CVFWfneZ5T1G5pjQ9u0/qvkNvexSSZwS4rdxWIFdCGDfN0TTiy lSOpMF53T5n8RNzJ9330b9fjAzrCPtGL1XsxNDwEaodKfeJBs+uznU55OoM+V0fZ6iap ESfA== X-Forwarded-Encrypted: i=1; AJvYcCX4GpMRqz7LHWj8bvwiggBpGAxFazAX4NcF4nWAA9C+AbrqteKg877SI7bJAy29i5mMvo1IPS+dyHgBGsV33JNWH1wIhXyqCP8W35WbRbMpNbyzwjrR35zuEEmNgj+g/+qm0SswlQAoKIW3vapRF60bQnjSZxT3HyrLT92wTB/8bPWCwB6qvgKwcUE3pjZ8Nd+rSSrpnFHianucduITmm7MRTE7G/tYED3a8USvEHkfaHJkMz1dmZ59OB/vvd6oBDtsJeI6LuD7AXjk9yq205To X-Gm-Message-State: AOJu0YyvP/KaxmIHMG3JUp3vwL2LMGgjac0F/e5M0AZNiUe0klwgoUgs nMbzH9FTdMpd4fV1lHl1p22MH1N5DsSOLfoIkUqggJvBIguLHop9UblCYjFx/FbxHYi21y8ydZn DydqOiDyt3i57SmyzCtfe5dWPdJ8= X-Google-Smtp-Source: AGHT+IEvggNBVdzXvnI4ZvwwFULNyMGcnSE+De8SL9h9q/KKuPRHfKSweg60n7E8F2beccoHCTHa7tAUIKb4KHack3U= X-Received: by 2002:a05:6a20:7f9d:b0:1c4:84ee:63d1 with SMTP id adf61e73a8af0-1c68d05bb3fmr1854789637.9.1722512763403; Thu, 01 Aug 2024 04:46:03 -0700 (PDT) MIME-Version: 1.0 References: <66a79885.170a0220.112141.bf03SMTPIN_ADDED_BROKEN@mx.google.com> In-Reply-To: <66a79885.170a0220.112141.bf03SMTPIN_ADDED_BROKEN@mx.google.com> From: Jesse Daniel Brown <plasmatoid@gmail.com> Date: Thu, 1 Aug 2024 08:45:51 -0300 Message-ID: <CALdg1mNFjMThpNU_6aCbNm2WeCtFLBScXed9QqAmQ+4_CWsDMg@mail.gmail.com> Subject: Re: Resposta ao solicitante do sinistro 02310241784 To: sinistrosura@tmagestao.com.br, Sinistro Auto <sinistro.auto@segurossura.com.br>, =?UTF-8?B?TWFyw61saWEgRmFsY8Ojbw==?= <marilia.falcao@bvaa.adv.br>, patricia.fontes@bvaa.adv.br, Fernando Aguilera <Fernando.Aguilera@segurossura.com.br>, fernanda.nicola@segurossura.com.br, sac@segurossura.com.br, Ouvidoria <Ouvidoria@segurossura.com.br> Content-Type: multipart/alternative; boundary=&quot;00000000000062450e061e9dc18a&quot; Return-Path: plasmatoid@gmail.com X-EOPAttributedMessage: 0 X-EOPTenantAttributedMessage: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581:0 X-MS-PublicTrafficType: Email X-MS-TrafficTypeDiagnostic: DS3PEPF000099E1:EE_|LV3PR13MB6334:EE_|BL0PR13MB4401:EE_|CO1PR13MB4918:EE_ X-MS-Office365-Filtering-Correlation-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e X-LD-Processed: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581,ExtFwd X-MS-Exchange-AtpMessageProperties: SA|SL X-Microsoft-Antispam: BCL:0;ARA:13230040|7093399012|69100299015; X-Microsoft-Antispam-Message-Info: =?utf-8?B?bzkyQ3A4UEcweFJGRGgyWkM4azRiT0gwcTM1U00zNGJxUWtnUzZOZ1NUeitT?= =?utf-8?B?YkVjREFHc3pzQ2RSSmMwY0c5VytUU3Y3UG01ZlRRT3NJRUdtSzJSKzRqTGRT?= =?utf-8?B?V29PZU1XdVllSDZDZG14T2VEYTdoWWs0Ullia3hNNGVocHRFRDREcjE5b0Z2?= =?utf-8?B?NXhNdm0xTDZ0Uko3VVZqMHJmNGY4bFVDUDlURkJyTStRVlNYV09vcGlrQSt1?= =?utf-8?B?bnBXSHIxNmpYRFhHOUdYcFMwMk1IeVNtaHBXNWdOZVZLckdYdXJNaHVPZ2JJ?= =?utf-8?B?NzJVKzhTcGFpeGhRZXNuZm5xZjU5SHB2dFZPNHBiSlBub2pxc0FvTTFVSTZV?= =?utf-8?B?VHJrM3EzZTl4QWp1UVB0NGNPOExSRHVLcmFRdnpLQ24vaGs0VmhDajBsM0Z6?= =?utf-8?B?NitWTHYyK1JiVHQ5SzVrZTBKUlJGcTk1cDFZcWdWcGN2MGxJbkZBTStOeFlZ?= =?utf-8?B?MDNCamQyU3J0VmI0RWw0Ukl3NEFvUlFrQlg1T3NsUFlHMTE0QVR5V2g4QUpn?= =?utf-8?B?UWVjRnNJVTRBNmRNeTNsRkVnNjFYM1lHL25ncTlnUU5LT0ZIUGRNNlBPY0Zn?= =?utf-8?B?a2xsMUpiNUpQWTNPNE1YUWVpQXZ4Q1FneFY1SERMNW0yNFdQZDkvTjA4Vk5I?= =?utf-8?B?VEt4Mk1qb0RvYkluUDFGVmhLdjhxSzBPb2VUTVV6YmI0VmhQNHhQSzF6UHk0?= =?utf-8?B?V3JWcThGOGZTR1hFSnZXTy9BZS9BM3BHNE55ZVZNZnhKVm1CRko1dlBCcWlr?= =?utf-8?B?OHkwWktReEJ4c2ZVcTN4Qm41SXFEaVp0cXRScHlsemNxaVFjZmxQRitmb1pl?= =?utf-8?B?RlJNNTdRZW13eUNKSFVLTjBESVQvV1NQaDh6dVNGTXpSVXBHOUNNRFNHdDc1?= =?utf-8?B?WXIwdmtZUkFrd0tiLzRKa1JtOTFxRGlNaFp4WmRHTURSamY2T28zN21NUWhH?= =?utf-8?B?QUtxQmpLOHR4VGhra3BIdjJJUGRodlJ6UUI0c0FaSVliYkJGaGNWZVVQcWMz?= =?utf-8?B?YXB0WFBYcVYzU1NyT2g0eWNPbGtQWkVYR2hqT21JRVp0TDVKYmdyMDVCcC94?= =?utf-8?B?M3Vsb0dBQzVIUzNsb0h2UGNmc2tWcTk5QkZDbm9wbXUxRjJaa29Fanl2WVlK?= =?utf-8?B?Wm85c1lHcUQwSUV1dk9XbmlyaTB1SHVOMjVOR2xhbEIzQ25RWVZ5ZEZ3Q1B5?= =?utf-8?B?WmJSOW1nUzhOWkhzVXY3d0o5MmlOeS9JQkQxOFVxY3NlWjhrQzdOTjFmZVhy?= =?utf-8?B?cWhBNFFubEJZKzIxcFFsVlc3MmpWK1RNUm1SWXV5Vkw1TkkwejVCZE9rZTdh?= =?utf-8?B?bDRxTDN1N0xIQ1IrL1ZEbkRyM25jdWlqdWdLM01NYkZUdVFTaWl3MHhoUzZq?= =?utf-8?B?RUh2Qm1kVVBTY1AzczJOTzFVZmR5MkVPYTNnc0YycG1HTTdtblA1K2R6YUdy?= =?utf-8?B?Z01jOXdqOTVXSzlqa2JJVlVsdU9xcWZGR0tCQjE5WTI4dEdnWVRoSUxnckxI?= =?utf-8?B?ZmRCa0xkY2FDOG9Ic05kbDIwSk02UUJjV1ZIWXVOMjkrNGR2N0NwV2trdHBZ?= =?utf-8?B?T2Vsd3RTOForeFFMTDlFRFE1ZnRkTFIvVzIzYm44VE1qNmgyUUxZTWlWV3Yy?= =?utf-8?B?TXZUSjMxOU85Z1dLMWZuU043T0dhUG1uTFBGTGJuc3N5dkpZTU12aWw4anRv?= =?utf-8?B?ZFZrRkxreEg0US84anpKVXR6RWgwbEp6QWhTcVZWYnNJVGwzNWZnQnVsTWJz?= =?utf-8?B?dG1WKzY5QkRGYzdJWGtiek9wd1dNUVlvLytFVndSVHp5RkFmRVFya0Zqd0lO?= =?utf-8?B?NVhpZEZNN1JWME00ajNzekY1SHp6SjNNSEpJNnpGNFFyb0EwR3NqTTlENnZM?= =?utf-8?B?RFRkZjZlWjMxekdpUjN5OVE0SWFzZnk2SG9KTXJXUjhaeE1WTXpXbjBLYm1z?= =?utf-8?B?Zk9zNU5HVTEwUzNaY3pRR2JPOWZHNVc3VEVheDg5RlE0RTVFY1NOc1N5RjNi?= =?utf-8?B?aGlBV3g5T3ZMM3ZHSUlzbkFlK2dQMXFYWThiN2dDZ0E5cm1PVU14bXRvbzF6?= =?utf-8?B?WGs2ZCtQdFZLMEJNODMrWEJRKy90emNHZ2ZDaG9iaW9ZL0tZSG44ejQzLzlQ?= =?utf-8?B?elJFT3ZDYmZ0VWlweTRweHg5Vm1oWnJtYkRHckt6V3c3Um4vS3NCbEEweGp4?= =?utf-8?B?OTZmUmkwNmdTZytqcjlycEhZNHFZSFNSYzlQa2k1MUMyMWlqTW5TRzNnK2Uy?= =?utf-8?B?VWxvOWdZNzhkMEQ1RXg2QTl5emdYMkJkaWlCams0YUZkZitZUkMzMklZU3Rt?= =?utf-8?B?TVUyQUJCS2JKdjFSOHV4TXZtcmdLMy9PcngvM2U2QkxPZDZRVWhwbGVOTUtQ?= =?utf-8?B?ZTg4cHEvRkxacGgxeWl4MExsMGFKL2w2dHR4aitGNC94Y2Z3cGpGRUIvNmVO?= =?utf-8?B?ZjZmZlAxemlJSEtNLzZ1cHFVNW5xVGtUUXZIdXNFQXh5TGlTdDFEbmNxaTlI?= =?utf-8?B?L3E3dEJGc3lQZndld3liM2lUdjhuSnh6T1lRdStKeEtHNzh0aHdVbHIxbTBa?= =?utf-8?B?czh3S1l2MVdiTi8wdzgzVnFEWDZYdWdHL2NzbEdrbEZsNEdKTzE3NEN4M3Vl?= =?utf-8?B?Rlh0Sm5mWCs3cU5ieEpkRmZURTcrdElDdFBRYzRLMHdzdll0bmtodVNnSmFX?= =?utf-8?B?TmN4M1VOK21rWUlyTkRzNzRuVE9QYWtVQ0E9PQ==?= X-Forefront-Antispam-Report: CIP:209.85.216.43;CTRY:US;LANG:pt;SCL:1;SRV:;IPV:NLI;SFV:NSPM;H:mail-pj1-f43.google.com;PTR:mail-pj1-f43.google.com;CAT:NONE;SFS:(13230040)(7093399012)(69100299015);DIR:INB; X-MS-Exchange-CrossTenant-OriginalArrivalTime: 01 Aug 2024 11:46:04.8858 (UTC) X-MS-Exchange-CrossTenant-Network-Message-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e X-MS-Exchange-CrossTenant-Id: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581 X-MS-Exchange-CrossTenant-AuthSource: DS3PEPF000099E1.namprd04.prod.outlook.com X-MS-Exchange-CrossTenant-AuthAs: Anonymous X-MS-Exchange-CrossTenant-FromEntityHeader: Internet X-MS-Exchange-Transport-CrossTenantHeadersStamped: LV3PR13MB6334 X-OrganizationHeadersPreserved: LV3PR13MB6334.namprd13.prod.outlook.com X-OriginatorOrg: sura.com X-CrossPremisesHeadersFilteredByDsnGenerator: CO1PR13MB4918.namprd13.prod.outlook.com AVISO: Você recebeu um e-mail externo. Verifique o remetente, não baixe anexos desconhecidos, não clique em links suspeitos e não entregue seus nomes de usuários ou senhas. Se você RECEBER UM EMAIL SUSPEITO , salve e anexe o e-mail original e envie para correond@suramericana.com.co , para que ocorra o bloqueio, caso tenha dúvidas entre em contato com o Service Desk. Subject: Re: Sinistro 02310241784 - Contestação e Documentação Adicional Prezada Dra. Marília Falcão, Sura, e sinistros departmento, Referente ao sinistro 02310241784, gostaria de esclarecer algumas questões levantadas na sua última comunicação. Vistoria pela Companhia : Conforme mencionado, o veículo passou por diversas inspeções independentes devido às restrições de licenciamento. Anexamos os relatórios de inspeção e o parecer técnico (Manifestação) que indicam danos extensivos e sugerem a perda total do veículo, contrariando a avaliação inicial. Determinação da Perda Total : O relatório técnico anexado demonstra claramente os danos estruturais significativos, incluindo danos nas longarinas traseiras, painel traseiro, assoalho do porta-malas, painel dianteiro e outros componentes. Estes danos comprometem a segurança e a integridade estrutural do veículo, justificando a alegação de perda total. Valor Pleiteado : O valor solicitado é baseado em avaliações detalhadas e justificadas, que consideram a depreciação do veículo e os custos reais dos reparos necessários. O valor proposto inicialmente pela seguradora é insuficiente frente às evidências documentais. Documentação de Lucros Cessantes e Danos Corporais : Anexamos novamente a documentação que comprova os lucros cessantes e os danos corporais sofridos. Estes documentos já foram submetidos anteriormente e estão detalhados nos anexos. Nova Vistoria : Várias vistorias foram realizadas e as evidências são claras quanto ao estado do veículo. Uma nova vistoria pela seguradora parece desnecessária e apenas prolonga a resolução do sinistro. Solicito, portanto, uma reavaliação do caso com base nas evidências anexadas e uma revisão da proposta de indenização. Estou à disposição para qualquer esclarecimento adicional e para discutir a questão de forma mais detalhada, se necessário. Atenciosamente, Jesse Daniel Brown On Mon, Jul 29, 2024 at 10:26 AM < sinistrosura@tmagestao.com.br > wrote: Prezado(a) jesse , Segue resposta sobre o andamento do sinistro 02310241784 Conforme informamos, você não realizou vistoria pela Cia. pois seu veículo foi apreendido por restrições (licenciamento), o senhor mesmo providenciou laudo de engenheiro e não foi constatado a perda total do seu veículo, está pleiteando um valor superior ao regulado e para resolver a situação a área de sinistro documentou em seu e-mail a necessidade de vistoria, pois podemos aprovar o orçamento na oficina que escolher após a regulação que só é feita em vistoria. Acionamos o escritório jurídico BVAA para intermediar e realizar as tratativas de Lucros Cessantes e Danos Corporais mas nenhum documento comprobatório a esses pleitos foi recebido. Informações, por favor, acionar Dra. Marilia Falcão Advogada Gestora - Núcleo de Acordos Telefone: 55 (81) 99112-3987 marilia.falcao@bvaa.adv.br Mantemos o valor proposto, caso não aceite, será necessário agendar vistoria, para agendamento de vistoria, acionar a central de atendimento, pelo telefone 11 3003 7727 São Paulo e capitais ou 0800 7049399 demais regiões opção 01 e 06. A Seguros Sura agradece o seu contato, qualquer duvida permanecemos a disposição. Favor não responder este email! Departamento de Sinistros Seguros Sura

## Raw body (tamper-evident)

```
Delivery has failed to these recipients or groups:

fernanda.nicola@segurossura.com.br<mailto:fernanda.nicola@segurossura.com.br>
Your message couldn't be delivered. Despite repeated attempts to contact the recipient's email system it didn't respond.

Contact the recipient by some other means (by phone, for example) and ask them to tell their email admin that it appears that their email system isn't accepting connection requests from your email system. Give them the error details shown below. It's likely that the recipient's email admin is the only one who can fix this problem.

For more information and tips to fix this issue see this article: https://go.microsoft.com/fwlink/?LinkId=389361.









Diagnostic information for administrators:

Generating server: CO1PR13MB4918.namprd13.prod.outlook.com
Total retry attempts: 10

fernanda.nicola@segurossura.com.br
Remote server returned '550 5.4.300 Message expired -> 421 Service Temporarily Unavailable'

Original message headers:

Received: from BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22)
 by CO1PR13MB4918.namprd13.prod.outlook.com (2603:10b6:303:f9::11) with
 Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Fri, 2 Aug
 2024 03:30:56 +0000
Received: from LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22)
 by BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22) with
 Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22; Thu, 1 Aug
 2024 22:52:02 +0000
ARC-Seal: i=1; a=rsa-sha256; s=arcselector10001; d=microsoft.com; cv=none;
 b=sXUFZ7fclbZEp/70Q4JeP17ssHtVmXc/242jYlO16N/bp3k6RlvtdHSiTRGX8kwDEgrkpdftsK2k6WC1DpXOp9n/MNv/xCmivRuVmzLbxUy9EuFVFUcszAj4sSpcfDeHU0e1+QyFExGE0K3AmrtmEtDMN29fuzh0rcXUQVxRW4gcg4rAWnHzmMUnjIMWprWKsS5F+zw48p4D4hKLku9UcNPobqmswXTKu53tlVcw8U3Eu6WuEPrqJUUg7jiQ9HHn+J281FvzGmNXtK3n1+yv22ViEJamb6iiqi8C8gl5PhN478ss+6dKZ1gd0gg7ZfdN62FowA9QyIgFWY+QuuBBMA==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=microsoft.com;
 s=arcselector10001;
 h=From:Date:Subject:Message-ID:Content-Type:MIME-Version:X-MS-Exchange-AntiSpam-MessageData-ChunkCount:X-MS-Exchange-AntiSpam-MessageData-0:X-MS-Exchange-AntiSpam-MessageData-1;
 bh=5hHw/AKaP7jRauBe3VisP5spgvm9xbUpaQ4sya9hdL8=;
 b=CqIST2DyBkCuqKSefXirO5ovP+VQygCbvyvA0F8b175QTENH1u0r1z3bqoYtl6BW2o+KRK4lUQQTSTIyDFdvndjOJznsLEz0xjlGu+07Rf3FWvxz+5Q8LsxfsiVHCaYjpDVl+7/5ltxQzv7WA98zxh8cSLq2TTBy2Ir+pcVJJb7Cyrat2B4FqyznvWQ9F26OZsv59HEcTFgAkpfqmbzWr6ETJQOdKiVu9XTb9vVXtnfAtz93C5Meji6VsCCtJQauQ58rSYDc7H/bPRZkN99oYv+JwwNOcSNjlThVYWEZLE3O6CF86e7gFWOyrVgGZYKw2e2RwHMeDus9mjND/kahGg==
ARC-Authentication-Results: i=1; mx.microsoft.com 1; spf=pass (sender ip is
 209.85.216.43) smtp.rcpttodomain=segurossura.com.br smtp.mailfrom=gmail.com;
 dmarc=pass (p=none sp=quarantine pct=100) action=none header.from=gmail.com;
 dkim=pass (signature was verified) header.d=gmail.com; arc=none (0)
Received: from CH0PR03CA0440.namprd03.prod.outlook.com (2603:10b6:610:10e::29)
 by LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22) with
 Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Thu, 1 Aug
 2024 11:46:05 +0000
Received: from DS3PEPF000099E1.namprd04.prod.outlook.com
 (2603:10b6:610:10e:cafe::ea) by CH0PR03CA0440.outlook.office365.com
 (2603:10b6:610:10e::29) with Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22 via Frontend
 Transport; Thu, 1 Aug 2024 11:46:05 +0000
Authentication-Results: spf=pass (sender IP is 209.85.216.43)
 smtp.mailfrom=gmail.com; dkim=pass (signature was verified)
 header.d=gmail.com;dmarc=pass action=none header.from=gmail.com;compauth=pass
 reason=100
Received-SPF: Pass (protection.outlook.com: domain of gmail.com designates
 209.85.216.43 as permitted sender) receiver=protection.outlook.com;
 client-ip=209.85.216.43; helo=mail-pj1-f43.google.com; pr=C
Received: from mail-pj1-f43.google.com (209.85.216.43) by
 DS3PEPF000099E1.mail.protection.outlook.com (10.167.17.196) with Microsoft
 SMTP Server (version=TLS1_3, cipher=TLS_AES_256_GCM_SHA384) id 15.20.7828.19
 via Frontend Transport; Thu, 1 Aug 2024 11:46:04 +0000
Received: by mail-pj1-f43.google.com with SMTP id 98e67ed59e1d1-2cd16900ec5so1232757a91.3;
        Thu, 01 Aug 2024 04:46:04 -0700 (PDT)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20230601; t=1722512764; x=1723117564; darn=segurossura.com.br;
        h=to:subject:message-id:date:from:in-reply-to:references:mime-version
         :from:to:cc:subject:date:message-id:reply-to;
        bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=;
        b=A0cbUhhjafsrfA9p/cq9icXU/1ncYY8K8jVuR4ZagiWy/YbW20P6EmMlRCRaz0ZKon
         A9YFGuSOGZG4B2x35iXiWZtiupHHUemynAaFf+YixLqSj5isn1mc6ClUBKy+/6xGdmnY
         xQc4pX5KOTOMo6eZN7ANQ2iY71U3cL9Ityw7kPz8AWRRsQExW7r3dPCo3X5ZW4dTFbRM
         fh200AJi19+ZgEoVjJB25oF5HyMnu73CvIC5UdgfqvVn+aW2icc8+oc3VZ5Dgje8ueMy
         w264ltqgT6XD4b0QLOGC4Vs4Y8+J9ZKwi4wLY064wT0MadCbzEewNqcM7IbdRf0Ub6WM
         0kVg==
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20230601; t=1722512764; x=1723117564;
        h=to:subject:message-id:date:from:in-reply-to:references:mime-version
         :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to;
        bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=;
        b=JGVoDywd10zH3viUvBMPGaG4elTPwXjGy7SCl6ZdSUu16BbWthvWbE7ft1077U1mW8
         mM+QZtu+DWVZ1Qct2C0I4wk7oA7AM1aH4mGE2AzK9zoX4UxfjWxMP9SteBouGtpwp9kb
         uKMtu2EcBRA3PpxomDZvOHG6/VhWSejDtdNkJ5sbcrHREgZDPQnUkznIRga03r7VkrF0
         bIonyluSrOKLcpTsF0CVFWfneZ5T1G5pjQ9u0/qvkNvexSSZwS4rdxWIFdCGDfN0TTiy
         lSOpMF53T5n8RNzJ9330b9fjAzrCPtGL1XsxNDwEaodKfeJBs+uznU55OoM+V0fZ6iap
         ESfA==
X-Forwarded-Encrypted: i=1; AJvYcCX4GpMRqz7LHWj8bvwiggBpGAxFazAX4NcF4nWAA9C+AbrqteKg877SI7bJAy29i5mMvo1IPS+dyHgBGsV33JNWH1wIhXyqCP8W35WbRbMpNbyzwjrR35zuEEmNgj+g/+qm0SswlQAoKIW3vapRF60bQnjSZxT3HyrLT92wTB/8bPWCwB6qvgKwcUE3pjZ8Nd+rSSrpnFHianucduITmm7MRTE7G/tYED3a8USvEHkfaHJkMz1dmZ59OB/vvd6oBDtsJeI6LuD7AXjk9yq205To
X-Gm-Message-State: AOJu0YyvP/KaxmIHMG3JUp3vwL2LMGgjac0F/e5M0AZNiUe0klwgoUgs
        nMbzH9FTdMpd4fV1lHl1p22MH1N5DsSOLfoIkUqggJvBIguLHop9UblCYjFx/FbxHYi21y8ydZn
        DydqOiDyt3i57SmyzCtfe5dWPdJ8=
X-Google-Smtp-Source: AGHT+IEvggNBVdzXvnI4ZvwwFULNyMGcnSE+De8SL9h9q/KKuPRHfKSweg60n7E8F2beccoHCTHa7tAUIKb4KHack3U=
X-Received: by 2002:a05:6a20:7f9d:b0:1c4:84ee:63d1 with SMTP id
 adf61e73a8af0-1c68d05bb3fmr1854789637.9.1722512763403; Thu, 01 Aug 2024
 04:46:03 -0700 (PDT)
MIME-Version: 1.0
References: <66a79885.170a0220.112141.bf03SMTPIN_ADDED_BROKEN@mx.google.com>
In-Reply-To: <66a79885.170a0220.112141.bf03SMTPIN_ADDED_BROKEN@mx.google.com>
From: Jesse Daniel Brown <plasmatoid@gmail.com>
Date: Thu, 1 Aug 2024 08:45:51 -0300
Message-ID: <CALdg1mNFjMThpNU_6aCbNm2WeCtFLBScXed9QqAmQ+4_CWsDMg@mail.gmail.com>
Subject: Re: Resposta ao solicitante do sinistro 02310241784
To: sinistrosura@tmagestao.com.br,
        Sinistro Auto <sinistro.auto@segurossura.com.br>,
        =?UTF-8?B?TWFyw61saWEgRmFsY8Ojbw==?= <marilia.falcao@bvaa.adv.br>,
        patricia.fontes@bvaa.adv.br,
        Fernando Aguilera <Fernando.Aguilera@segurossura.com.br>, fernanda.nicola@segurossura.com.br,
        sac@segurossura.com.br, Ouvidoria <Ouvidoria@segurossura.com.br>
Content-Type: multipart/alternative; boundary="00000000000062450e061e9dc18a"
Return-Path: plasmatoid@gmail.com
X-EOPAttributedMessage: 0
X-EOPTenantAttributedMessage: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581:0
X-MS-PublicTrafficType: Email
X-MS-TrafficTypeDiagnostic:
        DS3PEPF000099E1:EE_|LV3PR13MB6334:EE_|BL0PR13MB4401:EE_|CO1PR13MB4918:EE_
X-MS-Office365-Filtering-Correlation-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e
X-LD-Processed: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581,ExtFwd
X-MS-Exchange-AtpMessageProperties: SA|SL
X-Microsoft-Antispam: BCL:0;ARA:13230040|7093399012|69100299015;
X-Microsoft-Antispam-Message-Info: =?utf-8?B?bzkyQ3A4UEcweFJGRGgyWkM4azRiT0gwcTM1U00zNGJxUWtnUzZOZ1NUeitT?=
 =?utf-8?B?YkVjREFHc3pzQ2RSSmMwY0c5VytUU3Y3UG01ZlRRT3NJRUdtSzJSKzRqTGRT?=
 =?utf-8?B?V29PZU1XdVllSDZDZG14T2VEYTdoWWs0Ullia3hNNGVocHRFRDREcjE5b0Z2?=
 =?utf-8?B?NXhNdm0xTDZ0Uko3VVZqMHJmNGY4bFVDUDlURkJyTStRVlNYV09vcGlrQSt1?=
 =?utf-8?B?bnBXSHIxNmpYRFhHOUdYcFMwMk1IeVNtaHBXNWdOZVZLckdYdXJNaHVPZ2JJ?=
 =?utf-8?B?NzJVKzhTcGFpeGhRZXNuZm5xZjU5SHB2dFZPNHBiSlBub2pxc0FvTTFVSTZV?=
 =?utf-8?B?VHJrM3EzZTl4QWp1UVB0NGNPOExSRHVLcmFRdnpLQ24vaGs0VmhDajBsM0Z6?=
 =?utf-8?B?NitWTHYyK1JiVHQ5SzVrZTBKUlJGcTk1cDFZcWdWcGN2MGxJbkZBTStOeFlZ?=
 =?utf-8?B?MDNCamQyU3J0VmI0RWw0Ukl3NEFvUlFrQlg1T3NsUFlHMTE0QVR5V2g4QUpn?=
 =?utf-8?B?UWVjRnNJVTRBNmRNeTNsRkVnNjFYM1lHL25ncTlnUU5LT0ZIUGRNNlBPY0Zn?=
 =?utf-8?B?a2xsMUpiNUpQWTNPNE1YUWVpQXZ4Q1FneFY1SERMNW0yNFdQZDkvTjA4Vk5I?=
 =?utf-8?B?VEt4Mk1qb0RvYkluUDFGVmhLdjhxSzBPb2VUTVV6YmI0VmhQNHhQSzF6UHk0?=
 =?utf-8?B?V3JWcThGOGZTR1hFSnZXTy9BZS9BM3BHNE55ZVZNZnhKVm1CRko1dlBCcWlr?=
 =?utf-8?B?OHkwWktReEJ4c2ZVcTN4Qm41SXFEaVp0cXRScHlsemNxaVFjZmxQRitmb1pl?=
 =?utf-8?B?RlJNNTdRZW13eUNKSFVLTjBESVQvV1NQaDh6dVNGTXpSVXBHOUNNRFNHdDc1?=
 =?utf-8?B?WXIwdmtZUkFrd0tiLzRKa1JtOTFxRGlNaFp4WmRHTURSamY2T28zN21NUWhH?=
 =?utf-8?B?QUtxQmpLOHR4VGhra3BIdjJJUGRodlJ6UUI0c0FaSVliYkJGaGNWZVVQcWMz?=
 =?utf-8?B?YXB0WFBYcVYzU1NyT2g0eWNPbGtQWkVYR2hqT21JRVp0TDVKYmdyMDVCcC94?=
 =?utf-8?B?M3Vsb0dBQzVIUzNsb0h2UGNmc2tWcTk5QkZDbm9wbXUxRjJaa29Fanl2WVlK?=
 =?utf-8?B?Wm85c1lHcUQwSUV1dk9XbmlyaTB1SHVOMjVOR2xhbEIzQ25RWVZ5ZEZ3Q1B5?=
 =?utf-8?B?WmJSOW1nUzhOWkhzVXY3d0o5MmlOeS9JQkQxOFVxY3NlWjhrQzdOTjFmZVhy?=
 =?utf-8?B?cWhBNFFubEJZKzIxcFFsVlc3MmpWK1RNUm1SWXV5Vkw1TkkwejVCZE9rZTdh?=
 =?utf-8?B?bDRxTDN1N0xIQ1IrL1ZEbkRyM25jdWlqdWdLM01NYkZUdVFTaWl3MHhoUzZq?=
 =?utf-8?B?RUh2Qm1kVVBTY1AzczJOTzFVZmR5MkVPYTNnc0YycG1HTTdtblA1K2R6YUdy?=
 =?utf-8?B?Z01jOXdqOTVXSzlqa2JJVlVsdU9xcWZGR0tCQjE5WTI4dEdnWVRoSUxnckxI?=
 =?utf-8?B?ZmRCa0xkY2FDOG9Ic05kbDIwSk02UUJjV1ZIWXVOMjkrNGR2N0NwV2trdHBZ?=
 =?utf-8?B?T2Vsd3RTOForeFFMTDlFRFE1ZnRkTFIvVzIzYm44VE1qNmgyUUxZTWlWV3Yy?=
 =?utf-8?B?TXZUSjMxOU85Z1dLMWZuU043T0dhUG1uTFBGTGJuc3N5dkpZTU12aWw4anRv?=
 =?utf-8?B?ZFZrRkxreEg0US84anpKVXR6RWgwbEp6QWhTcVZWYnNJVGwzNWZnQnVsTWJz?=
 =?utf-8?B?dG1WKzY5QkRGYzdJWGtiek9wd1dNUVlvLytFVndSVHp5RkFmRVFya0Zqd0lO?=
 =?utf-8?B?NVhpZEZNN1JWME00ajNzekY1SHp6SjNNSEpJNnpGNFFyb0EwR3NqTTlENnZM?=
 =?utf-8?B?RFRkZjZlWjMxekdpUjN5OVE0SWFzZnk2SG9KTXJXUjhaeE1WTXpXbjBLYm1z?=
 =?utf-8?B?Zk9zNU5HVTEwUzNaY3pRR2JPOWZHNVc3VEVheDg5RlE0RTVFY1NOc1N5RjNi?=
 =?utf-8?B?aGlBV3g5T3ZMM3ZHSUlzbkFlK2dQMXFYWThiN2dDZ0E5cm1PVU14bXRvbzF6?=
 =?utf-8?B?WGs2ZCtQdFZLMEJNODMrWEJRKy90emNHZ2ZDaG9iaW9ZL0tZSG44ejQzLzlQ?=
 =?utf-8?B?elJFT3ZDYmZ0VWlweTRweHg5Vm1oWnJtYkRHckt6V3c3Um4vS3NCbEEweGp4?=
 =?utf-8?B?OTZmUmkwNmdTZytqcjlycEhZNHFZSFNSYzlQa2k1MUMyMWlqTW5TRzNnK2Uy?=
 =?utf-8?B?VWxvOWdZNzhkMEQ1RXg2QTl5emdYMkJkaWlCams0YUZkZitZUkMzMklZU3Rt?=
 =?utf-8?B?TVUyQUJCS2JKdjFSOHV4TXZtcmdLMy9PcngvM2U2QkxPZDZRVWhwbGVOTUtQ?=
 =?utf-8?B?ZTg4cHEvRkxacGgxeWl4MExsMGFKL2w2dHR4aitGNC94Y2Z3cGpGRUIvNmVO?=
 =?utf-8?B?ZjZmZlAxemlJSEtNLzZ1cHFVNW5xVGtUUXZIdXNFQXh5TGlTdDFEbmNxaTlI?=
 =?utf-8?B?L3E3dEJGc3lQZndld3liM2lUdjhuSnh6T1lRdStKeEtHNzh0aHdVbHIxbTBa?=
 =?utf-8?B?czh3S1l2MVdiTi8wdzgzVnFEWDZYdWdHL2NzbEdrbEZsNEdKTzE3NEN4M3Vl?=
 =?utf-8?B?Rlh0Sm5mWCs3cU5ieEpkRmZURTcrdElDdFBRYzRLMHdzdll0bmtodVNnSmFX?=
 =?utf-8?B?TmN4M1VOK21rWUlyTkRzNzRuVE9QYWtVQ0E9PQ==?=
X-Forefront-Antispam-Report: CIP:209.85.216.43;CTRY:US;LANG:pt;SCL:1;SRV:;IPV:NLI;SFV:NSPM;H:mail-pj1-f43.google.com;PTR:mail-pj1-f43.google.com;CAT:NONE;SFS:(13230040)(7093399012)(69100299015);DIR:INB;
X-MS-Exchange-CrossTenant-OriginalArrivalTime: 01 Aug 2024 11:46:04.8858
 (UTC)
X-MS-Exchange-CrossTenant-Network-Message-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e
X-MS-Exchange-CrossTenant-Id: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581
X-MS-Exchange-CrossTenant-AuthSource: DS3PEPF000099E1.namprd04.prod.outlook.com
X-MS-Exchange-CrossTenant-AuthAs: Anonymous
X-MS-Exchange-CrossTenant-FromEntityHeader: Internet
X-MS-Exchange-Transport-CrossTenantHeadersStamped: LV3PR13MB6334
X-OrganizationHeadersPreserved: LV3PR13MB6334.namprd13.prod.outlook.com
X-OriginatorOrg: sura.com
X-CrossPremisesHeadersFilteredByDsnGenerator:
        CO1PR13MB4918.namprd13.prod.outlook.com


Final-Recipient: rfc822;fernanda.nicola@segurossura.com.br
Action: failed
Status: 5.4.300
Diagnostic-Code: smtp;550 5.4.300 Message expired -> 421 Service Temporarily Unavailable


AVISO: Você recebeu um e-mail externo. Verifique o remetente, não baixe anexos desconhecidos, não clique em links suspeitos e não entregue seus nomes de usuários ou senhas. Se você RECEBER UM EMAIL SUSPEITO , salve e anexe o e-mail original e envie para correond@suramericana.com.co<mailto:correond@suramericana.com.co>, para que ocorra o bloqueio, caso tenha dúvidas entre em contato com o Service Desk.

  Subject: Re: Sinistro 02310241784 - Contestação e Documentação Adicional


Prezada Dra. Marília Falcão, Sura, e sinistros departmento,

Referente ao sinistro 02310241784, gostaria de esclarecer algumas questões levantadas na sua última comunicação.

  1.  Vistoria pela Companhia: Conforme mencionado, o veículo passou por diversas inspeções independentes devido às restrições de licenciamento. Anexamos os relatórios de inspeção e o parecer técnico (Manifestação) que indicam danos extensivos e sugerem a perda total do veículo, contrariando a avaliação inicial.

  2.  Determinação da Perda Total: O relatório técnico anexado demonstra claramente os danos estruturais significativos, incluindo danos nas longarinas traseiras, painel traseiro, assoalho do porta-malas, painel dianteiro e outros componentes. Estes danos comprometem a segurança e a integridade estrutural do veículo, justificando a alegação de perda total.

  3.  Valor Pleiteado: O valor solicitado é baseado em avaliações detalhadas e justificadas, que consideram a depreciação do veículo e os custos reais dos reparos necessários. O valor proposto inicialmente pela seguradora é insuficiente frente às evidências documentais.

  4.  Documentação de Lucros Cessantes e Danos Corporais: Anexamos novamente a documentação que comprova os lucros cessantes e os danos corporais sofridos. Estes documentos já foram submetidos anteriormente e estão detalhados nos anexos.

  5.  Nova Vistoria: Várias vistorias foram realizadas e as evidências são claras quanto ao estado do veículo. Uma nova vistoria pela seguradora parece desnecessária e apenas prolonga a resolução do sinistro.

Solicito, portanto, uma reavaliação do caso com base nas evidências anexadas e uma revisão da proposta de indenização. Estou à disposição para qualquer esclarecimento adicional e para discutir a questão de forma mais detalhada, se necessário.

Atenciosamente,

Jesse Daniel Brown

On Mon, Jul 29, 2024 at 10:26 AM <sinistrosura@tmagestao.com.br<mailto:sinistrosura@tmagestao.com.br>> wrote:

Prezado(a) jesse,



Segue resposta sobre o andamento do sinistro 02310241784



Conforme informamos, você não realizou vistoria pela Cia. pois seu veículo foi apreendido por restrições (licenciamento), o senhor mesmo providenciou laudo de engenheiro e não foi constatado a perda total do seu veículo, está pleiteando um valor superior ao regulado e para resolver a situação a área de sinistro documentou em seu e-mail a necessidade de vistoria, pois podemos aprovar o orçamento na oficina que escolher após a regulação que só é feita em vistoria.

Acionamos o escritório jurídico BVAA para intermediar e realizar as tratativas de Lucros Cessantes e Danos Corporais mas nenhum documento comprobatório a esses pleitos foi recebido.

Informações, por favor, acionar Dra. Marilia Falcão
Advogada Gestora - Núcleo de Acordos
Telefone: 55 (81) 99112-3987
marilia.falcao@bvaa.adv.br<mailto:marilia.falcao@bvaa.adv.br>


Mantemos o valor proposto, caso não aceite, será necessário agendar vistoria, para agendamento de vistoria, acionar a central de atendimento, pelo telefone 11 3003 7727 São Paulo e capitais ou 0800 7049399 demais regiões opção 01 e 06.

A Seguros Sura agradece o seu contato, qualquer duvida permanecemos a disposição.



Favor não responder este email!



Departamento de Sinistros



Seguros Sura




=== HTML PART ===
<html>
<Head></head><body>
<p><b><font color="#000066" size="3" face="Arial">Delivery has failed to these recipients or groups:</font></b></p>
<font color="#000000" size="2" face="Tahoma"><p><a href="mailto:fernanda.nicola@segurossura.com.br">fernanda.nicola@segurossura.com.br</a><br>
</font>
<font color="#000000" size="3" face="Arial">Your message couldn't be delivered. Despite repeated attempts to contact the recipient's email system it didn't respond.<p>Contact the recipient by some other means (by phone, for example) and ask them to tell their email admin that it appears that their email system isn't accepting connection requests from your email system. Give them the error details shown below. It's likely that the recipient's email admin is the only one who can fix this problem.</p><p>For more information and tips to fix this issue see this article: https://go.microsoft.com/fwlink/?LinkId=389361.</p><br>
</font>
<font color="#000000" size="2" face="Tahoma"><br>
</p>
</font>
<br><br><br><br><br><br>
<font color="#808080" size="2" face="Tahoma"><p><b>Diagnostic information for administrators:</b></p>
<p>Generating server: CO1PR13MB4918.namprd13.prod.outlook.com<br>
Total retry attempts: 10</p>
<p>fernanda.nicola@segurossura.com.br<br>
Remote server  returned '550 5.4.300 Message expired -&gt; 421 Service Temporarily Unavailable'<br>
</p>
<p>Original message headers:</p>
<pre>Received: from BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22)
 by CO1PR13MB4918.namprd13.prod.outlook.com (2603:10b6:303:f9::11) with
 Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Fri, 2 Aug
 2024 03:30:56 +0000
Received: from LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22)
 by BL0PR13MB4401.namprd13.prod.outlook.com (2603:10b6:208:1c3::22) with
 Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22; Thu, 1 Aug
 2024 22:52:02 +0000
ARC-Seal: i=1; a=rsa-sha256; s=arcselector10001; d=microsoft.com; cv=none;
 b=sXUFZ7fclbZEp/70Q4JeP17ssHtVmXc/242jYlO16N/bp3k6RlvtdHSiTRGX8kwDEgrkpdftsK2k6WC1DpXOp9n/MNv/xCmivRuVmzLbxUy9EuFVFUcszAj4sSpcfDeHU0e1+QyFExGE0K3AmrtmEtDMN29fuzh0rcXUQVxRW4gcg4rAWnHzmMUnjIMWprWKsS5F+zw48p4D4hKLku9UcNPobqmswXTKu53tlVcw8U3Eu6WuEPrqJUUg7jiQ9HHn+J281FvzGmNXtK3n1+yv22ViEJamb6iiqi8C8gl5PhN478ss+6dKZ1gd0gg7ZfdN62FowA9QyIgFWY+QuuBBMA==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=microsoft.com;
 s=arcselector10001;
 h=From:Date:Subject:Message-ID:Content-Type:MIME-Version:X-MS-Exchange-AntiSpam-MessageData-ChunkCount:X-MS-Exchange-AntiSpam-MessageData-0:X-MS-Exchange-AntiSpam-MessageData-1;
 bh=5hHw/AKaP7jRauBe3VisP5spgvm9xbUpaQ4sya9hdL8=;
 b=CqIST2DyBkCuqKSefXirO5ovP+VQygCbvyvA0F8b175QTENH1u0r1z3bqoYtl6BW2o+KRK4lUQQTSTIyDFdvndjOJznsLEz0xjlGu+07Rf3FWvxz+5Q8LsxfsiVHCaYjpDVl+7/5ltxQzv7WA98zxh8cSLq2TTBy2Ir+pcVJJb7Cyrat2B4FqyznvWQ9F26OZsv59HEcTFgAkpfqmbzWr6ETJQOdKiVu9XTb9vVXtnfAtz93C5Meji6VsCCtJQauQ58rSYDc7H/bPRZkN99oYv+JwwNOcSNjlThVYWEZLE3O6CF86e7gFWOyrVgGZYKw2e2RwHMeDus9mjND/kahGg==
ARC-Authentication-Results: i=1; mx.microsoft.com 1; spf=pass (sender ip is
 209.85.216.43) smtp.rcpttodomain=segurossura.com.br smtp.mailfrom=gmail.com;
 dmarc=pass (p=none sp=quarantine pct=100) action=none header.from=gmail.com;
 dkim=pass (signature was verified) header.d=gmail.com; arc=none (0)
Received: from CH0PR03CA0440.namprd03.prod.outlook.com (2603:10b6:610:10e::29)
 by LV3PR13MB6334.namprd13.prod.outlook.com (2603:10b6:408:19e::22) with
 Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.21; Thu, 1 Aug
 2024 11:46:05 +0000
Received: from DS3PEPF000099E1.namprd04.prod.outlook.com
 (2603:10b6:610:10e:cafe::ea) by CH0PR03CA0440.outlook.office365.com
 (2603:10b6:610:10e::29) with Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.7828.22 via Frontend
 Transport; Thu, 1 Aug 2024 11:46:05 +0000
Authentication-Results: spf=pass (sender IP is 209.85.216.43)
 smtp.mailfrom=gmail.com; dkim=pass (signature was verified)
 header.d=gmail.com;dmarc=pass action=none header.from=gmail.com;compauth=pass
 reason=100
Received-SPF: Pass (protection.outlook.com: domain of gmail.com designates
 209.85.216.43 as permitted sender) receiver=protection.outlook.com;
 client-ip=209.85.216.43; helo=mail-pj1-f43.google.com; pr=C
Received: from mail-pj1-f43.google.com (209.85.216.43) by
 DS3PEPF000099E1.mail.protection.outlook.com (10.167.17.196) with Microsoft
 SMTP Server (version=TLS1_3, cipher=TLS_AES_256_GCM_SHA384) id 15.20.7828.19
 via Frontend Transport; Thu, 1 Aug 2024 11:46:04 +0000
Received: by mail-pj1-f43.google.com with SMTP id 98e67ed59e1d1-2cd16900ec5so1232757a91.3;
        Thu, 01 Aug 2024 04:46:04 -0700 (PDT)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20230601; t=1722512764; x=1723117564; darn=segurossura.com.br;
        h=to:subject:message-id:date:from:in-reply-to:references:mime-version
         :from:to:cc:subject:date:message-id:reply-to;
        bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=;
        b=A0cbUhhjafsrfA9p/cq9icXU/1ncYY8K8jVuR4ZagiWy/YbW20P6EmMlRCRaz0ZKon
         A9YFGuSOGZG4B2x35iXiWZtiupHHUemynAaFf+YixLqSj5isn1mc6ClUBKy+/6xGdmnY
         xQc4pX5KOTOMo6eZN7ANQ2iY71U3cL9Ityw7kPz8AWRRsQExW7r3dPCo3X5ZW4dTFbRM
         fh200AJi19+ZgEoVjJB25oF5HyMnu73CvIC5UdgfqvVn+aW2icc8+oc3VZ5Dgje8ueMy
         w264ltqgT6XD4b0QLOGC4Vs4Y8+J9ZKwi4wLY064wT0MadCbzEewNqcM7IbdRf0Ub6WM
         0kVg==
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20230601; t=1722512764; x=1723117564;
        h=to:subject:message-id:date:from:in-reply-to:references:mime-version
         :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to;
        bh=JgVAvNrRlk3wkLA81ISCrH47m9HuH7YuT5dtpM2iGtI=;
        b=JGVoDywd10zH3viUvBMPGaG4elTPwXjGy7SCl6ZdSUu16BbWthvWbE7ft1077U1mW8
         mM+QZtu+DWVZ1Qct2C0I4wk7oA7AM1aH4mGE2AzK9zoX4UxfjWxMP9SteBouGtpwp9kb
         uKMtu2EcBRA3PpxomDZvOHG6/VhWSejDtdNkJ5sbcrHREgZDPQnUkznIRga03r7VkrF0
         bIonyluSrOKLcpTsF0CVFWfneZ5T1G5pjQ9u0/qvkNvexSSZwS4rdxWIFdCGDfN0TTiy
         lSOpMF53T5n8RNzJ9330b9fjAzrCPtGL1XsxNDwEaodKfeJBs+uznU55OoM+V0fZ6iap
         ESfA==
X-Forwarded-Encrypted: i=1; AJvYcCX4GpMRqz7LHWj8bvwiggBpGAxFazAX4NcF4nWAA9C+AbrqteKg877SI7bJAy29i5mMvo1IPS+dyHgBGsV33JNWH1wIhXyqCP8W35WbRbMpNbyzwjrR35zuEEmNgj+g/+qm0SswlQAoKIW3vapRF60bQnjSZxT3HyrLT92wTB/8bPWCwB6qvgKwcUE3pjZ8Nd+rSSrpnFHianucduITmm7MRTE7G/tYED3a8USvEHkfaHJkMz1dmZ59OB/vvd6oBDtsJeI6LuD7AXjk9yq205To
X-Gm-Message-State: AOJu0YyvP/KaxmIHMG3JUp3vwL2LMGgjac0F/e5M0AZNiUe0klwgoUgs
	nMbzH9FTdMpd4fV1lHl1p22MH1N5DsSOLfoIkUqggJvBIguLHop9UblCYjFx/FbxHYi21y8ydZn
	DydqOiDyt3i57SmyzCtfe5dWPdJ8=
X-Google-Smtp-Source: AGHT+IEvggNBVdzXvnI4ZvwwFULNyMGcnSE+De8SL9h9q/KKuPRHfKSweg60n7E8F2beccoHCTHa7tAUIKb4KHack3U=
X-Received: by 2002:a05:6a20:7f9d:b0:1c4:84ee:63d1 with SMTP id
 adf61e73a8af0-1c68d05bb3fmr1854789637.9.1722512763403; Thu, 01 Aug 2024
 04:46:03 -0700 (PDT)
MIME-Version: 1.0
References: &lt;66a79885.170a0220.112141.bf03SMTPIN_ADDED_BROKEN@mx.google.com&gt;
In-Reply-To: &lt;66a79885.170a0220.112141.bf03SMTPIN_ADDED_BROKEN@mx.google.com&gt;
From: Jesse Daniel Brown &lt;plasmatoid@gmail.com&gt;
Date: Thu, 1 Aug 2024 08:45:51 -0300
Message-ID: &lt;CALdg1mNFjMThpNU_6aCbNm2WeCtFLBScXed9QqAmQ+4_CWsDMg@mail.gmail.com&gt;
Subject: Re: Resposta ao solicitante do sinistro 02310241784
To: sinistrosura@tmagestao.com.br, 
	Sinistro Auto &lt;sinistro.auto@segurossura.com.br&gt;, 
	=?UTF-8?B?TWFyw61saWEgRmFsY8Ojbw==?= &lt;marilia.falcao@bvaa.adv.br&gt;, 
	patricia.fontes@bvaa.adv.br, 
	Fernando Aguilera &lt;Fernando.Aguilera@segurossura.com.br&gt;, fernanda.nicola@segurossura.com.br, 
	sac@segurossura.com.br, Ouvidoria &lt;Ouvidoria@segurossura.com.br&gt;
Content-Type: multipart/alternative; boundary=&quot;00000000000062450e061e9dc18a&quot;
Return-Path: plasmatoid@gmail.com
X-EOPAttributedMessage: 0
X-EOPTenantAttributedMessage: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581:0
X-MS-PublicTrafficType: Email
X-MS-TrafficTypeDiagnostic:
	DS3PEPF000099E1:EE_|LV3PR13MB6334:EE_|BL0PR13MB4401:EE_|CO1PR13MB4918:EE_
X-MS-Office365-Filtering-Correlation-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e
X-LD-Processed: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581,ExtFwd
X-MS-Exchange-AtpMessageProperties: SA|SL
X-Microsoft-Antispam: BCL:0;ARA:13230040|7093399012|69100299015;
X-Microsoft-Antispam-Message-Info: =?utf-8?B?bzkyQ3A4UEcweFJGRGgyWkM4azRiT0gwcTM1U00zNGJxUWtnUzZOZ1NUeitT?=
 =?utf-8?B?YkVjREFHc3pzQ2RSSmMwY0c5VytUU3Y3UG01ZlRRT3NJRUdtSzJSKzRqTGRT?=
 =?utf-8?B?V29PZU1XdVllSDZDZG14T2VEYTdoWWs0Ullia3hNNGVocHRFRDREcjE5b0Z2?=
 =?utf-8?B?NXhNdm0xTDZ0Uko3VVZqMHJmNGY4bFVDUDlURkJyTStRVlNYV09vcGlrQSt1?=
 =?utf-8?B?bnBXSHIxNmpYRFhHOUdYcFMwMk1IeVNtaHBXNWdOZVZLckdYdXJNaHVPZ2JJ?=
 =?utf-8?B?NzJVKzhTcGFpeGhRZXNuZm5xZjU5SHB2dFZPNHBiSlBub2pxc0FvTTFVSTZV?=
 =?utf-8?B?VHJrM3EzZTl4QWp1UVB0NGNPOExSRHVLcmFRdnpLQ24vaGs0VmhDajBsM0Z6?=
 =?utf-8?B?NitWTHYyK1JiVHQ5SzVrZTBKUlJGcTk1cDFZcWdWcGN2MGxJbkZBTStOeFlZ?=
 =?utf-8?B?MDNCamQyU3J0VmI0RWw0Ukl3NEFvUlFrQlg1T3NsUFlHMTE0QVR5V2g4QUpn?=
 =?utf-8?B?UWVjRnNJVTRBNmRNeTNsRkVnNjFYM1lHL25ncTlnUU5LT0ZIUGRNNlBPY0Zn?=
 =?utf-8?B?a2xsMUpiNUpQWTNPNE1YUWVpQXZ4Q1FneFY1SERMNW0yNFdQZDkvTjA4Vk5I?=
 =?utf-8?B?VEt4Mk1qb0RvYkluUDFGVmhLdjhxSzBPb2VUTVV6YmI0VmhQNHhQSzF6UHk0?=
 =?utf-8?B?V3JWcThGOGZTR1hFSnZXTy9BZS9BM3BHNE55ZVZNZnhKVm1CRko1dlBCcWlr?=
 =?utf-8?B?OHkwWktReEJ4c2ZVcTN4Qm41SXFEaVp0cXRScHlsemNxaVFjZmxQRitmb1pl?=
 =?utf-8?B?RlJNNTdRZW13eUNKSFVLTjBESVQvV1NQaDh6dVNGTXpSVXBHOUNNRFNHdDc1?=
 =?utf-8?B?WXIwdmtZUkFrd0tiLzRKa1JtOTFxRGlNaFp4WmRHTURSamY2T28zN21NUWhH?=
 =?utf-8?B?QUtxQmpLOHR4VGhra3BIdjJJUGRodlJ6UUI0c0FaSVliYkJGaGNWZVVQcWMz?=
 =?utf-8?B?YXB0WFBYcVYzU1NyT2g0eWNPbGtQWkVYR2hqT21JRVp0TDVKYmdyMDVCcC94?=
 =?utf-8?B?M3Vsb0dBQzVIUzNsb0h2UGNmc2tWcTk5QkZDbm9wbXUxRjJaa29Fanl2WVlK?=
 =?utf-8?B?Wm85c1lHcUQwSUV1dk9XbmlyaTB1SHVOMjVOR2xhbEIzQ25RWVZ5ZEZ3Q1B5?=
 =?utf-8?B?WmJSOW1nUzhOWkhzVXY3d0o5MmlOeS9JQkQxOFVxY3NlWjhrQzdOTjFmZVhy?=
 =?utf-8?B?cWhBNFFubEJZKzIxcFFsVlc3MmpWK1RNUm1SWXV5Vkw1TkkwejVCZE9rZTdh?=
 =?utf-8?B?bDRxTDN1N0xIQ1IrL1ZEbkRyM25jdWlqdWdLM01NYkZUdVFTaWl3MHhoUzZq?=
 =?utf-8?B?RUh2Qm1kVVBTY1AzczJOTzFVZmR5MkVPYTNnc0YycG1HTTdtblA1K2R6YUdy?=
 =?utf-8?B?Z01jOXdqOTVXSzlqa2JJVlVsdU9xcWZGR0tCQjE5WTI4dEdnWVRoSUxnckxI?=
 =?utf-8?B?ZmRCa0xkY2FDOG9Ic05kbDIwSk02UUJjV1ZIWXVOMjkrNGR2N0NwV2trdHBZ?=
 =?utf-8?B?T2Vsd3RTOForeFFMTDlFRFE1ZnRkTFIvVzIzYm44VE1qNmgyUUxZTWlWV3Yy?=
 =?utf-8?B?TXZUSjMxOU85Z1dLMWZuU043T0dhUG1uTFBGTGJuc3N5dkpZTU12aWw4anRv?=
 =?utf-8?B?ZFZrRkxreEg0US84anpKVXR6RWgwbEp6QWhTcVZWYnNJVGwzNWZnQnVsTWJz?=
 =?utf-8?B?dG1WKzY5QkRGYzdJWGtiek9wd1dNUVlvLytFVndSVHp5RkFmRVFya0Zqd0lO?=
 =?utf-8?B?NVhpZEZNN1JWME00ajNzekY1SHp6SjNNSEpJNnpGNFFyb0EwR3NqTTlENnZM?=
 =?utf-8?B?RFRkZjZlWjMxekdpUjN5OVE0SWFzZnk2SG9KTXJXUjhaeE1WTXpXbjBLYm1z?=
 =?utf-8?B?Zk9zNU5HVTEwUzNaY3pRR2JPOWZHNVc3VEVheDg5RlE0RTVFY1NOc1N5RjNi?=
 =?utf-8?B?aGlBV3g5T3ZMM3ZHSUlzbkFlK2dQMXFYWThiN2dDZ0E5cm1PVU14bXRvbzF6?=
 =?utf-8?B?WGs2ZCtQdFZLMEJNODMrWEJRKy90emNHZ2ZDaG9iaW9ZL0tZSG44ejQzLzlQ?=
 =?utf-8?B?elJFT3ZDYmZ0VWlweTRweHg5Vm1oWnJtYkRHckt6V3c3Um4vS3NCbEEweGp4?=
 =?utf-8?B?OTZmUmkwNmdTZytqcjlycEhZNHFZSFNSYzlQa2k1MUMyMWlqTW5TRzNnK2Uy?=
 =?utf-8?B?VWxvOWdZNzhkMEQ1RXg2QTl5emdYMkJkaWlCams0YUZkZitZUkMzMklZU3Rt?=
 =?utf-8?B?TVUyQUJCS2JKdjFSOHV4TXZtcmdLMy9PcngvM2U2QkxPZDZRVWhwbGVOTUtQ?=
 =?utf-8?B?ZTg4cHEvRkxacGgxeWl4MExsMGFKL2w2dHR4aitGNC94Y2Z3cGpGRUIvNmVO?=
 =?utf-8?B?ZjZmZlAxemlJSEtNLzZ1cHFVNW5xVGtUUXZIdXNFQXh5TGlTdDFEbmNxaTlI?=
 =?utf-8?B?L3E3dEJGc3lQZndld3liM2lUdjhuSnh6T1lRdStKeEtHNzh0aHdVbHIxbTBa?=
 =?utf-8?B?czh3S1l2MVdiTi8wdzgzVnFEWDZYdWdHL2NzbEdrbEZsNEdKTzE3NEN4M3Vl?=
 =?utf-8?B?Rlh0Sm5mWCs3cU5ieEpkRmZURTcrdElDdFBRYzRLMHdzdll0bmtodVNnSmFX?=
 =?utf-8?B?TmN4M1VOK21rWUlyTkRzNzRuVE9QYWtVQ0E9PQ==?=
X-Forefront-Antispam-Report: CIP:209.85.216.43;CTRY:US;LANG:pt;SCL:1;SRV:;IPV:NLI;SFV:NSPM;H:mail-pj1-f43.google.com;PTR:mail-pj1-f43.google.com;CAT:NONE;SFS:(13230040)(7093399012)(69100299015);DIR:INB;
X-MS-Exchange-CrossTenant-OriginalArrivalTime: 01 Aug 2024 11:46:04.8858
 (UTC)
X-MS-Exchange-CrossTenant-Network-Message-Id: 420589cb-8c31-4ee2-1278-08dcb21f866e
X-MS-Exchange-CrossTenant-Id: 3c0bd4fe-1111-4d13-8e0c-7c33b9eb7581
X-MS-Exchange-CrossTenant-AuthSource: DS3PEPF000099E1.namprd04.prod.outlook.com
X-MS-Exchange-CrossTenant-AuthAs: Anonymous
X-MS-Exchange-CrossTenant-FromEntityHeader: Internet
X-MS-Exchange-Transport-CrossTenantHeadersStamped: LV3PR13MB6334
X-OrganizationHeadersPreserved: LV3PR13MB6334.namprd13.prod.outlook.com
X-OriginatorOrg: sura.com
X-CrossPremisesHeadersFilteredByDsnGenerator:
	CO1PR13MB4918.namprd13.prod.outlook.com
</pre>
</font>
</body>
</html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
<div style="border-bottom-style: solid; border-bottom-width: 5px; border-bottom-color: #FF3933; border-top-style: solid; border-top-width: 5px; border-top-color: #FF3933;">
<div style="font-size: 9pt; font-family: 'Arial', Verdana, Helvetica, sans-serif;">
<p>AVISO: Você recebeu um e-mail externo. Verifique o remetente, não baixe anexos desconhecidos, não clique em links suspeitos e não entregue seus nomes de usuários ou senhas. Se você RECEBER UM EMAIL SUSPEITO , salve e anexe o e-mail original e envie para
<a href="mailto:correond@suramericana.com.co">correond@suramericana.com.co</a>, para que ocorra o bloqueio, caso tenha dúvidas entre em contato com o Service Desk.</p>
</div>
</div>
<div>
<div dir="ltr">&nbsp; Subject: Re: Sinistro 02310241784 - Contestação e Documentação Adicional<br>
<br>
<p>Prezada Dra. Marília Falcão, Sura, e sinistros departmento,</p>
<p>Referente ao sinistro 02310241784, gostaria de esclarecer algumas questões levantadas na sua última comunicação.</p>
<ol>
<li>
<p><strong>Vistoria pela Companhia</strong>: Conforme mencionado, o veículo passou por diversas inspeções independentes devido às restrições de licenciamento. Anexamos os relatórios de inspeção e o parecer técnico (Manifestação) que indicam danos extensivos
 e sugerem a perda total do veículo, contrariando a avaliação inicial.</p>
</li><li>
<p><strong>Determinação da Perda Total</strong>: O relatório técnico anexado demonstra claramente os danos estruturais significativos, incluindo danos nas longarinas traseiras, painel traseiro, assoalho do porta-malas, painel dianteiro e outros componentes.
 Estes danos comprometem a segurança e a integridade estrutural do veículo, justificando a alegação de perda total.</p>
</li><li>
<p><strong>Valor Pleiteado</strong>: O valor solicitado é baseado em avaliações detalhadas e justificadas, que consideram a depreciação do veículo e os custos reais dos reparos necessários. O valor proposto inicialmente pela seguradora é insuficiente frente
 às evidências documentais.</p>
</li><li>
<p><strong>Documentação de Lucros Cessantes e Danos Corporais</strong>: Anexamos novamente a documentação que comprova os lucros cessantes e os danos corporais sofridos. Estes documentos já foram submetidos anteriormente e estão detalhados nos anexos.</p>
</li><li>
<p><strong>Nova Vistoria</strong>: Várias vistorias foram realizadas e as evidências são claras quanto ao estado do veículo. Uma nova vistoria pela seguradora parece desnecessária e apenas prolonga a resolução do sinistro.</p>
</li></ol>
<p>Solicito, portanto, uma reavaliação do caso com base nas evidências anexadas e uma revisão da proposta de indenização. Estou à disposição para qualquer esclarecimento adicional e para discutir a questão de forma mais detalhada, se necessário.</p>
<p>Atenciosamente,</p>
Jesse Daniel Brown&nbsp;&nbsp;<br>
</div>
<br>
<div class="gmail_quote">
<div dir="ltr" class="gmail_attr">On Mon, Jul 29, 2024 at 10:26 AM &lt;<a href="mailto:sinistrosura@tmagestao.com.br">sinistrosura@tmagestao.com.br</a>&gt; wrote:<br>
</div>
<blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">
<div>
<p>Prezado(a) <strong>jesse</strong>,&nbsp;</p>
<p>&nbsp;</p>
<p>Segue resposta sobre o andamento do sinistro&nbsp;<strong>02310241784</strong> </p>
<p>&nbsp;</p>
<p style="text-align:justify">Conforme informamos, você não realizou vistoria pela Cia. pois seu veículo foi apreendido por restrições (licenciamento), o senhor mesmo providenciou laudo de engenheiro e não foi constatado a perda total do seu veículo, está pleiteando
 um valor superior ao regulado e para resolver a situação a área de sinistro documentou em seu e-mail a necessidade de vistoria, pois podemos aprovar o orçamento na oficina que escolher após a regulação que só é feita em vistoria.</p>
<p style="text-align:justify">Acionamos o escritório jurídico BVAA para intermediar e realizar as tratativas de Lucros Cessantes e Danos Corporais mas nenhum documento comprobatório a esses pleitos foi recebido.&nbsp;</p>
<p style="text-align:justify">Informações, por favor, acionar Dra. Marilia Falcão&nbsp;<br>
Advogada Gestora - Núcleo de Acordos<br>
Telefone: 55 (81) 99112-3987<br>
<a href="mailto:marilia.falcao@bvaa.adv.br" target="_blank">marilia.falcao@bvaa.adv.br</a><br>
&nbsp;</p>
<p style="text-align:justify">Mantemos o valor proposto, caso não aceite, será necessário agendar vistoria, para agendamento de vistoria, acionar a central de atendimento, pelo telefone 11 3003 7727 São Paulo e capitais ou 0800 7049399 demais regiões opção
 01 e 06.&nbsp;</p>
<p>A Seguros Sura agradece o seu contato, qualquer duvida permanecemos a disposição.</p>
<p>&nbsp;</p>
<p><strong>Favor não responder este email!</strong> </p>
<p>&nbsp;</p>
<p>Departamento de Sinistros</p>
<p>&nbsp;</p>
<p>Seguros Sura</p>
<img src="https://firstone.tmagestao.com.br/Sura/Atendimento/webFirstOne.aspx?P=TxgtM9cHjK_BpxK1tSlE-Orf4hz2b7-ozCQiKHb-TMMn-XMHD-aJUB-SKOo0UoLXHOb_pd7BpxK1t-EIGOrU4hL-YIe_FOoFgvpd7-I9cKHYEIs-tv6LCFSidbX/3Au/uKwfkalJmc51pNrvkAvm1SuPqxlxN6.hXsA8_4_b5lw_X2YqJfYjP9dNNVSwmQiFRsXcHiP9PJ8GQc1" width="0" height="0" style="border: 0px; width: 0px; height: 0px; overflow: hidden;"></div>
</blockquote>
</div>
</div>
</body>
</html>


```
