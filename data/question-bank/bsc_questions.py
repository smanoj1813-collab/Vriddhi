# -*- coding: utf-8 -*-
"""B.Sc seed questions — the original topic level: 4 subjects x 4 topics x 5.

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


B_SC = []

# ═══════════════════════════════════════════════════════════════════════════
# 1. MATHEMATICS
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Mathematics"

B_SC += [
    Q("The limit of (x squared - 1) / (x - 1) as x approaches 1 is:", SUB, "mcq", "easy", "Limits and Continuity", 1,
      ["0", "2", "1", "Does not exist"],
      "B", "Factor the numerator as (x-1)(x+1); the quotient becomes x+1 which tends to 2."),
    Q("A function f is continuous at x = a if the limit of f(x) as x approaches a equals f(a). This statement is:", SUB, "true_false", "easy", "Limits and Continuity", 1,
      [], "True", "All three conditions: f(a) exists; the limit exists; and the two are equal."),
    Q("The limit of (sin x) / x as x approaches 0 is:", SUB, "mcq", "medium", "Limits and Continuity", 1,
      ["0", "1", "Infinity", "2"],
      "B", "This standard limit is proved geometrically using the squeeze theorem."),
    Q("The intermediate value theorem requires the function to be:", SUB, "mcq", "medium", "Limits and Continuity", 1,
      ["Continuous on a closed interval", "Differentiable", "Increasing", "Periodic"],
      "A", "A continuous function takes every value between its endpoint values."),
    Q("State the definition of continuity of a function at a point.", SUB, "short_answer", "easy", "Limits and Continuity", 2,
      [], "The function is continuous at a point if the limit as x approaches the point exists and is equal to the value of the function at that point.", ""),

    Q("The derivative of x cubed is:", SUB, "mcq", "easy", "Differentiation", 1,
      ["x squared", "3 x squared", "3 x", "x cubed / 3"],
      "B", "Apply the power rule: bring down the exponent and reduce it by one."),
    Q("The derivative of sin x is:", SUB, "mcq", "easy", "Differentiation", 1,
      ["cos x", "-cos x", "-sin x", "tan x"],
      "A", "The derivative of cos x is -sin x which is the companion result."),
    Q("The chain rule states that the derivative of f(g(x)) equals f prime of g(x) times g prime of x. This statement is:", SUB, "true_false", "medium", "Differentiation", 1,
      [], "True", "Differentiate the outer function keeping the inner intact then multiply by the inner derivative."),
    Q("At a local maximum of a differentiable function the derivative equals zero. This statement is:", SUB, "true_false", "medium", "Differentiation", 1,
      [], "True", "Fermat's theorem: an interior extremum of a differentiable function has a horizontal tangent."),
    Q("State the product rule for differentiation.", SUB, "short_answer", "easy", "Differentiation", 2,
      [], "The derivative of the product f g is f prime g plus f g prime.", ""),

    Q("The integral of 2x dx is:", SUB, "mcq", "easy", "Integration", 1,
      ["x squared + C", "2 x squared + C", "x + C", "2 + C"],
      "A", "Differentiating x squared + C gives back 2x."),
    Q("The integral of 1 / x dx is:", SUB, "mcq", "medium", "Integration", 1,
      ["x + C", "ln x + C", "1 / x squared + C", "e to the x + C"],
      "B", "The natural logarithm is the antiderivative of the reciprocal function."),
    Q("The fundamental theorem of calculus connects differentiation and integration. This statement is:", SUB, "true_false", "medium", "Integration", 1,
      [], "True", "It shows that integration is the inverse of differentiation and gives the evaluation rule for definite integrals."),
    Q("The definite integral of 3x squared from 0 to 1 equals:", SUB, "numerical", "medium", "Integration", 1,
      [], "1", "An antiderivative is x cubed; evaluating from 0 to 1 gives 1 - 0."),
    Q("Explain what an indefinite integral means.", SUB, "short_answer", "easy", "Integration", 2,
      [], "It denotes the family of all antiderivatives of a function; any two members differ by a constant C.", ""),

    Q("The order of a differential equation is the:", SUB, "mcq", "easy", "Differential Equations", 1,
      ["Degree of the highest derivative", "Highest order derivative present", "Number of independent variables", "Power of x"],
      "B", "An equation with y prime prime is of second order."),
    Q("The general solution of dy/dx = y is:", SUB, "mcq", "medium", "Differential Equations", 1,
      ["y = C e to the x", "y = ln x", "y = x squared", "y = sin x"],
      "A", "Separate variables: dy/y = dx; integrate to get ln|y| = x + C."),
    Q("An equation of the form dy/dx + P(x) y = Q(x) is a first order linear ordinary differential equation. This statement is:", SUB, "true_false", "medium", "Differential Equations", 1,
      [], "True", "It is solved using an integrating factor."),
    Q("The integrating factor for dy/dx + P(x) y = Q(x) is e to the integral of P dx. This statement is:", SUB, "true_false", "hard", "Differential Equations", 1,
      [], "True", "Multiplying through makes the left side the derivative of a product."),
    Q("Define the order and degree of a differential equation.", SUB, "short_answer", "medium", "Differential Equations", 2,
      [], "The order is the highest derivative present; the degree is the power of that highest derivative when the equation is a polynomial in its derivatives.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 2. PHYSICS
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Physics"

B_SC += [
    Q("The speed of light in vacuum is approximately:", SUB, "mcq", "easy", "Waves and Optics", 1,
      ["3 x 10 to the 6 m/s", "3 x 10 to the 8 m/s", "3 x 10 to the 10 m/s", "3 x 10 to the 4 m/s"],
      "B", "It is denoted by c and is a universal constant in relativity."),
    Q("The splitting of white light into its colours is called:", SUB, "mcq", "easy", "Waves and Optics", 1,
      ["Reflection", "Dispersion", "Absorption", "Emission"],
      "B", "Different wavelengths bend by different amounts in a prism."),
    Q("Young's double slit experiment demonstrates the:", SUB, "mcq", "medium", "Waves and Optics", 1,
      ["Particle nature of light", "Wave nature of light through interference", "Gravitation of light", "Charge of light"],
      "B", "The alternating bright and dark fringes come from constructive and destructive interference."),
    Q("The focal length of a plane mirror is infinite. This statement is:", SUB, "true_false", "medium", "Waves and Optics", 1,
      [], "True", "Its reflecting surface has no curvature so the focal length is taken as infinity."),
    Q("State Huygens' principle.", SUB, "short_answer", "medium", "Waves and Optics", 2,
      [], "Every point on a wavefront acts as a source of secondary wavelets and the new wavefront is the envelope of those wavelets.", ""),

    Q("The SI unit of electrical resistance is the:", SUB, "mcq", "easy", "Electricity and Magnetism", 1,
      ["Volt", "Ampere", "Ohm", "Watt"],
      "C", "One ohm is the resistance that allows one ampere under one volt."),
    Q("Ohm's law holds exactly when the:", SUB, "mcq", "medium", "Electricity and Magnetism", 1,
      ["Temperature is kept constant", "Current is zero", "Circuit is open", "Voltage is changing rapidly"],
      "A", "V = I R for ohmic conductors at constant temperature."),
    Q("The magnetic force on a moving charge is given by F = q v cross B. This statement is:", SUB, "true_false", "medium", "Electricity and Magnetism", 1,
      [], "True", "The force is perpendicular to both the velocity and the field and equals q v B sin theta."),
    Q("The unit of inductance is the:", SUB, "mcq", "easy", "Electricity and Magnetism", 1,
      ["Henry", "Farad", "Coulomb", "Tesla"],
      "A", "A one henry inductor develops one volt when the current changes at one ampere per second."),
    Q("State Kirchhoff's junction rule.", SUB, "short_answer", "easy", "Electricity and Magnetism", 2,
      [], "The total current entering a junction equals the total current leaving it; it is a statement of conservation of charge.", ""),

    Q("The photoelectric effect was explained by:", SUB, "mcq", "easy", "Modern Physics", 1,
      ["Isaac Newton", "Albert Einstein", "Niels Bohr alone", "James Maxwell"],
      "B", "Einstein showed that light comes in quanta (photons) of energy h f; he won the Nobel Prize for this."),
    Q("The energy of a photon is given by:", SUB, "mcq", "easy", "Modern Physics", 1,
      ["E = h f", "E = m c squared only", "E = m v squared", "E = h f / c"],
      "A", "Energy is proportional to the frequency of the radiation."),
    Q("In the Bohr model electrons occupy stationary orbits with quantized angular momentum. This statement is:", SUB, "true_false", "medium", "Modern Physics", 1,
      [], "True", "An electron radiates energy only when it jumps between allowed orbits."),
    Q("The energy released in the fission of uranium 235 comes from the mass defect converted by E = m c squared. This statement is:", SUB, "true_false", "medium", "Modern Physics", 1,
      [], "True", "The products weigh slightly less than the reactants and the lost mass appears as energy."),
    Q("State Heisenberg's uncertainty principle.", SUB, "short_answer", "medium", "Modern Physics", 2,
      [], "The product of the uncertainties in position and momentum is at least h over 4 pi; the two cannot be known exactly at the same time.", ""),

    Q("The first law of thermodynamics is a statement of:", SUB, "mcq", "easy", "Thermodynamics", 1,
      ["Increase of entropy", "Conservation of energy", "Newton's first law", "Ohm's law"],
      "B", "Energy can change form but the total energy of an isolated system is constant."),
    Q("In an isothermal process the:", SUB, "mcq", "easy", "Thermodynamics", 1,
      ["Temperature is constant", "Volume is constant", "Pressure is constant", "Heat exchange is zero"],
      "A", "For an ideal gas internal energy depends only on temperature so delta U is zero in an isothermal change."),
    Q("The efficiency of a Carnot engine depends only on the temperatures of the source and the sink. This statement is:", SUB, "true_false", "medium", "Thermodynamics", 1,
      [], "True", "No real engine can exceed the Carnot efficiency for the same reservoirs."),
    Q("Absolute zero is:", SUB, "mcq", "medium", "Thermodynamics", 1,
      ["0 degrees Celsius", "0 kelvin (about -273.15 degrees Celsius)", "100 kelvin", "-100 degrees Celsius"],
      "B", "It is the lower limit of the thermodynamic temperature scale."),
    Q("State the second law of thermodynamics in the Clausius form.", SUB, "short_answer", "medium", "Thermodynamics", 2,
      [], "Heat cannot of itself pass from a colder body to a hotter body; external work is required for refrigeration.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 3. CHEMISTRY
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Chemistry"

B_SC += [
    Q("The bond formed by the sharing of electron pairs is the:", SUB, "mcq", "easy", "Chemical Bonding", 1,
      ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"],
      "B", "Atoms share pairs to complete their valence shells."),
    Q("The shape of the methane molecule is:", SUB, "mcq", "easy", "Chemical Bonding", 1,
      ["Linear", "Tetrahedral", "Trigonal planar", "Octahedral"],
      "B", "Four equivalent C-H bonds point to the corners of a tetrahedron with 109.5 degree angles."),
    Q("The VSEPR theory predicts molecular shape from the:", SUB, "mcq", "medium", "Chemical Bonding", 1,
      ["Repulsion of electron pairs around the central atom", "Mass of the central atom", "Charge of the nucleus only", "Colour of the compound"],
      "A", "Electron pairs arrange themselves as far apart as possible."),
    Q("Among H2O; H2S; HCl; and CH4 the strongest hydrogen bonding is shown by water. This statement is:", SUB, "true_false", "medium", "Chemical Bonding", 1,
      [], "True", "Oxygen is small and highly electronegative so O-H-O hydrogen bonds are strong."),
    Q("Distinguish between an ionic bond and a covalent bond.", SUB, "short_answer", "medium", "Chemical Bonding", 2,
      [], "An ionic bond involves transfer of electrons between metal and non metal with electrostatic attraction and high melting points; a covalent bond involves sharing of electron pairs usually between non metals with lower melting points.", ""),

    Q("Gibbs free energy is defined as:", SUB, "mcq", "medium", "Chemical Thermodynamics", 1,
      ["G = H - T S", "G = H + T S", "G = U + P V only", "G = T S - H"],
      "A", "It combines enthalpy and entropy into one quantity for spontaneity at constant T and P."),
    Q("A reaction is spontaneous when delta G is:", SUB, "mcq", "easy", "Chemical Thermodynamics", 1,
      ["Positive", "Negative", "Zero", "Infinite"],
      "B", "Delta G = 0 means the system is at equilibrium."),
    Q("The entropy of a system increases when its disorder increases. This statement is:", SUB, "true_false", "easy", "Chemical Thermodynamics", 1,
      [], "True", "Gases have higher entropy than liquids which have higher entropy than solids."),
    Q("The enthalpy change of a reaction depends only on the initial and final states. This statement is:", SUB, "true_false", "medium", "Chemical Thermodynamics", 1,
      [], "True", "Enthalpy is a state function; this is the basis of Hess's law."),
    Q("State the first law of thermodynamics with its equation.", SUB, "short_answer", "medium", "Chemical Thermodynamics", 2,
      [], "Energy of the universe is constant; for a system the change in internal energy equals heat added plus work done: delta U = q + w.", ""),

    Q("The device that converts chemical energy into electrical energy is:", SUB, "mcq", "easy", "Electrochemistry", 1,
      ["An electrolytic cell", "A galvanic (voltaic) cell", "A transformer", "A capacitor"],
      "B", "A spontaneous redox reaction drives the current in a galvanic cell."),
    Q("The standard hydrogen electrode is assigned a potential of:", SUB, "mcq", "medium", "Electrochemistry", 1,
      ["1.0 V", "0.00 V", "0.5 V", "2.0 V"],
      "B", "All standard electrode potentials are measured relative to it."),
    Q("The Nernst equation is used to calculate the cell potential under non standard conditions. This statement is:", SUB, "true_false", "medium", "Electrochemistry", 1,
      [], "True", "It relates potential to the activities (concentrations) of the reacting species."),
    Q("Corrosion of iron is essentially an electrochemical oxidation process. This statement is:", SUB, "true_false", "easy", "Electrochemistry", 1,
      [], "True", "Iron acts as an anode and loses electrons in the presence of moisture and oxygen."),
    Q("State Faraday's first law of electrolysis.", SUB, "short_answer", "medium", "Electrochemistry", 2,
      [], "The mass of a substance deposited or liberated at an electrode is proportional to the quantity of electricity that passes through the electrolyte: m = Z I t.", ""),

    Q("The central metal ion in the complex [Co(NH3)6]Cl3 is:", SUB, "mcq", "easy", "Coordination Compounds", 1,
      ["Chlorine", "Cobalt", "Ammonia", "Nitrogen"],
      "B", "Six ammonia ligands are coordinated to the cobalt inside the brackets."),
    Q("The coordination number of the complex ion [Fe(CN)6] 3- is:", SUB, "mcq", "medium", "Coordination Compounds", 1,
      ["3", "6", "2", "4"],
      "B", "It equals the number of donor atoms bonded to the central metal; here six cyanide carbons."),
    Q("Ammonia acts as a monodentate ligand. This statement is:", SUB, "true_false", "medium", "Coordination Compounds", 1,
      [], "True", "It donates a single lone pair from the nitrogen atom."),
    Q("The complex [Co(NH3)6]Cl3 dissociates in solution into one complex cation and three chloride ions. This statement is:", SUB, "true_false", "medium", "Coordination Compounds", 1,
      [], "True", "The ions inside the coordination sphere do not ionize; the counter ions do."),
    Q("Define a ligand and a coordination entity.", SUB, "short_answer", "medium", "Coordination Compounds", 2,
      [], "A ligand is an ion or molecule that donates a lone pair of electrons to a metal; the coordination entity is the central metal with its ligands enclosed in brackets.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 4. COMPUTER SCIENCE
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Computer Science"

B_SC += [
    Q("A variable in programming is:", SUB, "mcq", "easy", "Programming Fundamentals", 1,
      ["A named storage location whose value can change", "A constant only", "A function", "A comment"],
      "A", "Its value can be read and reassigned during execution."),
    Q("In Python which of the following is an immutable data type:", SUB, "mcq", "medium", "Programming Fundamentals", 1,
      ["list", "tuple", "dict", "set"],
      "B", "Once created a tuple's elements cannot be changed."),
    Q("The time complexity of binary search on a sorted array of n elements is:", SUB, "mcq", "easy", "Programming Fundamentals", 1,
      ["O(n)", "O(log n)", "O(n squared)", "O(1)"],
      "B", "The search space is halved at every step."),
    Q("An infinite loop occurs when the loop condition never becomes false. This statement is:", SUB, "true_false", "easy", "Programming Fundamentals", 1,
      [], "True", "A missing or wrong update of the loop variable is the most common cause."),
    Q("Distinguish between a compiler and an interpreter.", SUB, "short_answer", "medium", "Programming Fundamentals", 2,
      [], "A compiler translates the whole source program into machine code before execution; an interpreter executes the source line by line at run time.", ""),

    Q("A stack follows the:", SUB, "mcq", "easy", "Data Structures", 1,
      ["FIFO principle", "LIFO principle", "Random access principle", "Priority principle"],
      "B", "The last element pushed is the first one popped."),
    Q("A queue follows the FIFO principle. This statement is:", SUB, "true_false", "easy", "Data Structures", 1,
      [], "True", "The first element enqueued is the first one dequeued; it models waiting lines."),
    Q("In a binary search tree the left child of a node holds keys:", SUB, "mcq", "easy", "Data Structures", 1,
      ["Larger than the node", "Smaller than the node", "Equal to the node", "Always null"],
      "B", "This ordering makes search traverse one side at a time."),
    Q("The average time complexity of a hash table lookup with a good hash function is O(1). This statement is:", SUB, "true_false", "medium", "Data Structures", 1,
      [], "True", "Collisions degrade the worst case but the average stays constant for a good load factor."),
    Q("State three applications of a stack.", SUB, "short_answer", "medium", "Data Structures", 2,
      [], "Managing function calls (the call stack); evaluating arithmetic expressions; and matching brackets in code.", ""),

    Q("In a relational database a table is a:", SUB, "mcq", "easy", "Databases and SQL", 1,
      ["File", "Relation", "Class", "Pointer"],
      "B", "Rows are tuples and columns are attributes of the relation."),
    Q("The SQL command used to retrieve data is:", SUB, "mcq", "easy", "Databases and SQL", 1,
      ["INSERT", "SELECT", "UPDATE", "DELETE"],
      "B", "SELECT specifies which columns and which rows to return."),
    Q("The primary key of a table must be unique and not null. This statement is:", SUB, "true_false", "easy", "Databases and SQL", 1,
      [], "True", "It uniquely identifies every row of the table."),
    Q("Normalization is used to reduce redundancy and update anomalies. This statement is:", SUB, "true_false", "medium", "Databases and SQL", 1,
      [], "True", "Each form of normal form removes a specific kind of dependency problem."),
    Q("Explain what a foreign key is.", SUB, "short_answer", "medium", "Databases and SQL", 2,
      [], "A foreign key is a column or set of columns in one table that references the primary key of another table; it enforces the relationship between the two tables.", ""),

    Q("An operating system manages:", SUB, "mcq", "easy", "Operating Systems", 1,
      ["Only the CPU", "The CPU; memory; files; and devices", "Only the display", "Only the keyboard"],
      "B", "It acts as the resource manager between applications and hardware."),
    Q("The process of switching the CPU between running processes is called:", SUB, "mcq", "easy", "Operating Systems", 1,
      ["Context switching", "Printing", "Compiling", "Booting"],
      "A", "The saved state of one process is stored and the state of the next is restored."),
    Q("The four Coffman conditions for deadlock are mutual exclusion; hold and wait; no preemption; and circular wait. This statement is:", SUB, "true_false", "medium", "Operating Systems", 1,
      [], "True", "All four must hold simultaneously for deadlock to occur; removing any one prevents it."),
    Q("Virtual memory allows processes to use disk space as an extension of RAM. This statement is:", SUB, "true_false", "easy", "Operating Systems", 1,
      [], "True", "The page table maps virtual pages to physical frames and pages out rarely used pages."),
    Q("List the four Coffman conditions required for deadlock.", SUB, "short_answer", "medium", "Operating Systems", 2,
      [], "Mutual exclusion; hold and wait; no preemption; and circular wait.", ""),
]
