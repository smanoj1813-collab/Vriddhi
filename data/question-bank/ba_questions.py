# -*- coding: utf-8 -*-
"""BA seed questions — the original topic level: 4 subjects x 4 topics x 5.

This is generation one of the bank. Generation two lives in
`subtopic_questions.py` (4 questions per sub-topic) and the hierarchy both are
checked against lives in `structure.py`. `generate_seed.py` merges the two:

  * every question here gets a **sub-topic backfilled** by matching its text
    against the keywords declared for that subject/topic in `structure.py` — so
    adding a question here needs no extra bookkeeping, but a question whose text
    matches no keyword fails the build until the keywords are extended;
  * a question here whose wording `subtopic_questions.py` repeats is **dropped**,
    because both rows would share one dedupe fingerprint and the sub-topic
    version is the more specific of the two.

Field rules (matched to the app's naive CSV parser in BulkImportModal.tsx):
  * NO commas and NO double quotes inside any field
  * NO pipe characters in text fields (pipe separates MCQ options)
  * one line per question
"""


def Q(text, subject, type_, difficulty, unit, marks, options, correct, explanation=""):
    return {
        "text": text,
        "subject": subject,
        "type": type_,
        "difficulty": difficulty,
        "unit": unit,
        "marks": marks,
        "options": options,
        "correct": correct,
        "explanation": explanation,
    }


BA = []

# ═══════════════════════════════════════════════════════════════════════════
# 1. POLITICAL SCIENCE
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Political Science"

BA += [
    Q("The Preamble declares India to be a:", SUB, "mcq", "easy", "Preamble and Fundamental Rights", 1,
      ["Sovereign socialist secular democratic republic", "Theocracy", "Monarchy", "Federation of provinces only"],
      "A", "The Preamble is the key to the constitution's philosophy and objectives."),
    Q("The words socialist and secular were inserted into the Preamble by the:", SUB, "mcq", "medium", "Preamble and Fundamental Rights", 1,
      ["42nd Amendment", "44th Amendment", "1st Amendment", "86th Amendment"],
      "A", "The 42nd Amendment of 1976 adopted the famous Kiriti mantra language."),
    Q("Articles 12 to 35 of the Constitution deal with:", SUB, "mcq", "easy", "Preamble and Fundamental Rights", 1,
      ["Fundamental Rights", "Fundamental Duties", "Directive Principles of State Policy", "Emergency powers"],
      "B", "Part III of the Constitution contains the fundamental rights."),
    Q("The right to equality before law is guaranteed by Article:", SUB, "mcq", "medium", "Preamble and Fundamental Rights", 1,
      ["14", "19", "21", "32"],
      "A", "Article 14 guarantees equality before law and equal protection of the laws."),
    Q("List any four fundamental freedoms guaranteed by Article 19.", SUB, "short_answer", "medium", "Preamble and Fundamental Rights", 2,
      [], "Freedom of speech and expression; to assemble peacefully; to form associations; to move freely; to reside and settle anywhere; and to practice any profession.", ""),

    Q("The Parliament of India consists of:", SUB, "mcq", "easy", "Parliament", 1,
      ["The Lok Sabha and the Rajya Sabha", "The Lok Sabha and the President", "The Rajya Sabha and the Governor", "The President and the Supreme Court"],
      "A", "India follows a bicameral legislature with the President as its head."),
    Q("The maximum strength of the Lok Sabha under the Constitution is:", SUB, "mcq", "medium", "Parliament", 1,
      ["543", "552", "600", "500"],
      "B", "Article 81 fixes the ceiling at 552 members (530 elected and 20 nominated)."),
    Q("A money bill can be introduced only in the:", SUB, "mcq", "medium", "Parliament", 1,
      ["Rajya Sabha", "Lok Sabha", "Either house at any time", "President's council"],
      "B", "Only the lower house can introduce it and the President's recommendation is needed."),
    Q("The Speaker of the Lok Sabha is elected by the members of the Lok Sabha. This statement is:", SUB, "true_false", "easy", "Parliament", 1,
      [], "True", "The members of the house elect their own Speaker by majority vote."),
    Q("State any three powers of the Rajya Sabha in relation to money bills.", SUB, "short_answer", "hard", "Parliament", 2,
      [], "It may recommend changes to a money bill; it can hold the bill for at most six days; and it cannot reject the bill.", ""),

    Q("The Supreme Court of India is located in:", SUB, "mcq", "easy", "Judiciary", 1,
      ["Bhopal", "New Delhi", "Chennai", "Kolkata"],
      "B", "It was established in 1950 as the apex court of the land."),
    Q("The basic structure doctrine was upheld in the:", SUB, "mcq", "medium", "Judiciary", 1,
      ["Kesavananda Bharati case", "Shankari Prasad case", "Golaknath case", "Menaka case"],
      "A", "The 1973 judgment held that Parliament cannot alter the basic structure of the Constitution."),
    Q("Judicial review is the power of the courts to:", SUB, "mcq", "easy", "Judiciary", 1,
      ["Appoint judges", "Examine the validity of laws against the Constitution", "Audit government expenditure", "Dissolve Parliament"],
      "B", "Laws that violate the Constitution can be struck down as unconstitutional."),
    Q("The original jurisdiction of the Supreme Court extends to disputes between the Government of India and a state or between states. This statement is:", SUB, "true_false", "medium", "Judiciary", 1,
      [], "True", "Such disputes are directly heard by the Supreme Court under Article 131."),
    Q("Explain the collegium system for judicial appointments.", SUB, "short_answer", "medium", "Judiciary", 2,
      [], "A collegium of the Chief Justice of India and the four senior most judges recommends appointments and transfers to the higher judiciary and the government acts on the recommendation.", ""),

    Q("The 73rd Constitutional Amendment of 1992 gave constitutional status to:", SUB, "mcq", "easy", "Local Self Government", 1,
      ["Urban local bodies", "Panchayats", "Cooperative societies", "Municipal corporations"],
      "B", "It added the eleventh schedule covering panchayat functions."),
    Q("The 74th Constitutional Amendment deals with:", SUB, "mcq", "easy", "Local Self Government", 1,
      ["Municipal and urban local bodies", "Village panchayats", "The higher judiciary", "Centre state finance"],
      "A", "It came into force in 1993 and strengthened urban local government."),
    Q("The Gram Sabha consists of all persons registered in the electoral roll of the village. This statement is:", SUB, "true_false", "medium", "Local Self Government", 1,
      [], "True", "It is the basic unit of direct self governance at the village level."),
    Q("The District Planning Committee prepares the plan for the district as a whole. This statement is:", SUB, "true_false", "easy", "Local Self Government", 1,
      [], "True", "It consolidates the plans of the panchayats and municipal bodies into a district plan."),
    Q("State the main objectives of the Panchayati Raj system.", SUB, "short_answer", "medium", "Local Self Government", 2,
      [], "To democratize governance at the village level; to decentralize development planning; and to give citizens a direct role in deciding local priorities.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 2. HISTORY
# ═══════════════════════════════════════════════════════════════════════════
SUB = "History"

BA += [
    Q("The Indus Valley Civilization was first excavated at:", SUB, "mcq", "easy", "Indus and Vedic Civilisation", 1,
      ["Harappa in 1921", "Mohenjo-daro in 1922", "Lothal in 1955", "Dholavira in 1990"],
      "A", "Dayaram Sahni's excavations at Harappa opened the study of the civilization."),
    Q("The Rig Veda is the:", SUB, "mcq", "easy", "Indus and Vedic Civilisation", 1,
      ["Oldest Veda; a collection of hymns to gods", "Latest of the four Vedas", "Book of law", "Collection of dramas"],
      "A", "It contains 1028 hymns in ten mandalas and is the earliest Vedic text."),
    Q("The Harappan port town with a dockyard is:", SUB, "mcq", "medium", "Indus and Vedic Civilisation", 1,
      ["Kalibangan", "Lothal", "Rakhigarhi", "Banawali"],
      "B", "The Lothal dockyard shows that the civilization had organized maritime trade."),
    Q("The Vedic society saw the gradual development of the varna based social structure. This statement is:", SUB, "true_false", "medium", "Indus and Vedic Civilisation", 1,
      [], "True", "The later Vedic texts describe the four varnas of brahmana; kshatriya; vaishya; and shudra."),
    Q("List any four features of the Indus Valley Civilization.", SUB, "short_answer", "medium", "Indus and Vedic Civilisation", 2,
      [], "Planned brick towns with grid streets; covered drainage; the great bath at Mohenjo-daro; a standardized system of weights; and an undeciphered script.", ""),

    Q("The first ruler of the slave dynasty of the Delhi Sultanate was:", SUB, "mcq", "medium", "Medieval India", 1,
      ["Iltutmish", "Qutb-ud-din Aibek", "Alauddin Khalji", "Firoz Shah Tughlaq"],
      "B", "He founded the dynasty after the Ghurid conquest of northern India."),
    Q("The Taj Mahal was built by:", SUB, "mcq", "easy", "Medieval India", 1,
      ["Akbar", "Shah Jahan", "Aurangzeb", "Humayun"],
      "B", "It was built in memory of Mumtaz Mahal and completed around 1653."),
    Q("The first battle of Panipat in 1526 was fought between:", SUB, "mcq", "medium", "Medieval India", 1,
      ["Babur and Ibrahim Lodi", "Akbar and the Afghans", "The Marathas and the English", "Tipu Sultan and the British"],
      "A", "Babur's use of gunpowder weapons and the tulughma tactic decided the battle."),
    Q("Akbar's Din-i Ilahi was a syncretic faith he promoted to unite different religious groups. This statement is:", SUB, "true_false", "hard", "Medieval India", 1,
      [], "True", "It blended elements of Hinduism and Islam and was close to a court philosophy rather than a mass religion."),
    Q("State the main features of Mughal administration under Akbar.", SUB, "short_answer", "medium", "Medieval India", 2,
      [], "The mansabdari system of ranks; provinces governed by subahdars; a policy of religious tolerance; and a regular revenue system based on land measurement.", ""),

    Q("The Jallianwala Bagh massacre took place at:", SUB, "mcq", "easy", "Freedom Struggle", 1,
      ["Delhi in 1912", "Amritsar in 1919", "Mumbai in 1925", "Kolkata in 1930"],
      "B", "General Dyer's orders to fire on a peaceful gathering turned public opinion against the Raj."),
    Q("The Dandi March of 1930 was part of:", SUB, "mcq", "easy", "Freedom Struggle", 1,
      ["The Quit India Movement", "The salt satyagraha against the salt tax", "The Non Cooperation Movement", "The Khilafat Movement"],
      "B", "Breaking the salt law at Dandi on 6 April 1930 gave mass shape to civil disobedience."),
    Q("The Quit India Resolution was passed by the Congress in:", SUB, "mcq", "medium", "Freedom Struggle", 1,
      ["1920", "1930", "1942", "1947"],
      "C", "The resolution called for an orderly transfer of power and mass non cooperation."),
    Q("The Indian National Congress was founded in 1885 with A. O. Hume as its key founder. This statement is:", SUB, "true_false", "medium", "Freedom Struggle", 1,
      [], "True", "The first session at Bombay in 1885 was presided by W. C. Bonnerjee."),
    Q("Explain the main demands of the Non Cooperation Movement of 1920.", SUB, "short_answer", "medium", "Freedom Struggle", 2,
      [], "Boycott of British institutions such as schools; courts; and titles; promotion of swadeshi goods and khadi; and support for the Khilafat issue.", ""),

    Q("The First World War began in the year:", SUB, "mcq", "easy", "Modern World History", 1,
      ["1912", "1914", "1918", "1920"],
      "B", "The assassination of Archduke Franz Ferdinand at Sarajevo was the immediate trigger."),
    Q("The United Nations was established in the year:", SUB, "mcq", "easy", "Modern World History", 1,
      ["1919", "1945", "1948", "1950"],
      "B", "The Charter was signed at San Francisco in June 1945 to replace the League of Nations."),
    Q("The Cold War was the long standoff between:", SUB, "mcq", "easy", "Modern World History", 1,
      ["The USA and the Soviet Union", "Britain and France", "Japan and China", "Germany and Italy"],
      "A", "It was an ideological and military rivalry that never became a direct war between the two powers."),
    Q("The fall of the Berlin Wall in 1989 symbolized the beginning of the end of the Cold War era. This statement is:", SUB, "true_false", "medium", "Modern World History", 1,
      [], "True", "German reunification followed in 1990 and the Soviet Union dissolved in 1991."),
    Q("State any three causes of the First World War.", SUB, "short_answer", "medium", "Modern World History", 2,
      [], "Militarism; the alliance system; imperialist rivalry for colonies; and the assassination of Archduke Franz Ferdinand as the immediate trigger.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 3. SOCIOLOGY
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Sociology"

BA += [
    Q("Culture in sociology refers to:", SUB, "mcq", "easy", "Society and Culture", 1,
      ["Only art and music", "The shared patterns of values; beliefs; and practices of a group", "Only elite customs", "The climate of a region"],
      "A", "Culture is the symbolic system that guides how members of a society think and act."),
    Q("Socialization is the process by which a person learns and internalizes the norms of society. This statement is:", SUB, "true_false", "easy", "Society and Culture", 1,
      [], "True", "It begins in the family and continues through school; peers; and media."),
    Q("A social institution is best defined as:", SUB, "mcq", "medium", "Society and Culture", 1,
      ["A building", "An organized pattern of norms that meets basic social needs", "A commercial shop", "A government office only"],
      "B", "Family; education; religion; and the economy are classic examples."),
    Q("Emile Durkheim called the shared beliefs and values of a society the:", SUB, "mcq", "hard", "Society and Culture", 1,
      ["Collective consciousness", "Social contract", "Division of labour", "Anomie"],
      "A", "His concept explains how society binds individuals beyond their private interests."),
    Q("Distinguish between society and culture.", SUB, "short_answer", "medium", "Society and Culture", 2,
      [], "Society is the group of people and their patterned interactions; culture is the shared symbolic system of values; beliefs; and practices that the group creates and transmits.", ""),

    Q("The primary agent of socialization is the:", SUB, "mcq", "easy", "Social Institutions", 1,
      ["State", "Family", "Army", "Market"],
      "B", "The family is where children first learn language; norms; and roles."),
    Q("The family is called a primary group because its members have direct and intimate face to face interaction. This statement is:", SUB, "true_false", "easy", "Social Institutions", 1,
      [], "True", "Cooley used the term primary group for small groups with warm personal contact."),
    Q("Marriage systems studied in sociology include:", SUB, "mcq", "medium", "Social Institutions", 1,
      ["Monogamy and polygamy", "Monogamy only", "Polyandry only", "None of these"],
      "A", "Polygamy further includes polygyny (one husband many wives) and polyandry (one wife many husbands)."),
    Q("Education as a social institution functions to transmit knowledge and socialize the young. This statement is:", SUB, "true_false", "medium", "Social Institutions", 1,
      [], "True", "It also sorts people into roles through credentials and skills."),
    Q("List the main functions of the family.", SUB, "short_answer", "medium", "Social Institutions", 2,
      [], "Reproduction and replacement of members; socialization of children; economic cooperation; emotional support; and regulation of sexual behaviour.", ""),

    Q("The caste system in India is based primarily on:", SUB, "mcq", "easy", "Social Stratification", 1,
      ["Income", "Birth", "Education", "Choice of occupation"],
      "B", "Caste is a closed group assigned at birth with rules on occupation; marriage; and contact."),
    Q("The concept of sanskritisation was coined by:", SUB, "mcq", "medium", "Social Stratification", 1,
      ["M. N. Srinivas", "G. S. Ghurye", "Louis Dumont", "Andre Beteille"],
      "A", "It describes lower castes adopting the customs of higher castes to raise their status."),
    Q("Social mobility refers to the movement of people between social strata. This statement is:", SUB, "true_false", "easy", "Social Stratification", 1,
      [], "True", "It can be vertical (up or down) or horizontal (across groups at the same level)."),
    Q("The jajmani system refers to hereditary patron client relations between caste groups. This statement is:", SUB, "true_false", "medium", "Social Stratification", 1,
      [], "True", "Artisans received a share of produce and services in return for their work."),
    Q("Distinguish between caste and class.", SUB, "short_answer", "medium", "Social Stratification", 2,
      [], "Caste is a closed; birth ascribed hierarchy with ritual rules and endogamy; class is relatively open; based on wealth and achievement; and allows social mobility.", ""),

    Q("Modernization in Indian society includes:", SUB, "mcq", "easy", "Social Change", 1,
      ["Only urbanization", "Changes in economy; education; law; and values toward industrial and urban forms", "Only new technology", "Only new clothing"],
      "B", "It is a broad transformation of social institutions and attitudes."),
    Q("The green revolution in India transformed:", SUB, "mcq", "easy", "Social Change", 1,
      ["Agriculture", "The judiciary", "The army", "Theatre"],
      "A", "High yielding seeds; irrigation; and fertilizers raised grain output from the 1960s onward."),
    Q("A social movement is organized collective effort to promote or resist social change. This statement is:", SUB, "true_false", "medium", "Social Change", 1,
      [], "True", "Examples are the independence movement; the women's movement; and environmental movements."),
    Q("Globalization affects society mainly through faster flows of goods; capital; people; and ideas. This statement is:", SUB, "true_false", "easy", "Social Change", 1,
      [], "True", "It also reshapes local cultures and labour markets."),
    Q("State any three factors of social change in India.", SUB, "short_answer", "medium", "Social Change", 2,
      [], "Education; industrialization; urbanization; legal reforms such as personal law changes; and globalization.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 4. PSYCHOLOGY
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Psychology"

BA += [
    Q("Psychology is the scientific study of:", SUB, "mcq", "easy", "Introduction and Theories", 1,
      ["Only the soul", "Behaviour and mental processes", "Only dreams", "Only the anatomy of the brain"],
      "A", "It uses observation; experiment; and measurement to understand mind and behaviour."),
    Q("The structuralist school that analyzed conscious experience was founded by:", SUB, "mcq", "medium", "Introduction and Theories", 1,
      ["William James", "Wilhelm Wundt", "Ivan Pavlov", "B. F. Skinner"],
      "B", "Wundt set up the first psychology laboratory at Leipzig in 1879."),
    Q("The functionalist school emphasized the functions of behaviour and consciousness. This statement is:", SUB, "true_false", "easy", "Introduction and Theories", 1,
      [], "True", "Led by William James it asked what mental processes do for the organism."),
    Q("The idea of tabula rasa (mind as a blank slate) is associated with:", SUB, "mcq", "medium", "Introduction and Theories", 1,
      ["John Locke", "Sigmund Freud", "Abraham Maslow", "Jean Piaget"],
      "A", "Locke argued that experience writes all knowledge onto the empty mind of the child."),
    Q("State three major approaches in modern psychology.", SUB, "short_answer", "medium", "Introduction and Theories", 2,
      [], "Behaviourism; cognitivism; and psychoanalysis; with the biological and humanistic approaches adding further perspectives.", ""),

    Q("Classical conditioning is associated with:", SUB, "mcq", "easy", "Learning and Memory", 1,
      ["B. F. Skinner", "Ivan Pavlov", "Edward Thorndike", "Albert Bandura"],
      "B", "Pavlov's dogs learned to salivate to a bell that predicted food."),
    Q("Operant conditioning modifies behaviour through:", SUB, "mcq", "easy", "Learning and Memory", 1,
      ["Reinforcement and punishment", "Stimulus pairing only", "Observation only", "Dream analysis"],
      "A", "Consequences determine how likely a voluntary behaviour is to repeat."),
    Q("The law of effect states that behaviour followed by a satisfying consequence is more likely to recur. This statement is:", SUB, "true_false", "medium", "Learning and Memory", 1,
      [], "True", "Thorndike proposed it from his puzzle box experiments with cats."),
    Q("Short term memory can hold roughly seven plus or minus two items. This statement is:", SUB, "true_false", "medium", "Learning and Memory", 1,
      [], "True", "Miller's finding describes the limited capacity of working memory without rehearsal."),
    Q("Distinguish between classical and operant conditioning.", SUB, "short_answer", "medium", "Learning and Memory", 2,
      [], "Classical conditioning pairs stimuli to produce an involuntary response; operant conditioning shapes voluntary behaviour using its consequences such as reinforcement and punishment.", ""),

    Q("The intelligence quotient is computed as mental age divided by chronological age multiplied by 100. This statement is:", SUB, "true_false", "medium", "Intelligence", 1,
      [], "True", "This ratio formula was used in early intelligence testing before deviation based scores."),
    Q("Alfred Binet is credited with developing the first practical:", SUB, "mcq", "easy", "Intelligence", 1,
      ["IQ test for children", "Psychotherapy technique", "Reflex test", "Personality scale"],
      "A", "He and Simon designed school tests to identify pupils needing help."),
    Q("Howard Gardner proposed the theory of:", SUB, "mcq", "easy", "Intelligence", 1,
      ["A single general intelligence", "Multiple intelligences", "No measurable intelligence", "Only spatial intelligence"],
      "B", "He listed linguistic; logical mathematical; musical; bodily kinesthetic; and other distinct intelligences."),
    Q("The g factor in intelligence theory refers to a general mental ability common to all cognitive tasks. This statement is:", SUB, "true_false", "hard", "Intelligence", 1,
      [], "True", "Spearman identified it from the positive correlations among test scores."),
    Q("List the three components of Sternberg's triarchic theory of intelligence.", SUB, "short_answer", "medium", "Intelligence", 2,
      [], "Analytical; creative; and practical intelligence.", ""),

    Q("A mental disorder can be defined as a syndrome of clinically significant disturbance in cognition; emotion; or behaviour. This statement is:", SUB, "true_false", "easy", "Mental Health", 1,
      [], "True", "The definition stresses distress or impairment in addition to the symptoms."),
    Q("A common symptom of anxiety disorders is:", SUB, "mcq", "easy", "Mental Health", 1,
      ["Excessive worry and tension", "High blood pressure only", "Fever only", "Headache only"],
      "A", "Worry; restlessness; and muscle tension are core features."),
    Q("Cognitive behavioural therapy works by changing maladaptive thoughts and behaviours. This statement is:", SUB, "true_false", "easy", "Mental Health", 1,
      [], "True", "It is a structured short term approach with strong evidence for depression and anxiety."),
    Q("Stress is the body's response to any demand that upsets its balance. This statement is:", SUB, "true_false", "medium", "Mental Health", 1,
      [], "True", "The demand is called a stressor and the response mobilizes the body to cope."),
    Q("List three signs that a person may need professional mental health support.", SUB, "short_answer", "medium", "Mental Health", 2,
      [], "Persistent sadness or loss of interest; major changes in sleep or appetite; and social withdrawal or impaired daily functioning.", ""),
]
