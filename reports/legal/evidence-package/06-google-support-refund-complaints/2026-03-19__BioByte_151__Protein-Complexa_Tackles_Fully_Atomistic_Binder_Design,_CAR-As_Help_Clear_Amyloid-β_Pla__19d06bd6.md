---
gmail_message_id: 19d06bd611f993ca
account: plasmatoid@gmail.com
date_header: Thu, 19 Mar 2026 15:35:27 +0000
from: Decoding Bio  <decodingbio@substack.com>
to: plasmatoid@gmail.com
subject: BioByte 151: Protein-Complexa Tackles Fully Atomistic Binder Design, CAR-As Help Clear Amyloid-β Plaques, How Gran…
body_sha256: 9088733846c6a1f633783d706427aab4f45eb0cb22039284ce3f1d8753e33b0e
snippet: Welcome to Decoding Bio&#39;s BioByte: each week our writing collective highlight notable news—from the latest scientific papers to the latest funding rounds—and everything in between. ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏
---

# BioByte 151: Protein-Complexa Tackles Fully Atomistic Binder Design, CAR-As Help Clear Amyloid-β Plaques, How Gran…

**From:** Decoding Bio  <decodingbio@substack.com>
**To:** plasmatoid@gmail.com
**Date:** Thu, 19 Mar 2026 15:35:27 +0000
**SHA256:** `9088733846c6a1f633783d706427aab4f45eb0cb22039284ce3f1d8753e33b0e`

## Body (extracted text)

View this post on the web at https://decodingbio.substack.com/p/biobyte-151-protein-complexa-tackles Welcome to Decoding Bio [ https://substack.com/redirect/b402c076-9b00-4fa6-af59-4cddf98efc87?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]’s BioByte: each week our writing collective highlight notable news—from the latest scientific papers to the latest funding rounds—and everything in between. All in one place. What we read Blogs The Regeneration-Cancer Tradeoff [ https://substack.com/redirect/d12dd5b2-94e6-4362-8a65-4fc18adfa8e2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Karlin Compton, Proof Of Compton, March 2026] Humans are deficient in true regenerative capabilities, being limited to repairing blood, gut lining, skin, and parts of the liver rather than the entire body. The regeneration that does occur mostly proceeds through signaling via growth factors such as FGF and VEGF, which can help to temporarily induce a state closer to that of stem cells near damaged tissue until healing is complete. In contrast, these same growth factors and signaling modes often remain uninhibited or permanently active in cancers, netting them the description of “the wound that never heals”. Given these observations, Compton argues the limitation on humanity’s ability to truly regenerate is due to the similar biological machinery and pathways shared between regenerative capabilities and the growth and propagation of cancers. Relative to species which can regenerate more fully, human evolution proceeded along a more conservative path. The epithelial-mesenchymal transition (EMT) and dedifferentiation are two examples Compton provides for the similarity between regeneration and cancer. In the EMT, the adherence of some cells to the epithelial layers is relaxed, affording them migratory capabilities. This process is an essential part of transporting necessary cells to the site of a wound, but it is also one of the ways in which cancers are able to metastasize, making too much promiscuity in the EMT process a significant danger. In dedifferentiation, specialized cells are transformed into more labile forms, allowing them to participate in regeneration. However, the modifications that occur during this process closely resemble that of cancer cells such as epigenetic remodeling and a loosening of the cell’s regulatory architecture. Labile cells which can readily propagate could either be a recipe for limb regeneration or cancer. Compton suggests that in regenerative creatures (like zebrafish, salamanders, and planaria) processes like EMT and dedifferentiation are highly regulated such that when they have fulfilled their purpose, they are shut down, drawing the conclusion that the difference between regeneration and cancer arises from differences in control and regulation. It will be interesting to follow along as more research is done to understand what controls these regenerative behaviors, how it relates to cancer formation, and what specific mechanisms are at play which inhibit cancer formation and propagation. Papers Scaling Atomistic Protein Binder Design with Generative Pretraining and Test-Time Compute [ https://substack.com/redirect/d59a1983-e1db-45c1-a733-1379e9fa635f?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Didi et al., preprint, March 2026] Why it matters: Proteina-Complexa is a fully atomistic binder design tool that marries conditional generation methods and structure-based hallucination tools to deliver significant performance gains across a range of binder design challenges. The framework is also accompanied with rigorous wet lab validation that showcases its potential beyond in silico benchmarking. Building on their previous work from La Proteina [ https://substack.com/redirect/e66bcf61-85c9-4fd8-9ae0-3dd84524b4f1?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], the Fundamental Generative AI Research (GenAIR) Group at NVIDIA released Proteina-Complexa, a new framework to tackle fully atomistic binder design challenges. The development of Proteina-Complexa is grounded in the idea that the current dichotomy of binder generation methods is ripe for optimization. Briefly, binder generation methods fall under two classes - generative or hallucination-based - with the former (like RFDiffusion) approach relying on conditional generation processes while the latter (like BindCraft) uses gradients from structure predictors to iteratively refine a candidate design. The authors argue that this division is in stark contrast to the integrated framework of generative priors and inference-time scaling of leading language and vision models. In this paper Didi et al. present Proteina-Complexa as “the first binder design framework that unifies a strong flow-based base generative model with flexible inference-time optimization utilizing the generative prior, combining the strengths of both.” Proteina-Complexa reframes La-Proteina’s partially latent flow matching objective and applies it to conditional binder design. Specifically, the model uses an autoencoder to encode alpha-carbon backbone coordinates to control basic structure and uses latent variables for each residue to control amino acid properties and side chain geometries. To adapt this framework for binder design, the team introduced a target-conditioned denoiser that concatenates embedded target features with the binder’s latent representation before passing them to transformer layers that can process the joint embeddings. To leverage the benefits of structure-based hallucination methods, Proteina-Complexa uses structure prediction confidence metrics and interface bond energies to steer the generative diffusion process. In parallel, the team also used a range of test-time compute scaling approaches like growing the candidate pool, balancing exploration and exploitation with Monte Carlo tree searches, and varying reward-based strategies for goals like increasing interface hydrogen bonds. Apart from model architecture developments, other significant contributions include the development of the Teddymer Dataset, meant to bridge the gap in experimentally resolved multimers for paired binder-target training data. The team split the AlphaFold Database (AFDB) into individual domains and curated a set of synthetic dimers, yielding a dataset (Teddymer) much larger than the standard PDB. Proteina-Complexa was trained across four stages of data, starting with AFDB monomers followed by Teddymer dimers, before moving on to PDB multimers and protein-ligand pairs from the PLINDER dataset to give the model access to a wide variety of binder-target pairs. The benefits of this training regime were evident from both in silico benchmarks and an extensive wet lab validation campaign. Across a range of targets, the model generally outperformed conditional generation methods like RFDiffusion and Protpardelle-1c, while also outperforming tools like BoltzDesign, BindCraft, and AlphaDesign across a range of inference-time scaling approaches. Finally, Proteina-Complexa’s predictions showed promising wet lab performance, with the model demonstrating high hit rates and picomolar affinities for certain targets, while also designing the first known successful de novo carbohydrate binders. The wet lab performance is outlined in a separate manuscript [ https://substack.com/redirect/cc6286e9-76fe-45b9-822e-e550e7ab8896?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. In summary, the combination of promising performance across computational and wet lab benchmarks reaffirms the potential of generative design methodologies that can merge conditional generation and hallucination-based approaches. Targeting amyloid-β pathology by chimeric antigen receptor astrocyte (CAR-A) therapy [ https://substack.com/redirect/1ad58505-89ee-457e-959f-6669e4bb95f8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Chen et al., Science, March 2026] Why it matters: Chen et al. develop a new strategy to clear amyloid-β plaques, opening up a new avenue for anti-Aβ therapeutics. By arming astrocytes with chimeric antigen receptors (CARs), they enable these cells to degrade Aβ plaques through phagocytosis, leading to reduced plaque burden in mouse models. Even though anti-amyloid antibodies have now reached the clinic for Alzheimer’s treatment, it remains unclear how much plaque removal translates into meaningful disease modification. These therapies also come with real tradeoffs, including repeated high-dose administration, narrow treatment windows, and safety concerns such as amyloid-related imaging abnormalities. Instead of relying on antibodies to recruit endogenous phagocytes, the authors asked whether they could directly reprogram brain glia to recognize and clear amyloid-β themselves. Others have explored similar CAR-based approaches in microglia or myeloid cells, but these strategies face a key challenge: resident microglia are difficult to replace at scale, and engineered myeloid cells have not demonstrated durable, brain-wide activity in vivo. The authors instead turned to astrocytes, which are broadly distributed throughout the brain, already participate in phagocytic processes, and are accessible via CNS-tropic AAV delivery. To build the system, the team fused anti-amyloid single-chain antibody fragments to intracellular signaling domains from phagocytic receptors, creating four FcRγ-independent CAR designs for astrocytes. In their initial screen, they paired a crenezumab-derived scFv (targeting Aβ) with signaling domains from MEGF10, Dectin1, MERTK, or CD3ζ. After validating function in vitro, they moved in vivo to test whether these engineered astrocytes could meaningfully reduce amyloid burden and associated pathology. A single AAV-delivered dose administered after plaque formation reduced amyloid burden by about half in 5xFAD mice and decreased neuritic dystrophy, while earlier administration, prior to plaque deposition, strongly suppressed subsequent amyloid accumulation and related pathology. While this in vivo engineering strategy effectively reduces plaque burden, the authors highlight several limitations and areas for further development. Despite robust amyloid clearance, synaptic rescue was only partial, and the therapy may lead to overpruning of healthy synapses. Improvements in overall neural health were also limited, though this remains difficult to interpret given known constraints of the mouse model and broader uncertainty in the field around whether amyloid clearance alone is sufficient to restore function. Still, as a first demonstration of CAR-armed astrocytes operating in vivo, this represents a compelling proof of concept, and it will be exciting to see how the field iterates on construct design, safety, and cell-type targeting moving forward. Granule cells reorient cortical manifolds to separate contexts but preserve their geometry [ https://substack.com/redirect/d671ad9b-8e4e-44ee-ad9b-9af3e0d9c1b4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Garcia-Garcia et al., bioRxiv, March 2026] Why it matters: To learn effectively, animals must generalize across related experiences while still distinguishing between them – a fundamental computational tradeoff. Generalization is supported by low-dimensional neural manifolds found throughout the neocortex which accelerate learning by constraining activity to a small number of task-relevant axes. Conversely, context separation is classically attributed to neural expansion layers – most famously, cerebellar granule cells (GrCs) – that project overlapping inputs into high-rank feature spaces to separate them. However, high-rank expansion ‘shatters’ the smooth structure required for continuous prediction and generalization, creating an apparent paradox. Garcia-Garcia et al. resolve it by simultaneously imaging premotor cortical output neurons (layer 5 pyramidal tract cells, L5PT) and GrCs during parallel skill learning, revealing that GrCs reject high-dimensional expansion. Instead, they perform structured affine transformations – rotating cortical manifolds apart across contexts while rigorously preserving their low-rank geometry within each. Using a custom dual-site two-photon microscope, the authors tracked the same L5PT and GrC populations across two tasks with shared temporal structure (action → delay → reward) but distinct sensorimotor demands (forelimb reach vs VR locomotion) in 9 mice. Within each task, GrCs faithfully preserved cortical manifold structure: comparably dense, temporally organized, and low-rank (~4-5 effective dimensions by participation ratio, a measure of dimensionality based on eigenvalue spectra). Across tasks, however, the populations diverged. L5PT modes generalized strongly (cross-task r = 0.83), while GrC modes remapped nearly completely (r = 0.24) – despite stable coupling between the two regions. Representational similarity analysis of neural activity showed GrCs preserved within-task cortical geometry with high fidelity (Spearman ρ = 0.82) but diverged across tasks (ρ = 0.48). GrC manifolds rotated significantly further apart than L5PT manifolds across contexts, and this separation grew with dual-task proficiency (ρ = 0.6): as behavior converged across tasks, GrC representations became more distinct. To test whether this strategy confers a computational advantage, the authors simulated alternating two-task learning in a cerebellar-like circuit, comparing three GrC architectures: one that simply relays cortical geometry, one that shatters it via classical sparse expansion, and one that rotates manifolds apart (matching their data). The relay learned quickly but suffered catastrophic forgetting between tasks due to overlapping representations. Sparse expansion avoided forgetting but learned very slowly – shattering the geometry destroyed the smooth structure needed for temporal prediction. The rotation model achieved both: fast learning and resistance to interference. The authors propose that context-dependent rescaling of inputs to GrCs could generate these rotations, but this mechanism remains unvalidated. Interesting open questions follow from these experiments – including whether the motif extends to other pathways and expansion architectures (ex. piriform cortex, dentate gyrus) and quantifying the manifold packing capacities for different contexts. If this generalizes, coherent manifold reorientation may represent a broadly applicable blueprint for continuous prediction and control for neuroscientific and engineered systems. Notable deals Unnatural Products raises a $45M Series B round led by The Venture Collective (TVC). [ https://substack.com/redirect/2a56b382-b211-4eeb-ac5d-c3c7ba152462?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] The company is seeking to unlock an entirely new class of drugs: oral synthetic macrocyclic peptides. Previously only able to be targeted via costly injectables, Unnatural Products is using their proprietary platform to go after historically undruggable targets, having inked an impressive partnership with Novartis worth $100M upfront with $1.7B in potential milestones to go after such elusive targets in the cardiovascular domain just last month. The company has additional established collaborations with Merck, BridgeBio, and argenyx spanning multiple therapeutic areas whilst advancing their own pipeline of treatments for cardiometabolic, autoimmune, and inflammatory indications. Other investors participating in the round include argenx, Droia Ventures and existing investors Merck Global Health Innovation Fund, Artis Ventures, and First Spark Ventures. Vima Therapeutics announces $40M Series A extension as first patient is dosed in Phase 2 dystonia study. [ https://substack.com/redirect/d2fcd322-6041-4bf8-bd22-116ec1241105?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] The movement disorders-focused biotech is aiming at a potential first-in-class therapeutic for dystonia and Parkinson’s disease, which share underlying disease biology consisting of dopaminergic and acetylcholinergic signalling imbalances in the brain. Vima’s lead candidate, VIM0423, is a once-daily oral drug intended to selectively target muscarinic cholinergic receptors in the brain, a target established as effective, but one that has been limited by tolerability issues. VIM0423 seeks to address these tolerability challenges whilst still maintaining maximum efficacy. The potential treatment was awarded Fast Track designation by the FDA and is moving into Phase 2 clinical trials, having just completed a two-part Phase 1 study assessing pharmacokinetics, safety, tolerability, and dose titration. Funding from this round—which saw participation from new investor, Frazier Life Sciences, as well as from existing investors, Atlas Ventures, Access Industries, and Canaan Partners—will support this ongoing Phase 2. Crossbow Therapeutics closes $77M Series B led by Taiho Ventures and Arkin Bio Capital. [ https://substack.com/redirect/a575283b-418e-4e4a-86a0-05e16398a32a?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Armed with a portfolio of novel precision antibody drugs, Crossbow is aiming at treating a broad range of cancers. Their proprietary immunotherapies—dubbed T-Bolt™ molecules—consist of T cell engagers (TCE) targeting peptide human leukocyte antigen (pHLA) located on cancer cells via T cell mimetics (antibodies that resemble T cell receptors). This funding will bolster the company’s lead candidate, CBX-250, a first-in-class TCE through the CROSSCHECK-001 Phase 1 clinical trial which is set to evaluate the therapeutic in patients experiencing relapsed and refractory myeloid malignancies across acute myeloid leukemia, chronic myeloid leukemia, myelodysplastic syndromes, and chronic myelomonocytic leukemia. The Series B will additionally serve to advance other promising TCE assets such as CBX-663 which targets a telomerase reverse transcriptase (TERT)-derived pHLA for the treatment of multiple hematologic and solid tumors. CBX-663 is currently slated for IND submission. Other investors in the round include new adds: Sixty Degree Capital, Hamilton Square Partners Management LP, LifeLink Ventures, Libbs Ventures, and Blood Cancer United’s Therapy Acceleration Program (TAP), as well as existing investors MPM BioImpact, Pfizer Ventures, BVF Partners, Polaris Partners, Eli Lilly and Company, and Mirae Asset Venture Investment. With a $77.5 million, oversubscribed Series A, R1 Therapeutics launches to treat chronic kidney disease. [ https://substack.com/redirect/284478ed-dc3e-42dc-a252-074690a934af?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] In addition to the announcement of the raise, R1 also publicized the acquisition of the development and commercialization rights to AP306—a pan phosphate transporter inhibitor—outside of China from Alebund Pharmaceuticals. The asset is scheduled to enter Phase 2b trials for hyperphosphatemia in patients with chronic kidney disease later in 2026. Phase 2a results showed significant reduction in serum phosphate levels thanks to the ability of AP306 to block the active transport of phosphate, unlike other therapies which only block passive transport. Abingworth, DaVita Venture Group, and F-Prime led the round while Curie.Bio, SymBiosis, and U.S. Renal Care also participated. In case you missed it Breakout Ventures Launches Fund III with $114M to Continue Building the Future Powered by Science [ https://substack.com/redirect/7b7d89fe-0aa2-4ffb-ac58-0f0b4d406978?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Droplet Biosciences Accelerates Residual Cancer Detection with NVIDIA [ https://substack.com/redirect/07e3f7ac-4e26-4c06-b47e-b8e1829e57a2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Basecamp Research Launches Trillion Gene Atlas to Scale AI-Designed Therapeutics in Partnership with Anthropic, Ultima Genomics, and PacBio [ https://substack.com/redirect/735e2ba1-3684-4e9d-b9c0-a2314bfec0a4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Single–amino acid variants in target epitopes can confer resistance to antibody-based therapies | Science Translational Medicine [ https://substack.com/redirect/30d8ca31-0204-41d5-bf4e-6624d2ce9483?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Exploring the Scaling Laws of Consumer EEG: Introducing Alljoined-1.6M [ https://substack.com/redirect/0c9b3632-6d4d-4d18-aed7-6e8a55a08f37?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] What we liked on socials channels Bonus content: everyone online is buzzing about the new LinkedIn Speak translator [ https://substack.com/redirect/f9a30f84-920f-476b-a7e5-993c2ad35549?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] so we had to check it out ourselves (don’t worry we love decoding! ok now back to proofreading 🤓) Field Trip Did we miss anything? Would you like to contribute to Decoding Bio by writing a guest post? Drop us a note here [ mailto:pablo@decodingbio.com ] or chat with us on Twitter: @decodingbio [ https://substack.com/redirect/4c30eea5-1227-42fb-8fe1-7b3e2b5a11a2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. Unsubscribe https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9kZWNvZGluZ2Jpby5zdWJzdGFjay5jb20vYWN0aW9uL2Rpc2FibGVfZW1haWw_dG9rZW49ZXlKMWMyVnlYMmxrSWpveU1ESTROelE0TWpJc0luQnZjM1JmYVdRaU9qRTVNVFExTXpBM055d2lhV0YwSWpveE56Y3pPVE0wTlRZeUxDSmxlSEFpT2pFNE1EVTBOekExTmpJc0ltbHpjeUk2SW5CMVlpMHhNRGM1TkRrNElpd2ljM1ZpSWpvaVpHbHpZV0pzWlY5bGJXRnBiQ0o5LlkwTnVrMjNrSEMxYXh1dzBIQ0JDZldpNmd1X2RubS1DWTNZUGM5ZEJEV2MiLCJwIjoxOTE0NTMwNzcsInMiOjEwNzk0OTgsImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzczOTM0NTYyLCJleHAiOjIwODk1MTA1NjIsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.FG3WOHakWdtNovn7gdMP91wlZasf11hTJ1LN0TRFYeU? === HTML PART === BioByte 151: Protein-Complexa Tackles Fully Atomistic Binder Design, CAR-As Help Clear Amyloid-&#946; Plaques, How Granule Cells Enable Effective Learning, and the Tradeoff Between Regeneration and Cancer @media (max-width: 1024px) { .typography .pullquote-align-left, .typography.editor .pullquote-align-left, .typography .pullquote-align-right, .typography.editor .pullquote-align-right, .typography .pullquote-align-wide, .typography.editor .pullquote-align-wide, .typography .pullquote-align-center, .typography.editor .pullquote-align-center { float: none; margin: 0 auto; width: 100%; max-width: 100%; } } @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) { .typography .markup table.image-wrapper img, .typography.editor .markup table.image-wrapper img, .typography .markup table.kindle-wrapper img, .typography.editor .markup table.kindle-wrapper img { max-width: 550px; } } @media (min-width: 1024px) { .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } .typography:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (min-width: 1300px) { .typography .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } .typography .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (max-width: 1024px) { .typography, .typography.editor { /* Disable offset on mobile/tablet */ } .typography .captioned-image-container figure:has(> a.image2-align-left), .typography.editor .captioned-image-container figure:has(> a.image2-align-left), .typography .captioned-image-container figure:has(> a.image2-align-right), .typography.editor .captioned-image-container figure:has(> a.image2-align-right) { float: none; margin: 1em auto; max-width: 100%; width: auto; padding: 0; } .typography .captioned-image-container figure:has(> a.image2-align-left.thefp), .typography.editor .captioned-image-container figure:has(> a.image2-align-left.thefp), .typography .captioned-image-container figure:has(> a.image2-align-right.thefp), .typography.editor .captioned-image-container figure:has(> a.image2-align-right.thefp) { margin: 1em auto; } .typography .captioned-image-container figure:has(> a.image2-offset-left), .typography.editor .captioned-image-container figure:has(> a.image2-offset-left), .typography .captioned-image-container figure:has(> a.image2-offset-right), .typography.editor .captioned-image-container figure:has(> a.image2-offset-right) { margin: 1em auto; } .typography .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, .typography.editor .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, .typography .captioned-image-container figure:has(> a.image2-align-right) .image2-inset, .typography.editor .captioned-image-container figure:has(> a.image2-align-right) .image2-inset { display: block; justify-content: initial; } } @media (max-width: 768px) { .typography .markup div.sponsorship-campaign-embed, .typography.editor .markup div.sponsorship-campaign-embed { margin-top: 24px; margin-bottom: 24px; } .typography .markup div.sponsorship-campaign-embed:first-child, .typography.editor .markup div.sponsorship-campaign-embed:first-child { margin-top: 0px; } } @media screen and (max-width: 650px) { .typography .markup div.youtube-overlay, .typography.editor .markup div.youtube-overlay, .typography .markup div.vimeo-overlay, .typography.editor .markup div.vimeo-overlay { display: none !important; } } @media screen and (max-width: 370px) { .typography .markup div.tiktok-wrap, .typography.editor .markup div.tiktok-wrap { width: calc(95vw - 32px); height: calc((95vw - 32px - 2px) / 0.485714); } } @media screen and (max-width: 650px) { .typography .markup div.embedded-publication-wrap .embedded-publication.show-subscribe, .typography.editor .markup div.embedded-publication-wrap .embedded-publication.show-subscribe { padding: 24px; } } @media screen and (max-width: 650px) { .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe, .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe { padding: 0px 24px; } } @media screen and (max-width: 650px) { .typography .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, .typography.editor .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button { padding: 10px 12px; min-width: 110px; } } @media (max-width: 650px) { .typography .markup .twitter-embed, .typography.editor .markup .twitter-embed, .typography .markup .tweet, .typography.editor .markup .tweet { padding: 12px; } } @media (max-width: 650px) { .typography .markup .twitter-embed .tweet-text, .typography.editor .markup .twitter-embed .tweet-text, .typography .markup .tweet .tweet-text, .typography.editor .markup .tweet .tweet-text { font-size: 14px; line-height: 20px; } } @media (max-width: 650px) { .typography .markup .twitter-embed .tweet-photos-container.two, .typography.editor .markup .twitter-embed .tweet-photos-container.two, .typography .markup .tweet .tweet-photos-container.two, .typography.editor .markup .tweet .tweet-photos-container.two, .typography .markup .twitter-embed .tweet-photos-container.three, .typography.editor .markup .twitter-embed .tweet-photos-container.three, .typography .markup .tweet .tweet-photos-container.three, .typography.editor .markup .tweet .tweet-photos-container.three, .typography .markup .twitter-embed .tweet-photos-container.four, .typography.editor .markup .twitter-embed .tweet-photos-container.four, .typography .markup .tweet .tweet-photos-container.four, .typography.editor .markup .tweet .tweet-photos-container.four { height: 200px; } } @media (max-width: 650px) { .typography .markup .twitter-embed a.expanded-link .expanded-link-img, .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-img, .typography .markup .tweet a.expanded-link .expanded-link-img, .typography.editor .markup .tweet a.expanded-link .expanded-link-img { max-height: 180px; } } @media (max-width: 650px) { .typography .markup .twitter-embed a.expanded-link .expanded-link-description, .typography.editor .markup .twitter-embed a.expanded-link .expanded-link-description, .typography .markup .tweet a.expanded-link .expanded-link-description, .typography.editor .markup .tweet a.expanded-link .expanded-link-description { display: none; } } @media screen and (max-width: 650px) { .typography .markup .apple-podcast-container, .typography.editor .markup .apple-podcast-container { width: unset; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed img.install-substack-app-embed-img, .typography.editor .markup .install-substack-app-embed img.install-substack-app-embed-img { margin: 0 auto 16px auto; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed .install-substack-app-embed-text, .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-text { margin: 0 0 12px 0; max-width: 100%; width: auto; text-align: center; } } @media (max-width: 420px) { .typography .markup .install-substack-app-embed .install-substack-app-embed-link, .typography.editor .markup .install-substack-app-embed .install-substack-app-embed-link { display: flex; justify-content: center; } } @media screen and (min-width: 481px) { .share-button-container { height: 38px; } } @media screen and (min-width: 481px) { .share-button-container a.comment { height: 38px; line-height: 38px; padding-right: 10px; } } @media screen and (max-width: 480px) { .share-button-container .separator { display: block; margin: 0; height: 8px; border-left: none; } } @media screen and (max-width: 480px) { .share-button-container a.share.first img { padding-left: 0; } } @media screen and (min-width: 481px) { .share-button-container a.mobile { display: none !important; } } @media screen and (min-width: 541px) { .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container { padding: 36px; height: 680px; } } @media screen and (min-width: 541px) { .settings-add-pub-modal-wrapper .container .add-recommending-pub-modal-container .footer { position: absolute; bottom: 36px; margin: 0px; } } @media screen and (max-width: 650px) { .header-anchor-parent { display: none; } } @media screen and (max-width: 768px) { .post { padding: 16px 0 0 0; } } @media screen and (max-width: 650px) { .post .post-header .post-label { margin-top: 8px; } } @media screen and (max-width: 650px) { .post .post-header .meta-author-wrap.alternative-meta .meta-right-column .post-meta { margin-top: 6px; } } @media screen and (max-width: 650px) { .post .footer-facepile-container { height: 64px; padding: 0 16px; display: flex; align-items: center; justify-content: flex-start; width: 100%; } } @media screen and (max-width: 650px) { .post .post-footer.use-separators { justify-content: center; } } @media screen and (max-width: 650px) { .post .post-footer.next-prev { height: 64px; justify-content: space-between; box-sizing: border-box; } } @media screen and (max-width: 650px) { .post-contributor-footer .post-contributor-bio-table { display: block; } .post-contributor-footer .post-contributor-bio-table-row { display: flex; flex-direction: row; } .post-contributor-footer .post-contributor-bio-userhead-cell, .post-contributor-footer .post-contributor-bio-body-cell { display: block; } .post-contributor-footer .post-contributor-bio-body-cell { flex-grow: 1; } .post-contributor-footer .post-contributor-bio-body-table { display: block; } .post-contributor-footer .post-contributor-bio-body-table-row { display: block; } .post-contributor-footer .post-contributor-bio-copy-cell, .post-contributor-footer .post-contributor-bio-controls-cell { display: block; } .post-contributor-footer .post-contributor-bio-copy-cell { margin: 0 0 16px 0; } .post-contributor-footer .post-contributor-bio-controls-cell { width: auto; } .post-contributor-footer .post-contributor-bio-controls { margin: auto; } .post-contributor-footer .post-contributor-bio-controls .button.primary { width: 100%; } .post-contributor-footer .post-contributor-bio-text { font-size: 14px; } } @media screen and (min-width: 768px) { .post-silhouette { padding: 32px 0; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-title { margin-top: 10.44225025px; height: 120px; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-meta { width: 75%; } } @media screen and (max-width: 650px) { .post-silhouette .post-silhouette-meta.with-byline-image { margin: 20px 0; } } @media screen and (max-width: 650px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item, .post-meta.alternative-meta .post-meta-item { padding-right: 16px; } } @media screen and (max-width: 370px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item, .post-meta.alternative-meta .post-meta-item { font-size: 14px; } } @media screen and (max-width: 650px) { .use-theme-bg .post-meta.alternative-meta .post-meta-item.guest-author-publication, .post-meta.alternative-meta .post-meta-item.guest-author-publication { display: none; } } @media screen and (max-width: 370px) { .post-meta .post-meta-item .post-meta-button { height: 36px !important; /* important to override in-line height style on emails */ } .post-meta .post-meta-item .post-meta-button .meta-button-label { display: none; } .post-meta .post-meta-item .post-meta-button > svg { margin-right: 0; } } @media screen and (max-width: 370px) { .post-meta .post-meta-item { font-size: 12px; } } @media screen and (max-width: 650px) { .post .floating-subscribe-button { bottom: 20px; right: 20px; } } @media (max-width: 1024px) { body .pullquote-align-left, body .pullquote-align-right, body .pullquote-align-wide, body .pullquote-align-center { float: none; margin: 0 auto; width: 100%; max-width: 100%; } } @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) { body .markup table.image-wrapper img, body .markup table.kindle-wrapper img { max-width: 550px; } } @media (min-width: 1024px) { body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } body:not(:has(#toc)) .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (min-width: 1300px) { body .captioned-image-container figure:has(> a.image2-offset-left) { margin-left: var(--image-offset-margin); } body .captioned-image-container figure:has(> a.image2-offset-right) { margin-right: var(--image-offset-margin); } } @media (max-width: 1024px) { body { /* Disable offset on mobile/tablet */ } body .captioned-image-container figure:has(> a.image2-align-left), body .captioned-image-container figure:has(> a.image2-align-right) { float: none; margin: 1em auto; max-width: 100%; width: auto; padding: 0; } body .captioned-image-container figure:has(> a.image2-align-left.thefp), body .captioned-image-container figure:has(> a.image2-align-right.thefp) { margin: 1em auto; } body .captioned-image-container figure:has(> a.image2-offset-left), body .captioned-image-container figure:has(> a.image2-offset-right) { margin: 1em auto; } body .captioned-image-container figure:has(> a.image2-align-left) .image2-inset, body .captioned-image-container figure:has(> a.image2-align-right) .image2-inset { display: block; justify-content: initial; } } @media (max-width: 768px) { body .markup div.sponsorship-campaign-embed { margin-top: 24px; margin-bottom: 24px; } body .markup div.sponsorship-campaign-embed:first-child { margin-top: 0px; } } @media screen and (max-width: 650px) { body .markup div.youtube-overlay, body .markup div.vimeo-overlay { display: none !important; } } @media screen and (max-width: 370px) { body .markup div.tiktok-wrap { width: calc(95vw - 32px); height: calc((95vw - 32px - 2px) / 0.485714); } } @media screen and (max-width: 650px) { body .markup div.embedded-publication-wrap .embedded-publication.show-subscribe { padding: 24px; } } @media screen and (max-width: 650px) { body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe, body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe, body .markup div.captioned-button-wrap .subscription-widget.show-subscribe { padding: 0px 24px; } } @media screen and (max-width: 650px) { body .markup div.subscription-widget-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button, body .markup div.subscription-widget-wrap-editor .subscription-widget.show-subscribe .subscription-widget-subscribe .button, body .markup div.captioned-button-wrap .subscription-widget.show-subscribe .subscription-widget-subscribe .button { padding: 10px 12px; min-width: 110px; } } @media (max-width: 650px) { body .markup .twitter-embed, body .markup .tweet { padding: 12px; } } @media (max-width: 650px) { body .markup .twitter-embed .tweet-text, body .markup .tweet .tweet-text { font-size: 14px; line-height: 20px; } } @media (max-width: 650px) { body .markup .twitter-embed .tweet-photos-container.two, body .markup .tweet .tweet-photos-container.two, body .markup .twitter-embed .tweet-photos-container.three, body .markup .tweet .tweet-photos-container.three, body .markup .twitter-embed .tweet-photos-container.four, body .markup .tweet .tweet-photos-container.four { height: 200px; } } @media (max-width: 650px) { body .markup .twitter-embed a.expanded-link .expanded-link-img, body .markup .tweet a.expanded-link .expanded-link-img { max-height: 180px; } } @media (max-width: 650px) { body .markup .twitter-embed a.expanded-link .expanded-link-description, body .markup .tweet a.expanded-link .expanded-link-description { display: none; } } @media screen and (max-width: 650px) { body .markup .apple-podcast-container { width: unset; } } @media (max-width: 420px) { body .markup .install-substack-app-embed img.install-substack-app-embed-img { margin: 0 auto 16px auto; } } @media (max-width: 420px) { body .markup .install-substack-app-embed .install-substack-app-embed-text { margin: 0 0 12px 0; max-width: 100%; width: auto; text-align: center; } } @media (max-width: 420px) { body .markup .install-substack-app-embed .install-substack-app-embed-link { display: flex; justify-content: center; } } @media screen and (min-width: 500px) { body .header a.logo { width: 42px; height: 42px; border-radius: 12px; } } @media screen and (max-width: 420px) { body .subscription-receipt table:first-of-type .subscription-amount .subscription-discount { width: 72px !important; } } @media screen and (min-width: 481px) { body .share-button-container { height: auto; } } @media screen and (max-width: 480px) { body .share-button-container .separator { display: block !important; margin: 0 !important; height: 8px !important; border-left: none !important; } } @media screen and (max-width: 650px) { .digest .item .post-meta-item.audience { display: none; } } @media screen and (min-width: 500px) { .digest-publication .logo img { width: 42px; height: 42px; border-radius: 8px; } } @media screen and (max-width: 650px) { .comments-page .container .comment-list .collapsed-reply { margin-left: calc(10 + 32px - 24px); } } @media screen and (max-width: 650px) { .comment > .comment-list { padding-left: 24px; } } @media screen and (max-width: 650px) { .finish-magic-login-modal .modal-content .container { padding: 24px 0; } } @media (max-width: 650px) { .reader2-text-b3 { line-height: 24px; } } @media screen and (max-width: 650px) { .reader2-text-h4 { line-height: 24px; } } @media screen and (min-width: 541px) { .user-profile-modal { padding-left: 12px; padding-right: 12px; } } @media screen and (max-width: 650px) { .subscribe-widget form.form .sideBySideWrap button.rightButton { padding: 10px 12px; } } @media screen and (min-width: 541px) { .pub-icon:hover .logo-hover, .feed-item-icon:hover .logo-hover { display: block; } } @media screen and (max-width: 650px) { .post-ufi.single-full-width-button .post-ufi-button-wrapper { width: 100%; padding: 16px; } .post-ufi.single-full-width-button .post-ufi-button-wrapper:empty { display: none; } .post-ufi.single-full-width-button .post-ufi-button { width: 100%; justify-content: center; } } @media screen and (max-width: 768px) { .file-embed-wrapper { padding: 0; } } @media screen and (max-width: 768px) { .file-embed-wrapper-editor { padding: 0; } } @media screen and (max-width: 768px) { .file-embed-wrapper-editor:active { padding: 0; } } @media only screen and (max-width: 650px) { .file-embed-button.wide, .file-embed-error-button.wide { display: none; } } @media only screen and (min-width: 630px) { .file-embed-button.narrow, .file-embed-error-button.narrow { display: none; } } @media screen and (min-width: 541px) { .audio-player-wrapper .audio-player { min-width: 500px; } } @media screen and (max-width: 650px) { .audio-player-wrapper .audio-player .audio-player-progress { border-left-width: 16px; border-right-width: 16px; } } @media screen and (max-width: 650px) { .audio-player-wrapper .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup { top: -54px; } } @media screen and (max-width: 650px) { .audio-player-wrapper-fancy .audio-player .audio-player-progress { border-left-width: 16px; border-right-width: 16px; } } @media screen and (max-width: 650px) { .audio-player-wrapper-fancy .audio-player .audio-player-progress .audio-player-progress-bar .audio-player-progress-bar-popup { top: -54px; } } @media (min-width: 250px) { .audio-player-wrapper-fancy .audio-player { padding: 32px; } .audio-player-wrapper-fancy .audio-player .btn-group { display: flex; } .audio-player-wrapper-fancy .audio-player .btn-group .button:last-of-type { display: block; } } @media (min-width: 300px) { .audio-player-wrapper-fancy .audio-player .btn-group { display: block; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } } @media (min-width: 350px) { .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo { display: block; } .audio-player-wrapper-fancy .audio-player .audio-player-title { margin-top: 16px; } .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 15%; width: 15%; display: block; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } .audio-player-wrapper-fancy .audio-player .audio-player-substack-logo { display: block; } } @media (min-width: 350px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 25%; width: 25%; display: block; } .audio-player-wrapper-fancy .audio-player .btn-group { display: flex; } .audio-player-wrapper-fancy .audio-player .btn-group .button:first-of-type { display: block; } } @media (min-width: 400px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 40%; width: 40%; } } @media (max-width: 400px) { .audio-player-wrapper-fancy .audio-player .btn-group { margin-top: 12px; } .audio-player-wrapper-fancy .audio-player .btn-group .button { font-size: 13px; padding: 6px 12px; height: auto; margin-top: 10px; } } @media (min-width: 600px) { .audio-player-wrapper-fancy .audio-player .audio-player-hero-image-container { padding-top: 55%; width: 55%; } } @media (max-width: 650px) { .poll-editor-modal { min-width: calc(100% - 20px); } } @media (max-width: 750px) { .poll-embed .poll-anchor-target .poll-anchor-copy-button { left: 8px; top: 45px; } } Welcome to Decoding Bio&#8217;s BioByte: each week our writing collective highlight notable news&#8212;from the latest scientific papers to the latest funding rounds&#8212;and everything in between. &#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173;&#847; &#8199; &#173; Forwarded this email? Subscribe here for more BioByte 151: Protein-Complexa Tackles Fully Atomistic Binder Design, CAR-As Help Clear Amyloid-&#946; Plaques, How Granule Cells Enable Effective Learning, and the Tradeoff Between Regeneration and Cancer Pranay Satya , Matthew's Biotech Musings , Mikaela Kimpton , and Varun Agarwal Mar 19 READ IN APP Welcome to Decoding Bio &#8217;s BioByte: each week our writing collective highlight notable news&#8212;from the latest scientific papers to the latest funding rounds&#8212;and everything in between. All in one place. Upgrade to paid Paul Klee, Deep Pathos , 1915, gouache and watercolor What we read Blogs The Regeneration-Cancer Tradeoff [Karlin Compton, Proof Of Compton , March 2026] Humans are deficient in true regenerative capabilities, being limited to repairing blood, gut lining, skin, and parts of the liver rather than the entire body. The regeneration that does occur mostly proceeds through signaling via growth factors such as FGF and VEGF, which can help to temporarily induce a state closer to that of stem cells near damaged tissue until healing is complete. In contrast, these same growth factors and signaling modes often remain uninhibited or permanently active in cancers, netting them the description of &#8220;the wound that never heals&#8221;. Given these observations, Compton argues the limitation on humanity&#8217;s ability to truly regenerate is due to the similar biological machinery and pathways shared between regenerative capabilities and the growth and propagation of cancers. Relative to species which can regenerate more fully, human evolution proceeded along a more conservative path. The epithelial-mesenchymal transition (EMT) and dedifferentiation are two examples Compton provides for the similarity between regeneration and cancer. In the EMT, the adherence of some cells to the epithelial layers is relaxed, affording them migratory capabilities. This process is an essential part of transporting necessary cells to the site of a wound, but it is also one of the ways in which cancers are able to metastasize, making too much promiscuity in the EMT process a significant danger. In dedifferentiation, specialized cells are transformed into more labile forms, allowing them to participate in regeneration. However, the modifications that occur during this process closely resemble that of cancer cells such as epigenetic remodeling and a loosening of the cell&#8217;s regulatory architecture. Labile cells which can readily propagate could either be a recipe for limb regeneration or cancer. Compton suggests that in regenerative creatures (like zebrafish, salamanders, and planaria) processes like EMT and dedifferentiation are highly regulated such that when they have fulfilled their purpose, they are shut down, drawing the conclusion that the difference between regeneration and cancer arises from differences in control and regulation. It will be interesting to follow along as more research is done to understand what controls these regenerative behaviors, how it relates to cancer formation, and what specific mechanisms are at play which inhibit cancer formation and propagation. Share Papers Scaling Atomistic Protein Binder Design with Generative Pretraining and Test-Time Compute [Didi et al., preprint , March 2026] Why it matters: Proteina-Complexa is a fully atomistic binder design tool that marries conditional generation methods and structure-based hallucination tools to deliver significant performance gains across a range of binder design challenges. The framework is also accompanied with rigorous wet lab validation that showcases its potential beyond in silico benchmarking. Building on their previous work from La Proteina , the Fundamental Generative AI Research (GenAIR) Group at NVIDIA released Proteina-Complexa , a new framework to tackle fully atomistic binder design challenges. The development of Proteina-Complexa is grounded in the idea that the current dichotomy of binder generation methods is ripe for optimization. Briefly, binder generation methods fall under two classes - generative or hallucination-based - with the former (like RFDiffusion) approach relying on conditional generation processes while the latter (like BindCraft) uses gradients from structure predictors to iteratively refine a candidate design. The authors argue that this division is in stark contrast to the integrated framework of generative priors and inference-time scaling of leading language and vision models. In this paper Didi et al. present Proteina-Complexa as &#8220;the first binder design framework that unifies a strong flow-based base generative model with flexible inference-time optimization utilizing the generative prior, combining the strengths of both.&#8221; Proteina-Complexa reframes La-Proteina&#8217;s partially latent flow matching objective and applies it to conditional binder design. Specifically, the model uses an autoencoder to encode alpha-carbon backbone coordinates to control basic structure and uses latent variables for each residue to control amino acid properties and side chain geometries. To adapt this framework for binder design, the team introduced a target-conditioned denoiser that concatenates embedded target features with the binder&#8217;s latent representation before passing them to transformer layers that can process the joint embeddings. To leverage the benefits of structure-based hallucination methods, Proteina-Complexa uses structure prediction confidence metrics and interface bond energies to steer the generative diffusion process. In parallel, the team also used a range of test-time compute scaling approaches like growing the candidate pool, balancing exploration and exploitation with Monte Carlo tree searches, and varying reward-based strategies for goals like increasing interface hydrogen bonds. Apart from model architecture developments, other significant contributions include the development of the Teddymer Dataset, meant to bridge the gap in experimentally resolved multimers for paired binder-target training data. The team split the AlphaFold Database (AFDB) into individual domains and curated a set of synthetic dimers, yielding a dataset (Teddymer) much larger than the standard PDB. Proteina-Complexa was trained across four stages of data, starting with AFDB monomers followed by Teddymer dimers, before moving on to PDB multimers and protein-ligand pairs from the PLINDER dataset to give the model access to a wide variety of binder-target pairs. The benefits of this training regime were evident from both in silico benchmarks and an extensive wet lab validation campaign. Across a range of targets, the model generally outperformed conditional generation methods like RFDiffusion and Protpardelle-1c, while also outperforming tools like BoltzDesign, BindCraft, and AlphaDesign across a range of inference-time scaling approaches. Finally, Proteina-Complexa &#8217;s predictions showed promising wet lab performance, with the model demonstrating high hit rates and picomolar affinities for certain targets, while also designing the first known successful de novo carbohydrate binders. The wet lab performance is outlined in a separate manuscript . In summary, the combination of promising performance across computational and wet lab benchmarks reaffirms the potential of generative design methodologies that can merge conditional generation and hallucination-based approaches. Targeting amyloid-&#946; pathology by chimeric antigen receptor astrocyte (CAR-A) therapy [Chen et al., Science , March 2026] Why it matters: Chen et al. develop a new strategy to clear amyloid-&#946; plaques, opening up a new avenue for anti-A&#946; therapeutics. By arming astrocytes with chimeric antigen receptors (CARs), they enable these cells to degrade A&#946; plaques through phagocytosis, leading to reduced plaque burden in mouse models. Even though anti-amyloid antibodies have now reached the clinic for Alzheimer&#8217;s treatment, it remains unclear how much plaque removal translates into meaningful disease modification. These therapies also come with real tradeoffs, including repeated high-dose administration, narrow treatment windows, and safety concerns such as amyloid-related imaging abnormalities. Instead of relying on antibodies to recruit endogenous phagocytes, the authors asked whether they could directly reprogram brain glia to recognize and clear amyloid-&#946; themselves. Others have explored similar CAR-based approaches in microglia or myeloid cells, but these strategies face a key challenge: resident microglia are difficult to replace at scale, and engineered myeloid cells have not demonstrated durable, brain-wide activity in vivo. The authors instead turned to astrocytes, which are broadly distributed throughout the brain, already participate in phagocytic processes, and are accessible via CNS-tropic AAV delivery. To build the system, the team fused anti-amyloid single-chain antibody fragments to intracellular signaling domains from phagocytic receptors, creating four FcR&#947;-independent CAR designs for astrocytes. In their initial screen, they paired a crenezumab-derived scFv (targeting A&#946;) with signaling domains from MEGF10, Dectin1, MERTK, or CD3&#950;. After validating function in vitro, they moved in vivo to test whether these engineered astrocytes could meaningfully reduce amyloid burden and associated pathology. A single AAV-delivered dose administered after plaque formation reduced amyloid burden by about half in 5xFAD mice and decreased neuritic dystrophy, while earlier administration, prior to plaque deposition, strongly suppressed subsequent amyloid accumulation and related pathology. While this in vivo engineering strategy effectively reduces plaque burden, the authors highlight several limitations and areas for further development. Despite robust amyloid clearance, synaptic rescue was only partial, and the therapy may lead to overpruning of healthy synapses. Improvements in overall neural health were also limited, though this remains difficult to interpret given known constraints of the mouse model and broader uncertainty in the field around whether amyloid clearance alone is sufficient to restore function. Still, as a first demonstration of CAR-armed astrocytes operating in vivo, this represents a compelling proof of concept, and it will be exciting to see how the field iterates on construct design, safety, and cell-type targeting moving forward. Granule cells reorient cortical manifolds to separate contexts but preserve their geometry [Garcia-Garcia et al., bioRxiv , March 2026] Why it matters: To learn effectively, animals must generalize across related experiences while still distinguishing between them &#8211; a fundamental computational tradeoff. Generalization is supported by low-dimensional neural manifolds found throughout the neocortex which accelerate learning by constraining activity to a small number of task-relevant axes. Conversely, context separation is classically attributed to neural expansion layers &#8211; most famously, cerebellar granule cells (GrCs) &#8211; that project overlapping inputs into high-rank feature spaces to separate them. However, high-rank expansion &#8216;shatters&#8217; the smooth structure required for continuous prediction and generalization, creating an apparent paradox. Garcia-Garcia et al. resolve it by simultaneously imaging premotor cortical output neurons (layer 5 pyramidal tract cells, L5PT) and GrCs during parallel skill learning, revealing that GrCs reject high-dimensional expansion. Instead, they perform structured affine transformations &#8211; rotating cortical manifolds apart across contexts while rigorously preserving their low-rank geometry within each. Using a custom dual-site two-photon microscope, the authors tracked the same L5PT and GrC populations across two tasks with shared temporal structure (action &#8594; delay &#8594; reward) but distinct sensorimotor demands (forelimb reach vs VR locomotion) in 9 mice. Within each task, GrCs faithfully preserved cortical manifold structure: comparably dense, temporally organized, and low-rank (~4-5 effective dimensions by participation ratio, a measure of dimensionality based on eigenvalue spectra). Across tasks, however, the populations diverged. L5PT modes generalized strongly (cross-task r = 0.83), while GrC modes remapped nearly completely (r = 0.24) &#8211; despite stable coupling between the two regions. Representational similarity analysis of neural activity showed GrCs preserved within-task cortical geometry with high fidelity (Spearman &#961; = 0.82) but diverged across tasks (&#961; = 0.48). GrC manifolds rotated significantly further apart than L5PT manifolds across contexts, and this separation grew with dual-task proficiency (&#961; = 0.6): as behavior converged across tasks, GrC representations became more distinct. To test whether this strategy confers a computational advantage, the authors simulated alternating two-task learning in a cerebellar-like circuit, comparing three GrC architectures: one that simply relays cortical geometry, one that shatters it via classical sparse expansion, and one that rotates manifolds apart (matching their data). The relay learned quickly but suffered catastrophic forgetting between tasks due to overlapping representations. Sparse expansion avoided forgetting but learned very slowly &#8211; shattering the geometry destroyed the smooth structure needed for temporal prediction. The rotation model achieved both: fast learning and resistance to interference. The authors propose that context-dependent rescaling of inputs to GrCs could generate these rotations, but this mechanism remains unvalidated. Interesting open questions follow from these experiments &#8211; including whether the motif extends to other pathways and expansion architectures (ex. piriform cortex, dentate gyrus) and quantifying the manifold packing capacities for different contexts. If this generalizes, coherent manifold reorientation may represent a broadly applicable blueprint for continuous prediction and control for neuroscientific and engineered systems. Notable deals Unnatural Products raises a $45M Series B round led by The Venture Collective (TVC). The company is seeking to unlock an entirely new class of drugs: oral synthetic macrocyclic peptides. Previously only able to be targeted via costly injectables, Unnatural Products is using their proprietary platform to go after historically undruggable targets, having inked an impressive partnership with Novartis worth $100M upfront with $1.7B in potential milestones to go after such elusive targets in the cardiovascular domain just last month. The company has additional established collaborations with Merck, BridgeBio, and argenyx spanning multiple therapeutic areas whilst advancing their own pipeline of treatments for cardiometabolic, autoimmune, and inflammatory indications. Other investors participating in the round include argenx, Droia Ventures and existing investors Merck Global Health Innovation Fund, Artis Ventures, and First Spark Ventures. Vima Therapeutics announces $40M Series A extension as first patient is dosed in Phase 2 dystonia study. The movement disorders-focused biotech is aiming at a potential first-in-class therapeutic for dystonia and Parkinson&#8217;s disease, which share underlying disease biology consisting of dopaminergic and acetylcholinergic signalling imbalances in the brain. Vima&#8217;s lead candidate, VIM0423, is a once-daily oral drug intended to selectively target muscarinic cholinergic receptors in the brain, a target established as effective, but one that has been limited by tolerability issues. VIM0423 seeks to address these tolerability challenges whilst still maintaining maximum efficacy. The potential treatment was awarded Fast Track designation by the FDA and is moving into Phase 2 clinical trials, having just completed a two-part Phase 1 study assessing pharmacokinetics, safety, tolerability, and dose titration. Funding from this round&#8212;which saw participation from new investor, Frazier Life Sciences, as well as from existing investors, Atlas Ventures, Access Industries, and Canaan Partners&#8212;will support this ongoing Phase 2. Crossbow Therapeutics closes $77M Series B led by Taiho Ventures and Arkin Bio Capital. Armed with a portfolio of novel precision antibody drugs, Crossbow is aiming at treating a broad range of cancers. Their proprietary immunotherapies&#8212;dubbed T-Bolt&#8482; molecules&#8212;consist of T cell engagers (TCE) targeting peptide human leukocyte antigen (pHLA) located on cancer cells via T cell mimetics (antibodies that resemble T cell receptors). This funding will bolster the company&#8217;s lead candidate, CBX-250, a first-in-class TCE through the CROSSCHECK-001 Phase 1 clinical trial which is set to evaluate the therapeutic in patients experiencing relapsed and refractory myeloid malignancies across acute myeloid leukemia, chronic myeloid leukemia, myelodysplastic syndromes, and chronic myelomonocytic leukemia. The Series B will additionally serve to advance other promising TCE assets such as CBX-663 which targets a telomerase reverse transcriptase (TERT)-derived pHLA for the treatment of multiple hematologic and solid tumors. CBX-663 is currently slated for IND submission. Other investors in the round include new adds: Sixty Degree Capital, Hamilton Square Partners Management LP, LifeLink Ventures, Libbs Ventures, and Blood Cancer United&#8217;s Therapy Acceleration Program (TAP), as well as existing investors MPM BioImpact, Pfizer Ventures, BVF Partners, Polaris Partners, Eli Lilly and Company, and Mirae Asset Venture Investment. With a $77.5 million, oversubscribed Series A, R1 Therapeutics launches to treat chronic kidney disease. In addition to the announcement of the raise, R1 also publicized the acquisition of the development and commercialization rights to AP306&#8212;a pan phosphate transporter inhibitor&#8212;outside of China from Alebund Pharmaceuticals. The asset is scheduled to enter Phase 2b trials for hyperphosphatemia in patients with chronic kidney disease later in 2026. Phase 2a results showed significant reduction in serum phosphate levels thanks to the ability of AP306 to block the active transport of phosphate, unlike other therapies which only block passive transport. Abingworth, DaVita Venture Group, and F-Prime led the round while Curie.Bio, SymBiosis, and U.S. Renal Care also participated. In case you missed it Breakout Ventures Launches Fund III with $114M to Continue Building the Future Powered by Science Droplet Biosciences Accelerates Residual Cancer Detection with NVIDIA Basecamp Research Launches Trillion Gene Atlas to Scale AI-Designed Therapeutics in Partnership with Anthropic, Ultima Genomics, and PacBio Single&#8211;amino acid variants in target epitopes can confer resistance to antibody-based therapies | Science Translational Medicine Exploring the Scaling Laws of Consumer EEG: Introducing Alljoined-1.6M What we liked on socials channels Bonus content: everyone online is buzzing about the new LinkedIn Speak translator so we had to check it out ourselves (don&#8217;t worry we love decoding! ok now back to proofreading &#129299;) Field Trip Support Us! Did we miss anything? Would you like to contribute to Decoding Bio by writing a guest post? Drop us a note here or chat with us on Twitter: @ decodingbio . Invite your friends and earn rewards If you enjoy Decoding Bio, share it with your friends and earn rewards when they subscribe. Invite Friends Share Like Comment Restack &#169; 2026 Decoding Bio, LLC 548 Market Street PMB 72296, San Francisco, CA 94104 Unsubscribe

## Raw body (tamper-evident)

```
View this post on the web at https://decodingbio.substack.com/p/biobyte-151-protein-complexa-tackles

Welcome to Decoding Bio [ https://substack.com/redirect/b402c076-9b00-4fa6-af59-4cddf98efc87?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]’s BioByte: each week our writing collective highlight notable news—from the latest scientific papers to the latest funding rounds—and everything in between. All in one place.
What we read
Blogs
The Regeneration-Cancer Tradeoff [ https://substack.com/redirect/d12dd5b2-94e6-4362-8a65-4fc18adfa8e2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Karlin Compton, Proof Of Compton, March 2026]
Humans are deficient in true regenerative capabilities, being limited to repairing blood, gut lining, skin, and parts of the liver rather than the entire body. The regeneration that does occur mostly proceeds through signaling via growth factors such as FGF and VEGF, which can help to temporarily induce a state closer to that of stem cells near damaged tissue until healing is complete. In contrast, these same growth factors and signaling modes often remain uninhibited or permanently active in cancers, netting them the description of “the wound that never heals”. Given these observations, Compton argues the limitation on humanity’s ability to truly regenerate is due to the similar biological machinery and pathways shared between regenerative capabilities and the growth and propagation of cancers. Relative to species which can regenerate more fully, human evolution proceeded along a more conservative path.
The epithelial-mesenchymal transition (EMT) and dedifferentiation are two examples Compton provides for the similarity between regeneration and cancer. In the EMT, the adherence of some cells to the epithelial layers is relaxed, affording them migratory capabilities. This process is an essential part of transporting necessary cells to the site of a wound, but it is also one of the ways in which cancers are able to metastasize, making too much promiscuity in the EMT process a significant danger. In dedifferentiation, specialized cells are transformed into more labile forms, allowing them to participate in regeneration. However, the modifications that occur during this process closely resemble that of cancer cells such as epigenetic remodeling and a loosening of the cell’s regulatory architecture. Labile cells which can readily propagate could either be a recipe for limb regeneration or cancer.
Compton suggests that in regenerative creatures (like zebrafish, salamanders, and planaria) processes like EMT and dedifferentiation are highly regulated such that when they have fulfilled their purpose, they are shut down, drawing the conclusion that the difference between regeneration and cancer arises from differences in control and regulation. It will be interesting to follow along as more research is done to understand what controls these regenerative behaviors, how it relates to cancer formation, and what specific mechanisms are at play which inhibit cancer formation and propagation.
Papers
Scaling Atomistic Protein Binder Design with Generative Pretraining and Test-Time Compute [ https://substack.com/redirect/d59a1983-e1db-45c1-a733-1379e9fa635f?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Didi et al., preprint, March 2026]
Why it matters: Proteina-Complexa is a fully atomistic binder design tool that marries conditional generation methods and structure-based hallucination tools to deliver significant performance gains across a range of binder design challenges. The framework is also accompanied with rigorous wet lab validation that showcases its potential beyond in silico benchmarking.
Building on their previous work from La Proteina [ https://substack.com/redirect/e66bcf61-85c9-4fd8-9ae0-3dd84524b4f1?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ], the Fundamental Generative AI Research (GenAIR) Group at NVIDIA released Proteina-Complexa, a new framework to tackle fully atomistic binder design challenges. The development of Proteina-Complexa is grounded in the idea that the current dichotomy of binder generation methods is ripe for optimization. Briefly, binder generation methods fall under two classes - generative or hallucination-based - with the former (like RFDiffusion) approach relying on conditional generation processes while the latter (like BindCraft) uses gradients from structure predictors to iteratively refine a candidate design. The authors argue that this division is in stark contrast to the integrated framework of generative priors and inference-time scaling of leading language and vision models. In this paper Didi et al. present Proteina-Complexa as “the first binder design framework that unifies a strong flow-based base generative model with flexible inference-time optimization utilizing the generative prior, combining the strengths of both.”
Proteina-Complexa reframes La-Proteina’s partially latent flow matching objective and applies it to conditional binder design. Specifically, the model uses an autoencoder to encode alpha-carbon backbone coordinates to control basic structure and uses latent variables for each residue to control amino acid properties and side chain geometries. To adapt this framework for binder design, the team introduced a target-conditioned denoiser that concatenates embedded target features with the binder’s latent representation before passing them to transformer layers that can process the joint embeddings. To leverage the benefits of structure-based hallucination methods, Proteina-Complexa uses structure prediction confidence metrics and interface bond energies to steer the generative diffusion process. In parallel, the team also used a range of test-time compute scaling approaches like growing the candidate pool, balancing exploration and exploitation with Monte Carlo tree searches, and varying reward-based strategies for goals like increasing interface hydrogen bonds.
Apart from model architecture developments, other significant contributions include the development of the Teddymer Dataset, meant to bridge the gap in experimentally resolved multimers for paired binder-target training data. The team split the AlphaFold Database (AFDB) into individual domains and curated a set of synthetic dimers, yielding a dataset (Teddymer) much larger than the standard PDB. Proteina-Complexa was trained across four stages of data, starting with AFDB monomers followed by Teddymer dimers, before moving on to PDB multimers and protein-ligand pairs from the PLINDER dataset to give the model access to a wide variety of binder-target pairs. The benefits of this training regime were evident from both in silico benchmarks and an extensive wet lab validation campaign. Across a range of targets, the model generally outperformed conditional generation methods like RFDiffusion and Protpardelle-1c, while also outperforming tools like BoltzDesign, BindCraft, and AlphaDesign across a range of inference-time scaling approaches. Finally, Proteina-Complexa’s predictions showed promising wet lab performance, with the model demonstrating high hit rates and picomolar affinities for certain targets, while also designing the first known successful de novo carbohydrate binders. The wet lab performance is outlined in a separate manuscript [ https://substack.com/redirect/cc6286e9-76fe-45b9-822e-e550e7ab8896?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]. In summary, the combination of promising performance across computational and wet lab benchmarks reaffirms the potential of generative design methodologies that can merge conditional generation and hallucination-based approaches.
Targeting amyloid-β pathology by chimeric antigen receptor astrocyte (CAR-A) therapy [ https://substack.com/redirect/1ad58505-89ee-457e-959f-6669e4bb95f8?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Chen et al., Science, March 2026]
Why it matters: Chen et al. develop a new strategy to clear amyloid-β plaques, opening up a new avenue for anti-Aβ therapeutics. By arming astrocytes with chimeric antigen receptors (CARs), they enable these cells to degrade Aβ plaques through phagocytosis, leading to reduced plaque burden in mouse models.
Even though anti-amyloid antibodies have now reached the clinic for Alzheimer’s treatment, it remains unclear how much plaque removal translates into meaningful disease modification. These therapies also come with real tradeoffs, including repeated high-dose administration, narrow treatment windows, and safety concerns such as amyloid-related imaging abnormalities. Instead of relying on antibodies to recruit endogenous phagocytes, the authors asked whether they could directly reprogram brain glia to recognize and clear amyloid-β themselves. Others have explored similar CAR-based approaches in microglia or myeloid cells, but these strategies face a key challenge: resident microglia are difficult to replace at scale, and engineered myeloid cells have not demonstrated durable, brain-wide activity in vivo. The authors instead turned to astrocytes, which are broadly distributed throughout the brain, already participate in phagocytic processes, and are accessible via CNS-tropic AAV delivery.
To build the system, the team fused anti-amyloid single-chain antibody fragments to intracellular signaling domains from phagocytic receptors, creating four FcRγ-independent CAR designs for astrocytes. In their initial screen, they paired a crenezumab-derived scFv (targeting Aβ) with signaling domains from MEGF10, Dectin1, MERTK, or CD3ζ. After validating function in vitro, they moved in vivo to test whether these engineered astrocytes could meaningfully reduce amyloid burden and associated pathology. A single AAV-delivered dose administered after plaque formation reduced amyloid burden by about half in 5xFAD mice and decreased neuritic dystrophy, while earlier administration, prior to plaque deposition, strongly suppressed subsequent amyloid accumulation and related pathology.
While this in vivo engineering strategy effectively reduces plaque burden, the authors highlight several limitations and areas for further development. Despite robust amyloid clearance, synaptic rescue was only partial, and the therapy may lead to overpruning of healthy synapses. Improvements in overall neural health were also limited, though this remains difficult to interpret given known constraints of the mouse model and broader uncertainty in the field around whether amyloid clearance alone is sufficient to restore function. Still, as a first demonstration of CAR-armed astrocytes operating in vivo, this represents a compelling proof of concept, and it will be exciting to see how the field iterates on construct design, safety, and cell-type targeting moving forward.
Granule cells reorient cortical manifolds to separate contexts but preserve their geometry [ https://substack.com/redirect/d671ad9b-8e4e-44ee-ad9b-9af3e0d9c1b4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] [Garcia-Garcia et al., bioRxiv, March 2026]
Why it matters: To learn effectively, animals must generalize across related experiences while still distinguishing between them – a fundamental computational tradeoff. Generalization is supported by low-dimensional neural manifolds found throughout the neocortex which accelerate learning by constraining activity to a small number of task-relevant axes. Conversely, context separation is classically attributed to neural expansion layers – most famously, cerebellar granule cells (GrCs) – that project overlapping inputs into high-rank feature spaces to separate them. However, high-rank expansion ‘shatters’ the smooth structure required for continuous prediction and generalization, creating an apparent paradox. Garcia-Garcia et al. resolve it by simultaneously imaging premotor cortical output neurons (layer 5 pyramidal tract cells, L5PT) and GrCs during parallel skill learning, revealing that GrCs reject high-dimensional expansion. Instead, they perform structured affine transformations – rotating cortical manifolds apart across contexts while rigorously preserving their low-rank geometry within each.
Using a custom dual-site two-photon microscope, the authors tracked the same L5PT and GrC populations across two tasks with shared temporal structure (action → delay → reward) but distinct sensorimotor demands (forelimb reach vs VR locomotion) in 9 mice. Within each task, GrCs faithfully preserved cortical manifold structure: comparably dense, temporally organized, and low-rank (~4-5 effective dimensions by participation ratio, a measure of dimensionality based on eigenvalue spectra). Across tasks, however, the populations diverged. L5PT modes generalized strongly (cross-task r = 0.83), while GrC modes remapped nearly completely (r = 0.24) – despite stable coupling between the two regions. Representational similarity analysis of neural activity showed GrCs preserved within-task cortical geometry with high fidelity (Spearman ρ = 0.82) but diverged across tasks (ρ = 0.48). GrC manifolds rotated significantly further apart than L5PT manifolds across contexts, and this separation grew with dual-task proficiency (ρ = 0.6): as behavior converged across tasks, GrC representations became more distinct.
To test whether this strategy confers a computational advantage, the authors simulated alternating two-task learning in a cerebellar-like circuit, comparing three GrC architectures: one that simply relays cortical geometry, one that shatters it via classical sparse expansion, and one that rotates manifolds apart (matching their data). The relay learned quickly but suffered catastrophic forgetting between tasks due to overlapping representations. Sparse expansion avoided forgetting but learned very slowly – shattering the geometry destroyed the smooth structure needed for temporal prediction. The rotation model achieved both: fast learning and resistance to interference. The authors propose that context-dependent rescaling of inputs to GrCs could generate these rotations, but this mechanism remains unvalidated. Interesting open questions follow from these experiments – including whether the motif extends to other pathways and expansion architectures (ex. piriform cortex, dentate gyrus) and quantifying the manifold packing capacities for different contexts. If this generalizes, coherent manifold reorientation may represent a broadly applicable blueprint for continuous prediction and control for neuroscientific and engineered systems.
Notable deals
Unnatural Products raises a $45M Series B round led by The Venture Collective (TVC). [ https://substack.com/redirect/2a56b382-b211-4eeb-ac5d-c3c7ba152462?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] The company is seeking to unlock an entirely new class of drugs: oral synthetic macrocyclic peptides. Previously only able to be targeted via costly injectables, Unnatural Products is using their proprietary platform to go after historically undruggable targets, having inked an impressive partnership with Novartis worth $100M upfront with $1.7B in potential milestones to go after such elusive targets in the cardiovascular domain just last month. The company has additional established collaborations with Merck, BridgeBio, and argenyx spanning multiple therapeutic areas whilst advancing their own pipeline of treatments for cardiometabolic, autoimmune, and inflammatory indications. Other investors participating in the round include argenx, Droia Ventures and existing investors Merck Global Health Innovation Fund, Artis Ventures, and First Spark Ventures.
Vima Therapeutics announces $40M Series A extension as first patient is dosed in Phase 2 dystonia study. [ https://substack.com/redirect/d2fcd322-6041-4bf8-bd22-116ec1241105?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] The movement disorders-focused biotech is aiming at a potential first-in-class therapeutic for dystonia and Parkinson’s disease, which share underlying disease biology consisting of dopaminergic and acetylcholinergic signalling imbalances in the brain. Vima’s lead candidate, VIM0423, is a once-daily oral drug intended to selectively target muscarinic cholinergic receptors in the brain, a target established as effective, but one that has been limited by tolerability issues. VIM0423 seeks to address these tolerability challenges whilst still maintaining maximum efficacy. The potential treatment was awarded Fast Track designation by the FDA and is moving into Phase 2 clinical trials, having just completed a two-part Phase 1 study assessing pharmacokinetics, safety, tolerability, and dose titration. Funding from this round—which saw participation from new investor, Frazier Life Sciences, as well as from existing investors, Atlas Ventures, Access Industries, and Canaan Partners—will support this ongoing Phase 2.
Crossbow Therapeutics closes $77M Series B led by Taiho Ventures and Arkin Bio Capital. [ https://substack.com/redirect/a575283b-418e-4e4a-86a0-05e16398a32a?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] Armed with a portfolio of novel precision antibody drugs, Crossbow is aiming at treating a broad range of cancers. Their proprietary immunotherapies—dubbed T-Bolt™ molecules—consist of T cell engagers (TCE) targeting peptide human leukocyte antigen (pHLA) located on cancer cells via T cell mimetics (antibodies that resemble T cell receptors). This funding will bolster the company’s lead candidate, CBX-250, a first-in-class TCE through the CROSSCHECK-001 Phase 1 clinical trial which is set to evaluate the therapeutic in patients experiencing relapsed and refractory myeloid malignancies across acute myeloid leukemia, chronic myeloid leukemia, myelodysplastic syndromes, and chronic myelomonocytic leukemia. The Series B will additionally serve to advance other promising TCE assets such as CBX-663 which targets a telomerase reverse transcriptase (TERT)-derived pHLA for the treatment of multiple hematologic and solid tumors. CBX-663 is currently slated for IND submission. Other investors in the round include new adds: Sixty Degree Capital, Hamilton Square Partners Management LP, LifeLink Ventures, Libbs Ventures, and Blood Cancer United’s Therapy Acceleration Program (TAP), as well as existing investors MPM BioImpact, Pfizer Ventures, BVF Partners, Polaris Partners, Eli Lilly and Company, and Mirae Asset Venture Investment.
With a $77.5 million, oversubscribed Series A, R1 Therapeutics launches to treat chronic kidney disease. [ https://substack.com/redirect/284478ed-dc3e-42dc-a252-074690a934af?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] In addition to the announcement of the raise, R1 also publicized the acquisition of the development and commercialization rights to AP306—a pan phosphate transporter inhibitor—outside of China from Alebund Pharmaceuticals. The asset is scheduled to enter Phase 2b trials for hyperphosphatemia in patients with chronic kidney disease later in 2026. Phase 2a results showed significant reduction in serum phosphate levels thanks to the ability of AP306 to block the active transport of phosphate, unlike other therapies which only block passive transport. Abingworth, DaVita Venture Group, and F-Prime led the round while Curie.Bio, SymBiosis, and U.S. Renal Care also participated.
In case you missed it
Breakout Ventures Launches Fund III with $114M to Continue Building the Future Powered by Science [ https://substack.com/redirect/7b7d89fe-0aa2-4ffb-ac58-0f0b4d406978?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Droplet Biosciences Accelerates Residual Cancer Detection with NVIDIA [ https://substack.com/redirect/07e3f7ac-4e26-4c06-b47e-b8e1829e57a2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Basecamp Research Launches Trillion Gene Atlas to Scale AI-Designed Therapeutics in Partnership with Anthropic, Ultima Genomics, and PacBio [ https://substack.com/redirect/735e2ba1-3684-4e9d-b9c0-a2314bfec0a4?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Single–amino acid variants in target epitopes can confer resistance to antibody-based therapies | Science Translational Medicine [ https://substack.com/redirect/30d8ca31-0204-41d5-bf4e-6624d2ce9483?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
Exploring the Scaling Laws of Consumer EEG: Introducing Alljoined-1.6M [ https://substack.com/redirect/0c9b3632-6d4d-4d18-aed7-6e8a55a08f37?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ]
What we liked on socials channels
Bonus content: everyone online is buzzing about the new LinkedIn Speak translator [ https://substack.com/redirect/f9a30f84-920f-476b-a7e5-993c2ad35549?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ] so we had to check it out ourselves (don’t worry we love decoding! ok now back to proofreading 🤓)
Field Trip
Did we miss anything? Would you like to contribute to Decoding Bio by writing a guest post? Drop us a note here [ mailto:pablo@decodingbio.com ] or chat with us on Twitter: @decodingbio [ https://substack.com/redirect/4c30eea5-1227-42fb-8fe1-7b3e2b5a11a2?j=eyJ1IjoiM2NzYjdxIn0.UJrnWTJcQoMalTjap72aqxZLXdl38WkbMJeAwZuAR3U ].

Unsubscribe https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly9kZWNvZGluZ2Jpby5zdWJzdGFjay5jb20vYWN0aW9uL2Rpc2FibGVfZW1haWw_dG9rZW49ZXlKMWMyVnlYMmxrSWpveU1ESTROelE0TWpJc0luQnZjM1JmYVdRaU9qRTVNVFExTXpBM055d2lhV0YwSWpveE56Y3pPVE0wTlRZeUxDSmxlSEFpT2pFNE1EVTBOekExTmpJc0ltbHpjeUk2SW5CMVlpMHhNRGM1TkRrNElpd2ljM1ZpSWpvaVpHbHpZV0pzWlY5bGJXRnBiQ0o5LlkwTnVrMjNrSEMxYXh1dzBIQ0JDZldpNmd1X2RubS1DWTNZUGM5ZEJEV2MiLCJwIjoxOTE0NTMwNzcsInMiOjEwNzk0OTgsImYiOnRydWUsInUiOjIwMjg3NDgyMiwiaWF0IjoxNzczOTM0NTYyLCJleHAiOjIwODk1MTA1NjIsImlzcyI6InB1Yi0wIiwic3ViIjoibGluay1yZWRpcmVjdCJ9.FG3WOHakWdtNovn7gdMP91wlZasf11hTJ1LN0TRFYeU?

=== HTML PART ===
<html style="scrollbar-width: thin;scrollbar-color: rgb(219,219,219)rgb(255,255,255);"><head><meta charset="utf-8"><title>BioByte 151: Protein-Complexa Tackles Fully Atomistic Binder Design, CAR-As Help Clear Amyloid-&#946; Plaques, How Granule Cells Enable Effective Learning, and the Tradeoff Between Regeneration and Cancer</title><style>
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
}</style></head><body class="email-body" style="font-kerning: auto;--image-offset-margin: -120px;"><img src="https://eotrx.substackcdn.com/open?token=eyJtIjoiPDIwMjYwMzE5MTUzNTI3LjMuMzZkNmY0MWUyOGJjN2E4ZEBtZzIuc3Vic3RhY2suY29tPiIsInUiOjIwMjg3NDgyMiwiciI6InBsYXNtYXRvaWRAZ21haWwuY29tIiwiZCI6Im1nMi5zdWJzdGFjay5jb20iLCJwIjoxOTE0NTMwNzcsInQiOiJuZXdzbGV0dGVyIiwiYSI6ImV2ZXJ5b25lIiwicyI6MTA3OTQ5OCwiYyI6InBvc3QiLCJmIjp0cnVlLCJwb3NpdGlvbiI6InRvcCIsImlhdCI6MTc3MzkzNDU2MiwiZXhwIjoxNzc2NTI2NTYyLCJpc3MiOiJwdWItMCIsInN1YiI6ImVvIn0.yY_OPQix0dUpiPSpLGYh8isgdc23soXttV52NG0JV6c" alt="" width="1" height="1" border="0" style="height:1px !important;width:1px !important;border-width:0 !important;margin-top:0 !important;margin-bottom:0 !important;margin-right:0 !important;margin-left:0 !important;padding-top:0 !important;padding-bottom:0 !important;padding-right:0 !important;padding-left:0 !important;"/><div class="preview" style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Welcome to Decoding Bio&#8217;s BioByte: each week our writing collective highlight notable news&#8212;from the latest scientific papers to the latest funding rounds&#8212;and everything in between.</div><div class="preview" style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbsp; &#8199; &#173;&#847; &nbs
```

*(truncated at 50KB — full body is 145016 bytes, sha256 is of the full body)*