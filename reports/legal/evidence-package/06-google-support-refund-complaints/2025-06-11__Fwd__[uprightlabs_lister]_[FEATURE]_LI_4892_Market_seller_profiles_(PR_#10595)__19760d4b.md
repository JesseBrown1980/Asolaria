---
gmail_message_id: 19760d4b064a804a
account: jessebrown.soft1980@gmail.com
date_header: Wed, 11 Jun 2025 18:10:28 -0300
from: Jesse Daniel Brown <plasmatoid@gmail.com>
to: Jesse Brown <jessebrown.soft1980@gmail.com>
subject: Fwd: [uprightlabs/lister] [FEATURE] LI 4892 Market seller profiles (PR #10595)
body_sha256: ab0423e9c8c5faac6991faab193bb7ab323b7a2233f681460e1e5cec61120301
snippet: ---------- Forwarded message --------- From: Ian &lt;notifications@github.com&gt; Date: Wed, Jun 11, 2025, 5:27 PM Subject: Re: [uprightlabs/lister] [FEATURE] LI 4892 Market seller profiles (PR #10595)
---

# Fwd: [uprightlabs/lister] [FEATURE] LI 4892 Market seller profiles (PR #10595)

**From:** Jesse Daniel Brown <plasmatoid@gmail.com>
**To:** Jesse Brown <jessebrown.soft1980@gmail.com>
**Date:** Wed, 11 Jun 2025 18:10:28 -0300
**SHA256:** `ab0423e9c8c5faac6991faab193bb7ab323b7a2233f681460e1e5cec61120301`

## Body (extracted text)

---------- Forwarded message --------- From: Ian Date: Wed, Jun 11, 2025, 5:27 PM Subject: Re: [uprightlabs/lister] [FEATURE] LI 4892 Market seller profiles (PR #10595) To: uprightlabs/lister Cc: Jesse Daniel Brown , Review requested *@ianmdawson* approved this pull request. This looks like it's on the right track to me, the code looks good to me 👍 -- Let me know if you want my eyes on it again after you make changes ------------------------------ In app/controllers/api/v5/common/market_seller_profiles_controller.rb : > + return_policies = return_policies.where(hidden: false) || [] if only_visible_param + + return_policies = return_policies.order(name: :asc) + render json: { + shipping_profiles: shipping_profiles.as_json(only: [:id, :name, :profile_type, :hidden, :default, :external_id]), + return_policies: return_policies.as_json(only: [:id, :name, :profile_type, :hidden, :default, :external_id]) + } + end + + private + + def market_account_id_param + params.require(:market_account_id) + end + + def only_visible_param Another minor suggestion: ⬇️ Suggested change - def only_visible_param + def show_only_visible? ------------------------------ In app/models/market_seller_profile.rb : > + def self.process_market_seller_profiles(market_account) + transaction do + process_market_seller_profiles_by_type(market_account, 'SHIPPING') + process_market_seller_profiles_by_type(market_account, 'RETURN_POLICY') + end + end + + def self.process_market_seller_profiles_by_type(market_account, profile_type) + client = market_account.client + policies = + case profile_type + when 'SHIPPING' + client.fetch_shipping_profiles + when 'RETURN_POLICY' + client.fetch_raw_return_policies + end Should this have an else case where an error is raised for invalid profile type? ------------------------------ In client/routes/products_v4/listings/etsy/helpers/useLocalValidation.ts : > + }) + } + } + + if (e.name === 'whoMade') { + if (e.value === '') { + setLocalErrors(prevErrors => ({ ...prevErrors, etsyListingWhoMade: true })) + } else { + setLocalErrors(prevErrors => { + const { etsyListingWhoMade, ...rest } = prevErrors + return rest + }) + } + } + + // Dodato za whenMade This comment can probably be removed ------------------------------ In client/types/api/seller_profile.ts : > @@ -0,0 +1,13 @@ +type SellerProfileType = 'PAYMENT' | 'RETURN_POLICY' | 'SHIPPING' + +export interface MarketSellerProfile { + id: number + marketAccountId: number + externalId: number This might also be a string some day ------------------------------ In spec/requests/api/v5/common/market_seller_profiles_spec.rb : > + context 'when the profiles do not exist' do + it 'responds with empty array' do + get "/api/v5/common/market_seller_profiles?market_account_id=#{etsy_account.id}", **api_headers(user) + expect(json[:shipping_profiles]).to eql([]) + expect(response).to have_http_status(:ok) + end + end + end + + context 'when the account does not exist' do + it 'responds with empty array' do + get "/api/v5/common/market_seller_profiles?market_account_id=does-not-exist", **api_headers(user) + expect(json[:message]).to eql("Market Account with ID: does-not-exist doesn't exist") + expect(response).to have_http_status(:not_found) + end + end I would add a test for when the market account belongs to another org (like you added in spec/requests/api/v4/bulk_update/market_seller_profiles_spec.rb). You already coded this correctly as far as I can tell, but I like the extra security. — Reply to this email directly, view it on GitHub , or unsubscribe . You are receiving this because your review was requested.Message ID: === HTML PART === ---------- Forwarded message --------- From: Ian < notifications@github.com > Date: Wed, Jun 11, 2025, 5:27 PM Subject: Re: [uprightlabs/lister] [FEATURE] LI 4892 Market seller profiles (PR #10595) To: uprightlabs/lister < lister@noreply.github.com > Cc: Jesse Daniel Brown < plasmatoid@gmail.com >, Review requested < review_requested@noreply.github.com > @ianmdawson approved this pull request. This looks like it&#39;s on the right track to me, the code looks good to me 👍 -- Let me know if you want my eyes on it again after you make changes In app/controllers/api/v5/common/market_seller_profiles_controller.rb : > + return_policies = return_policies.where(hidden: false) || [] if only_visible_param + + return_policies = return_policies.order(name: :asc) + render json: { + shipping_profiles: shipping_profiles.as_json(only: [:id, :name, :profile_type, :hidden, :default, :external_id]), + return_policies: return_policies.as_json(only: [:id, :name, :profile_type, :hidden, :default, :external_id]) + } + end + + private + + def market_account_id_param + params.require(:market_account_id) + end + + def only_visible_param Another minor suggestion: ⬇️ Suggested change - def only_visible_param + def show_only_visible? In app/models/market_seller_profile.rb : > + def self.process_market_seller_profiles(market_account) + transaction do + process_market_seller_profiles_by_type(market_account, &#39;SHIPPING&#39;) + process_market_seller_profiles_by_type(market_account, &#39;RETURN_POLICY&#39;) + end + end + + def self.process_market_seller_profiles_by_type(market_account, profile_type) + client = market_account.client + policies = + case profile_type + when &#39;SHIPPING&#39; + client.fetch_shipping_profiles + when &#39;RETURN_POLICY&#39; + client.fetch_raw_return_policies + end Should this have an else case where an error is raised for invalid profile type? In client/routes/products_v4/listings/etsy/helpers/useLocalValidation.ts : > + }) + } + } + + if ( e.name === &#39;whoMade&#39;) { + if (e.value === &#39;&#39;) { + setLocalErrors(prevErrors => ({ ...prevErrors, etsyListingWhoMade: true })) + } else { + setLocalErrors(prevErrors => { + const { etsyListingWhoMade, ...rest } = prevErrors + return rest + }) + } + } + + // Dodato za whenMade This comment can probably be removed In client/types/api/seller_profile.ts : > @@ -0,0 +1,13 @@ +type SellerProfileType = &#39;PAYMENT&#39; | &#39;RETURN_POLICY&#39; | &#39;SHIPPING&#39; + +export interface MarketSellerProfile { + id: number + marketAccountId: number + externalId: number This might also be a string some day In spec/requests/api/v5/common/market_seller_profiles_spec.rb : > + context &#39;when the profiles do not exist&#39; do + it &#39;responds with empty array&#39; do + get &quot;/api/v5/common/market_seller_profiles?market_account_id=#{ etsy_account.id }&quot;, **api_headers(user) + expect(json[:shipping_profiles]).to eql([]) + expect(response).to have_http_status(:ok) + end + end + end + + context &#39;when the account does not exist&#39; do + it &#39;responds with empty array&#39; do + get &quot;/api/v5/common/market_seller_profiles?market_account_id=does-not-exist&quot;, **api_headers(user) + expect(json[:message]).to eql(&quot;Market Account with ID: does-not-exist doesn&#39;t exist&quot;) + expect(response).to have_http_status(:not_found) + end + end I would add a test for when the market account belongs to another org (like you added in spec/requests/api/v4/bulk_update/market_seller_profiles_spec.rb ). You already coded this correctly as far as I can tell, but I like the extra security. — Reply to this email directly, view it on GitHub , or unsubscribe . You are receiving this because your review was requested. Message ID: <uprightlabs/lister/pull/10595/review/2918231301 @ github . com>

## Raw body (tamper-evident)

```
---------- Forwarded message ---------
From: Ian <notifications@github.com>
Date: Wed, Jun 11, 2025, 5:27 PM
Subject: Re: [uprightlabs/lister] [FEATURE] LI 4892 Market seller profiles
(PR #10595)
To: uprightlabs/lister <lister@noreply.github.com>
Cc: Jesse Daniel Brown <plasmatoid@gmail.com>, Review requested <
review_requested@noreply.github.com>


*@ianmdawson* approved this pull request.

This looks like it's on the right track to me, the code looks good to me 👍
-- Let me know if you want my eyes on it again after you make changes
------------------------------

In app/controllers/api/v5/common/market_seller_profiles_controller.rb
<https://github.com/uprightlabs/lister/pull/10595#discussion_r2140792196>:

> +    return_policies = return_policies.where(hidden: false) || [] if only_visible_param
+
+    return_policies = return_policies.order(name: :asc)
+    render json: {
+      shipping_profiles: shipping_profiles.as_json(only: [:id, :name,
:profile_type, :hidden, :default, :external_id]),
+      return_policies: return_policies.as_json(only: [:id, :name,
:profile_type, :hidden, :default, :external_id])
+    }
+  end
+
+  private
+
+  def market_account_id_param
+    params.require(:market_account_id)
+  end
+
+  def only_visible_param

Another minor suggestion:
⬇️ Suggested change

-  def only_visible_param
+  def show_only_visible?

------------------------------

In app/models/market_seller_profile.rb
<https://github.com/uprightlabs/lister/pull/10595#discussion_r2140801817>:

> +  def self.process_market_seller_profiles(market_account)
+    transaction do
+      process_market_seller_profiles_by_type(market_account, 'SHIPPING')
+      process_market_seller_profiles_by_type(market_account, 'RETURN_POLICY')
+    end
+  end
+
+  def self.process_market_seller_profiles_by_type(market_account, profile_type)
+    client = market_account.client
+    policies =
+      case profile_type
+      when 'SHIPPING'
+        client.fetch_shipping_profiles
+      when 'RETURN_POLICY'
+        client.fetch_raw_return_policies
+      end

Should this have an else case where an error is raised for invalid profile
type?
------------------------------

In client/routes/products_v4/listings/etsy/helpers/useLocalValidation.ts
<https://github.com/uprightlabs/lister/pull/10595#discussion_r2140822691>:

> +        })
+      }
+    }
+
+    if (e.name === 'whoMade') {
+      if (e.value === '') {
+        setLocalErrors(prevErrors => ({ ...prevErrors,
etsyListingWhoMade: true }))
+      } else {
+        setLocalErrors(prevErrors => {
+          const { etsyListingWhoMade, ...rest } = prevErrors
+          return rest
+        })
+      }
+    }
+
+    // Dodato za whenMade

This comment can probably be removed
------------------------------

In client/types/api/seller_profile.ts
<https://github.com/uprightlabs/lister/pull/10595#discussion_r2140846963>:

> @@ -0,0 +1,13 @@
+type SellerProfileType = 'PAYMENT' | 'RETURN_POLICY' | 'SHIPPING'
+
+export interface MarketSellerProfile {
+  id: number
+  marketAccountId: number
+  externalId: number

This might also be a string some day
------------------------------

In spec/requests/api/v5/common/market_seller_profiles_spec.rb
<https://github.com/uprightlabs/lister/pull/10595#discussion_r2140992286>:

> +    context 'when the profiles do not exist' do
+      it 'responds with empty array' do
+        get "/api/v5/common/market_seller_profiles?market_account_id=#{etsy_account.id}",
**api_headers(user)
+        expect(json[:shipping_profiles]).to eql([])
+        expect(response).to have_http_status(:ok)
+      end
+    end
+  end
+
+  context 'when the account does not exist' do
+    it 'responds with empty array' do
+      get "/api/v5/common/market_seller_profiles?market_account_id=does-not-exist",
**api_headers(user)
+      expect(json[:message]).to eql("Market Account with ID:
does-not-exist doesn't exist")
+      expect(response).to have_http_status(:not_found)
+    end
+  end

I would add a test for when the market account belongs to another org (like
you added in spec/requests/api/v4/bulk_update/market_seller_profiles_spec.rb).
You already coded this correctly as far as I can tell, but I like the extra
security.

—
Reply to this email directly, view it on GitHub
<https://github.com/uprightlabs/lister/pull/10595#pullrequestreview-2918231301>,
or unsubscribe
<https://github.com/notifications/unsubscribe-auth/BCWABISQ4KKFOG3JHKS6MAL3DCGM7AVCNFSM6AAAAAB7AUKUOOVHI2DSMVQWIX3LMV43YUDVNRWFEZLROVSXG5CSMV3GSZLXHMZDSMJYGIZTCMZQGE>
.
You are receiving this because your review was requested.Message ID:
<uprightlabs/lister/pull/10595/review/2918231301@github.com>


=== HTML PART ===
<div dir="auto"></div><br><div class="gmail_quote gmail_quote_container"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: <strong class="gmail_sendername" dir="auto">Ian</strong> <span dir="auto">&lt;<a href="mailto:notifications@github.com">notifications@github.com</a>&gt;</span><br>Date: Wed, Jun 11, 2025, 5:27 PM<br>Subject: Re: [uprightlabs/lister] [FEATURE] LI 4892 Market seller profiles (PR #10595)<br>To: uprightlabs/lister &lt;<a href="mailto:lister@noreply.github.com">lister@noreply.github.com</a>&gt;<br>Cc: Jesse Daniel Brown &lt;<a href="mailto:plasmatoid@gmail.com">plasmatoid@gmail.com</a>&gt;, Review requested &lt;<a href="mailto:review_requested@noreply.github.com">review_requested@noreply.github.com</a>&gt;<br></div><br><br><p></p>
<p><b>@ianmdawson</b> approved this pull request.</p>

<p dir="auto">This looks like it&#39;s on the right track to me, the code looks good to me 👍  -- Let me know if you want my eyes on it again after you make changes</p><hr>

<p>In <a href="https://github.com/uprightlabs/lister/pull/10595#discussion_r2140792196" target="_blank" rel="noreferrer">app/controllers/api/v5/common/market_seller_profiles_controller.rb</a>:</p>
<pre style="color:#555">&gt; +    return_policies = return_policies.where(hidden: false) || [] if only_visible_param
+
+    return_policies = return_policies.order(name: :asc)
+    render json: {
+      shipping_profiles: shipping_profiles.as_json(only: [:id, :name, :profile_type, :hidden, :default, :external_id]),
+      return_policies: return_policies.as_json(only: [:id, :name, :profile_type, :hidden, :default, :external_id])
+    }
+  end
+
+  private
+
+  def market_account_id_param
+    params.require(:market_account_id)
+  end
+
+  def only_visible_param
</pre>
<p dir="auto">Another minor suggestion:</p>
⬇️ Suggested change
<pre style="color:#555">-  def only_visible_param
+  def show_only_visible?
</pre>


<hr>

<p>In <a href="https://github.com/uprightlabs/lister/pull/10595#discussion_r2140801817" target="_blank" rel="noreferrer">app/models/market_seller_profile.rb</a>:</p>
<pre style="color:#555">&gt; +  def self.process_market_seller_profiles(market_account)
+    transaction do
+      process_market_seller_profiles_by_type(market_account, &#39;SHIPPING&#39;)
+      process_market_seller_profiles_by_type(market_account, &#39;RETURN_POLICY&#39;)
+    end
+  end
+
+  def self.process_market_seller_profiles_by_type(market_account, profile_type)
+    client = market_account.client
+    policies =
+      case profile_type
+      when &#39;SHIPPING&#39;
+        client.fetch_shipping_profiles
+      when &#39;RETURN_POLICY&#39;
+        client.fetch_raw_return_policies
+      end
</pre>
<p dir="auto">Should this have an else case where an error is raised for invalid profile type?</p>

<hr>

<p>In <a href="https://github.com/uprightlabs/lister/pull/10595#discussion_r2140822691" target="_blank" rel="noreferrer">client/routes/products_v4/listings/etsy/helpers/useLocalValidation.ts</a>:</p>
<pre style="color:#555">&gt; +        })
+      }
+    }
+
+    if (<a href="http://e.name" target="_blank" rel="noreferrer">e.name</a> === &#39;whoMade&#39;) {
+      if (e.value === &#39;&#39;) {
+        setLocalErrors(prevErrors =&gt; ({ ...prevErrors, etsyListingWhoMade: true }))
+      } else {
+        setLocalErrors(prevErrors =&gt; {
+          const { etsyListingWhoMade, ...rest } = prevErrors
+          return rest
+        })
+      }
+    }
+
+    // Dodato za whenMade
</pre>
<p dir="auto">This comment can probably be removed</p>

<hr>

<p>In <a href="https://github.com/uprightlabs/lister/pull/10595#discussion_r2140846963" target="_blank" rel="noreferrer">client/types/api/seller_profile.ts</a>:</p>
<pre style="color:#555">&gt; @@ -0,0 +1,13 @@
+type SellerProfileType = &#39;PAYMENT&#39; | &#39;RETURN_POLICY&#39; | &#39;SHIPPING&#39;
+
+export interface MarketSellerProfile {
+  id: number
+  marketAccountId: number
+  externalId: number
</pre>
<p dir="auto">This might also be a string some day</p>

<hr>

<p>In <a href="https://github.com/uprightlabs/lister/pull/10595#discussion_r2140992286" target="_blank" rel="noreferrer">spec/requests/api/v5/common/market_seller_profiles_spec.rb</a>:</p>
<pre style="color:#555">&gt; +    context &#39;when the profiles do not exist&#39; do
+      it &#39;responds with empty array&#39; do
+        get &quot;/api/v5/common/market_seller_profiles?market_account_id=#{<a href="http://etsy_account.id" target="_blank" rel="noreferrer">etsy_account.id</a>}&quot;, **api_headers(user)
+        expect(json[:shipping_profiles]).to eql([])
+        expect(response).to have_http_status(:ok)
+      end
+    end
+  end
+
+  context &#39;when the account does not exist&#39; do
+    it &#39;responds with empty array&#39; do
+      get &quot;/api/v5/common/market_seller_profiles?market_account_id=does-not-exist&quot;, **api_headers(user)
+      expect(json[:message]).to eql(&quot;Market Account with ID: does-not-exist doesn&#39;t exist&quot;)
+      expect(response).to have_http_status(:not_found)
+    end
+  end
</pre>
<p dir="auto">I would add a test for when the market account belongs to another org (like you added in <code class="notranslate">spec/requests/api/v4/bulk_update/market_seller_profiles_spec.rb</code>). You already coded this correctly as far as I can tell, but I like the extra security.</p>

<p style="font-size:small;color:#666">—<br>Reply to this email directly, <a href="https://github.com/uprightlabs/lister/pull/10595#pullrequestreview-2918231301" target="_blank" rel="noreferrer">view it on GitHub</a>, or <a href="https://github.com/notifications/unsubscribe-auth/BCWABISQ4KKFOG3JHKS6MAL3DCGM7AVCNFSM6AAAAAB7AUKUOOVHI2DSMVQWIX3LMV43YUDVNRWFEZLROVSXG5CSMV3GSZLXHMZDSMJYGIZTCMZQGE" target="_blank" rel="noreferrer">unsubscribe</a>.<br>You are receiving this because your review was requested.<img src="https://github.com/notifications/beacon/BCWABITWPHUVB7YTZGJ55NL3DCGM7A5CNFSM6AAAAAB7AUKUOOWGG33NNVSW45C7OR4XAZNRKB2WY3CSMVYXKZLTORJGK5TJMV32UY3PNVWWK3TUL5UWJTVN6CWQK.gif" height="1" width="1" alt=""><span style="color:transparent;font-size:0;display:none;overflow:hidden;opacity:0;width:0;height:0;max-width:0;max-height:0">Message ID: <span>&lt;uprightlabs/lister/pull/10595/review/2918231301</span><span>@</span><span>github</span><span>.</span><span>com&gt;</span></span></p>
</div>


```
