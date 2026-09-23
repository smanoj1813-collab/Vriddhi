# -*- coding: utf-8 -*-
"""Topic and sub-topic hierarchy for the B.Com / BA / B.Sc seed bank.

Three tiers, matching the universal question bank's schema:

    subject   → QuestionMetadata.subjectId    (the CSV `subject` column)
    topic     → QuestionMetadata.topicId      (the CSV `unit` column)
    sub-topic → QuestionMetadata.subTopicId   (the CSV `subtopic` column)

`structure.py` is the single source of truth for that hierarchy. It drives:

  * generation  — every question row carries a subtopic, and the generator
                  refuses a subtopic that is not declared here (a typo would
                  otherwise split one concept into two phantom sub-topics).
  * backfill    — the questions authored before sub-topics existed get one
                  assigned by matching their text against `keywords`.

Field rules are the same as everywhere else in this directory (the app's CSV
parsers split on a raw comma): NO commas, NO double quotes and NO pipes inside
any name or keyword.
"""

# ─────────────────────────────────────────────────────────────────────────────
# B.Com
# ─────────────────────────────────────────────────────────────────────────────

B_COM_STRUCTURE = {
    "Financial Accounting": {
        "Journal and Accounting Equation": [
            ("Accounting Equation and Dual Aspect",
             ["accounting equation", "dual aspect", "two accounts", "equal amounts"]),
            ("Journalising Transactions",
             ["journal", "original entry", "journalising", "recording a transaction"]),
            ("Rules of Debit and Credit",
             ["cash is received", "debit", "credit", "customer on account"]),
        ],
        "Ledger and Trial Balance": [
            ("Ledger Posting and Balancing",
             ["ledger", "book of", "posting"]),
            ("Trial Balance Preparation",
             ["trial balance is prepared", "credit balance in the trial balance"]),
            ("Errors Disclosed and Not Disclosed",
             ["error of omission", "not disclosed", "errors that are not"]),
        ],
        "Financial Statements": [
            ("Trading Account and Gross Profit",
             ["profit earned from trading", "gross profit", "trading"]),
            ("Profit and Loss Account",
             ["net profit", "distinguish between gross profit"]),
            ("Balance Sheet Classification",
             ["closing stock", "current liability", "creditor", "balance sheet"]),
        ],
        "Bank Reconciliation and Depreciation": [
            ("Bank Reconciliation Statement",
             ["bank reconciliation", "reconcile", "cheque deposited", "cash book"]),
            ("Depreciation Concepts and Causes",
             ["depreciation is charged", "wear and tear", "obsolescence"]),
            ("Methods of Depreciation",
             ["straight line", "methods of providing depreciation", "diminishing balance",
              "original cost"]),
        ],
    },
    "Commercial Law": {
        "Indian Contract Act": [
            ("Essentials of a Valid Contract",
             ["valid contract", "essentials", "requires"]),
            ("Consideration and Capacity",
             ["consideration"]),
            ("Free Consent and Discharge",
             ["coercion", "come to an end", "performance", "free consent"]),
        ],
        "Sale of Goods": [
            ("Sale and Agreement to Sell",
             ["sale of goods is complete", "agreement to sell"]),
            ("Goods Risk and Transfer of Property",
             ["risk normally follows", "goods under the sale", "sale on approval"]),
            ("Conditions and Warranties",
             ["conditions implied", "warrant"]),
        ],
        "Negotiable Instruments": [
            ("Promissory Note",
             ["promissory note"]),
            ("Bill of Exchange and Cheque",
             ["cheque", "bill of exchange", "written instruction"]),
            ("Holder in Due Course",
             ["holder in due course"]),
        ],
        "Consumer Protection": [
            ("Consumer Protection Act 2019",
             ["consumer protection act", "replaced"]),
            ("Consumer Rights",
             ["rights of a consumer", "consumer rights", "right to safety"]),
            ("Consumer Disputes Redressal",
             ["dissatisfied consumer", "deficiency in service", "redressal", "commission"]),
        ],
    },
    "Business Mathematics": {
        "Probability and Statistics": [
            ("Probability of Events",
             ["impossible event", "probabilities of all outcomes", "random experiment"]),
            ("Bayes Theorem and Conditional Probability",
             ["bayes"]),
            ("Measures of Dispersion and Central Tendency",
             ["standard deviation", "mean of a grouped", "step deviation", "frequency"]),
        ],
        "Index Numbers": [
            ("Construction of Index Numbers",
             ["simple aggregate", "constructing a price index"]),
            ("Laspeyres Fisher and Marshalls Indices",
             ["fishers ideal", "geometric mean"]),
            ("Uses and Consumer Price Index",
             ["index number expresses", "consumer price index", "uses of index numbers",
              "household inflation"]),
        ],
        "Time Series": [
            ("Components of a Time Series",
             ["four components", "components of a time series"]),
            ("Trend and Seasonal Variation",
             ["long term rising", "seasonal variation", "moving average"]),
            ("Business Cycle and Irregular Fluctuations",
             ["business cycle"]),
        ],
        "Linear Programming": [
            ("Formulation of an LPP",
             ["objective is to", "linear programming problem the objective"]),
            ("Feasible Region and Graphical Method",
             ["feasible solutions", "graphical method", "feasible region"]),
            ("Simplex Method and Slack Variables",
             ["simplex", "slack variables"]),
        ],
    },
    "Economics": {
        "Demand and Supply": [
            ("Law of Demand",
             ["law of demand", "quantity demanded to fall"]),
            ("Elasticity of Demand",
             ["elasticity", "perfectly elastic"]),
            ("Market Equilibrium and Shifts",
             ["shift of the demand curve", "equilibrium price", "movement along"]),
        ],
        "National Income": [
            ("Methods of Measuring National Income",
             ["income method", "output method", "value added"]),
            ("GDP GNP and Per Capita Income",
             ["gnp at market prices", "per capita income", "gdp"]),
            ("Measurement Problems",
             ["problems in the measurement"]),
        ],
        "Money and Banking": [
            ("Functions and Kinds of Money",
             ["functions of money"]),
            ("Central Bank and Commercial Banks",
             ["central bank of india"]),
            ("Monetary Policy and Credit Creation",
             ["cash reserve ratio", "repo rate", "credit creation"]),
        ],
        "International Trade": [
            ("Comparative Advantage and Free Trade",
             ["comparative advantage", "free trade", "protectionism"]),
            ("Balance of Payments and Exchange Rates",
             ["balance of payments", "current account", "depreciation of the rupee"]),
            ("Trade Policy and International Institutions", []),
        ],
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# BA
# ─────────────────────────────────────────────────────────────────────────────

BA_STRUCTURE = {
    "Political Science": {
        "Preamble and Fundamental Rights": [
            ("Preamble of the Constitution",
             ["preamble", "socialist and secular"]),
            ("Right to Equality and Freedom",
             ["right to equality", "article 19", "fundamental freedoms", "articles 12 to 35"]),
            ("Writs and Enforceability", []),
        ],
        "Parliament": [
            ("Composition of Parliament",
             ["parliament of india consists", "maximum strength", "lok sabha"]),
            ("Legislative Procedure and Bills",
             ["money bill", "powers of the rajya sabha"]),
            ("Presiding Officers and Sessions",
             ["speaker of the lok sabha"]),
        ],
        "Judiciary": [
            ("Supreme Court and Its Jurisdiction",
             ["supreme court of india is located", "original jurisdiction"]),
            ("Judicial Review and Basic Structure",
             ["basic structure", "judicial review"]),
            ("Judicial Appointments and Independence",
             ["collegium"]),
        ],
        "Local Self Government": [
            ("Panchayati Raj and the 73rd Amendment",
             ["73rd", "panchayati raj"]),
            ("Urban Local Bodies and the 74th Amendment",
             ["74th"]),
            ("Gram Sabha and District Planning",
             ["gram sabha", "district planning committee"]),
        ],
    },
    "History": {
        "Indus and Vedic Civilisation": [
            ("Indus Valley Sites and Excavation",
             ["first excavated", "indus valley civilization"]),
            ("Harappan Town Planning and Society",
             ["features of the indus valley", "dockyard", "port town"]),
            ("Vedic Literature and Society",
             ["rig veda", "vedic society", "varna"]),
        ],
        "Medieval India": [
            ("Delhi Sultanate",
             ["slave dynasty", "delhi sultanate"]),
            ("Mughal Empire and Administration",
             ["taj mahal", "mughal administration", "din-i ilahi"]),
            ("Battles and Regional Powers",
             ["battle of panipat"]),
        ],
        "Freedom Struggle": [
            ("Rise of the Indian National Congress",
             ["indian national congress was founded", "a. o. hume"]),
            ("Gandhian Mass Movements",
             ["jallianwala bagh", "dandi march", "non cooperation"]),
            ("Quit India and Independence",
             ["quit india"]),
        ],
        "Modern World History": [
            ("Enlightenment and Revolutions",
             ["french revolution", "american revolution", "enlightenment"]),
            ("Industrial Revolution and Capitalism",
             ["industrial revolution", "capitalism"]),
            ("World Wars and the United Nations",
             ["first world war", "world war", "united nations", "cold war", "berlin wall"]),
        ],
    },
    "Sociology": {
        "Society and Culture": [
            ("Society and Social Structure",
             ["social institution", "social structure", "distinguish between society"]),
            ("Culture Norms and Values",
             ["culture in sociology", "socialization", "shared beliefs"]),
            ("Sociological Thinkers and Approaches",
             ["durkheim", "marx", "weber"]),
        ],
        "Social Institutions": [
            ("Family as a Primary Group",
             ["primary group", "functions of the family"]),
            ("Marriage and Kinship",
             ["marriage systems"]),
            ("Education Religion and Economy",
             ["education as a social institution", "socialization"]),
        ],
        "Social Stratification": [
            ("Caste System in India",
             ["caste system in india", "sanskritisation", "jajmani"]),
            ("Class and Status",
             ["distinguish between caste and class"]),
            ("Social Mobility",
             ["social mobility"]),
        ],
        "Social Change": [
            ("Modernization and Development",
             ["modernization"]),
            ("Social Movements in India",
             ["social movement", "factors of social change"]),
            ("Globalization and Society",
             ["globalization", "green revolution"]),
        ],
    },
    "Psychology": {
        "Introduction and Theories": [
            ("Definition and Early Schools",
             ["scientific study", "structuralist", "functionalist", "tabula rasa"]),
            ("Major Approaches in Psychology",
             ["major approaches"]),
            ("Research Methods in Psychology", []),
        ],
        "Learning and Memory": [
            ("Classical Conditioning",
             ["classical conditioning"]),
            ("Operant Conditioning",
             ["operant conditioning", "law of effect"]),
            ("Memory Systems and Forgetting",
             ["short term memory", "seven plus or minus"]),
        ],
        "Intelligence": [
            ("Intelligence Testing and IQ",
             ["intelligence quotient", "alfred binet", "mental age"]),
            ("Theories of Intelligence",
             ["g factor", "gardner", "sternberg", "triarchic"]),
            ("Emotional Intelligence and Aptitude", []),
        ],
        "Mental Health": [
            ("Mental Health and Mental Disorders",
             ["mental disorder", "clinically significant", "anxiety disorders"]),
            ("Therapeutic Approaches",
             ["cognitive behavioural therapy"]),
            ("Stress Coping and Wellbeing",
             ["stress is the body", "professional mental health"]),
        ],
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# B.Sc
# ─────────────────────────────────────────────────────────────────────────────

B_SC_STRUCTURE = {
    "Mathematics": {
        "Limits and Continuity": [
            ("Limit of a Function",
             ["limit of (x squared", "as x approaches 1"]),
            ("Continuity at a Point",
             ["continuous at x = a", "continuity of a function"]),
            ("Standard Limits and Theorems",
             ["sin x) / x", "intermediate value theorem"]),
        ],
        "Differentiation": [
            ("Derivative from First Principles",
             ["derivative of x cubed", "derivative of sin x"]),
            ("Rules of Differentiation",
             ["chain rule", "product rule"]),
            ("Applications of Derivatives",
             ["local maximum", "derivative equals zero"]),
        ],
        "Integration": [
            ("Indefinite Integrals",
             ["integral of 2x", "integral of 1 / x", "indefinite integral"]),
            ("Techniques of Integration", []),
            ("Definite Integrals and Fundamental Theorem",
             ["fundamental theorem of calculus", "definite integral of 3x squared"]),
        ],
        "Differential Equations": [
            ("Order Degree and Formation",
             ["order of a differential equation", "order and degree"]),
            ("First Order Linear Equations",
             ["first order linear", "integrating factor", "dy/dx = y"]),
            ("Higher Order Equations and Applications", []),
        ],
    },
    "Physics": {
        "Waves and Optics": [
            ("Wave Motion and Huygens Principle",
             ["huygens"]),
            ("Reflection Refraction and Mirrors",
             ["speed of light", "plane mirror", "splitting of white light"]),
            ("Interference and Diffraction",
             ["young's double slit", "double slit"]),
        ],
        "Electricity and Magnetism": [
            ("Ohms Law and Circuits",
             ["ohm's law", "kirchhoff", "electrical resistance"]),
            ("Electrostatics and Capacitance", []),
            ("Magnetic Effects and Induction",
             ["magnetic force", "unit of inductance", "cross b"]),
        ],
        "Modern Physics": [
            ("Photoelectric Effect and Photons",
             ["photoelectric", "energy of a photon"]),
            ("Atomic Models and Spectra",
             ["bohr model", "stationary orbits"]),
            ("Nuclear Physics and Uncertainty",
             ["fission of uranium", "heisenberg", "mass defect"]),
        ],
        "Thermodynamics": [
            ("First Law and Thermodynamic Processes",
             ["first law of thermodynamics", "isothermal"]),
            ("Second Law and Entropy",
             ["second law of thermodynamics", "clausius"]),
            ("Carnot Engine and Absolute Zero",
             ["carnot", "absolute zero"]),
        ],
    },
    "Chemistry": {
        "Chemical Bonding": [
            ("Ionic and Covalent Bonds",
             ["sharing of electron pairs", "ionic bond"]),
            ("Molecular Geometry and VSEPR",
             ["shape of the methane", "vsepr"]),
            ("Hydrogen Bonding and Intermolecular Forces",
             ["hydrogen bonding"]),
        ],
        "Chemical Thermodynamics": [
            ("Enthalpy and Hesss Law",
             ["enthalpy change", "first law of thermodynamics with its equation"]),
            ("Entropy and Disorder",
             ["entropy"]),
            ("Gibbs Energy and Spontaneity",
             ["gibbs free energy", "spontaneous when delta g"]),
        ],
        "Electrochemistry": [
            ("Galvanic Cells and Electrode Potential",
             ["chemical energy into electrical energy", "standard hydrogen electrode"]),
            ("Nernst Equation and Conductance",
             ["nernst"]),
            ("Electrolysis Faradays Laws and Corrosion",
             ["faraday", "corrosion of iron"]),
        ],
        "Coordination Compounds": [
            ("Ligands and Coordination Number",
             ["ligand", "coordination number", "monodentate", "coordination entity"]),
            ("Nomenclature and Isomerism",
             ["central metal ion", "complex cation", "dissociates"]),
            ("Bonding Theories in Complexes", []),
        ],
    },
    "Computer Science": {
        "Programming Fundamentals": [
            ("Variables Data Types and Operators",
             ["variable in programming", "immutable data type"]),
            ("Control Flow and Loops",
             ["infinite loop", "loop condition"]),
            ("Functions and Complexity",
             ["compiler and an interpreter", "binary search"]),
        ],
        "Data Structures": [
            ("Stacks and Queues",
             ["stack follows", "queue follows", "applications of a stack"]),
            ("Trees and Graphs",
             ["binary search tree", "left child"]),
            ("Hashing and Sorting",
             ["hash table", "hash function"]),
        ],
        "Databases and SQL": [
            ("Relational Model and Keys",
             ["table is a", "primary key", "foreign key"]),
            ("SQL Commands",
             ["sql command"]),
            ("Normalization and Design",
             ["normalization"]),
        ],
        "Operating Systems": [
            ("OS Functions and Structure",
             ["operating system manages"]),
            ("Process Scheduling and Deadlock",
             ["switching the cpu", "coffman"]),
            ("Memory and Virtual Memory",
             ["virtual memory"]),
        ],
    },
}

# branch label → structure
STRUCTURES = {
    "B.Com": B_COM_STRUCTURE,
    "BA": BA_STRUCTURE,
    "B.Sc": B_SC_STRUCTURE,
}


def subtopics_for(branch, subject, topic):
    """Declared sub-topic names for a (branch, subject, topic) triple."""
    return [name for name, _ in STRUCTURES[branch][subject][topic]]


def all_subtopics(branch):
    """Every declared (subject, topic, subtopic) triple for a branch."""
    out = []
    for subject, topics in STRUCTURES[branch].items():
        for topic, subs in topics.items():
            for name, _ in subs:
                out.append((subject, topic, name))
    return out


def keywords_for(branch, subject, topic, subtopic):
    for name, kws in STRUCTURES[branch][subject][topic]:
        if name == subtopic:
            return kws
    return []


def structure_stats(branch):
    structure = STRUCTURES[branch]
    subjects = len(structure)
    topics = sum(len(t) for t in structure.values())
    subs = sum(len(s) for t in structure.values() for s in t.values())
    return {"subjects": subjects, "topics": topics, "subtopics": subs}
