---
gmail_message_id: 18fe5f97aa7f7b2b
account: plasmatoid@gmail.com
date_header: Tue, 4 Jun 2024 22:18:02 -0300
from: Jesse Daniel Brown <plasmatoid@gmail.com>
to: henry.s@cinemaloop.co
subject: Re: Jesse Daniel Brown
body_sha256: 86952ac0c49c3935b14b0abd3bb30f75c39e0aea37b78f728480374e8b52ffce
snippet: Hello Henry, A lot has happened since we last talked (seemingly years of development in weeks across all kinds of domains including MAMBA2. Are you thinking about using a layered approach where
---

# Re: Jesse Daniel Brown

**From:** Jesse Daniel Brown <plasmatoid@gmail.com>
**To:** henry.s@cinemaloop.co
**Date:** Tue, 4 Jun 2024 22:18:02 -0300
**SHA256:** `86952ac0c49c3935b14b0abd3bb30f75c39e0aea37b78f728480374e8b52ffce`

## Body (extracted text)

Hello Henry, A lot has happened since we last talked (seemingly years of development in weeks across all kinds of domains including MAMBA2. Are you thinking about using a layered approach where heuristics serve as the first line of defense to filter out the most obvious cases of toxicity, followed by deeper analysis from more sophisticated models like the proposed Cinemaloop BERT. IMO, that would provide a balance between performance and accuracy. I watched the video about dating and it did have an effect on me and made a lot of sense. It is also very relatable to what people want versus what they see. Right now the AI universe that Nvidia is trying to build is not quite ready for us all to plug our mind reading EEG caps on and have the system understand what we want in relation to what's available... But it is something we could prepare for in AI-Human reinforced mind reading in the near future. Some guys are working on this in New York, and that was actually my last research project. Social Engineering and User Behavior Modification-- In the case of what that made me think is that developing a more transparent system where users are aware of how their behavior influences their visibility and interactions on the platform would make more sense to me. Implementing community-driven moderation where users can play a role in defining acceptable behaviors would create a self-regulating community. maybe offering moderators coupons or discounts, event invites, or other offerings could make this an attractive user based reward. Of course it will draw more people to use the site more, and could cause some scam problems, but it sounds like a more cost effective and attractive idea that can get more people involved beyond what they are already doing. In the meantime, OpenAI’s Ada or Babbage models operate at almost the same level as GPT4, but could have been considered cheaper. (not sure if that is true with the new GPT4o model as they are touting it as cheaper),, but I have not looked at the pricing in the last few weeks. Using the smaller models in function calling used to give the same type of natural language use that we would be looking for, while costing a lot less. Of course, right around the beginning of November, the Whale size model will be released and it is expected to be much better and can handle almost everything you are talking about with inference that is not possible anywhere else. I think creating BERT is one of the best ideas for now. When I was thinking about the platform-level Interventions-- I am not sure about the reporting functions you are running, but while promoting positive posts is beneficial, relying solely on algorithmic adjustments might not address the root causes of toxicity. Maybe combine algorithmic promotion of positive behavior with user education about the community standards and the consequences of violating them. Also, incorporating a straightforward and accessible reporting system that empowers users to easily report problematic content, with a bot that explains the ideas people have of each other without letting the users know who is actually talking about them. And thinking about it, we could assign every person an unseen id number, The system could analyze what those id numbers are doing in a log, and relate the flags, reports, and positive things people are saying to help the AI understand more about them, This could help with what films they are presented in the long run, how their comments are loaded, and a lot of other issues. On a side note, we are moving really fast into the area of instantly producible content with a very simple to use git file: https://youtube.com/watch?v=tR871s1jEQg TL browse (which instantly creates a new page based on what you ask the agent.. just an easy to see example) And we can make a lot cheaper agents: (this is really useful for your problem, and looks like what you might really want for some use cases): https://www.youtube.com/watch?v=MGkByeDm-90 At any rate, I think the BERT model is the best for now, if you were to imagine that the instantly creatable content is not worth waiting for. I mean, with that option, we could instantly create a lot of stuff for each individual user id number like I talked about before, that REALLY targeted what that user id wants and is associated with, while lowering the urge to have toxicity inducing content presented to them. Just a thought. Jesse On Tue, Jun 4, 2024 at 5:26 PM wrote: > Hi Jesse, > > Thank you for sending this and your patience. > > 1. I've put some more thought into the idea of averaging the scores of > multiple NLP models and right now my thinking is that this would not work. > Each model we consider is going to perform better or worse depending on how > they've been trained and the type of toxicity we are trying to score. For > example if we decided that Hatebase API was an NLP that we wanted to > integrate with the Perspective API. * because it’s no longer officially supported. Hatebase API just happens to > fit nicely into an example type I’d be looking for. *I would suspect > that one of the models is measurably more accurate in most cases than the > other. Averaging them would only reduce the accuracy in the majority of > cases. My best guess without having done any testing is that the Hatebase > API was trained on data similar to what the Perspective API is categorizing > as Identity_Attack. So, it we could test if it scores better then the > Perspective API’s Identity_Attack scoring. > > "IDENTITY_ATTACK": {}, Hatebase API? > > So for this example consider Hatebase as an analog for any promising NLP > model that covers a type of speech we might want to comparatively evaluate. > We would need to start with AUC-ROC or maybe F1-score for both Perspective > and the competing NLP. If we can determine that nine times out of ten > the Hatebase API returns a more accurate toxicity score then Perspectives > Identity_Attack scores, we could then choose to replace Perspectives > Identity_Attack score with the normalized scores returned by Hatebase API. > > Of course we then except that one in every ten times we will get a less > accurate score but this seems far better to me then diminishing the > accuracy of both nine times out of ten by averaging or weighting the two > against each other. It’s ok to weight speech subcategories against each > other or even exclude things like perspectives flirting score, but no > averaging. > > With this approach effort is less coding and more about testing if we’ve > identified NLP candidates that meet requirements. Being able to return > scores with a higher degree of accuracy on speech that Perspective already > covers is an entry condition, cost is also factor. > > 2. Contextual Analysis with GPT-4 of course, but devil is in the details, > how does this fit in with Perspective or does it even and what is the cost > and burden on Development to maintain it. The cost of LLM API calls can > add up quickly, and integrating such a model would require significant > development effort. APIs for Context Fetching: Integrating multiple APIs > (e.g., TMDb) adds complexity and potential costs. Each API call incurs > latency, and handling failures or inconsistencies in data. Later if this > becomes cheaper and easier or if we have the funding to create a team to > handle this, but I think this is out of reach at the moment. That said > maybe there’s some budget version AI solution we can build, see below. > > 3. Heuristics and false negatives. > > Yes there are some movies, movie people or post topics that we must be > able to detect and handle differently. Handling differently means things > like rate limiting posting or lower the threshold for providing user > feedback on toxicity or making people jump through some addition hoops > before they can post i.e. reminders to be nice, reminders that we are movie > networking platform not a town hall for discussing politics etc, etc. To > make context something we can use in a cost effective way I think we would > need to build our own model, BERT being a possible candidate. Possibly > contextual heuristics could be used as a first layer that helps us to > decide what data to pass to a custom Cinemaloop BERT model. This could > save money too. > > Here are the cases I think we’d need to cover - > > a. Movies that might be problematic & toxic: > > We should be able to train on the data we will have in mongodb. This > means if there are many posts with the same movie id that has a lot of > toxic comments we should be consuming all the comments and comment threads > with that same movie id, we should also be consuming the data we get back > from the moviedb about that movie. We may need other data to possibly, > maybe Internet Movie Script Database (IMSDb) or SimplyScripts. We should > also be able to train on the moviedb info available for the cast and crew > for said movies. It may not be the movie itself creating toxicity, it > could be some member or members of the cast and crew. We should be > looking at the ratio of toxic posts for each movie person id. The output > of the model should be identifying films that might be high risk and > label them such that we can automate a more risk averse posting experience > for users when they engage on movies identified as high risk. > > > So if for a real world example let’s imagine that we trained our model on > 2000 Mules “a 2020 election conspiracy movie” because we notice a stream of > toxic conspiracy comments coming from Cinemaloop users. It could be that > we find training data like this for movies that extol or denigrate the > virtue of vaccines too. When we see movies with a lot of toxic posts > we’ll get a clearer picture of the types of movies we should be concerned > about but more important the our model must be able to bucket movies into > various problem themes and flag new movies matching problematic themes as > soon as posts appear. When it’s ready we could point the model at every > post that comes in for a movie we haven’t evaluated before. So if > someone makes a post on* Loose Change *“(2005) - A documentary that > promotes conspiracy theories about the September 11 attacks, presumably > posting something like *“This documentary finally reveals the truth about > 9/11! The mainstream media won't tell you this, but Loose Change exposes > the undeniable evidence of a government orchestrated attack.”* our model > could flag it based on the movie theme and the post. We could then take > automated steps like the ones I mentioned above that might help to limit > the number of dumpster fires on the platform. > > > This can also be very useful for blocking some movies completely. I've > attached a screenshot. Note what I searched for in the upper right, then > note the result in the lower right, Tokyo Train Girls. This is porn that > hasn't been flagged correctly in the MovieDB. This will surely generate > posting activity we don't want. This problem isn't going to go away > because of the way the moviedb crowdsources their data. Last week there > were two other JAV films that I went ahead and flagged. I corrected the > data on the movidb side so those two movies don’t show up anymore, but > someone has since entered this latest one. We could use a similar > mechanism to block movies like this from showing up in search results > regardless of how it's been flagged in the moviedb. > > > b. People that due to what's happening with them in the real world might > be problematic: > > - We should be able to train on the data we will have in mongodb. > This means if there's a person id that has a lot of toxic comments already > in mongodb we should be consuming training on the movie persons bio info, > gender/age that we get from the moviedb. the issue here is that this isn't > likely be enough. If you look up Harvey Weinstein or any other problematic > movie person you won't find out the details you will need to understand > that he's problematic so another data source might be needed. > > > c. User posts that people might make unrelated to any specific movie: > > If similar to posts that spawned a toxic threads previously, we should > flag the thread and provide a more risk avers posting experiance. This > case cannot always be informed by Movie or Movie people contexts because > posts within User Groups won’t need to be linked to a movie or person. In > this case we only have what’s in mongo. This could include evaluating > previous posts looking for themes once a problematic post is identified. It > could also include consuming the user group bio, movie favs etc. > > - Rinse & repeat. We should be able to train to id posts that are > likely to turn toxic. > > > 4. Social Engineering and User Behavior Modification: test any changes we do here. > > > 5. Platform-Level Interventions: people but yes we’ll have to do this from time-to-time. Rewarding > positive posts is something we can do by up-ranking via the feed algorithm > that I’ve put forward. We’ve not implemented this yet but we will. > > > Right now I don’t have the capacity to do more than number one. Having a > clear path to two/three is I think the next step towards managing toxicity. > Four and five, that’s very straight forward stuff that we can tackle as a > matter of course. I’m very familiar with tactics used by hackers and > authors of malware etc.. the Bumble idea on women making the first move for > a dating app was clever. I am open to novel ideas like that on social > engineering for Cinemaloop. If you have an idea that you haven’t seen > someone try before, maybe it’s worth considering. ;) > > Thanks > > > Henry > > On 2024-05-22 13:38, Jesse Daniel Brown wrote: > > Hi Henry, > > Thank you for your detailed feedback and for outlining the specifics. I > appreciate the insights and agree that handling toxicity effectively > requires a nuanced approach that takes context into account. > > Based on your feedback, here are some refined suggestions: > > 1. > > *Multi-Model Sentiment Analysis:* Given the limitations you've > encountered with a single API, you could implement a multi-model approach. > This involves running comments through multiple sentiment analysis APIs > (e.g., Google's Perspective API and an in-house NLP model using NLTK or > SpaCy) and aggregating the results to improve accuracy. This hybrid > approach could help mitigate false positives and negatives by leveraging > the strengths of each model. > > *Example Implementation:* > python > > import requests def get_perspective_score(text, api_key): url = " > https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" data > = { 'comment': {'text': text}, 'languages': ['en'], > 'requestedAttributes': {'TOXICITY': {}} } response = requests.post(url, > json=data, headers={"Authorization": f"Bearer {api_key}"}) return > response.json() def get_custom_nlp_score(text): # Placeholder for > custom NLP analysis logic return {"toxicity": 0.5} comment = "I hate > you!" perspective_score = get_perspective_score(comment, > "YOUR_PERSPECTIVE_API_KEY") custom_score = > get_custom_nlp_score(comment) # Aggregate scores combined_score = > (perspective_score['attributeScores']['TOXICITY']['summaryScore'][ > 'value'] + custom_score['toxicity']) / 2 print(f"Combined toxicity > score: {combined_score}") > 2. > > *Contextual Analysis with LLMs:* Leveraging large language models > (LLMs) like GPT-4 can help in understanding the context of comments. By > integrating data from movie databases (e.g., TMDb) and thread histories, we > can provide the model with the necessary context to accurately interpret > comments. > > *Implementation Steps:* > - Use APIs to fetch context (e.g., movie quotes from TMDb). > - Pass both the comment and context to an LLM for analysis. > 3. > > *Real-Time Monitoring and User Interaction Metrics:* Implementing > real-time monitoring tools can help detect toxic patterns quickly. We could > use a combination of machine learning and heuristic rules to flag > potentially problematic threads for closer monitoring. > > *Example Heuristic Rule:* > yaml > > rules: - name: "Monitor high-activity threads" condition: thread: > activity: "high" sentiment: "mixed" action: flag message: "This thread > is being monitored due to high activity and mixed sentiment." > 4. > > *Social Engineering and User Behavior Modification:* Exploring social > engineering techniques, such as displaying toxicity scores in real-time, > could encourage self-moderation. We could run A/B tests to measure the > impact of such features on user behavior. > > *Example Implementation:* > python > > def display_toxicity_warning(score): if score > 0.4: print("Warning: > Your comment is being flagged for high toxicity. Please reconsider your > wording.") > > Incorporating elements like gender ratio balance can also contribute > to a healthier community dynamic, similar to Bumble's approach in dating > contexts. > 5. > > *Platform-Level Interventions:* Implementing platform-wide policies > that discourage toxic behavior and promote positive interactions. This > could include rewards for positive contributions and stricter penalties for > repeated violations. > > I believe these approaches, combined with continuous iteration and user > feedback, can significantly improve toxicity management on the site. I'm > looking forward to discussing these ideas further and exploring how we can > implement them effectively. > > Jesse > > On Wed, May 22, 2024 at 5:11 PM wrote: > > Hi Jesse, > > Sorry it's been a very busy lately. I have some comments I can give on > all of your ideas but it's going to be next week I think before things > settle down. However, on NLP that's what the perspective API is. I've > considered running more than one sentiment analyzer because I've found > cases, where for example Google's paid NLP service does better than > Perspective, but it's all very case-by-case and it seems to me it wouldn't > really solve the problem adequately. I haven't looked at NLTK or SpaCy but > at this stage I'm not expecting anyones NLP to perform as well as I would > like. Part of the issue is context. In the context of a discussion a users > input and how it should be interpreted in many cases depends on what they > are responding to and what happened earlier in the thread. Similarly if > someone is commenting on a horror film some comments regarding violence > might in that case be acceptable where in other contexts they are not. > This is something that the developers for the perspective API mentioned > that they were working on. Right now I don't know of an out of the box > solution that handles sentiment in the context of a discussion thread or in > the context of something like a movie category. There are many lines from > movies that if quoted by someone on Cinemaloop would be flagged > inappropriately. For example, if a Cinemaloop user says something like "I > can't believe Allison says "You're either a prude or a slut". This is ok, > because Allison is a character from the movie and this is line she said in > the movie The Breakfast Club. If I send this to the Perspective API, it > comes back 83% it's toxic. > { > "begin": 0, > "end": 61, > "score": { > "value": 0.8364697, > "type": "PROBABILITY" > } > } > ], > "summaryScore": { > "value": 0.8364697, > "type": "PROBABILITY" > } > > A large language model that's consuming the data passed to us about said > movie from the moviedb and other sources to would be needed could figure > out that this user is commenting on the character Allison but as of now > we'd get a false positive. Yep TensorFlow & PyTorch, large language models > generally have promise. For sure it would be great if we could customize > it for our user base and various contexts it would solve for exactly the > examples I gave. However, this would require an entire team with the > expertise to build & maintain it. This comes back to the solution needing > to be easy. On user interaction metrics that will happen just by virtue of > having each exchange rated by the perspective API. We'll start building > reporting on this as soon as we get our MVP features finished. > > "TOXICITY": {}, > "SEVERE_TOXICITY": {}, > "IDENTITY_ATTACK": {}, > "INSULT": {}, > "PROFANITY": {}, > "THREAT": {}, > "SEXUALLY_EXPLICIT": {}, > "FLIRTATION": {} > > We'll look at other ways we can do analysis too. > > I want to also mention that recently I had platform access to the app > Nextdoor's reported posts and the threads that these reports came from. > What I observed about their effort to handle toxicity was that when it > worked "which wasn't very often" it was too slow. If a user makes a highly > toxic post it doesn't take longer than a few min for an entire thread to > turn into a dumpster fire if it happens to be one that people are active > on. Even if the post is removed relatively quickly the damage is done. > These kind of comments trigger more toxic comments. My feeling also after > seeing what was happening there is that some categories of posts were > highly likely to become problematic even if they are started with good > intentions. I also observed a pattern, things would start positive, then > factions would divide and as lines in the sand were drawn the thread became > a detriment to the platform. For sure I think there are things we could do > to keep an eye on threads that demonstrate this arch but this would require > LLM & data scientist inputs. Regardless, my point still is that we need > something that's as close to realtime as possible. > > I want to add that social engineering is something that we need to > consider and should be willing to be creative about too. I.e. Bumble > requiring women to make the first move in Bumbles dating context. I think > things like this can help, but also we can do things at a platform level. > https://www.youtube.com/watch?v=x3lypVnJ0HM through to the end. While we aren't a dating app "maybe a side hustle in > the future" my feeling is that this problem can affect every social media > platform. So if we focus on acquiring women and take steps to keep the > gender ratio as equal as we can it will also help us with toxicity for > everyone on the platform. The perspective api also provides for the option > to do some social engineering. I don't really know how people will respond > to seeing their toxicity score indicated as they type if they pass let's > say the 40% threshold, but it's worth at test to see what the impact is on > self moderation. Anyway, I'll try to get back to you on the other stuff > you brought up by next week. Some of the items related to bot detection we > have done or have plans to do already. Now you know a little bit more > about where I'm coming from. > > > Thanks! > > > Henry > > > > On 2024-05-17 04:54, Jesse Daniel Brown wrote: > > Also, we have some different ideas about avenues of direction for the > platform. There are many ways to implement these though, so an idea starts > the conversation: > *Coding Implementations:* > > 1. > > *Natural Language Processing (NLP):* > - Use NLP libraries like NLTK or SpaCy to analyze and classify text. > - Implement sentiment analysis to detect negative sentiment. > 2. > > *Machine Learning Models:* > - Train models using frameworks like TensorFlow or PyTorch. > - Deploy models to automatically flag and filter out toxic content. > 3. > > *User Interaction Metrics:* > - Track user interactions and identify patterns associated with toxic > behavior. > - Use data analysis to adapt and improve moderation strategies. > > *Additional Tools:* > > - *Captcha Systems:* > - Use captchas to prevent automated spam and bot interactions.(This > is becoming less applicable due to agentic properties of the new crawl and > curl agents) > - *Rate Limiting:* > - Limit the number of posts/comments a user can make in a short > period. > > > On Fri, May 17, 2024 at 8:49 AM Jesse Daniel Brown > wrote: > > Hello! > *1. User Behavior Monitoring:* > > *Example: Perspective API by Google* > > - *Implementation:* > - Use the Perspective API to analyze comments for toxicity. It > assigns a score to each comment based on the likelihood of it being > perceived as toxic. > - Integration: > python > > import requests def get_toxicity_score(text): url = " > https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" > data = { 'comment': {'text': text}, 'languages': ['en'], > 'requestedAttributes': {'TOXICITY': {}} } response = requests.post(url, > json=data, headers={"Authorization": "Bearer API_KEY"}) return > response.json() comment = "I hate you!" score = get_toxicity_score(comment) > print(f"Toxicity score: {score}") > - *Outcome:* > - Comments with high toxicity scores are flagged for review or > automatically removed. > > *2. Content Moderation:* > > *Example: AutoMod in Reddit* > > - *Implementation:* > - AutoMod is a customizable bot used to enforce community > guidelines by automatically filtering posts and comments based on set rules. > - Integration: > yaml > > # Example AutoMod configuration for Reddit rules: - name: "Remove > offensive words" condition: comment: body (includes): ["offensive_word1", > "offensive_word2"] action: remove message: "Your comment was removed due to > the use of offensive language." - name: "Limit post frequency" condition: > user: post_frequency: "5 per hour" action: remove message: "You are posting > too frequently. Please slow down." > - *Outcome:* > - Offensive comments are removed automatically, and users > posting too frequently are temporarily restricted. > > > On Tue, May 14, 2024 at 7:48 PM wrote: > > Hi Jesse, > > Toxicity, if you want to look at this problem and tell me how you think it > can be effectively managed let me know. My feeling is that it's going to > be a combination of things, not just one solution. The key criteria is > that anything we do needs to be straight forward to implement i.e. "easy", > doesn't involve humans in the loop once implemented unless the cops phone > us up, and performant, this means fast but also few if any FNs or FPs. We > have our starting moves lined up already, but this won't be a game that's > won in just one or two moves. Show me some moves you would make knowing > where we are at today. > > -H- > > > On 2024-05-09 08:34, Jesse Daniel Brown wrote: > > Thanks for the feedback. > I would still be happy to help with the small tasks in the interim. > I will reach out in 6 months and see what your position is. > In the meantime, please let me know if you want any help or adice. Would > be happy to do it as a friend too. > Jesse > > On Thu, May 9, 2024 at 11:30 AM wrote: > > Hi Jesse, > > I'm not sure that YouTube video hit the way you thought it would with me. > We have practical problems that need to be solved right now and anyone that > I bring on to the team needs to be able to meet us where we are. Honestly > that means a fair amount of donkey work. i.e. fixing bugs, removing > friction points, hitting our registration conversion rate target as well as > finishing up the feature set we think we need to make the product something > people would want to come back to. There's a direct line between this > work, which is not far from being done, and finding funding. For the near > term this means developers writing their own code albeit with the > assistance of AI. I know what's coming with AI but the fact is it's only > an assist at the moment. This is especially true for the one problem that > keeps me up at night, platform toxicity, though I have big hopes for > improvements coming down the pipeline. It was a good chat yesterday. It's > always nice to discuss Cinemaloop with someone that gets it, and I think > you do. :) My feeling is that you would be a better fit for Cinemaloop > once we are funded. At that point we'll be in a better position to reach > for the future. You have my email, feel free to check back with me in 6 to > 12 months. At that time we'll be in a much different place, AI will be > too. > > Thanks > > Henry > > > > On 2024-05-08 13:15, Jesse Daniel Brown wrote: > > Hello Henry, > > It was great to talk to you today. > I really like your idea of creating social networks and communities based > on the user and I really think you have potential! (great job so far) > I thought you might really love this > https://www.youtube.com/watch?v=Zlgkzjndpak (really old version of what > exists today), but I think if you watch it, your mind will begin to race > with the possibilities. > Other than that, looking forward to talking to gerard? about future work. > Let me know. > Jesse > > === HTML PART === Hello Henry, A lot has happened since we last talked (seemingly years of development in weeks across all kinds of domains including MAMBA2. Are you thinking about using a layered approach where heuristics serve as the first line of defense to filter out the most obvious cases of toxicity, followed by deeper analysis from more sophisticated models like the proposed Cinemaloop BERT. IMO, that would provide a balance between performance and accuracy. I watched the video about dating and it did have an effect on me and made a lot of sense. It is also very relatable to what people want versus what they see. Right now the AI universe that Nvidia is trying to build is not quite ready for us all to plug our mind reading EEG caps on and have the system understand what we want in relation to what&#39;s available... But it is something we could prepare for in AI-Human reinforced mind reading in the near future. Some guys are working on this in New York, and that was actually my last research project. Social Engineering and User Behavior Modification-- In the case of what that made me think is that developing a more transparent system where users are aware of how their behavior influences their visibility and interactions on the platform would make more sense to me. Implementing community-driven moderation where users can play a role in defining acceptable behaviors would create a self-regulating community. maybe offering moderators coupons or discounts, event invites, or other offerings could make this an attractive user based reward. Of course it will draw more people to use the site more, and could cause some scam problems, but it sounds like a more cost effective and attractive idea that can get more people involved beyond what they are already doing. In the meantime, OpenAI’s Ada or Babbage models operate at almost the same level as GPT4, but could have been considered cheaper. (not sure if that is true with the new GPT4o model as they are touting it as cheaper),, but I have not looked at the pricing in the last few weeks. Using the smaller models in function calling used to give the same type of natural language use that we would be looking for, while costing a lot less. Of course, right around the beginning of November, the Whale size model will be released and it is expected to be much better and can handle almost everything you are talking about with inference that is not possible anywhere else. I think creating BERT is one of the best ideas for now. When I was thinking about the platform-level Interventions-- I am not sure about the reporting functions you are running, but while promoting positive posts is beneficial, relying solely on algorithmic adjustments might not address the root causes of toxicity. Maybe combine algorithmic promotion of positive behavior with user education about the community standards and the consequences of violating them. Also, incorporating a straightforward and accessible reporting system that empowers users to easily report problematic content, with a bot that explains the ideas people have of each other without letting the users know who is actually talking about them. And thinking about it, we could assign every person an unseen id number, The system could analyze what those id numbers are doing in a log, and relate the flags, reports, and positive things people are saying to help the AI understand more about them, This could help with what films they are presented in the long run, how their comments are loaded, and a lot of other issues. On a side note, we are moving really fast into the area of instantly producible content with a very simple to use git file: https://youtube.com/watch?v=tR871s1jEQg TL browse (which instantly creates a new page based on what you ask the agent.. just an easy to see example) And we can make a lot cheaper agents: (this is really useful for your problem, and looks like what you might really want for some use cases): https://www.youtube.com/watch?v=MGkByeDm-90 At any rate, I think the BERT model is the best for now, if you were to imagine that the instantly creatable content is not worth waiting for. I mean, with that option, we could instantly create a lot of stuff for each individual user id number like I talked about before, that REALLY targeted what that user id wants and is associated with, while lowering the urge to have toxicity inducing content presented to them. Just a thought. Jesse On Tue, Jun 4, 2024 at 5:26 PM < henry.s@cinemaloop.co > wrote: Hi Jesse, Thank you for sending this and your patience. 1. I&#39;ve put some more thought into the idea of averaging the scores of multiple NLP models and right now my thinking is that this would not work. Each model we consider is going to perform better or worse depending on how they&#39;ve been trained and the type of toxicity we are trying to score. For example if we decided that Hatebase API was an NLP that we wanted to integrate with the Perspective API. <— I’m not proposing this but because it’s no longer officially supported. Hatebase API just happens to fit nicely into an example type I’d be looking for. I would suspect that one of the models is measurably more accurate in most cases than the other. Averaging them would only reduce the accuracy in the majority of cases. My best guess without having done any testing is that the Hatebase API was trained on data similar to what the Perspective API is categorizing as Identity_Attack. So, it we could test if it scores better then the Perspective API’s Identity_Attack scoring. &quot;IDENTITY_ATTACK&quot; : {}, Hatebase API? So for this example consider Hatebase as an analog for any promising NLP model that covers a type of speech we might want to comparatively evaluate. We would need to start with AUC-ROC or maybe F1-score for both Perspective and the competing NLP. If we can determine that nine times out of ten the Hatebase API returns a more accurate toxicity score then Perspectives Identity_Attack scores, we could then choose to replace Perspectives Identity_Attack score with the normalized scores returned by Hatebase API. Of course we then except that one in every ten times we will get a less accurate score but this seems far better to me then diminishing the accuracy of both nine times out of ten by averaging or weighting the two against each other. It’s ok to weight speech subcategories against each other or even exclude things like perspectives flirting score, but no averaging. With this approach effort is less coding and more about testing if we’ve identified NLP candidates that meet requirements. Being able to return scores with a higher degree of accuracy on speech that Perspective already covers is an entry condition, cost is also factor. 2. Contextual Analysis with GPT-4 of course, but devil is in the details, how does this fit in with Perspective or does it even and what is the cost and burden on Development to maintain it. The cost of LLM API calls can add up quickly, and integrating such a model would require significant development effort. APIs for Context Fetching: Integrating multiple APIs (e.g., TMDb) adds complexity and potential costs. Each API call incurs latency, and handling failures or inconsistencies in data. Later if this becomes cheaper and easier or if we have the funding to create a team to handle this, but I think this is out of reach at the moment. That said maybe there’s some budget version AI solution we can build, see below. 3. Heuristics <-- I&#39;m not a big fan of this idea, too many false positives and false negatives. Yes there are some movies, movie people or post topics that we must be able to detect and handle differently. Handling differently means things like rate limiting posting or lower the threshold for providing user feedback on toxicity or making people jump through some addition hoops before they can post i.e. reminders to be nice, reminders that we are movie networking platform not a town hall for discussing politics etc, etc. To make context something we can use in a cost effective way I think we would need to build our own model, BERT being a possible candidate. Possibly contextual heuristics could be used as a first layer that helps us to decide what data to pass to a custom Cinemaloop BERT model. This could save money too. Here are the cases I think we’d need to cover - a. Movies that might be problematic & toxic: We should be able to train on the data we will have in mongodb. This means if there are many posts with the same movie id that has a lot of toxic comments we should be consuming all the comments and comment threads with that same movie id, we should also be consuming the data we get back from the moviedb about that movie. We may need other data to possibly, maybe Internet Movie Script Database (IMSDb) or SimplyScripts. We should also be able to train on the moviedb info available for the cast and crew for said movies. It may not be the movie itself creating toxicity, it could be some member or members of the cast and crew. We should be looking at the ratio of toxic posts for each movie person id. The output of the model should be identifying films that might be high risk and label them such that we can automate a more risk averse posting experience for users when they engage on movies identified as high risk. So if for a real world example let’s imagine that we trained our model on 2000 Mules “a 2020 election conspiracy movie” because we notice a stream of toxic conspiracy comments coming from Cinemaloop users. It could be that we find training data like this for movies that extol or denigrate the virtue of vaccines too. When we see movies with a lot of toxic posts we’ll get a clearer picture of the types of movies we should be concerned about but more important the our model must be able to bucket movies into various problem themes and flag new movies matching problematic themes as soon as posts appear. When it’s ready we could point the model at every post that comes in for a movie we haven’t evaluated before. So if someone makes a post on Loose Change “(2005) - A documentary that promotes conspiracy theories about the September 11 attacks, presumably posting something like “This documentary finally reveals the truth about 9/11! The mainstream media won&#39;t tell you this, but Loose Change exposes the undeniable evidence of a government orchestrated attack.” our model could flag it based on the movie theme and the post. We could then take automated steps like the ones I mentioned above that might help to limit the number of dumpster fires on the platform. This can also be very useful for blocking some movies completely. I&#39;ve attached a screenshot. Note what I searched for in the upper right, then note the result in the lower right, Tokyo Train Girls. This is porn that hasn&#39;t been flagged correctly in the MovieDB. This will surely generate posting activity we don&#39;t want. This problem isn&#39;t going to go away because of the way the moviedb crowdsources their data. Last week there were two other JAV films that I went ahead and flagged. I corrected the data on the movidb side so those two movies don’t show up anymore, but someone has since entered this latest one. We could use a similar mechanism to block movies like this from showing up in search results regardless of how it&#39;s been flagged in the moviedb. b. People that due to what&#39;s happening with them in the real world might be problematic: We should be able to train on the data we will have in mongodb. This means if there&#39;s a person id that has a lot of toxic comments already in mongodb we should be consuming training on the movie persons bio info, gender/age that we get from the moviedb. the issue here is that this isn&#39;t likely be enough. If you look up Harvey Weinstein or any other problematic movie person you won&#39;t find out the details you will need to understand that he&#39;s problematic so another data source might be needed. c. User posts that people might make unrelated to any specific movie: If similar to posts that spawned a toxic threads previously, we should flag the thread and provide a more risk avers posting experiance. This case cannot always be informed by Movie or Movie people contexts because posts within User Groups won’t need to be linked to a movie or person. In this case we only have what’s in mongo. This could include evaluating previous posts looking for themes once a problematic post is identified. It could also include consuming the user group bio, movie favs etc. Rinse & repeat. We should be able to train to id posts that are likely to turn toxic. 4. Social Engineering and User Behavior Modification: <— Yes we’ll A/B test any changes we do here. 5. Platform-Level Interventions: <— I want to avoid ever needing to boot people but yes we’ll have to do this from time-to-time. Rewarding positive posts is something we can do by up-ranking via the feed algorithm that I’ve put forward. We’ve not implemented this yet but we will. Right now I don’t have the capacity to do more than number one. Having a clear path to two/three is I think the next step towards managing toxicity. Four and five, that’s very straight forward stuff that we can tackle as a matter of course. I’m very familiar with tactics used by hackers and authors of malware etc.. the Bumble idea on women making the first move for a dating app was clever. I am open to novel ideas like that on social engineering for Cinemaloop. If you have an idea that you haven’t seen someone try before, maybe it’s worth considering. ;) Thanks Henry On 2024-05-22 13:38, Jesse Daniel Brown wrote: Hi Henry, Thank you for your detailed feedback and for outlining the specifics. I appreciate the insights and agree that handling toxicity effectively requires a nuanced approach that takes context into account. Based on your feedback, here are some refined suggestions: Multi-Model Sentiment Analysis: Given the limitations you&#39;ve encountered with a single API, you could implement a multi-model approach. This involves running comments through multiple sentiment analysis APIs (e.g., Google&#39;s Perspective API and an in-house NLP model using NLTK or SpaCy) and aggregating the results to improve accuracy. This hybrid approach could help mitigate false positives and negatives by leveraging the strengths of each model. Example Implementation: python import requests def get_perspective_score ( text, api_key ): url = &quot; https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze &quot; data = { &#39;comment&#39; : { &#39;text&#39; : text}, &#39;languages&#39; : [ &#39;en&#39; ], &#39;requestedAttributes&#39; : { &#39;TOXICITY&#39; : {}} } response = requests.post (url, json=data, headers={ &quot;Authorization&quot; : f&quot;Bearer {api_key} &quot; }) return response.json() def get_custom_nlp_score ( text ): # Placeholder for custom NLP analysis logic return { &quot;toxicity&quot; : 0.5 } comment = &quot;I hate you!&quot; perspective_score = get_perspective_score(comment, &quot;YOUR_PERSPECTIVE_API_KEY&quot; ) custom_score = get_custom_nlp_score(comment) # Aggregate scores combined_score = (perspective_score[ &#39;attributeScores&#39; ][ &#39;TOXICITY&#39; ][ &#39;summaryScore&#39; ][ &#39;value&#39; ] + custom_score[ &#39;toxicity&#39; ]) / 2 print ( f&quot;Combined toxicity score: {combined_score} &quot; ) Contextual Analysis with LLMs: Leveraging large language models (LLMs) like GPT-4 can help in understanding the context of comments. By integrating data from movie databases (e.g., TMDb) and thread histories, we can provide the model with the necessary context to accurately interpret comments. Implementation Steps: Use APIs to fetch context (e.g., movie quotes from TMDb). Pass both the comment and context to an LLM for analysis. Real-Time Monitoring and User Interaction Metrics: Implementing real-time monitoring tools can help detect toxic patterns quickly. We could use a combination of machine learning and heuristic rules to flag potentially problematic threads for closer monitoring. Example Heuristic Rule: yaml rules: - name: &quot;Monitor high-activity threads&quot; condition: thread: activity: &quot;high&quot; sentiment: &quot;mixed&quot; action: flag message: &quot;This thread is being monitored due to high activity and mixed sentiment.&quot; Social Engineering and User Behavior Modification: Exploring social engineering techniques, such as displaying toxicity scores in real-time, could encourage self-moderation. We could run A/B tests to measure the impact of such features on user behavior. Example Implementation: python def display_toxicity_warning ( score ): if score > 0.4 : print ( &quot;Warning: Your comment is being flagged for high toxicity. Please reconsider your wording.&quot; ) Incorporating elements like gender ratio balance can also contribute to a healthier community dynamic, similar to Bumble&#39;s approach in dating contexts. Platform-Level Interventions: Implementing platform-wide policies that discourage toxic behavior and promote positive interactions. This could include rewards for positive contributions and stricter penalties for repeated violations. I believe these approaches, combined with continuous iteration and user feedback, can significantly improve toxicity management on the site. I&#39;m looking forward to discussing these ideas further and exploring how we can implement them effectively. Jesse On Wed, May 22, 2024 at 5:11 PM < henry.s@cinemaloop.co > wrote: Hi Jesse, Sorry it&#39;s been a very busy lately. I have some comments I can give on all of your ideas but it&#39;s going to be next week I think before things settle down. However, on NLP that&#39;s what the perspective API is. I&#39;ve considered running more than one sentiment analyzer because I&#39;ve found cases, where for example Google&#39;s paid NLP service does better than Perspective, but it&#39;s all very case-by-case and it seems to me it wouldn&#39;t really solve the problem adequately. I haven&#39;t looked at NLTK or SpaCy but at this stage I&#39;m not expecting anyones NLP to perform as well as I would like. Part of the issue is context. In the context of a discussion a users input and how it should be interpreted in many cases depends on what they are responding to and what happened earlier in the thread. Similarly if someone is commenting on a horror film some comments regarding violence might in that case be acceptable where in other contexts they are not. This is something that the developers for the perspective API mentioned that they were working on. Right now I don&#39;t know of an out of the box solution that handles sentiment in the context of a discussion thread or in the context of something like a movie category. There are many lines from movies that if quoted by someone on Cinemaloop would be flagged inappropriately. For example, if a Cinemaloop user says something like &quot;I can&#39;t believe Allison says &quot;You&#39;re either a prude or a slut&quot;. This is ok, because Allison is a character from the movie and this is line she said in the movie The Breakfast Club. If I send this to the Perspective API, it comes back 83% it&#39;s toxic. { &quot;begin&quot; : 0 , &quot;end&quot; : 61 , &quot;score&quot; : { &quot;value&quot; : 0.8364697 , &quot;type&quot; : &quot;PROBABILITY&quot; } } ], &quot;summaryScore&quot; : { &quot;value&quot; : 0.8364697 , &quot;type&quot; : &quot;PROBABILITY&quot; } A large language model that&#39;s consuming the data passed to us about said movie from the moviedb and other sources to would be needed could figure out that this user is commenting on the character Allison but as of now we&#39;d get a false positive. Yep TensorFlow & PyTorch, large language models generally have promise. For sure it would be great if we could customize it for our user base and various contexts it would solve for exactly the examples I gave. However, this would require an entire team with the expertise to build & maintain it. This comes back to the solution needing to be easy. On user interaction metrics that will happen just by virtue of having each exchange rated by the perspective API. We&#39;ll start building reporting on this as soon as we get our MVP features finished. &quot;TOXICITY&quot; : {}, &quot;SEVERE_TOXICITY&quot; : {}, &quot;IDENTITY_ATTACK&quot; : {}, &quot;INSULT&quot; : {}, &quot;PROFANITY&quot; : {}, &quot;THREAT&quot; : {}, &quot;SEXUALLY_EXPLICIT&quot; : {}, &quot;FLIRTATION&quot; : {} We&#39;ll look at other ways we can do analysis too. I want to also mention that recently I had platform access to the app Nextdoor&#39;s reported posts and the threads that these reports came from. What I observed about their effort to handle toxicity was that when it worked &quot;which wasn&#39;t very often&quot; it was too slow. If a user makes a highly toxic post it doesn&#39;t take longer than a few min for an entire thread to turn into a dumpster fire if it happens to be one that people are active on. Even if the post is removed relatively quickly the damage is done. These kind of comments trigger more toxic comments. My feeling also after seeing what was happening there is that some categories of posts were highly likely to become problematic even if they are started with good intentions. I also observed a pattern, things would start positive, then factions would divide and as lines in the sand were drawn the thread became a detriment to the platform. For sure I think there are things we could do to keep an eye on threads that demonstrate this arch but this would require LLM & data scientist inputs. Regardless, my point still is that we need something that&#39;s as close to realtime as possible. I want to add that social engineering is something that we need to consider and should be willing to be creative about too. I.e. Bumble requiring women to make the first move in Bumbles dating context. I think things like this can help, but also we can do things at a platform level. https://www.youtube.com/watch?v=x3lypVnJ0HM <-- Watch this simulation through to the end. While we aren&#39;t a dating app &quot;maybe a side hustle in the future&quot; my feeling is that this problem can affect every social media platform. So if we focus on acquiring women and take steps to keep the gender ratio as equal as we can it will also help us with toxicity for everyone on the platform. The perspective api also provides for the option to do some social engineering. I don&#39;t really know how people will respond to seeing their toxicity score indicated as they type if they pass let&#39;s say the 40% threshold, but it&#39;s worth at test to see what the impact is on self moderation. Anyway, I&#39;ll try to get back to you on the other stuff you brought up by next week. Some of the items related to bot detection we have done or have plans to do already. Now you know a little bit more about where I&#39;m coming from. Thanks! Henry On 2024-05-17 04:54, Jesse Daniel Brown wrote: Also, we have some different ideas about avenues of direction for the platform. There are many ways to implement these though, so an idea starts the conversation: Coding Implementations: Natural Language Processing (NLP): Use NLP libraries like NLTK or SpaCy to analyze and classify text. Implement sentiment analysis to detect negative sentiment. Machine Learning Models: Train models using frameworks like TensorFlow or PyTorch. Deploy models to automatically flag and filter out toxic content. User Interaction Metrics: Track user interactions and identify patterns associated with toxic behavior. Use data analysis to adapt and improve moderation strategies. Additional Tools: Captcha Systems: Use captchas to prevent automated spam and bot interactions.(This is becoming less applicable due to agentic properties of the new crawl and curl agents) Rate Limiting: Limit the number of posts/comments a user can make in a short period. On Fri, May 17, 2024 at 8:49 AM Jesse Daniel Brown < plasmatoid@gmail.com > wrote: Hello! 1. User Behavior Monitoring: Example: Perspective API by Google Implementation: Use the Perspective API to analyze comments for toxicity. It assigns a score to each comment based on the likelihood of it being perceived as toxic. Integration: python import requests def get_toxicity_score(text): url = &quot; https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze &quot; data = { &#39;comment&#39;: {&#39;text&#39;: text}, &#39;languages&#39;: [&#39;en&#39;], &#39;requestedAttributes&#39;: {&#39;TOXICITY&#39;: {}} } response = requests.post (url, json=data, headers={&quot;Authorization&quot;: &quot;Bearer API_KEY&quot;}) return response.json() comment = &quot;I hate you!&quot; score = get_toxicity_score(comment) print(f&quot;Toxicity score: {score}&quot;) Outcome: Comments with high toxicity scores are flagged for review or automatically removed. 2. Content Moderation: Example: AutoMod in Reddit Implementation: AutoMod is a customizable bot used to enforce community guidelines by automatically filtering posts and comments based on set rules. Integration: yaml # Example AutoMod configuration for Reddit rules: - name: &quot;Remove offensive words&quot; condition: comment: body (includes): [&quot;offensive_word1&quot;, &quot;offensive_word2&quot;] action: remove message: &quot;Your comment was removed due to the use of offensive language.&quot; - name: &quot;Limit post frequency&quot; condition: user: post_frequency: &quot;5 per hour&quot; action: remove message: &quot;You are posting too frequently. Please slow down.&quot; Outcome: Offensive comments are removed automatically, and users posting too frequently are temporarily restricted. On Tue, May 14, 2024 at 7:48 PM < henry.s@cinemaloop.co > wrote: Hi Jesse, Toxicity, if you want to look at this problem and tell me how you think it can be effectively managed let me know. My feeling is that it&#39;s going to be a combination of things, not just one solution. The key criteria is that anything we do needs to be straight forward to implement i.e. &quot;easy&quot;, doesn&#39;t involve humans in the loop once implemented unless the cops phone us up, and performant, this means fast but also few if any FNs or FPs. We have our starting moves lined up already, but this won&#39;t be a game that&#39;s won in just one or two moves. Show me some moves you would make knowing where we are at today. -H- On 2024-05-09 08:34, Jesse Daniel Brown wrote: Thanks for the feedback. I would still be happy to help with the small tasks in the interim. I will reach out in 6 months and see what your position is. In the meantime, please let me know if you want any help or adice. Would be happy to do it as a friend too. Jesse On Thu, May 9, 2024 at 11:30 AM < henry.s@cinemaloop.co > wrote: Hi Jesse, I&#39;m not sure that YouTube video hit the way you thought it would with me. We have practical problems that need to be solved right now and anyone that I bring on to the team needs to be able to meet us where we are. Honestly that means a fair amount of donkey work. i.e. fixing bugs, removing friction points, hitting our registration conversion rate target as well as finishing up the feature set we think we need to make the product something people would want to come back to. There&#39;s a direct line between this work, which is not far from being done, and finding funding. For the near term this means developers writing their own code albeit with the assistance of AI. I know what&#39;s coming with AI but the fact is it&#39;s only an assist at the moment. This is especially true for the one problem that keeps me up at night, platform toxicity, though I have big hopes for improvements coming down the pipeline. It was a good chat yesterday. It&#39;s always nice to discuss Cinemaloop with someone that gets it, and I think you do. :) My feeling is that you would be a better fit for Cinemaloop once we are funded. At that point we&#39;ll be in a better position to reach for the future. You have my email, feel free to check back with me in 6 to 12 months. At that time we&#39;ll be in a much different place, AI will be too. Thanks Henry On 2024-05-08 13:15, Jesse Daniel Brown wrote: Hello Henry, It was great to talk to you today. I really like your idea of creating social networks and communities based on the user and I really think you have potential! (great job so far) I thought you might really love this https://www.youtube.com/watch?v=Zlgkzjndpak (really old version of what exists today), but I think if you watch it, your mind will begin to race with the possibilities. Other than that, looking forward to talking to gerard? about future work. Let me know. Jesse

## Raw body (tamper-evident)

```
Hello Henry,
A lot has happened since we last talked (seemingly years of development in
weeks across all kinds of domains including MAMBA2.
Are you thinking about using a layered approach where heuristics serve as
the first line of defense to filter out the most obvious cases of toxicity,
followed by deeper analysis from more sophisticated models like the
proposed Cinemaloop BERT. IMO, that would provide a balance between
performance and accuracy.

I watched the video about dating and it did have an effect on me and made a
lot of sense.
It is also very relatable to what people want versus what they see.
Right now the AI universe that Nvidia is trying to build is not quite ready
for us all to plug our mind reading EEG caps on and have the system
understand what we want in relation to what's available... But it is
something we could prepare for in AI-Human reinforced mind reading in the
near future. Some guys are working on this in New York, and that was
actually my last research project.
   Social Engineering and User Behavior Modification--
In the case of  what that made me think is that developing a more
transparent system where users are aware of how their behavior influences
their visibility and interactions on the platform would make more sense to
me. Implementing community-driven moderation where users can play a role in
defining acceptable behaviors would create a self-regulating community.
maybe offering moderators coupons or discounts, event invites, or other
offerings could make this an attractive user based reward. Of course it
will draw more people to use the site more, and could cause some scam
problems, but it sounds like a more cost effective and attractive idea that
can get more people involved beyond what they are already doing.



In the meantime,  OpenAI’s Ada or Babbage models operate at almost the same
level as GPT4, but could have been considered cheaper. (not sure if that is
true with the new GPT4o model as they are touting it as cheaper),, but I
have not looked at the pricing in the last few weeks. Using the smaller
models in function calling used to give the same type of natural language
use that we would be looking for, while costing a lot less.
Of course, right around the beginning of November, the Whale size model
will be released and it is expected to be much better and can handle almost
everything you are talking about with inference that is not possible
anywhere else.
I think creating BERT is one of the best ideas for now.

 When I was thinking about the platform-level Interventions--
I am not sure about the reporting functions you are running, but while
promoting positive posts is beneficial, relying solely on algorithmic
adjustments might not address the root causes of toxicity.
Maybe combine algorithmic promotion of positive behavior with user
education about the community standards and the consequences of violating
them. Also, incorporating a straightforward and accessible reporting system
that empowers users to easily report problematic content, with a bot that
explains the ideas people have of each other without letting the users know
who is actually talking about them.

And thinking about it, we could assign every person an unseen id number,
The system could analyze what those id numbers are doing in a log, and
relate the flags, reports, and positive things people are saying to help
the AI understand more about them, This could help with what films they are
presented in the long run, how their comments are loaded, and a lot of
other issues.


On a side note, we are moving really fast into the area of instantly
producible content with a very simple to use git file:
https://youtube.com/watch?v=tR871s1jEQg  TL browse (which instantly creates
a new page based on what you ask the agent.. just an easy to see example)

And we can make a lot cheaper agents: (this is really useful for your
problem, and looks like what you might really want for some use cases):
https://www.youtube.com/watch?v=MGkByeDm-90

At any rate, I think the BERT model is the best for now, if you were to
imagine that the instantly creatable content is not worth waiting for.
I mean, with that option, we could instantly create a lot of stuff for each
individual user id number like I talked about before, that REALLY targeted
what that user id wants and is associated with, while lowering the urge to
have toxicity inducing content presented to them.

Just a thought.
Jesse

On Tue, Jun 4, 2024 at 5:26 PM <henry.s@cinemaloop.co> wrote:

> Hi Jesse,
>
> Thank you for sending this and your patience.
>
> 1. I've put some more thought into the idea of averaging the scores of
> multiple NLP models and right now my thinking is that this would not work.
> Each model we consider is going to perform better or worse depending on how
> they've been trained and the type of toxicity we are trying to score.  For
> example if we decided that Hatebase API was an NLP that we wanted to
> integrate with the Perspective API.  *<— I’m not proposing this but
> because it’s no longer officially supported.  Hatebase API just happens to
> fit nicely into an example type I’d be looking for.  *I would suspect
> that one of the models is measurably more accurate in most cases than the
> other.  Averaging them would only reduce the accuracy in the majority of
> cases.  My best guess without having done any testing is that the Hatebase
> API was trained on data similar to what the Perspective API is categorizing
> as Identity_Attack.  So, it we could test if it scores better then the
> Perspective API’s Identity_Attack scoring.
>
>     "IDENTITY_ATTACK": {},   Hatebase API?
>
> So for this example consider Hatebase as an analog for any promising NLP
> model that covers a type of speech we might want to comparatively evaluate.
> We would need to start with AUC-ROC or maybe F1-score for both Perspective
> and the competing NLP.   If we can determine that nine times out of ten
> the Hatebase API returns a more accurate toxicity score then Perspectives
> Identity_Attack scores, we could then choose to replace Perspectives
> Identity_Attack score with the normalized scores returned by Hatebase API.
>
> Of course we then except that one in every ten times we will get a less
> accurate score but this seems far better to me then diminishing the
> accuracy of both nine times out of ten by averaging or weighting the two
> against each other.  It’s ok to weight speech subcategories against each
> other or even exclude things like perspectives flirting score, but no
> averaging.
>
> With this approach effort is less coding and more about testing if we’ve
> identified NLP candidates that meet requirements. Being able to return
> scores with a higher degree of accuracy on speech that Perspective already
> covers is an entry condition, cost is also factor.
>
> 2. Contextual Analysis with GPT-4 of course, but devil is in the details,
> how does this fit in with Perspective or does it even and what is the cost
> and burden on Development to maintain it.   The cost of LLM API calls can
> add up quickly, and integrating such a model would require significant
> development effort.  APIs for Context Fetching: Integrating multiple APIs
> (e.g., TMDb) adds complexity and potential costs.  Each API call incurs
> latency, and handling failures or inconsistencies in data.  Later if this
> becomes cheaper and easier or if we have the funding to create a team to
> handle this, but I think this is out of reach at the moment.  That said
> maybe there’s some budget version AI solution we can build, see below.
>
> 3. Heuristics <-- I'm not a big fan of this idea, too many false positives
> and false negatives.
>
> Yes there are some movies, movie people or post topics that we must be
> able to detect and handle differently.  Handling differently means things
> like rate limiting posting or lower the threshold for providing user
> feedback on toxicity or making people jump through some addition hoops
> before they can post i.e. reminders to be nice, reminders that we are movie
> networking platform not a town hall for discussing politics etc, etc.  To
> make context something we can use in a cost effective way I think we would
> need to build our own model, BERT being a possible candidate.   Possibly
> contextual heuristics could be used as a first layer that helps us to
> decide what data to pass to a custom Cinemaloop BERT model.  This could
> save money too.
>
> Here are the cases I think we’d need to cover -
>
> a. Movies that might be problematic & toxic:
>
> We should be able to train on the data we will have in mongodb.  This
> means if there are many posts with the same movie id that has a lot of
> toxic comments we should be consuming all the comments and comment threads
> with that same movie id, we should also be consuming the data we get back
> from the moviedb about that movie.  We may need other data to possibly,
> maybe Internet Movie Script Database (IMSDb) or SimplyScripts.  We should
> also be able to train on the moviedb info available for the cast and crew
> for said movies.  It may not be the movie itself creating toxicity, it
> could be some member or members of the cast and crew.  We should be
> looking at the ratio of toxic posts for each movie person id.  The output
> of the model should be identifying  films that might be high risk and
> label them such that we can automate a more risk averse posting experience
> for users when they engage on movies identified as high risk.
>
>
> So if for a real world example let’s imagine that we trained our model on
> 2000 Mules “a 2020 election conspiracy movie” because we notice a stream of
> toxic conspiracy comments coming from Cinemaloop users.  It could be that
> we find training data like this for movies that extol or denigrate the
> virtue of vaccines too.  When we see movies with a lot of toxic posts
> we’ll get a clearer picture of the types of movies we should be concerned
> about but more important the our model must be able to bucket movies into
> various problem themes and flag new movies matching problematic themes as
> soon as posts appear.  When it’s ready we could point the model at every
> post that comes in for a movie we haven’t evaluated before.  So if
> someone makes a post on* Loose Change *“(2005) - A documentary that
> promotes conspiracy theories about the September 11 attacks, presumably
> posting something like *“This documentary finally reveals the truth about
> 9/11! The mainstream media won't tell you this, but Loose Change exposes
> the undeniable evidence of a government orchestrated attack.”* our model
> could flag it based on the movie theme and the post.  We could then take
> automated steps like the ones I mentioned above that might help to limit
> the number of dumpster fires on the platform.
>
>
> This can also be very useful for blocking some movies completely.  I've
> attached a screenshot.  Note what I searched for in the upper right, then
> note the result in the lower right, Tokyo Train Girls.  This is porn that
> hasn't been flagged correctly in the MovieDB.  This will surely generate
> posting activity we don't want.  This problem isn't going to go away
> because of the way the moviedb crowdsources their data.  Last week there
> were two other JAV films that I went ahead and flagged.  I corrected the
> data on the movidb side so those two movies don’t show up anymore, but
> someone has since entered this latest one.  We could use a similar
> mechanism to block movies like this from showing up in search results
> regardless of how it's been flagged in the moviedb.
>
>
> b. People that due to what's happening with them in the real world might
> be problematic:
>
>    - We should be able to train on the data we will have in mongodb.
>    This means if there's a person id that has a lot of toxic comments already
>    in mongodb we should be consuming training on the movie persons bio info,
>    gender/age that we get from the moviedb.  the issue here is that this isn't
>    likely be enough.  If you look up Harvey Weinstein or any other problematic
>    movie person you won't find out the details you will need to understand
>    that he's problematic so another data source might be needed.
>
>
> c. User posts that people might make unrelated to any specific movie:
>
> If similar to posts that spawned a toxic threads previously, we should
> flag the thread and provide a more risk avers posting experiance.  This
> case cannot always be informed by Movie or Movie people contexts because
> posts within User Groups won’t need to be linked to a movie or person.  In
> this case we only have what’s in mongo.  This could include evaluating
> previous posts looking for themes once a problematic post is identified.  It
> could also include consuming the user group bio, movie favs etc.
>
>    - Rinse & repeat.  We should be able to train to id posts that are
>    likely to turn toxic.
>
>
> 4. Social Engineering and User Behavior Modification: <— Yes we’ll A/B
> test any changes we do here.
>
>
> 5. Platform-Level Interventions: <— I want to avoid ever needing to boot
> people but yes we’ll have to do this from time-to-time.  Rewarding
> positive posts is something we can do by up-ranking via the feed algorithm
> that I’ve put forward.  We’ve not implemented this yet but we will.
>
>
> Right now I don’t have the capacity to do more than number one.  Having a
> clear path to two/three is I think the next step towards managing toxicity.
> Four and five, that’s very straight forward stuff that we can tackle as a
> matter of course.  I’m very familiar with tactics used by hackers and
> authors of malware etc.. the Bumble idea on women making the first move for
> a dating app was clever.  I am open to novel ideas like that on social
> engineering for Cinemaloop.  If you have an idea that you haven’t seen
> someone try before, maybe it’s worth considering.  ;)
>
> Thanks
>
>
> Henry
>
> On 2024-05-22 13:38, Jesse Daniel Brown wrote:
>
> Hi Henry,
>
> Thank you for your detailed feedback and for outlining the specifics. I
> appreciate the insights and agree that handling toxicity effectively
> requires a nuanced approach that takes context into account.
>
> Based on your feedback, here are some refined suggestions:
>
>    1.
>
>    *Multi-Model Sentiment Analysis:* Given the limitations you've
>    encountered with a single API, you could implement a multi-model approach.
>    This involves running comments through multiple sentiment analysis APIs
>    (e.g., Google's Perspective API and an in-house NLP model using NLTK or
>    SpaCy) and aggregating the results to improve accuracy. This hybrid
>    approach could help mitigate false positives and negatives by leveraging
>    the strengths of each model.
>
>    *Example Implementation:*
>    python
>
>    import requests def get_perspective_score(text, api_key): url = "
>    https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" data
>    = { 'comment': {'text': text}, 'languages': ['en'],
>    'requestedAttributes': {'TOXICITY': {}} } response = requests.post(url,
>    json=data, headers={"Authorization": f"Bearer {api_key}"}) return
>    response.json() def get_custom_nlp_score(text): # Placeholder for
>    custom NLP analysis logic return {"toxicity": 0.5} comment = "I hate
>    you!" perspective_score = get_perspective_score(comment,
>    "YOUR_PERSPECTIVE_API_KEY") custom_score =
>    get_custom_nlp_score(comment) # Aggregate scores combined_score =
>    (perspective_score['attributeScores']['TOXICITY']['summaryScore'][
>    'value'] + custom_score['toxicity']) / 2 print(f"Combined toxicity
>    score: {combined_score}")
>    2.
>
>    *Contextual Analysis with LLMs:* Leveraging large language models
>    (LLMs) like GPT-4 can help in understanding the context of comments. By
>    integrating data from movie databases (e.g., TMDb) and thread histories, we
>    can provide the model with the necessary context to accurately interpret
>    comments.
>
>    *Implementation Steps:*
>    - Use APIs to fetch context (e.g., movie quotes from TMDb).
>       - Pass both the comment and context to an LLM for analysis.
>    3.
>
>    *Real-Time Monitoring and User Interaction Metrics:* Implementing
>    real-time monitoring tools can help detect toxic patterns quickly. We could
>    use a combination of machine learning and heuristic rules to flag
>    potentially problematic threads for closer monitoring.
>
>    *Example Heuristic Rule:*
>    yaml
>
>    rules: - name: "Monitor high-activity threads" condition: thread:
>    activity: "high" sentiment: "mixed" action: flag message: "This thread
>    is being monitored due to high activity and mixed sentiment."
>    4.
>
>    *Social Engineering and User Behavior Modification:* Exploring social
>    engineering techniques, such as displaying toxicity scores in real-time,
>    could encourage self-moderation. We could run A/B tests to measure the
>    impact of such features on user behavior.
>
>    *Example Implementation:*
>    python
>
>    def display_toxicity_warning(score): if score > 0.4: print("Warning:
>    Your comment is being flagged for high toxicity. Please reconsider your
>    wording.")
>
>    Incorporating elements like gender ratio balance can also contribute
>    to a healthier community dynamic, similar to Bumble's approach in dating
>    contexts.
>    5.
>
>    *Platform-Level Interventions:* Implementing platform-wide policies
>    that discourage toxic behavior and promote positive interactions. This
>    could include rewards for positive contributions and stricter penalties for
>    repeated violations.
>
> I believe these approaches, combined with continuous iteration and user
> feedback, can significantly improve toxicity management on the site. I'm
> looking forward to discussing these ideas further and exploring how we can
> implement them effectively.
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
> Perspective, but it's all very case-by-case and it seems to me it wouldn't
> really solve the problem adequately.  I haven't looked at NLTK or SpaCy but
> at this stage I'm not expecting anyones NLP to perform as well as I would
> like.  Part of the issue is context. In the context of a discussion a users
> input and how it should be interpreted in many cases depends on what they
> are responding to and what happened earlier in the thread.  Similarly if
> someone is commenting on a horror film some comments regarding violence
> might in that case be acceptable where in other contexts they are not.
> This is something that the developers for the perspective API mentioned
> that they were working on.   Right now I don't know of an out of the box
> solution that handles sentiment in the context of a discussion thread or in
> the context of something like a movie category.  There are many lines from
> movies that if quoted by someone on Cinemaloop would be flagged
> inappropriately.  For example, if a Cinemaloop user says something like "I
> can't believe Allison says "You're either a prude or a slut".  This is ok,
> because Allison is a character from the movie and this is line she said in
> the movie The Breakfast Club.  If I send this to the Perspective API, it
> comes back 83% it's toxic.
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
> A large language model that's consuming the data passed to us about said
> movie from the moviedb and other sources to would be needed could figure
> out that this user is commenting on the character Allison but as of now
> we'd get a false positive.  Yep TensorFlow & PyTorch, large language models
> generally have promise.  For sure it would be great if we could customize
> it for our user base and various contexts it would solve for exactly the
> examples I gave.  However, this would require an entire team with the
> expertise to build & maintain it.  This comes back to the solution needing
> to be easy.  On user interaction metrics that will happen just by virtue of
> having each exchange rated by the perspective API.  We'll start building
> reporting on this as soon as we get our MVP features finished.
>
> "TOXICITY": {},
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
> What I observed about their effort to handle toxicity was that when it
> worked "which wasn't very often" it was too slow.  If a user makes a highly
> toxic post it doesn't take longer than a few min for an entire thread to
> turn into a dumpster fire if it happens to be one that people are active
> on.  Even if the post is removed relatively quickly the damage is done.
> These kind of comments trigger more toxic comments.  My feeling also after
> seeing what was happening there is that some categories of posts were
> highly likely to become problematic even if they are started with good
> intentions.  I also observed a pattern, things would start positive, then
> factions would divide and as lines in the sand were drawn the thread became
> a detriment to the platform.  For sure I think there are things we could do
> to keep an eye on threads that demonstrate this arch but this would require
> LLM & data scientist inputs. Regardless, my point still is that we need
> something that's as close to realtime as possible.
>
> I want to add that social engineering is something that we need to
> consider and should be willing to be creative about too.  I.e. Bumble
> requiring women to make the first move in Bumbles dating context.  I think
> things like this can help, but also we can do things at a platform level.
> https://www.youtube.com/watch?v=x3lypVnJ0HM  <-- Watch this simulation
> through to the end.  While we aren't a dating app "maybe a side hustle in
> the future" my feeling is that this problem can affect every social media
> platform.  So if we focus on acquiring women and take steps to keep the
> gender ratio as equal as we can it will also help us with toxicity for
> everyone on the platform.  The perspective api also provides for the option
> to do some social engineering.  I don't really know how people will respond
> to seeing their toxicity score indicated as they type if they pass let's
> say the 40% threshold, but it's worth at test to see what the impact is on
> self moderation.  Anyway, I'll try to get back to you on the other stuff
> you brought up by next week.  Some of the items related to bot detection we
> have done or have plans to do already.  Now you know a little bit more
> about where I'm coming from.
>
>
> Thanks!
>
>
> Henry
>
>
>
> On 2024-05-17 04:54, Jesse Daniel Brown wrote:
>
> Also, we have some different ideas about avenues of direction for the
> platform. There are many ways to implement these though, so an idea starts
> the conversation:
> *Coding Implementations:*
>
>    1.
>
>    *Natural Language Processing (NLP):*
>    - Use NLP libraries like NLTK or SpaCy to analyze and classify text.
>       - Implement sentiment analysis to detect negative sentiment.
>    2.
>
>    *Machine Learning Models:*
>    - Train models using frameworks like TensorFlow or PyTorch.
>       - Deploy models to automatically flag and filter out toxic content.
>    3.
>
>    *User Interaction Metrics:*
>    - Track user interactions and identify patterns associated with toxic
>       behavior.
>       - Use data analysis to adapt and improve moderation strategies.
>
> *Additional Tools:*
>
>    - *Captcha Systems:*
>       - Use captchas to prevent automated spam and bot interactions.(This
>       is becoming less applicable due to agentic properties of the new crawl and
>       curl agents)
>    - *Rate Limiting:*
>       - Limit the number of posts/comments a user can make in a short
>       period.
>
>
> On Fri, May 17, 2024 at 8:49 AM Jesse Daniel Brown <plasmatoid@gmail.com>
> wrote:
>
> Hello!
> *1. User Behavior Monitoring:*
>
> *Example: Perspective API by Google*
>
>    - *Implementation:*
>       - Use the Perspective API to analyze comments for toxicity. It
>       assigns a score to each comment based on the likelihood of it being
>       perceived as toxic.
>       - Integration:
>       python
>
>       import requests def get_toxicity_score(text): url = "
>       https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze"
>       data = { 'comment': {'text': text}, 'languages': ['en'],
>       'requestedAttributes': {'TOXICITY': {}} } response = requests.post(url,
>       json=data, headers={"Authorization": "Bearer API_KEY"}) return
>       response.json() comment = "I hate you!" score = get_toxicity_score(comment)
>       print(f"Toxicity score: {score}")
>       - *Outcome:*
>          - Comments with high toxicity scores are flagged for review or
>          automatically removed.
>
> *2. Content Moderation:*
>
> *Example: AutoMod in Reddit*
>
>    - *Implementation:*
>       - AutoMod is a customizable bot used to enforce community
>       guidelines by automatically filtering posts and comments based on set rules.
>       - Integration:
>       yaml
>
>       # Example AutoMod configuration for Reddit rules: - name: "Remove
>       offensive words" condition: comment: body (includes): ["offensive_word1",
>       "offensive_word2"] action: remove message: "Your comment was removed due to
>       the use of offensive language." - name: "Limit post frequency" condition:
>       user: post_frequency: "5 per hour" action: remove message: "You are posting
>       too frequently. Please slow down."
>       - *Outcome:*
>          - Offensive comments are removed automatically, and users
>          posting too frequently are temporarily restricted.
>
>
> On Tue, May 14, 2024 at 7:48 PM <henry.s@cinemaloop.co> wrote:
>
> Hi Jesse,
>
> Toxicity, if you want to look at this problem and tell me how you think it
> can be effectively managed let me know.  My feeling is that it's going to
> be a combination of things, not just one solution.  The key criteria is
> that anything we do needs to be straight forward to implement i.e. "easy",
> doesn't involve humans in the loop once implemented unless the cops phone
> us up, and performant, this means fast but also few if any FNs or FPs.  We
> have our starting moves lined up already, but this won't be a game that's
> won in just one or two moves.  Show me some moves you would make knowing
> where we are at today.
>
> -H-
>
>
> On 2024-05-09 08:34, Jesse Daniel Brown wrote:
>
> Thanks for the feedback.
> I would still be happy to help with the small tasks in the interim.
> I will reach out in 6 months and see what your position is.
> In the meantime, please let me know if you want any help or adice. Would
> be happy to do it as a friend too.
> Jesse
>
> On Thu, May 9, 2024 at 11:30 AM <henry.s@cinemaloop.co> wrote:
>
> Hi Jesse,
>
> I'm not sure that YouTube video hit the way you thought it would with me.
> We have practical problems that need to be solved right now and anyone that
> I bring on to the team needs to be able to meet us where we are.  Honestly
> that means a fair amount of donkey work.  i.e. fixing bugs, removing
> friction points, hitting our registration conversion rate target as well as
> finishing up the feature set we think we need to make the product something
> people would want to come back to.  There's a direct line between this
> work, which is not far from being done, and finding funding.  For the near
> term this means developers writing their own code albeit with the
> assistance of AI.  I know what's coming with AI but the fact is it's only
> an assist at the moment.  This is especially true for the one problem that
> keeps me up at night, platform toxicity, though I have big hopes for
> improvements coming down the pipeline.  It was a good chat yesterday.  It's
> always nice to discuss Cinemaloop with someone that gets it, and I think
> you do.  :)  My feeling is that you would be a better fit for Cinemaloop
> once we are funded.  At that point we'll be in a better position to reach
> for the future.  You have my email, feel free to check back with me in 6 to
> 12 months.  At that time we'll be in a much different place, AI will be
> too.
>
> Thanks
>
> Henry
>
>
>
> On 2024-05-08 13:15, Jesse Daniel Brown wrote:
>
> Hello Henry,
>
> It was great to talk to you today.
> I really like your idea of creating social networks and communities based
> on the user and I really think you have potential! (great job so far)
> I thought you might really love this
> https://www.youtube.com/watch?v=Zlgkzjndpak  (really old version of what
> exists today), but I think if you watch it, your mind will begin to race
> with the possibilities.
> Other than that, looking forward to talking to gerard? about future work.
> Let me know.
> Jesse
>
>


=== HTML PART ===
<div dir="ltr">Hello Henry,<br>A lot has happened since we last talked (seemingly years of development in weeks across all kinds of domains including MAMBA2.<br>Are you thinking about using a layered approach where heuristics serve as the first line of defense to filter out the most obvious cases of toxicity, followed by deeper analysis from more sophisticated models like the proposed Cinemaloop BERT. IMO, that would provide a balance between performance and accuracy.<div><br>I watched the video about dating and it did have an effect on me and made a lot of sense.<br>It is also very relatable to what people want versus what they see.<br>Right now the AI universe that Nvidia is trying to build is not quite ready for us all to plug our mind reading EEG caps on and have the system understand what we want in relation to what&#39;s available... But it is something we could prepare for in AI-Human reinforced mind reading in the near future. Some guys are working on this in New York, and that was actually my last research project.<br>   Social Engineering and User Behavior Modification--  <br>In the case of  what that made me think is that developing a more transparent system where users are aware of how their behavior influences their visibility and interactions on the platform would make more sense to me. Implementing community-driven moderation where users can play a role in defining acceptable behaviors would create a self-regulating community. maybe offering moderators coupons or discounts, event invites, or other offerings could make this an attractive user based reward. Of course it will draw more people to use the site more, and could cause some scam problems, but it sounds like a more cost effective and attractive idea that can get more people involved beyond what they are already doing.<br><br><br></div><div><br>In the meantime, 

 OpenAI’s Ada or Babbage models operate at almost the same level as GPT4, but could have been considered cheaper. (not sure if that is true with the new GPT4o model as they are touting it as cheaper),, but I have not looked at the pricing in the last few weeks. Using the smaller models in function calling used to give the same type of natural language use that we would be looking for, while costing a lot less. <br>Of course, right around the beginning of November, the Whale size model will be released and it is expected to be much better and can handle almost everything you are talking about with inference that is not possible anywhere else.<br>I think creating BERT is one of the best ideas for now.</div><div><br> When I was thinking about the platform-level Interventions--<br>I am not sure about the reporting functions you are running, but while promoting positive posts is beneficial, relying solely on algorithmic adjustments might not address the root causes of toxicity.</div><div>Maybe combine algorithmic promotion of positive behavior with user education about the community standards and the consequences of violating them. Also, incorporating a straightforward and accessible reporting system that empowers users to easily report problematic content, with a bot that explains the ideas people have of each other without letting the users know who is actually talking about them.<br><br>And thinking about it, we could assign every person an unseen id number, The system could analyze what those id numbers are doing in a log, and relate the flags, reports, and positive things people are saying to help the AI understand more about them, This could help with what films they are presented in the long run, how their comments are loaded, and a lot of other issues.</div><div><br></div><div><br><p>On a side note, we are moving really fast into the area of instantly producible content with a very simple to use git file: <br><a href="https://youtube.com/watch?v=tR871s1jEQg">https://youtube.com/watch?v=tR871s1jEQg</a>  TL browse (which instantly creates a new page based on what you ask the agent.. just an easy to see example)<br><br>And we can make a lot cheaper agents: (this is really useful for your problem, and looks like what you might really want for some use cases):<br><a href="https://www.youtube.com/watch?v=MGkByeDm-90">https://www.youtube.com/watch?v=MGkByeDm-90</a><br></p><p>At any rate, I think the BERT model is the best for now, if you were to imagine that the instantly creatable content is not worth waiting for.<br>I mean, with that option, we could instantly create a lot of stuff for each individual user id number like I talked about before, that REALLY targeted what that user id wants and is associated with, while lowering the urge to have toxicity inducing content presented to them.<br><br>Just a thought.<br>Jesse</p></div></div><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">On Tue, Jun 4, 2024 at 5:26 PM &lt;<a href="mailto:henry.s@cinemaloop.co">henry.s@cinemaloop.co</a>&gt; wrote:<br></div><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex"><div style="font-size:10pt;font-family:Verdana,Geneva,sans-serif">
<p><span>Hi Jesse,</span></p>
<p><span>Thank you for sending this and your patience.  </span></p>
<p><span>1. I&#39;ve put some more thought into the idea of averaging the scores of multiple NLP models and right now my thinking is that this would not work.  Each model we consider is going to perform better or worse depending on how they&#39;ve been trained and the type of toxicity we are trying to score.  For example if we decided that Hatebase API was an NLP that we wanted to integrate with the Perspective API.<span>  </span><em>&lt;— I’m not proposing this but because it’s no longer officially supported.<span>  </span>Hatebase API just happens to fit nicely into an example type I’d be looking for.<span>  </span></em>I would suspect that one of the models is measurably more accurate in most cases than the other.  Averaging them would only reduce the accuracy in the majority of cases.  My best guess without having done any testing is that the Hatebase API was trained on data similar to what the Perspective API is categorizing as Identity_Attack.<span>  </span>So, it we could test if it scores better then the Perspective API’s Identity_Attack scoring. <span> </span></span></p>
<p style="color:rgb(144,1,18)"><span style="color:rgb(0,0,0);background-color:rgb(255,255,255)"><span>    </span></span><span style="background-color:rgb(255,255,255)">&quot;IDENTITY_ATTACK&quot;</span><span style="color:rgb(0,0,0);background-color:rgb(255,255,255)">: {}, <span>  </span></span><span style="color:rgb(0,0,255)">Hatebase API?</span><span></span></p>
<p><span>So for this example consider Hatebase as an analog for any promising NLP model that covers a type of speech we might want to comparatively evaluate. <span>  </span>We would need to start with AUC-ROC or maybe F1-score for both Perspective and the competing NLP. <span>  </span>If we can determine that nine times out of ten the Hatebase API returns a more accurate toxicity score then Perspectives Identity_Attack scores, we could then choose to replace Perspectives Identity_Attack score with the normalized scores returned by Hatebase API.</span></p>
<p><span>Of course we then except that one in every ten times we will get a less accurate score but this seems far better to me then diminishing the accuracy of both nine times out of ten by averaging or weighting the two against each other.<span>  </span>It’s ok to weight speech subcategories against each other or even exclude things like perspectives flirting score, but no averaging. <span> </span></span></p>
<p><span>With this approach effort is less coding and more about testing if we’ve identified NLP candidates that meet requirements. Being able to return scores with a higher degree of accuracy on speech that Perspective already covers is an entry condition, cost is also factor. <span> </span></span></p>
<p><span>2. Contextual Analysis with GPT-4 of course, but devil is in the details, how does this fit in with Perspective or does it even and what is the cost and burden on Development to maintain it. <span>  </span>The cost of LLM API calls can add up quickly, and integrating such a model would require significant development effort.<span>  </span>APIs for Context Fetching: Integrating multiple APIs (e.g., TMDb) adds complexity and potential costs.<span>  </span>Each API call incurs latency, and handling failures or inconsistencies in data.<span>  </span>Later if this becomes cheaper and easier or if we have the funding to create a team to handle this, but I think this is out of reach at the moment.<span>  </span>That said maybe there’s some budget version AI solution we can build, see below. <span> </span></span><span></span></p>
<p><span>3. Heuristics &lt;-- I&#39;m not a big fan of this idea, too many false positives and false negatives.  </span></p>
<p><span>Yes there are some movies, movie people or post topics that we must be able to detect and handle differently.<span>  </span>Handling differently means things like rate limiting posting or lower the threshold for providing user feedback on toxicity or making people jump through some addition hoops before they can post i.e. reminders to be nice, reminders that we are movie networking platform not a town hall for discussing politics etc, etc.<span>  </span>To make context something we can use in a cost effective way I think we would need to build our own model, BERT being a possible candidate.<span>  </span> Possibly contextual heuristics could be used as a first layer that helps us to decide what data to pass to a custom Cinemaloop BERT model.<span>  </span>This could save money too.</span><span></span></p>
<p><span>Here are the cases I think we’d need to cover -</span></p>
<p><span style="text-decoration:underline">a. Movies that might be problematic &amp; toxic:</span></p>
<p><span>We should be able to train on the data we will have in mongodb.  This means if there are many posts with the same movie id that has a lot of toxic comments we should be consuming all the comments and comment threads with that same movie id, we should also be consuming the data we get back from the moviedb about that movie.<span>  </span>We may need other data to possibly, maybe Internet Movie Script Database (IMSDb) or SimplyScripts.  We should also be able to train on the moviedb info available for the cast and crew for said movies.<span>  </span>It may not be the movie itself creating toxicity, it could be some member or members of the cast and crew.<span>  </span>We should be looking at the ratio of toxic posts for each movie person id.<span>  </span>The output of the model should be identifying<span>  </span>films that might be high risk and label them such that we can automate a more risk averse posting experience for users when they engage on movies identified as high risk. <span> </span></span></p>
<p><br></p>
<p><span>So if for a real world example let’s imagine that we trained our model on 2000 Mules “a 2020 election conspiracy movie” because we notice a stream of toxic conspiracy comments coming from Cinemaloop users.<span>  </span>It could be that we find training data like this for movies that extol or denigrate the virtue of vaccines too.<span>  </span>When we see movies with a lot of toxic posts we’ll get a clearer picture of the types of movies we should be concerned about but more important the our model must be able to bucket movies into various problem themes and flag new movies matching problematic themes as soon as posts appear.<span>  </span>When it’s ready we could point the model at every post that comes in for a movie we haven’t evaluated before.<span>  </span>So if someone makes a post on<strong> Loose Change </strong>“(2005) - A documentary that promotes conspiracy theories about the September 11 attacks, presumably posting something like <em>“This documentary finally reveals the truth about 9/11! The mainstream media won&#39;t tell you this, but Loose Change exposes the undeniable evidence of a government orchestrated attack.”</em> our model could flag it based on the movie theme and the post.<span>  </span>We could then take automated steps like the ones I mentioned above that might help to limit the number of dumpster fires on the platform.  </span></p>
<p><br></p>
<p><span>This can also be very useful for blocking some movies completely.  I&#39;ve attached a screenshot.  Note what I searched for in the upper right, then note the result in the lower right, Tokyo Train Girls.  This is porn that hasn&#39;t been flagged correctly in the MovieDB.  This will surely generate posting activity we don&#39;t want.  This problem isn&#39;t going to go away because of the way the moviedb crowdsources their data.  Last week there were two other JAV films that I went ahead and flagged.<span>  </span>I corrected the data on the movidb side so those two movies don’t show up anymore, but someone has since entered this latest one.  We could use a similar mechanism to block movies like this from showing up in search results regardless of how it&#39;s been flagged in the moviedb.  </span></p>
<p><br></p>
<p><span style="text-decoration:underline">b. People that due to what&#39;s happening with them in the real world might be problematic:</span></p>
<ul>
<li><span>We should be able to train on the data we will have in mongodb.  This means if there&#39;s a person id that has a lot of toxic comments already in mongodb we should be consuming training on the movie persons bio info, gender/age that we get from the moviedb.  the issue here is that this isn&#39;t likely be enough.  If you look up Harvey Weinstein or any other problematic movie person you won&#39;t find out the details you will need to understand that he&#39;s problematic so another data source might be needed. </span></li>
</ul>
<p><br></p>
<p><span style="text-decoration:underline">c. User posts that people might make unrelated to any specific movie:</span></p>
<p><span>If similar to posts that spawned a toxic threads previously, we should flag the thread and provide a more risk avers posting experiance.<span>  </span>This case cannot always be informed by Movie or Movie people contexts because posts within User Groups won’t need to be linked to a movie or person.<span>  </span>In this case we only have what’s in mongo.<span>  </span>This could include evaluating previous posts looking for themes once a problematic post is identified. <span> It could also include consuming the user group bio, movie favs etc.</span></span></p>
<ul>
<li><span>Rinse &amp; repeat.  We should be able to train to id posts that are likely to turn toxic.  </span></li>
</ul>
<p><br></p>
<p><span>4. Social Engineering and User Behavior Modification: &lt;— Yes we’ll A/B test any changes we do here.<span> </span></span></p>
<p><br></p>
<p><span>5. Platform-Level Interventions: &lt;— I want to avoid ever needing to boot people but yes we’ll have to do this from time-to-time.<span>  </span>Rewarding positive posts is something we can do by up-ranking via the feed algorithm that I’ve put forward.<span>  </span>We’ve not implemented this yet but we will. <span> </span></span></p>
<p><br></p>
<p><span>Right now I don’t have the capacity to do more than number one.<span>  </span>Having a clear path to two/three is I think the next step towards managing toxicity.<span>  </span>Four and five, that’s very straight forward stuff that we can tackle as a matter of course.<span>  </span>I’m very familiar with tactics used by hackers and authors of malware etc.. the Bumble idea on women making the first move for a dating app was clever.<span>  </span>I am open to novel ideas like that on social engineering for Cinemaloop.<span>  </span>If you have an idea that you haven’t seen someone try before, maybe it’s worth considering.<span>  </span>;)</span><span></span></p>
<p><span>Thanks</span></p>
<p><br></p>
<p><span>Henry</span></p>
<p id="m_-7482973412499874712v1reply-intro">On 2024-05-22 13:38, Jesse Daniel Brown wrote:</p>
<blockquote type="cite" style="padding:0px 0.4em;border-left:2px solid rgb(16,16,255);margin:0px">
<div id="m_-7482973412499874712v1replybody1">
<div dir="ltr">
<p>Hi Henry,</p>
<p>Thank you for your detailed feedback and for outlining the specifics. I appreciate the insights and agree that handling toxicity effectively requires a nuanced approach that takes context into account.</p>
<p>Based on your feedback, here are some refined suggestions:</p>
<ol>
<li>
<p><strong>Multi-Model Sentiment Analysis:</strong> Given the limitations you&#39;ve encountered with a single API, you could implement a multi-model approach. This involves running comments through multiple sentiment analysis APIs (e.g., Google&#39;s Perspective API and an in-house NLP model using NLTK or SpaCy) and aggregating the results to improve accuracy. This hybrid approach could help mitigate false positives and negatives by leveraging the strengths of each model.</p>
<p><strong>Example Implementation:</strong></p>
<div>
<div>python
<div> </div>
</div>
<div dir="ltr"><code><span>import</span> requests

<span>def</span> <span>get_perspective_score</span>(<span>text, api_key</span>):
    url = <span>&quot;<a href="https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze" rel="noopener noreferrer" target="_blank">https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze</a>&quot;</span>
    data = {
        <span>&#39;comment&#39;</span>: {<span>&#39;text&#39;</span>: text},
        <span>&#39;languages&#39;</span>: [<span>&#39;en&#39;</span>],
        <span>&#39;requestedAttributes&#39;</span>: {<span>&#39;TOXICITY&#39;</span>: {}}
    }
    response = <a href="http://requests.post" rel="noopener noreferrer" target="_blank">requests.post</a>(url, json=data, headers={<span>&quot;Authorization&quot;</span>: <span>f&quot;Bearer <span>{api_key}</span>&quot;</span>})
    <span>return</span> response.json()

<span>def</span> <span>get_custom_nlp_score</span>(<span>text</span>):
    <span># Placeholder for custom NLP analysis logic</span>
    <span>return</span> {<span>&quot;toxicity&quot;</span>: <span>0.5</span>}

comment = <span>&quot;I hate you!&quot;</span>
perspective_score = get_perspective_score(comment, <span>&quot;YOUR_PERSPECTIVE_API_KEY&quot;</span>)
custom_score = get_custom_nlp_score(comment)

<span># Aggregate scores</span>
combined_score = (perspective_score[<span>&#39;attributeScores&#39;</span>][<span>&#39;TOXICITY&#39;</span>][<span>&#39;summaryScore&#39;</span>][<span>&#39;value&#39;</span>] + custom_score[<span>&#39;toxicity&#39;</span>]) / <span>2</span>
<span>print</span>(<span>f&quot;Combined toxicity score: <span>{combined_score}</span>&quot;</span>)
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
<div>
<div>yaml
<div> </div>
</div>

```

*(truncated at 50KB — full body is 70499 bytes, sha256 is of the full body)*