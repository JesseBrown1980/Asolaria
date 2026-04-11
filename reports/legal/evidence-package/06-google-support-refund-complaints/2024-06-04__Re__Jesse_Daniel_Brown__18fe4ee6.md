---
gmail_message_id: 18fe4ee6e02b9bfe
account: plasmatoid@gmail.com
date_header: Tue, 04 Jun 2024 13:26:12 -0700
from: henry.s@cinemaloop.co
to: Jesse Daniel Brown <plasmatoid@gmail.com>
subject: Re: Jesse Daniel Brown
body_sha256: b07e981e53ef62853f74e4a34d4a1db1b3967e06ee1da8dae259376e001b8ffd
snippet: Hi Jesse, Thank you for sending this and your patience. 1. I&#39;ve put some more thought into the idea of averaging the scores of multiple NLP models and right now my thinking is that this would not
---

# Re: Jesse Daniel Brown

**From:** henry.s@cinemaloop.co
**To:** Jesse Daniel Brown <plasmatoid@gmail.com>
**Date:** Tue, 04 Jun 2024 13:26:12 -0700
**SHA256:** `b07e981e53ef62853f74e4a34d4a1db1b3967e06ee1da8dae259376e001b8ffd`

## Body (extracted text)

Hi Jesse, Thank you for sending this and your patience. 1. I've put some more thought into the idea of averaging the scores of multiple NLP models and right now my thinking is that this would not work. Each model we consider is going to perform better or worse depending on how they've been trained and the type of toxicity we are trying to score. For example if we decided that Hatebase API was an NLP that we wanted to integrate with the Perspective API. _ Hi Henry, > > Thank you for your detailed feedback and for outlining the specifics. I > appreciate the insights and agree that handling toxicity effectively > requires a nuanced approach that takes context into account. > > Based on your feedback, here are some refined suggestions: > > * > > Multi-Model Sentiment Analysis: Given the limitations you've > encountered with a single API, you could implement a multi-model > approach. This involves running comments through multiple sentiment > analysis APIs (e.g., Google's Perspective API and an in-house NLP model > using NLTK or SpaCy) and aggregating the results to improve accuracy. > This hybrid approach could help mitigate false positives and negatives > by leveraging the strengths of each model. > > Example Implementation: > > python > > import requests def get_perspective_score(text, api_key): url = > "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" data > = { 'comment': {'text': text}, 'languages': ['en'], > 'requestedAttributes': {'TOXICITY': {}} } response = requests.post > [1](url, json=data, headers={"Authorization": f"Bearer {api_key}"}) > return response.json() def get_custom_nlp_score(text): # Placeholder > for custom NLP analysis logic return {"toxicity": 0.5} comment = "I > hate you!" perspective_score = get_perspective_score(comment, > "YOUR_PERSPECTIVE_API_KEY") custom_score = > get_custom_nlp_score(comment) # Aggregate scores combined_score = > (perspective_score['attributeScores']['TOXICITY']['summaryScore']['value'] > + custom_score['toxicity']) / 2 print(f"Combined toxicity score: > {combined_score}") > * > > Contextual Analysis with LLMs: Leveraging large language models (LLMs) > like GPT-4 can help in understanding the context of comments. By > integrating data from movie databases (e.g., TMDb) and thread > histories, we can provide the model with the necessary context to > accurately interpret comments. > > Implementation Steps: > > * Use APIs to fetch context (e.g., movie quotes from TMDb). > * Pass both the comment and context to an LLM for analysis. > > * > > Real-Time Monitoring and User Interaction Metrics: Implementing > real-time monitoring tools can help detect toxic patterns quickly. We > could use a combination of machine learning and heuristic rules to flag > potentially problematic threads for closer monitoring. > > Example Heuristic Rule: > > yaml > > rules: - name: "Monitor high-activity threads" condition: thread: > activity: "high" sentiment: "mixed" action: flag message: "This thread > is being monitored due to high activity and mixed sentiment." > * > > Social Engineering and User Behavior Modification: Exploring social > engineering techniques, such as displaying toxicity scores in > real-time, could encourage self-moderation. We could run A/B tests to > measure the impact of such features on user behavior. > > Example Implementation: > > python > > def display_toxicity_warning(score): if score > 0.4: print("Warning: > Your comment is being flagged for high toxicity. Please reconsider your > wording.") > > Incorporating elements like gender ratio balance can also contribute to > a healthier community dynamic, similar to Bumble's approach in dating > contexts. > * > > Platform-Level Interventions: Implementing platform-wide policies that > discourage toxic behavior and promote positive interactions. This could > include rewards for positive contributions and stricter penalties for > repeated violations. > > I believe these approaches, combined with continuous iteration and user > feedback, can significantly improve toxicity management on the site. > I'm looking forward to discussing these ideas further and exploring how > we can implement them effectively. > > Jesse > > On Wed, May 22, 2024 at 5:11 PM wrote: > > Hi Jesse, > > Sorry it's been a very busy lately. I have some comments I can give on > all of your ideas but it's going to be next week I think before things > settle down. However, on NLP that's what the perspective API is. I've > considered running more than one sentiment analyzer because I've found > cases, where for example Google's paid NLP service does better than > Perspective, but it's all very case-by-case and it seems to me it > wouldn't really solve the problem adequately. I haven't looked at NLTK > or SpaCy but at this stage I'm not expecting anyones NLP to perform as > well as I would like. Part of the issue is context. In the context of > a discussion a users input and how it should be interpreted in many > cases depends on what they are responding to and what happened earlier > in the thread. Similarly if someone is commenting on a horror film > some comments regarding violence might in that case be acceptable where > in other contexts they are not. This is something that the developers > for the perspective API mentioned that they were working on. Right > now I don't know of an out of the box solution that handles sentiment > in the context of a discussion thread or in the context of something > like a movie category. There are many lines from movies that if quoted > by someone on Cinemaloop would be flagged inappropriately. For > example, if a Cinemaloop user says something like "I can't believe > Allison says "You're either a prude or a slut". This is ok, because > Allison is a character from the movie and this is line she said in the > movie The Breakfast Club. If I send this to the Perspective API, it > comes back 83% it's toxic. > > { > "begin": 0, > "end": 61, > "score": { > "value": 0.8364697, > "type": "PROBABILITY" > } > } > ], > "summaryScore": { > "value": 0.8364697, > "type": "PROBABILITY" > } > > A large language model that's consuming the data passed to us about > said movie from the moviedb and other sources to would be needed could > figure out that this user is commenting on the character Allison but as > of now we'd get a false positive. Yep TensorFlow & PyTorch, large > language models generally have promise. For sure it would be great if > we could customize it for our user base and various contexts it would > solve for exactly the examples I gave. However, this would require an > entire team with the expertise to build & maintain it. This comes back > to the solution needing to be easy. On user interaction metrics that > will happen just by virtue of having each exchange rated by the > perspective API. We'll start building reporting on this as soon as we > get our MVP features finished. > > "TOXICITY": {}, > > "SEVERE_TOXICITY": {}, > "IDENTITY_ATTACK": {}, > "INSULT": {}, > "PROFANITY": {}, > "THREAT": {}, > "SEXUALLY_EXPLICIT": {}, > "FLIRTATION": {} > > We'll look at other ways we can do analysis too. > > I want to also mention that recently I had platform access to the app > Nextdoor's reported posts and the threads that these reports came from. > What I observed about their effort to handle toxicity was that when it > worked "which wasn't very often" it was too slow. If a user makes a > highly toxic post it doesn't take longer than a few min for an entire > thread to turn into a dumpster fire if it happens to be one that people > are active on. Even if the post is removed relatively quickly the > damage is done. These kind of comments trigger more toxic comments. > My feeling also after seeing what was happening there is that some > categories of posts were highly likely to become problematic even if > they are started with good intentions. I also observed a pattern, > things would start positive, then factions would divide and as lines in > the sand were drawn the thread became a detriment to the platform. For > sure I think there are things we could do to keep an eye on threads > that demonstrate this arch but this would require LLM & data scientist > inputs. Regardless, my point still is that we need something that's as > close to realtime as possible. > > I want to add that social engineering is something that we need to > consider and should be willing to be creative about too. I.e. Bumble > requiring women to make the first move in Bumbles dating context. I > think things like this can help, but also we can do things at a > platform level. https://www.youtube.com/watch?v=x3lypVnJ0HM this simulation through to the end. While we aren't a dating app > "maybe a side hustle in the future" my feeling is that this problem can > affect every social media platform. So if we focus on acquiring women > and take steps to keep the gender ratio as equal as we can it will also > help us with toxicity for everyone on the platform. The perspective > api also provides for the option to do some social engineering. I > don't really know how people will respond to seeing their toxicity > score indicated as they type if they pass let's say the 40% threshold, > but it's worth at test to see what the impact is on self moderation. > Anyway, I'll try to get back to you on the other stuff you brought up > by next week. Some of the items related to bot detection we have done > or have plans to do already. Now you know a little bit more about > where I'm coming from. > > Thanks! > > Henry > > On 2024-05-17 04:54, Jesse Daniel Brown wrote: > > Also, we have some different ideas about avenues of direction for the > platform. There are many ways to implement these though, so an idea > starts the conversation: > > CODING IMPLEMENTATIONS: > > * > > Natural Language Processing (NLP): > > * Use NLP libraries like NLTK or SpaCy to analyze and classify text. > * Implement sentiment analysis to detect negative sentiment. > > * > > Machine Learning Models: > > * Train models using frameworks like TensorFlow or PyTorch. > * Deploy models to automatically flag and filter out toxic content. > > * > > User Interaction Metrics: > > * Track user interactions and identify patterns associated with toxic > behavior. > * Use data analysis to adapt and improve moderation strategies. > > ADDITIONAL TOOLS: > > * Captcha Systems: > > * Use captchas to prevent automated spam and bot interactions.(This is > becoming less applicable due to agentic properties of the new crawl and > curl agents) > > * Rate Limiting: > > * Limit the number of posts/comments a user can make in a short period. > > On Fri, May 17, 2024 at 8:49 AM Jesse Daniel Brown > wrote: > Hello! > > 1. USER BEHAVIOR MONITORING: > > Example: Perspective API by Google > > * Implementation: > > * Use the Perspective API to analyze comments for toxicity. It assigns > a score to each comment based on the likelihood of it being perceived > as toxic. > * Integration: > python > > import requests def get_toxicity_score(text): url = > "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" data > = { 'comment': {'text': text}, 'languages': ['en'], > 'requestedAttributes': {'TOXICITY': {}} } response = requests.post > [1](url, json=data, headers={"Authorization": "Bearer API_KEY"}) return > response.json() comment = "I hate you!" score = > get_toxicity_score(comment) print(f"Toxicity score: {score}") > > * Outcome: > > * Comments with high toxicity scores are flagged for review or > automatically removed. > > 2. CONTENT MODERATION: > > Example: AutoMod in Reddit > > * Implementation: > > * AutoMod is a customizable bot used to enforce community guidelines by > automatically filtering posts and comments based on set rules. > * Integration: > yaml > > # Example AutoMod configuration for Reddit rules: - name: "Remove > offensive words" condition: comment: body (includes): > ["offensive_word1", "offensive_word2"] action: remove message: "Your > comment was removed due to the use of offensive language." - name: > "Limit post frequency" condition: user: post_frequency: "5 per hour" > action: remove message: "You are posting too frequently. Please slow > down." > > * Outcome: > > * Offensive comments are removed automatically, and users posting too > frequently are temporarily restricted. > > On Tue, May 14, 2024 at 7:48 PM wrote: > > Hi Jesse, > > Toxicity, if you want to look at this problem and tell me how you think > it can be effectively managed let me know. My feeling is that it's > going to be a combination of things, not just one solution. The key > criteria is that anything we do needs to be straight forward to > implement i.e. "easy", doesn't involve humans in the loop once > implemented unless the cops phone us up, and performant, this means > fast but also few if any FNs or FPs. We have our starting moves lined > up already, but this won't be a game that's won in just one or two > moves. Show me some moves you would make knowing where we are at > today. > > -H- > > On 2024-05-09 08:34, Jesse Daniel Brown wrote: > > Thanks for the feedback. > I would still be happy to help with the small tasks in the interim. > I will reach out in 6 months and see what your position is. > In the meantime, please let me know if you want any help or adice. > Would be happy to do it as a friend too. > Jesse > > On Thu, May 9, 2024 at 11:30 AM wrote: > > Hi Jesse, > > I'm not sure that YouTube video hit the way you thought it would with > me. We have practical problems that need to be solved right now and > anyone that I bring on to the team needs to be able to meet us where we > are. Honestly that means a fair amount of donkey work. i.e. fixing > bugs, removing friction points, hitting our registration conversion > rate target as well as finishing up the feature set we think we need to > make the product something people would want to come back to. There's > a direct line between this work, which is not far from being done, and > finding funding. For the near term this means developers writing their > own code albeit with the assistance of AI. I know what's coming with > AI but the fact is it's only an assist at the moment. This is > especially true for the one problem that keeps me up at night, platform > toxicity, though I have big hopes for improvements coming down the > pipeline. It was a good chat yesterday. It's always nice to discuss > Cinemaloop with someone that gets it, and I think you do. :) My > feeling is that you would be a better fit for Cinemaloop once we are > funded. At that point we'll be in a better position to reach for the > future. You have my email, feel free to check back with me in 6 to 12 > months. At that time we'll be in a much different place, AI will be > too. > > Thanks > > Henry > > On 2024-05-08 13:15, Jesse Daniel Brown wrote: > > Hello Henry, > > It was great to talk to you today. > I really like your idea of creating social networks and communities > based on the user and I really think you have potential! (great job so > far) > I thought you might really love this > https://www.youtube.com/watch?v=Zlgkzjndpak (really old version of > what exists today), but I think if you watch it, your mind will begin > to race with the possibilities. > Other than that, looking forward to talking to gerard? about future > work. > Let me know. > Jesse Links: ------ [1] http://requests.post === HTML PART === Hi Jesse, Thank you for sending this and your patience. 1. I've put some more thought into the idea of averaging the scores of multiple NLP models and right now my thinking is that this would not work. Each model we consider is going to perform better or worse depending on how they've been trained and the type of toxicity we are trying to score. For example if we decided that Hatebase API was an NLP that we wanted to integrate with the Perspective API. <&mdash; I&rsquo;m not proposing this but because it&rsquo;s no longer officially supported. Hatebase API just happens to fit nicely into an example type I&rsquo;d be looking for. I would suspect that one of the models is measurably more accurate in most cases than the other. Averaging them would only reduce the accuracy in the majority of cases. My best guess without having done any testing is that the Hatebase API was trained on data similar to what the Perspective API is categorizing as Identity_Attack. So, it we could test if it scores better then the Perspective API&rsquo;s Identity_Attack scoring. "IDENTITY_ATTACK" : {}, Hatebase API? So for this example consider Hatebase as an analog for any promising NLP model that covers a type of speech we might want to comparatively evaluate. We would need to start with AUC-ROC or maybe F1-score for both Perspective and the competing NLP. If we can determine that nine times out of ten the Hatebase API returns a more accurate toxicity score then Perspectives Identity_Attack scores, we could then choose to replace Perspectives Identity_Attack score with the normalized scores returned by Hatebase API. Of course we then except that one in every ten times we will get a less accurate score but this seems far better to me then diminishing the accuracy of both nine times out of ten by averaging or weighting the two against each other. It&rsquo;s ok to weight speech subcategories against each other or even exclude things like perspectives flirting score, but no averaging. With this approach effort is less coding and more about testing if we&rsquo;ve identified NLP candidates that meet requirements. Being able to return scores with a higher degree of accuracy on speech that Perspective already covers is an entry condition, cost is also factor. 2. Contextual Analysis with GPT-4 of course, but devil is in the details, how does this fit in with Perspective or does it even and what is the cost and burden on Development to maintain it. The cost of LLM API calls can add up quickly, and integrating such a model would require significant development effort. APIs for Context Fetching: Integrating multiple APIs (e.g., TMDb) adds complexity and potential costs. Each API call incurs latency, and handling failures or inconsistencies in data. Later if this becomes cheaper and easier or if we have the funding to create a team to handle this, but I think this is out of reach at the moment. That said maybe there&rsquo;s some budget version AI solution we can build, see below. 3. Heuristics <-- I'm not a big fan of this idea, too many false positives and false negatives. Yes there are some movies, movie people or post topics that we must be able to detect and handle differently. Handling differently means things like rate limiting posting or lower the threshold for providing user feedback on toxicity or making people jump through some addition hoops before they can post i.e. reminders to be nice, reminders that we are movie networking platform not a town hall for discussing politics etc, etc. To make context something we can use in a cost effective way I think we would need to build our own model, BERT being a possible candidate. Possibly contextual heuristics could be used as a first layer that helps us to decide what data to pass to a custom Cinemaloop BERT model. This could save money too. Here are the cases I think we&rsquo;d need to cover - a. Movies that might be problematic & toxic: We should be able to train on the data we will have in mongodb. This means if there are many posts with the same movie id that has a lot of toxic comments we should be consuming all the comments and comment threads with that same movie id, we should also be consuming the data we get back from the moviedb about that movie. We may need other data to possibly, maybe Internet Movie Script Database (IMSDb) or SimplyScripts. We should also be able to train on the moviedb info available for the cast and crew for said movies. It may not be the movie itself creating toxicity, it could be some member or members of the cast and crew. We should be looking at the ratio of toxic posts for each movie person id. The output of the model should be identifying films that might be high risk and label them such that we can automate a more risk averse posting experience for users when they engage on movies identified as high risk. So if for a real world example let&rsquo;s imagine that we trained our model on 2000 Mules &ldquo;a 2020 election conspiracy movie&rdquo; because we notice a stream of toxic conspiracy comments coming from Cinemaloop users. It could be that we find training data like this for movies that extol or denigrate the virtue of vaccines too. When we see movies with a lot of toxic posts we&rsquo;ll get a clearer picture of the types of movies we should be concerned about but more important the our model must be able to bucket movies into various problem themes and flag new movies matching problematic themes as soon as posts appear. When it&rsquo;s ready we could point the model at every post that comes in for a movie we haven&rsquo;t evaluated before. So if someone makes a post on Loose Change &ldquo;(2005) - A documentary that promotes conspiracy theories about the September 11 attacks, presumably posting something like &ldquo;This documentary finally reveals the truth about 9/11! The mainstream media won't tell you this, but Loose Change exposes the undeniable evidence of a government orchestrated attack.&rdquo; our model could flag it based on the movie theme and the post. We could then take automated steps like the ones I mentioned above that might help to limit the number of dumpster fires on the platform. This can also be very useful for blocking some movies completely. I've attached a screenshot. Note what I searched for in the upper right, then note the result in the lower right, Tokyo Train Girls. This is porn that hasn't been flagged correctly in the MovieDB. This will surely generate posting activity we don't want. This problem isn't going to go away because of the way the moviedb crowdsources their data. Last week there were two other JAV films that I went ahead and flagged. I corrected the data on the movidb side so those two movies don&rsquo;t show up anymore, but someone has since entered this latest one. We could use a similar mechanism to block movies like this from showing up in search results regardless of how it's been flagged in the moviedb. b. People that due to what's happening with them in the real world might be problematic: We should be able to train on the data we will have in mongodb. This means if there's a person id that has a lot of toxic comments already in mongodb we should be consuming training on the movie persons bio info, gender/age that we get from the moviedb. the issue here is that this isn't likely be enough. If you look up Harvey Weinstein or any other problematic movie person you won't find out the details you will need to understand that he's problematic so another data source might be needed. c. User posts that people might make unrelated to any specific movie: If similar to posts that spawned a toxic threads previously, we should flag the thread and provide a more risk avers posting experiance. This case cannot always be informed by Movie or Movie people contexts because posts within User Groups won&rsquo;t need to be linked to a movie or person. In this case we only have what&rsquo;s in mongo. This could include evaluating previous posts looking for themes once a problematic post is identified. It could also include consuming the user group bio, movie favs etc. Rinse & repeat. We should be able to train to id posts that are likely to turn toxic. 4. Social Engineering and User Behavior Modification: <&mdash; Yes we&rsquo;ll A/B test any changes we do here. 5. Platform-Level Interventions: <&mdash; I want to avoid ever needing to boot people but yes we&rsquo;ll have to do this from time-to-time. Rewarding positive posts is something we can do by up-ranking via the feed algorithm that I&rsquo;ve put forward. We&rsquo;ve not implemented this yet but we will. Right now I don&rsquo;t have the capacity to do more than number one. Having a clear path to two/three is I think the next step towards managing toxicity. Four and five, that&rsquo;s very straight forward stuff that we can tackle as a matter of course. I&rsquo;m very familiar with tactics used by hackers and authors of malware etc.. the Bumble idea on women making the first move for a dating app was clever. I am open to novel ideas like that on social engineering for Cinemaloop. If you have an idea that you haven&rsquo;t seen someone try before, maybe it&rsquo;s worth considering. ;) Thanks Henry On 2024-05-22 13:38, Jesse Daniel Brown wrote: Hi Henry, Thank you for your detailed feedback and for outlining the specifics. I appreciate the insights and agree that handling toxicity effectively requires a nuanced approach that takes context into account. Based on your feedback, here are some refined suggestions: Multi-Model Sentiment Analysis: Given the limitations you've encountered with a single API, you could implement a multi-model approach. This involves running comments through multiple sentiment analysis APIs (e.g., Google's Perspective API and an in-house NLP model using NLTK or SpaCy) and aggregating the results to improve accuracy. This hybrid approach could help mitigate false positives and negatives by leveraging the strengths of each model. Example Implementation: python import requests def get_perspective_score ( text, api_key ): url = " https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze " data = { 'comment' : { 'text' : text}, 'languages' : [ 'en' ], 'requestedAttributes' : { 'TOXICITY' : {}} } response = requests.post (url, json=data, headers={ "Authorization" : f"Bearer {api_key} " }) return response.json() def get_custom_nlp_score ( text ): # Placeholder for custom NLP analysis logic return { "toxicity" : 0.5 } comment = "I hate you!" perspective_score = get_perspective_score(comment, "YOUR_PERSPECTIVE_API_KEY" ) custom_score = get_custom_nlp_score(comment) # Aggregate scores combined_score = (perspective_score[ 'attributeScores' ][ 'TOXICITY' ][ 'summaryScore' ][ 'value' ] + custom_score[ 'toxicity' ]) / 2 print ( f"Combined toxicity score: {combined_score} " ) Contextual Analysis with LLMs: Leveraging large language models (LLMs) like GPT-4 can help in understanding the context of comments. By integrating data from movie databases (e.g., TMDb) and thread histories, we can provide the model with the necessary context to accurately interpret comments. Implementation Steps: Use APIs to fetch context (e.g., movie quotes from TMDb). Pass both the comment and context to an LLM for analysis. Real-Time Monitoring and User Interaction Metrics: Implementing real-time monitoring tools can help detect toxic patterns quickly. We could use a combination of machine learning and heuristic rules to flag potentially problematic threads for closer monitoring. Example Heuristic Rule: yaml rules: - name: "Monitor high-activity threads" condition: thread: activity: "high" sentiment: "mixed" action: flag message: "This thread is being monitored due to high activity and mixed sentiment." Social Engineering and User Behavior Modification: Exploring social engineering techniques, such as displaying toxicity scores in real-time, could encourage self-moderation. We could run A/B tests to measure the impact of such features on user behavior. Example Implementation: python def display_toxicity_warning ( score ): if score > 0.4 : print ( "Warning: Your comment is being flagged for high toxicity. Please reconsider your wording." ) Incorporating elements like gender ratio balance can also contribute to a healthier community dynamic, similar to Bumble's approach in dating contexts. Platform-Level Interventions: Implementing platform-wide policies that discourage toxic behavior and promote positive interactions. This could include rewards for positive contributions and stricter penalties for repeated violations. I believe these approaches, combined with continuous iteration and user feedback, can significantly improve toxicity management on the site. I'm looking forward to discussing these ideas further and exploring how we can implement them effectively. Jesse On Wed, May 22, 2024 at 5:11 PM < henry.s@cinemaloop.co > wrote: Hi Jesse, Sorry it's been a very busy lately. I have some comments I can give on all of your ideas but it's going to be next week I think before things settle down. However, on NLP that's what the perspective API is. I've considered running more than one sentiment analyzer because I've found cases, where for example Google's paid NLP service does better than Perspective, but it's all very case-by-case and it seems to me it wouldn't really solve the problem adequately. I haven't looked at NLTK or SpaCy but at this stage I'm not expecting anyones NLP to perform as well as I would like. Part of the issue is context. In the context of a discussion a users input and how it should be interpreted in many cases depends on what they are responding to and what happened earlier in the thread. Similarly if someone is commenting on a horror film some comments regarding violence might in that case be acceptable where in other contexts they are not. This is something that the developers for the perspective API mentioned that they were working on. Right now I don't know of an out of the box solution that handles sentiment in the context of a discussion thread or in the context of something like a movie category. There are many lines from movies that if quoted by someone on Cinemaloop would be flagged inappropriately. For example, if a Cinemaloop user says something like "I can't believe Allison says "You're either a prude or a slut". This is ok, because Allison is a character from the movie and this is line she said in the movie The Breakfast Club. If I send this to the Perspective API, it comes back 83% it's toxic. { "begin" : 0 , "end" : 61 , "score" : { "value" : 0.8364697 , "type" : "PROBABILITY" } } ], "summaryScore" : { "value" : 0.8364697 , "type" : "PROBABILITY" } A large language model that's consuming the data passed to us about said movie from the moviedb and other sources to would be needed could figure out that this user is commenting on the character Allison but as of now we'd get a false positive. Yep TensorFlow & PyTorch, large language models generally have promise. For sure it would be great if we could customize it for our user base and various contexts it would solve for exactly the examples I gave. However, this would require an entire team with the expertise to build & maintain it. This comes back to the solution needing to be easy. On user interaction metrics that will happen just by virtue of having each exchange rated by the perspective API. We'll start building reporting on this as soon as we get our MVP features finished. "TOXICITY" : {}, "SEVERE_TOXICITY" : {}, "IDENTITY_ATTACK" : {}, "INSULT" : {}, "PROFANITY" : {}, "THREAT" : {}, "SEXUALLY_EXPLICIT" : {}, "FLIRTATION" : {} We'll look at other ways we can do analysis too. I want to also mention that recently I had platform access to the app Nextdoor's reported posts and the threads that these reports came from. What I observed about their effort to handle toxicity was that when it worked "which wasn't very often" it was too slow. If a user makes a highly toxic post it doesn't take longer than a few min for an entire thread to turn into a dumpster fire if it happens to be one that people are active on. Even if the post is removed relatively quickly the damage is done. These kind of comments trigger more toxic comments. My feeling also after seeing what was happening there is that some categories of posts were highly likely to become problematic even if they are started with good intentions. I also observed a pattern, things would start positive, then factions would divide and as lines in the sand were drawn the thread became a detriment to the platform. For sure I think there are things we could do to keep an eye on threads that demonstrate this arch but this would require LLM & data scientist inputs. Regardless, my point still is that we need something that's as close to realtime as possible. I want to add that social engineering is something that we need to consider and should be willing to be creative about too. I.e. Bumble requiring women to make the first move in Bumbles dating context. I think things like this can help, but also we can do things at a platform level. https://www.youtube.com/watch?v=x3lypVnJ0HM <-- Watch this simulation through to the end. While we aren't a dating app "maybe a side hustle in the future" my feeling is that this problem can affect every social media platform. So if we focus on acquiring women and take steps to keep the gender ratio as equal as we can it will also help us with toxicity for everyone on the platform. The perspective api also provides for the option to do some social engineering. I don't really know how people will respond to seeing their toxicity score indicated as they type if they pass let's say the 40% threshold, but it's worth at test to see what the impact is on self moderation. Anyway, I'll try to get back to you on the other stuff you brought up by next week. Some of the items related to bot detection we have done or have plans to do already. Now you know a little bit more about where I'm coming from. Thanks! Henry On 2024-05-17 04:54, Jesse Daniel Brown wrote: Also, we have some different ideas about avenues of direction for the platform. There are many ways to implement these though, so an idea starts the conversation: Coding Implementations: Natural Language Processing (NLP): Use NLP libraries like NLTK or SpaCy to analyze and classify text. Implement sentiment analysis to detect negative sentiment. Machine Learning Models: Train models using frameworks like TensorFlow or PyTorch. Deploy models to automatically flag and filter out toxic content. User Interaction Metrics: Track user interactions and identify patterns associated with toxic behavior. Use data analysis to adapt and improve moderation strategies. Additional Tools: Captcha Systems: Use captchas to prevent automated spam and bot interactions.(This is becoming less applicable due to agentic properties of the new crawl and curl agents) Rate Limiting: Limit the number of posts/comments a user can make in a short period. On Fri, May 17, 2024 at 8:49 AM Jesse Daniel Brown < plasmatoid@gmail.com > wrote: Hello! 1. User Behavior Monitoring: Example: Perspective API by Google Implementation: Use the Perspective API to analyze comments for toxicity. It assigns a score to each comment based on the likelihood of it being perceived as toxic. Integration: python import requests def get_toxicity_score(text): url = " https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze " data = { 'comment': {'text': text}, 'languages': ['en'], 'requestedAttributes': {'TOXICITY': {}} } response = requests.post (url, json=data, headers={"Authorization": "Bearer API_KEY"}) return response.json() comment = "I hate you!" score = get_toxicity_score(comment) print(f"Toxicity score: {score}") Outcome: Comments with high toxicity scores are flagged for review or automatically removed. 2. Content Moderation: Example: AutoMod in Reddit Implementation: AutoMod is a customizable bot used to enforce community guidelines by automatically filtering posts and comments based on set rules. Integration: yaml # Example AutoMod configuration for Reddit rules: - name: "Remove offensive words" condition: comment: body (includes): ["offensive_word1", "offensive_word2"] action: remove message: "Your comment was removed due to the use of offensive language." - name: "Limit post frequency" condition: user: post_frequency: "5 per hour" action: remove message: "You are posting too frequently. Please slow down." Outcome: Offensive comments are removed automatically, and users posting too frequently are temporarily restricted. On Tue, May 14, 2024 at 7:48 PM < henry.s@cinemaloop.co > wrote: Hi Jesse, Toxicity, if you want to look at this problem and tell me how you think it can be effectively managed let me know. My feeling is that it's going to be a combination of things, not just one solution. The key criteria is that anything we do needs to be straight forward to implement i.e. "easy", doesn't involve humans in the loop once implemented unless the cops phone us up, and performant, this means fast but also few if any FNs or FPs. We have our starting moves lined up already, but this won't be a game that's won in just one or two moves. Show me some moves you would make knowing where we are at today. -H- On 2024-05-09 08:34, Jesse Daniel Brown wrote: Thanks for the feedback. I would still be happy to help with the small tasks in the interim. I will reach out in 6 months and see what your position is. In the meantime, please let me know if you want any help or adice. Would be happy to do it as a friend too. Jesse On Thu, May 9, 2024 at 11:30 AM < henry.s@cinemaloop.co > wrote: Hi Jesse, I'm not sure that YouTube video hit the way you thought it would with me. We have practical problems that need to be solved right now and anyone that I bring on to the team needs to be able to meet us where we are. Honestly that means a fair amount of donkey work. i.e. fixing bugs, removing friction points, hitting our registration conversion rate target as well as finishing up the feature set we think we need to make the product something people would want to come back to. There's a direct line between this work, which is not far from being done, and finding funding. For the near term this means developers writing their own code albeit with the assistance of AI. I know what's coming with AI but the fact is it's only an assist at the moment. This is especially true for the one problem that keeps me up at night, platform toxicity, though I have big hopes for improvements coming down the pipeline. It was a good chat yesterday. It's always nice to discuss Cinemaloop with someone that gets it, and I think you do. :) My feeling is that you would be a better fit for Cinemaloop once we are funded. At that point we'll be in a better position to reach for the future. You have my email, feel free to check back with me in 6 to 12 months. At that time we'll be in a much different place, AI will be too. Thanks Henry On 2024-05-08 13:15, Jesse Daniel Brown wrote: Hello Henry, It was great to talk to you today. I really like your idea of creating social networks and communities based on the user and I really think you have potential! (great job so far) I thought you might really love this https://www.youtube.com/watch?v=Zlgkzjndpak (really old version of what exists today), but I think if you watch it, your mind will begin to race with the possibilities. Other than that, looking forward to talking to gerard? about future work. Let me know. Jesse

## Raw body (tamper-evident)

```
Hi Jesse,

Thank you for sending this and your patience.

1. I've put some more thought into the idea of averaging the scores of 
multiple NLP models and right now my thinking is that this would not 
work.  Each model we consider is going to perform better or worse 
depending on how they've been trained and the type of toxicity we are 
trying to score.  For example if we decided that Hatebase API was an NLP 
that we wanted to integrate with the Perspective API.  _<-- I'm not 
proposing this but because it's no longer officially supported.  
Hatebase API just happens to fit nicely into an example type I'd be 
looking for.  _I would suspect that one of the models is measurably more 
accurate in most cases than the other.  Averaging them would only reduce 
the accuracy in the majority of cases.  My best guess without having 
done any testing is that the Hatebase API was trained on data similar to 
what the Perspective API is categorizing as Identity_Attack.  So, it we 
could test if it scores better then the Perspective API's 
Identity_Attack scoring.

     "IDENTITY_ATTACK": {},   Hatebase API?

So for this example consider Hatebase as an analog for any promising NLP 
model that covers a type of speech we might want to comparatively 
evaluate.   We would need to start with AUC-ROC or maybe F1-score for 
both Perspective and the competing NLP.   If we can determine that nine 
times out of ten the Hatebase API returns a more accurate toxicity score 
then Perspectives Identity_Attack scores, we could then choose to 
replace Perspectives Identity_Attack score with the normalized scores 
returned by Hatebase API.

Of course we then except that one in every ten times we will get a less 
accurate score but this seems far better to me then diminishing the 
accuracy of both nine times out of ten by averaging or weighting the two 
against each other.  It's ok to weight speech subcategories against each 
other or even exclude things like perspectives flirting score, but no 
averaging.

With this approach effort is less coding and more about testing if we've 
identified NLP candidates that meet requirements. Being able to return 
scores with a higher degree of accuracy on speech that Perspective 
already covers is an entry condition, cost is also factor.

2. Contextual Analysis with GPT-4 of course, but devil is in the 
details, how does this fit in with Perspective or does it even and what 
is the cost and burden on Development to maintain it.   The cost of LLM 
API calls can add up quickly, and integrating such a model would require 
significant development effort.  APIs for Context Fetching: Integrating 
multiple APIs (e.g., TMDb) adds complexity and potential costs.  Each 
API call incurs latency, and handling failures or inconsistencies in 
data.  Later if this becomes cheaper and easier or if we have the 
funding to create a team to handle this, but I think this is out of 
reach at the moment.  That said maybe there's some budget version AI 
solution we can build, see below.

3. Heuristics <-- I'm not a big fan of this idea, too many false 
positives and false negatives.

Yes there are some movies, movie people or post topics that we must be 
able to detect and handle differently.  Handling differently means 
things like rate limiting posting or lower the threshold for providing 
user feedback on toxicity or making people jump through some addition 
hoops before they can post i.e. reminders to be nice, reminders that we 
are movie networking platform not a town hall for discussing politics 
etc, etc.  To make context something we can use in a cost effective way 
I think we would need to build our own model, BERT being a possible 
candidate.   Possibly contextual heuristics could be used as a first 
layer that helps us to decide what data to pass to a custom Cinemaloop 
BERT model.  This could save money too.

Here are the cases I think we'd need to cover -

a. Movies that might be problematic & toxic:

We should be able to train on the data we will have in mongodb.  This 
means if there are many posts with the same movie id that has a lot of 
toxic comments we should be consuming all the comments and comment 
threads with that same movie id, we should also be consuming the data we 
get back from the moviedb about that movie.  We may need other data to 
possibly, maybe Internet Movie Script Database (IMSDb) or SimplyScripts. 
  We should also be able to train on the moviedb info available for the 
cast and crew for said movies.  It may not be the movie itself creating 
toxicity, it could be some member or members of the cast and crew.  We 
should be looking at the ratio of toxic posts for each movie person id.  
The output of the model should be identifying  films that might be high 
risk and label them such that we can automate a more risk averse posting 
experience for users when they engage on movies identified as high risk.

So if for a real world example let's imagine that we trained our model 
on 2000 Mules "a 2020 election conspiracy movie" because we notice a 
stream of toxic conspiracy comments coming from Cinemaloop users.  It 
could be that we find training data like this for movies that extol or 
denigrate the virtue of vaccines too.  When we see movies with a lot of 
toxic posts we'll get a clearer picture of the types of movies we should 
be concerned about but more important the our model must be able to 
bucket movies into various problem themes and flag new movies matching 
problematic themes as soon as posts appear.  When it's ready we could 
point the model at every post that comes in for a movie we haven't 
evaluated before.  So if someone makes a post on Loose Change "(2005) - 
A documentary that promotes conspiracy theories about the September 11 
attacks, presumably posting something like _"This documentary finally 
reveals the truth about 9/11! The mainstream media won't tell you this, 
but Loose Change exposes the undeniable evidence of a government 
orchestrated attack."_ our model could flag it based on the movie theme 
and the post.  We could then take automated steps like the ones I 
mentioned above that might help to limit the number of dumpster fires on 
the platform.

This can also be very useful for blocking some movies completely.  I've 
attached a screenshot.  Note what I searched for in the upper right, 
then note the result in the lower right, Tokyo Train Girls.  This is 
porn that hasn't been flagged correctly in the MovieDB.  This will 
surely generate posting activity we don't want.  This problem isn't 
going to go away because of the way the moviedb crowdsources their data. 
  Last week there were two other JAV films that I went ahead and flagged. 
  I corrected the data on the movidb side so those two movies don't show 
up anymore, but someone has since entered this latest one.  We could use 
a similar mechanism to block movies like this from showing up in search 
results regardless of how it's been flagged in the moviedb.

b. People that due to what's happening with them in the real world might 
be problematic:

  	* We should be able to train on the data we will have in mongodb.  
This means if there's a person id that has a lot of toxic comments 
already in mongodb we should be consuming training on the movie persons 
bio info, gender/age that we get from the moviedb.  the issue here is 
that this isn't likely be enough.  If you look up Harvey Weinstein or 
any other problematic movie person you won't find out the details you 
will need to understand that he's problematic so another data source 
might be needed.

c. User posts that people might make unrelated to any specific movie:

If similar to posts that spawned a toxic threads previously, we should 
flag the thread and provide a more risk avers posting experiance.  This 
case cannot always be informed by Movie or Movie people contexts because 
posts within User Groups won't need to be linked to a movie or person.  
In this case we only have what's in mongo.  This could include 
evaluating previous posts looking for themes once a problematic post is 
identified.  It could also include consuming the user group bio, movie 
favs etc.

  	* Rinse & repeat.  We should be able to train to id posts that are 
likely to turn toxic.

4. Social Engineering and User Behavior Modification: <-- Yes we'll A/B 
test any changes we do here.

5. Platform-Level Interventions: <-- I want to avoid ever needing to 
boot people but yes we'll have to do this from time-to-time.  Rewarding 
positive posts is something we can do by up-ranking via the feed 
algorithm that I've put forward.  We've not implemented this yet but we 
will.

Right now I don't have the capacity to do more than number one.  Having 
a clear path to two/three is I think the next step towards managing 
toxicity.  Four and five, that's very straight forward stuff that we can 
tackle as a matter of course.  I'm very familiar with tactics used by 
hackers and authors of malware etc.. the Bumble idea on women making the 
first move for a dating app was clever.  I am open to novel ideas like 
that on social engineering for Cinemaloop.  If you have an idea that you 
haven't seen someone try before, maybe it's worth considering.  ;)

Thanks

Henry

On 2024-05-22 13:38, Jesse Daniel Brown wrote:

> Hi Henry,
> 
> Thank you for your detailed feedback and for outlining the specifics. I 
> appreciate the insights and agree that handling toxicity effectively 
> requires a nuanced approach that takes context into account.
> 
> Based on your feedback, here are some refined suggestions:
> 
> *
> 
> Multi-Model Sentiment Analysis: Given the limitations you've 
> encountered with a single API, you could implement a multi-model 
> approach. This involves running comments through multiple sentiment 
> analysis APIs (e.g., Google's Perspective API and an in-house NLP model 
> using NLTK or SpaCy) and aggregating the results to improve accuracy. 
> This hybrid approach could help mitigate false positives and negatives 
> by leveraging the strengths of each model.
> 
> Example Implementation:
> 
> python
> 
> import requests def get_perspective_score(text, api_key): url = 
> "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" data 
> = { 'comment': {'text': text}, 'languages': ['en'], 
> 'requestedAttributes': {'TOXICITY': {}} } response = requests.post 
> [1](url, json=data, headers={"Authorization": f"Bearer {api_key}"}) 
> return response.json() def get_custom_nlp_score(text): # Placeholder 
> for custom NLP analysis logic return {"toxicity": 0.5} comment = "I 
> hate you!" perspective_score = get_perspective_score(comment, 
> "YOUR_PERSPECTIVE_API_KEY") custom_score = 
> get_custom_nlp_score(comment) # Aggregate scores combined_score = 
> (perspective_score['attributeScores']['TOXICITY']['summaryScore']['value'] 
> + custom_score['toxicity']) / 2 print(f"Combined toxicity score: 
> {combined_score}")
> *
> 
> Contextual Analysis with LLMs: Leveraging large language models (LLMs) 
> like GPT-4 can help in understanding the context of comments. By 
> integrating data from movie databases (e.g., TMDb) and thread 
> histories, we can provide the model with the necessary context to 
> accurately interpret comments.
> 
> Implementation Steps:
> 
> * Use APIs to fetch context (e.g., movie quotes from TMDb).
> * Pass both the comment and context to an LLM for analysis.
> 
> *
> 
> Real-Time Monitoring and User Interaction Metrics: Implementing 
> real-time monitoring tools can help detect toxic patterns quickly. We 
> could use a combination of machine learning and heuristic rules to flag 
> potentially problematic threads for closer monitoring.
> 
> Example Heuristic Rule:
> 
> yaml
> 
> rules: - name: "Monitor high-activity threads" condition: thread: 
> activity: "high" sentiment: "mixed" action: flag message: "This thread 
> is being monitored due to high activity and mixed sentiment."
> *
> 
> Social Engineering and User Behavior Modification: Exploring social 
> engineering techniques, such as displaying toxicity scores in 
> real-time, could encourage self-moderation. We could run A/B tests to 
> measure the impact of such features on user behavior.
> 
> Example Implementation:
> 
> python
> 
> def display_toxicity_warning(score): if score > 0.4: print("Warning: 
> Your comment is being flagged for high toxicity. Please reconsider your 
> wording.")
> 
> Incorporating elements like gender ratio balance can also contribute to 
> a healthier community dynamic, similar to Bumble's approach in dating 
> contexts.
> *
> 
> Platform-Level Interventions: Implementing platform-wide policies that 
> discourage toxic behavior and promote positive interactions. This could 
> include rewards for positive contributions and stricter penalties for 
> repeated violations.
> 
> I believe these approaches, combined with continuous iteration and user 
> feedback, can significantly improve toxicity management on the site. 
> I'm looking forward to discussing these ideas further and exploring how 
> we can implement them effectively.
> 
> Jesse
> 
> On Wed, May 22, 2024 at 5:11 PM <henry.s@cinemaloop.co> wrote:
> 
> Hi Jesse,
> 
> Sorry it's been a very busy lately.  I have some comments I can give on 
> all of your ideas but it's going to be next week I think before things 
> settle down.  However, on NLP that's what the perspective API is.  I've 
> considered running more than one sentiment analyzer because I've found 
> cases, where for example Google's paid NLP service does better than 
> Perspective, but it's all very case-by-case and it seems to me it 
> wouldn't really solve the problem adequately.  I haven't looked at NLTK 
> or SpaCy but at this stage I'm not expecting anyones NLP to perform as 
> well as I would like.  Part of the issue is context. In the context of 
> a discussion a users input and how it should be interpreted in many 
> cases depends on what they are responding to and what happened earlier 
> in the thread.  Similarly if someone is commenting on a horror film 
> some comments regarding violence might in that case be acceptable where 
> in other contexts they are not.  This is something that the developers 
> for the perspective API mentioned that they were working on.   Right 
> now I don't know of an out of the box solution that handles sentiment 
> in the context of a discussion thread or in the context of something 
> like a movie category.  There are many lines from movies that if quoted 
> by someone on Cinemaloop would be flagged inappropriately.  For 
> example, if a Cinemaloop user says something like "I can't believe 
> Allison says "You're either a prude or a slut".  This is ok, because 
> Allison is a character from the movie and this is line she said in the 
> movie The Breakfast Club.  If I send this to the Perspective API, it 
> comes back 83% it's toxic.
> 
> {
> "begin": 0,
> "end": 61,
> "score": {
> "value": 0.8364697,
> "type": "PROBABILITY"
> }
> }
> ],
> "summaryScore": {
> "value": 0.8364697,
> "type": "PROBABILITY"
> }
> 
> A large language model that's consuming the data passed to us about 
> said movie from the moviedb and other sources to would be needed could 
> figure out that this user is commenting on the character Allison but as 
> of now we'd get a false positive.  Yep TensorFlow & PyTorch, large 
> language models generally have promise.  For sure it would be great if 
> we could customize it for our user base and various contexts it would 
> solve for exactly the examples I gave.  However, this would require an 
> entire team with the expertise to build & maintain it.  This comes back 
> to the solution needing to be easy.  On user interaction metrics that 
> will happen just by virtue of having each exchange rated by the 
> perspective API.  We'll start building reporting on this as soon as we 
> get our MVP features finished.
> 
> "TOXICITY": {},
> 
> "SEVERE_TOXICITY": {},
> "IDENTITY_ATTACK": {},
> "INSULT": {},
> "PROFANITY": {},
> "THREAT": {},
> "SEXUALLY_EXPLICIT": {},
> "FLIRTATION": {}
> 
> We'll look at other ways we can do analysis too.
> 
> I want to also mention that recently I had platform access to the app 
> Nextdoor's reported posts and the threads that these reports came from. 
>  What I observed about their effort to handle toxicity was that when it 
> worked "which wasn't very often" it was too slow.  If a user makes a 
> highly toxic post it doesn't take longer than a few min for an entire 
> thread to turn into a dumpster fire if it happens to be one that people 
> are active on.  Even if the post is removed relatively quickly the 
> damage is done.  These kind of comments trigger more toxic comments.  
> My feeling also after seeing what was happening there is that some 
> categories of posts were highly likely to become problematic even if 
> they are started with good intentions.  I also observed a pattern, 
> things would start positive, then factions would divide and as lines in 
> the sand were drawn the thread became a detriment to the platform.  For 
> sure I think there are things we could do to keep an eye on threads 
> that demonstrate this arch but this would require LLM & data scientist 
> inputs. Regardless, my point still is that we need something that's as 
> close to realtime as possible.
> 
> I want to add that social engineering is something that we need to 
> consider and should be willing to be creative about too.  I.e. Bumble 
> requiring women to make the first move in Bumbles dating context.  I 
> think things like this can help, but also we can do things at a 
> platform level.  https://www.youtube.com/watch?v=x3lypVnJ0HM  <-- Watch 
> this simulation through to the end.  While we aren't a dating app 
> "maybe a side hustle in the future" my feeling is that this problem can 
> affect every social media platform.  So if we focus on acquiring women 
> and take steps to keep the gender ratio as equal as we can it will also 
> help us with toxicity for everyone on the platform.  The perspective 
> api also provides for the option to do some social engineering.  I 
> don't really know how people will respond to seeing their toxicity 
> score indicated as they type if they pass let's say the 40% threshold, 
> but it's worth at test to see what the impact is on self moderation.  
> Anyway, I'll try to get back to you on the other stuff you brought up 
> by next week.  Some of the items related to bot detection we have done 
> or have plans to do already.  Now you know a little bit more about 
> where I'm coming from.
> 
> Thanks!
> 
> Henry
> 
> On 2024-05-17 04:54, Jesse Daniel Brown wrote:
> 
> Also, we have some different ideas about avenues of direction for the 
> platform. There are many ways to implement these though, so an idea 
> starts the conversation:
> 
> CODING IMPLEMENTATIONS:
> 
> *
> 
> Natural Language Processing (NLP):
> 
> * Use NLP libraries like NLTK or SpaCy to analyze and classify text.
> * Implement sentiment analysis to detect negative sentiment.
> 
> *
> 
> Machine Learning Models:
> 
> * Train models using frameworks like TensorFlow or PyTorch.
> * Deploy models to automatically flag and filter out toxic content.
> 
> *
> 
> User Interaction Metrics:
> 
> * Track user interactions and identify patterns associated with toxic 
> behavior.
> * Use data analysis to adapt and improve moderation strategies.
> 
> ADDITIONAL TOOLS:
> 
> * Captcha Systems:
> 
> * Use captchas to prevent automated spam and bot interactions.(This is 
> becoming less applicable due to agentic properties of the new crawl and 
> curl agents)
> 
> * Rate Limiting:
> 
> * Limit the number of posts/comments a user can make in a short period.
> 
> On Fri, May 17, 2024 at 8:49 AM Jesse Daniel Brown 
> <plasmatoid@gmail.com> wrote:
> Hello!
> 
> 1. USER BEHAVIOR MONITORING:
> 
> Example: Perspective API by Google
> 
> * Implementation:
> 
> * Use the Perspective API to analyze comments for toxicity. It assigns 
> a score to each comment based on the likelihood of it being perceived 
> as toxic.
> * Integration:
> python
> 
> import requests def get_toxicity_score(text): url = 
> "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" data 
> = { 'comment': {'text': text}, 'languages': ['en'], 
> 'requestedAttributes': {'TOXICITY': {}} } response = requests.post 
> [1](url, json=data, headers={"Authorization": "Bearer API_KEY"}) return 
> response.json() comment = "I hate you!" score = 
> get_toxicity_score(comment) print(f"Toxicity score: {score}")
> 
> * Outcome:
> 
> * Comments with high toxicity scores are flagged for review or 
> automatically removed.
> 
> 2. CONTENT MODERATION:
> 
> Example: AutoMod in Reddit
> 
> * Implementation:
> 
> * AutoMod is a customizable bot used to enforce community guidelines by 
> automatically filtering posts and comments based on set rules.
> * Integration:
> yaml
> 
> # Example AutoMod configuration for Reddit rules: - name: "Remove 
> offensive words" condition: comment: body (includes): 
> ["offensive_word1", "offensive_word2"] action: remove message: "Your 
> comment was removed due to the use of offensive language." - name: 
> "Limit post frequency" condition: user: post_frequency: "5 per hour" 
> action: remove message: "You are posting too frequently. Please slow 
> down."
> 
> * Outcome:
> 
> * Offensive comments are removed automatically, and users posting too 
> frequently are temporarily restricted.
> 
> On Tue, May 14, 2024 at 7:48 PM <henry.s@cinemaloop.co> wrote:
> 
> Hi Jesse,
> 
> Toxicity, if you want to look at this problem and tell me how you think 
> it can be effectively managed let me know.  My feeling is that it's 
> going to be a combination of things, not just one solution.  The key 
> criteria is that anything we do needs to be straight forward to 
> implement i.e. "easy", doesn't involve humans in the loop once 
> implemented unless the cops phone us up, and performant, this means 
> fast but also few if any FNs or FPs.  We have our starting moves lined 
> up already, but this won't be a game that's won in just one or two 
> moves.  Show me some moves you would make knowing where we are at 
> today.
> 
> -H-
> 
> On 2024-05-09 08:34, Jesse Daniel Brown wrote:
> 
> Thanks for the feedback.
> I would still be happy to help with the small tasks in the interim.
> I will reach out in 6 months and see what your position is.
> In the meantime, please let me know if you want any help or adice. 
> Would be happy to do it as a friend too.
> Jesse
> 
> On Thu, May 9, 2024 at 11:30 AM <henry.s@cinemaloop.co> wrote:
> 
> Hi Jesse,
> 
> I'm not sure that YouTube video hit the way you thought it would with 
> me.  We have practical problems that need to be solved right now and 
> anyone that I bring on to the team needs to be able to meet us where we 
> are.  Honestly that means a fair amount of donkey work.  i.e. fixing 
> bugs, removing friction points, hitting our registration conversion 
> rate target as well as finishing up the feature set we think we need to 
> make the product something people would want to come back to.  There's 
> a direct line between this work, which is not far from being done, and 
> finding funding.  For the near term this means developers writing their 
> own code albeit with the assistance of AI.  I know what's coming with 
> AI but the fact is it's only an assist at the moment.  This is 
> especially true for the one problem that keeps me up at night, platform 
> toxicity, though I have big hopes for improvements coming down the 
> pipeline.  It was a good chat yesterday.  It's always nice to discuss 
> Cinemaloop with someone that gets it, and I think you do.  :)  My 
> feeling is that you would be a better fit for Cinemaloop once we are 
> funded.  At that point we'll be in a better position to reach for the 
> future.  You have my email, feel free to check back with me in 6 to 12 
> months.  At that time we'll be in a much different place, AI will be 
> too.
> 
> Thanks
> 
> Henry
> 
> On 2024-05-08 13:15, Jesse Daniel Brown wrote:
> 
> Hello Henry,
> 
> It was great to talk to you today.
> I really like your idea of creating social networks and communities 
> based on the user and I really think you have potential! (great job so 
> far)
> I thought you might really love this 
> https://www.youtube.com/watch?v=Zlgkzjndpak  (really old version of 
> what exists today), but I think if you watch it, your mind will begin 
> to race with the possibilities.
> Other than that, looking forward to talking to gerard? about future 
> work.
> Let me know.
> Jesse


Links:
------
[1] http://requests.post

=== HTML PART ===
<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head><body style='font-size: 10pt; font-family: Verdana,Geneva,sans-serif'>
<p><span>Hi Jesse,</span></p>
<p><span>Thank you for sending this and your patience. &nbsp;</span></p>
<p><span>1. I've put some more thought into the idea of averaging the scores of multiple NLP models and right now my thinking is that this would not work. &nbsp;Each model we consider is going to perform better or worse depending on how they've been trained and the type of toxicity we are trying to score. &nbsp;For example if we decided that Hatebase API was an NLP that we wanted to integrate with the Perspective API.<span class="Apple-converted-space">&nbsp; </span><em>&lt;&mdash; I&rsquo;m not proposing this but because it&rsquo;s no longer officially supported.<span class="Apple-converted-space">&nbsp; </span>Hatebase API just happens to fit nicely into an example type I&rsquo;d be looking for.<span class="Apple-converted-space">&nbsp; </span></em>I would suspect that one of the models is measurably more accurate in most cases than the other. &nbsp;Averaging them would only reduce the accuracy in the majority of cases. &nbsp;My best guess without having done any testing is that the Hatebase API was trained on data similar to what the Perspective API is categorizing as Identity_Attack.<span class="Apple-converted-space">&nbsp; </span>So, it we could test if it scores better then the Perspective API&rsquo;s Identity_Attack scoring. <span class="Apple-converted-space">&nbsp;</span></span></p>
<p style="color: #900112;"><span style="color: #000000; background-color: #ffffff;"><span class="Apple-converted-space">&nbsp; &nbsp; </span></span><span style="background-color: #ffffff;">"IDENTITY_ATTACK"</span><span style="color: #000000; background-color: #ffffff;">: {}, <span class="Apple-converted-space">&nbsp; </span></span><span style="color: #0000ff;">Hatebase API?</span><span></span></p>
<p><span>So for this example consider Hatebase as an analog for any promising NLP model that covers a type of speech we might want to comparatively evaluate. <span class="Apple-converted-space">&nbsp; </span>We would need to start with AUC-ROC or maybe F1-score for both Perspective and the competing NLP. <span class="Apple-converted-space">&nbsp; </span>If we can determine that nine times out of ten the Hatebase API returns a more accurate toxicity score then Perspectives Identity_Attack scores, we could then choose to replace Perspectives Identity_Attack score with the normalized scores returned by Hatebase API.</span></p>
<p><span>Of course we then except that one in every ten times we will get a less accurate score but this seems far better to me then diminishing the accuracy of both nine times out of ten by averaging or weighting the two against each other.<span class="Apple-converted-space">&nbsp; </span>It&rsquo;s ok to weight speech subcategories against each other or even exclude things like perspectives flirting score, but no averaging. <span class="Apple-converted-space">&nbsp;</span></span></p>
<p><span>With this approach effort is less coding and more about testing if we&rsquo;ve identified NLP candidates that meet requirements. Being able to return scores with a higher degree of accuracy on speech that Perspective already covers is an entry condition, cost is also factor. <span class="Apple-converted-space">&nbsp;</span></span></p>
<p><span>2. Contextual Analysis with GPT-4 of course, but devil is in the details, how does this fit in with Perspective or does it even and what is the cost and burden on Development to maintain it. <span class="Apple-converted-space">&nbsp; </span>The cost of LLM API calls can add up quickly, and integrating such a model would require significant development effort.<span class="Apple-converted-space">&nbsp; </span>APIs for Context Fetching: Integrating multiple APIs (e.g., TMDb) adds complexity and potential costs.<span class="Apple-converted-space">&nbsp; </span>Each API call incurs latency, and handling failures or inconsistencies in data.<span class="Apple-converted-space">&nbsp; </span>Later if this becomes cheaper and easier or if we have the funding to create a team to handle this, but I think this is out of reach at the moment.<span class="Apple-converted-space">&nbsp; </span>That said maybe there&rsquo;s some budget version AI solution we can build, see below. <span class="Apple-converted-space">&nbsp;</span></span><span></span></p>
<p><span>3. Heuristics &lt;-- I'm not a big fan of this idea, too many false positives and false negatives. &nbsp;</span></p>
<p><span>Yes there are some movies, movie people or post topics that we must be able to detect and handle differently.<span class="Apple-converted-space">&nbsp; </span>Handling differently means things like rate limiting posting or lower the threshold for providing user feedback on toxicity or making people jump through some addition hoops before they can post i.e. reminders to be nice, reminders that we are movie networking platform not a town hall for discussing politics etc, etc.<span class="Apple-converted-space">&nbsp; </span>To make context something we can use in a cost effective way I think we would need to build our own model, BERT being a possible candidate.<span class="Apple-converted-space">&nbsp; </span>&nbsp;Possibly contextual heuristics could be used as a first layer that helps us to decide what data to pass to a custom Cinemaloop BERT model.<span class="Apple-converted-space">&nbsp; </span>This could save money too.</span><span></span></p>
<p><span>Here are the cases I think we&rsquo;d need to cover -</span></p>
<p><span style="text-decoration: underline;">a. Movies that might be problematic &amp; toxic:</span></p>
<p><span>We should be able to train on the data we will have in mongodb. &nbsp;This means if there are many posts with the same movie id that has a lot of toxic comments we should be consuming all the comments and comment threads with that same movie id, we should also be consuming the data we get back from the moviedb about that movie.<span class="Apple-converted-space">&nbsp; </span>We may need other data to possibly, maybe Internet Movie Script Database (IMSDb) or SimplyScripts. &nbsp;We should also be able to train on the moviedb info available for the cast and crew for said movies.<span class="Apple-converted-space">&nbsp; </span>It may not be the movie itself creating toxicity, it could be some member or members of the cast and crew.<span class="Apple-converted-space">&nbsp; </span>We should be looking at the ratio of toxic posts for each movie person id.<span class="Apple-converted-space">&nbsp; </span>The output of the model should be identifying<span class="Apple-converted-space">&nbsp; </span>films that might be high risk and label them such that we can automate a more risk averse posting experience for users when they engage on movies identified as high risk. <span class="Apple-converted-space">&nbsp;</span></span></p>
<p><br /></p>
<p><span>So if for a real world example let&rsquo;s imagine that we trained our model on 2000 Mules &ldquo;a 2020 election conspiracy movie&rdquo; because we notice a stream of toxic conspiracy comments coming from Cinemaloop users.<span class="Apple-converted-space">&nbsp; </span>It could be that we find training data like this for movies that extol or denigrate the virtue of vaccines too.<span class="Apple-converted-space">&nbsp; </span>When we see movies with a lot of toxic posts we&rsquo;ll get a clearer picture of the types of movies we should be concerned about but more important the our model must be able to bucket movies into various problem themes and flag new movies matching problematic themes as soon as posts appear.<span class="Apple-converted-space">&nbsp; </span>When it&rsquo;s ready we could point the model at every post that comes in for a movie we haven&rsquo;t evaluated before.<span class="Apple-converted-space">&nbsp; </span>So if someone makes a post on<strong> Loose Change </strong>&ldquo;(2005) - A documentary that promotes conspiracy theories about the September 11 attacks, presumably posting something like <em>&ldquo;This documentary finally reveals the truth about 9/11! The mainstream media won't tell you this, but Loose Change exposes the undeniable evidence of a government orchestrated attack.&rdquo;</em> our model could flag it based on the movie theme and the post.<span class="Apple-converted-space">&nbsp; </span>We could then take automated steps like the ones I mentioned above that might help to limit the number of dumpster fires on the platform. &nbsp;</span></p>
<p><br /></p>
<p><span>This can also be very useful for blocking some movies completely. &nbsp;I've attached a screenshot. &nbsp;Note what I searched for in the upper right, then note the result in the lower right, Tokyo Train Girls. &nbsp;This is porn that hasn't been flagged correctly in the MovieDB. &nbsp;This will surely generate posting activity we don't want. &nbsp;This problem isn't going to go away because of the way the moviedb crowdsources their data. &nbsp;Last week there were two other JAV films that I went ahead and flagged.<span class="Apple-converted-space">&nbsp; </span>I corrected the data on the movidb side so those two movies don&rsquo;t show up anymore, but someone has since entered this latest one. &nbsp;We could use a similar mechanism to block movies like this from showing up in search results regardless of how it's been flagged in the moviedb. &nbsp;</span></p>
<p><br /></p>
<p><span style="text-decoration: underline;">b. People that due to what's happening with them in the real world might be problematic:</span></p>
<ul>
<li><span>We should be able to train on the data we will have in mongodb. &nbsp;This means if there's a person id that has a lot of toxic comments already in mongodb we should be consuming training on the movie persons bio info, gender/age that we get from the moviedb. &nbsp;the issue here is that this isn't likely be enough. &nbsp;If you look up Harvey Weinstein or any other problematic movie person you won't find out the details you will need to understand that he's problematic so another data source might be needed.&nbsp;</span></li>
</ul>
<p><br /></p>
<p><span style="text-decoration: underline;">c. User posts that people might make unrelated to any specific movie:</span></p>
<p><span>If similar to posts that spawned a toxic threads previously, we should flag the thread and provide a more risk avers posting experiance.<span class="Apple-converted-space">&nbsp; </span>This case cannot always be informed by Movie or Movie people contexts because posts within User Groups won&rsquo;t need to be linked to a movie or person.<span class="Apple-converted-space">&nbsp; </span>In this case we only have what&rsquo;s in mongo.<span class="Apple-converted-space">&nbsp; </span>This could include evaluating previous posts looking for themes once a problematic post is identified. <span class="Apple-converted-space">&nbsp;It could also include consuming the user group bio, movie favs etc.</span></span></p>
<ul>
<li><span>Rinse &amp; repeat. &nbsp;We should be able to train to id posts that are likely to turn toxic. &nbsp;</span></li>
</ul>
<p><br /></p>
<p><span>4. Social Engineering and User Behavior Modification: &lt;&mdash; Yes we&rsquo;ll A/B test any changes we do here.<span class="Apple-converted-space">&nbsp;</span></span></p>
<p><br /></p>
<p><span>5. Platform-Level Interventions: &lt;&mdash; I want to avoid ever needing to boot people but yes we&rsquo;ll have to do this from time-to-time.<span class="Apple-converted-space">&nbsp; </span>Rewarding positive posts is something we can do by up-ranking via the feed algorithm that I&rsquo;ve put forward.<span class="Apple-converted-space">&nbsp; </span>We&rsquo;ve not implemented this yet but we will. <span class="Apple-converted-space">&nbsp;</span></span></p>
<p><br /></p>
<p><span>Right now I don&rsquo;t have the capacity to do more than number one.<span class="Apple-converted-space">&nbsp; </span>Having a clear path to two/three is I think the next step towards managing toxicity.<span class="Apple-converted-space">&nbsp; </span>Four and five, that&rsquo;s very straight forward stuff that we can tackle as a matter of course.<span class="Apple-converted-space">&nbsp; </span>I&rsquo;m very familiar with tactics used by hackers and authors of malware etc.. the Bumble idea on women making the first move for a dating app was clever.<span class="Apple-converted-space">&nbsp; </span>I am open to novel ideas like that on social engineering for Cinemaloop.<span class="Apple-converted-space">&nbsp; </span>If you have an idea that you haven&rsquo;t seen someone try before, maybe it&rsquo;s worth considering.<span class="Apple-converted-space">&nbsp; </span>;)</span><span></span></p>
<p><span>Thanks</span></p>
<p><br /></p>
<p><span>Henry</span></p>
<p id="v1reply-intro">On 2024-05-22 13:38, Jesse Daniel Brown wrote:</p>
<blockquote type="cite" style="padding: 0 0.4em; border-left: #1010ff 2px solid; margin: 0">
<div id="v1replybody1">
<div dir="ltr">
<p>Hi Henry,</p>
<p>Thank you for your detailed feedback and for outlining the specifics. I appreciate the insights and agree that handling toxicity effectively requires a nuanced approach that takes context into account.</p>
<p>Based on your feedback, here are some refined suggestions:</p>
<ol>
<li>
<p><strong>Multi-Model Sentiment Analysis:</strong> Given the limitations you've encountered with a single API, you could implement a multi-model approach. This involves running comments through multiple sentiment analysis APIs (e.g., Google's Perspective API and an in-house NLP model using NLTK or SpaCy) and aggregating the results to improve accuracy. This hybrid approach could help mitigate false positives and negatives by leveraging the strengths of each model.</p>
<p><strong>Example Implementation:</strong></p>
<div class="v1v1gmail-dark v1v1gmail-bg-gray-950 v1v1gmail-rounded-md v1v1gmail-border-[0.5px] v1v1gmail-border-token-border-medium">
<div class="v1v1gmail-flex v1v1gmail-items-center v1v1gmail-relative v1v1gmail-text-token-text-secondary v1v1gmail-bg-token-main-surface-secondary v1v1gmail-px-4 v1v1gmail-py-2 v1v1gmail-text-xs v1v1gmail-font-sans v1v1gmail-justify-between v1v1gmail-rounded-t-md">python
<div class="v1v1gmail-flex v1v1gmail-items-center">&nbsp;</div>
</div>
<div class="v1v1gmail-overflow-y-auto v1v1gmail-p-4 v1v1gmail-text-left v1v1gmail-undefined" dir="ltr"><code class="v1v1gmail-!whitespace-pre v1v1gmail-hljs v1v1gmail-language-python"><span class="v1v1gmail-hljs-keyword">import</span> requests

<span class="v1v1gmail-hljs-keyword">def</span> <span class="v1v1gmail-hljs-title v1v1gmail-function_">get_perspective_score</span>(<span class="v1v1gmail-hljs-params">text, api_key</span>):
    url = <span class="v1v1gmail-hljs-string">"<a href="https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" target="_blank" rel="noopener noreferrer">https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze</a>"</span>
    data = {
        <span class="v1v1gmail-hljs-string">'comment'</span>: {<span class="v1v1gmail-hljs-string">'text'</span>: text},
        <span class="v1v1gmail-hljs-string">'languages'</span>: [<span class="v1v1gmail-hljs-string">'en'</span>],
        <span class="v1v1gmail-hljs-string">'requestedAttributes'</span>: {<span class="v1v1gmail-hljs-string">'TOXICITY'</span>: {}}
    }
    response = <a href="http://requests.post" target="_blank" rel="noopener noreferrer">requests.post</a>(url, json=data, headers={<span class="v1v1gmail-hljs-string">"Authorization"</span>: <span class="v1v1gmail-hljs-string">f"Bearer <span class="v1v1gmail-hljs-subst">{api_key}</span>"</span>})
    <span class="v1v1gmail-hljs-keyword">return</span> response.json()

<span class="v1v1gmail-hljs-keyword">def</span> <span class="v1v1gmail-hljs-title v1v1gmail-function_">get_custom_nlp_score</span>(<span class="v1v1gmail-hljs-params">text</span>):
    <span class="v1v1gmail-hljs-comment"># Placeholder for custom NLP analysis logic</span>
    <span class="v1v1gmail-hljs-keyword">return</span> {<span class="v1v1gmail-hljs-string">"toxicity"</span>: <span class="v1v1gmail-hljs-number">0.5</span>}

comment = <span class="v1v1gmail-hljs-string">"I hate you!"</span>
perspective_score = get_perspective_score(comment, <span class="v1v1gmail-hljs-string">"YOUR_PERSPECTIVE_API_KEY"</span>)
custom_score = get_custom_nlp_score(comment)

<span class="v1v1gmail-hljs-comment"># Aggregate scores</span>
combined_score = (perspective_score[<span class="v1v1gmail-hljs-string">'attributeScores'</span>][<span class="v1v1gmail-hljs-string">'TOXICITY'</span>][<span class="v1v1gmail-hljs-string">'summaryScore'</span>][<span class="v1v1gmail-hljs-string">'value'</span>] + custom_score[<span class="v1v1gmail-hljs-string">'toxicity'</span>]) / <span class="v1v1gmail-hljs-number">2</span>
<span class="v1v1gmail-hljs-built_in">print</span>(<span class="v1v1gmail-hljs-string">f"Combined toxicity score: <span class="v1v1gmail-hljs-subst">{combined_score}</span>"</span>)
</code></div>
</div>
</li>
<li>
<p><strong>Contextual Analysis with LLMs:</strong> Leveraging large language models (LLMs) like GPT-4 can help in understanding the context of comments. By integrating data from movie databases (e.g., TMDb) and thread histories, we can provide the model with the necessary context to accurately interpret comments.</p>
<p><strong>Implementation Steps:</strong></p>
<ul>
<li>Use APIs to fetch context (e.g., movie quotes from TMDb).</li>
<li>Pass both the comment and context to an LLM for analysis.</li>
</ul>
</li>
<li>
<p><strong>Real-Time Monitoring and User Interaction Metrics:</strong> Implementing real-time monitoring tools can help detect toxic patterns quickly. We could use a combination of machine learning and heuristic rules to flag potentially problematic threads for closer monitoring.</p>
<p><strong>Example Heuristic Rule:</strong></p>
<div class="v1v1gmail-dark v1v1gmail-bg-gray-950 v1v1gmail-rounded-md v1v1gmail-border-[0.5px] v1v1gmail-border-token-border-medium">
<div class="v1v1gmail-flex v1v1gmail-items-center v1v1gmail-relative v1v1gmail-text-token-text-secondary v1v1gmail-bg-token-main-surface-secondary v1v1gmail-px-4 v1v1gmail-py-2 v1v1gmail-text-xs v1v1gmail-font-sans v1v1gmail-justify-between v1v1gmail-rounded-t-md">yaml
<div class="v1v1gmail-flex v1v1gmail-items-center">&nbsp;</div>
</div>
<div class="v1v1gmail-overflow-y-auto v1v1gmail-p-4 v1v1gmail-text-left v1v1gmail-undefined" dir="ltr"><code class="v1v1gmail-!whitespace-pre v1v1gmail-hljs v1v1gmail-language-yaml"><span class="v1v1gmail-hljs-attr">rules:</span>
  <span class="v1v1gmail-hljs-bullet">-</span> <span class="v1v1gmail-hljs-attr">name:</span> <span class="v1v1gmail-hljs-string">"Monitor high-activity threads"</span>
    <span class="v1v1gmail-hljs-attr">condition:</span>
      <span class="v1v1gmail-hljs-attr">thread:</span>
        <span class="v1v1gmail-hljs-attr">activity:</span> <span class="v1v1gmail-hljs-string">"high"</span>
        <span class="v1v1gmail-hljs-attr">sentiment:</span> <span class="v1v1gmail-hljs-string">"mixed"</span>
    <span class="v1v1gmail-hljs-attr">action:</span> <span class="v1v1gmail-hljs-string">flag</span>
    <span class="v1v1gmail-hljs-attr">message:</span> <span class="v1v1gmail-hljs-string">"This thread is being monitored due to high activity and mixed sentiment."</span>
</code></div>
</div>
</li>
<li>
<p><strong>Social Engineering and User Behavior Modification:</strong> Exploring social engineering techniques, such as displaying toxicity scores in real-time, could encourage self-moderation. We could run A/B tests to measure the impact of such features on user behavior.</p>
<p><strong>Example Implementation:</strong></p>
<div class="v1v1gmail-dark v1v1gmail-bg-gray-950 v1v1gmail-rounded-md v1v1gmail-border-[0.5px] v1v1gmail-border-token-border-medium">
<div class="v1v1gmail-flex v1v1gmail-items-center v1v1gmail-relative v1v1gmail-text-token-text-secondary v1v1gmail-bg-token-main-surface-secondary v1v1gmail-px-4 v1v1gmail-py-2 v1v1gmail-text-xs v1v1gmail-font-sans v1v1gmail-justify-between v1v1gmail-rounded-t-md">python
<div class="v1v1gmail-flex v1v1gmail-items-center">&nbsp;</div>
</div>
<div class="v1v1gmail-overflow-y-auto v1v1gmail-p-4 v1v1gmail-text-left v1v1gmail-undefined" dir="ltr"><code class="v1v1gmail-!whitespace-pre v1v1gmail-hljs v1v1gmail-language-python"><span class="v1v1gmail-hljs-keyword">def</span> <span class="v1v1gmail-hljs-title v1v1gmail-function_">display_toxicity_warning</span>(<span class="v1v1gmail-hljs-params">score</span>):
    <span class="v1v1gmail-hljs-keyword">if</span> score &gt; <span class="v1v1gmail-hljs-number">0.4</span>:
        <span class="v1v1gmail-hljs-built_in">print</span>(<span class="v1v1gmail-hljs-string">"Warning: Your comment is being flagged for high toxicity. Please reconsider your wording."</span>)
</code></div>
</div>
<p>Incorporating elements like gender ratio balance can also contribute to a healthier community dynamic, similar to Bumble's approach in dating contexts.</p>
</li>
<li>
<p><strong>Platform-Level Interventions:</strong> Implementing platform-wide policies that discourage toxic behavior and promote positive interactions. This could include rewards for positive contributions and stricter penalties for repeated violations.</p>
</li>
</ol>
<p>I believe these approaches, combined with continuous iteration and user feedback, can significantly improve toxicity management on the site. I'm looking forward to discussing these ideas further and exploring how we can implement them effectively.</p>
<p>Jesse&nbsp;</p>
</div>
<br />
<div class="v1v1gmail_quote">
<div class="v1v1gmail_attr" dir="ltr">On Wed, May 22, 2024 at 5:11 PM &lt;<a href="mailto:henry.s@cinemaloop.co" rel="noreferrer">henry.s@cinemaloop.co</a>&gt; wrote:</div>
<blockquote class="v1v1gmail_quote" style="margin: 0px 0px 0px 0.8ex; border-left: 1px solid #cccccc; padding-left: 1ex;">
<div style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<p>Hi Jesse,</p>
<p>Sorry it's been a very busy lately.&nbsp; I have some comments I can give on all of your ideas but it's going to be next week I think before things settle down.&nbsp; However, on NLP that's what the perspective API is.&nbsp; I've considered running more than one sentiment analyzer because I've found cases, where for example Google's paid NLP service does better than Perspective, but it's all very case-by-case and it seems to me it wouldn't really solve the problem adequately.&nbsp; I haven't looked at NLTK or SpaCy but at this stage I'm not expecting anyones NLP to perform as well as I would like.&nbsp; Part of the issue is context. In the context of a discussion a users input and how it should be interpreted in many cases depends on what they are responding to and what happened earlier in the thread.&nbsp; Similarly if someone is commenting on a horror film some comments regarding violence might in that case be acceptable where in other contexts they are not.&nbsp; This is something that the developers for the perspective API mentioned that they were working on. &nbsp; Right now I don't know of an out of the box solution that handles sentiment in the context of a discussion thread or in the context of something like a movie category.&nbsp; There are many lines from movies that if quoted by someone on Cinemaloop would be flagged inappropriately.&nbsp; For example, if a Cinemaloop user says something like "I can't believe Allison says "You're either a prude or a slut".&nbsp; This is ok, because Allison is a character from the movie and this is line she said in the movie The Breakfast Club.&nbsp; If I send this to the Perspective API, it comes back 83% it's toxic. &nbsp;</p>
<div><span style="color: #000000;">{</span></div>
<div><span style="color: #000000;"> </span><span style="color: #a31515;">"begin"</span><span style="color: #000000;">: </span><span style="color: #098658;">0</span><span style="color: #000000;">,</span></div>
<div><span style="color: #000000;"> </span><span style="color: #a31515;">"end"</span><span style="color: #000000;">: </span><span style="color: #098658;">61</span><span style="color: #000000;">,</span></div>
<div><span style="color: #000000;"> </span><span style="color: #a31515;">"score"</span><span style="color: #000000;">: {</span></div>
<div><span style="color: #000000;"> </span><span style="color: #a31515;">"value"</sp
```

*(truncated at 50KB — full body is 65213 bytes, sha256 is of the full body)*