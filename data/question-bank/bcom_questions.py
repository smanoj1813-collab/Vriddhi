# -*- coding: utf-8 -*-
"""B.Com seed questions — 4 subjects x 4 topics x 5 questions = 80 questions.

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


B_COM = []

# ═══════════════════════════════════════════════════════════════════════════
# 1. FINANCIAL ACCOUNTING
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Financial Accounting"

B_COM += [
    Q("The accounting equation is stated as:", SUB, "mcq", "easy", "Journal and Accounting Equation", 1,
      ["Assets = Liabilities + Capital", "Assets + Capital = Liabilities", "Capital = Assets + Liabilities", "Assets = Capital - Liabilities"],
      "A", "Assets equal the sum of outside claims (liabilities) and the owner's claims (capital)."),
    Q("Recording a transaction in the journal for the first time is called:", SUB, "mcq", "easy", "Journal and Accounting Equation", 1,
      ["Posting", "Journalising", "Ledgerising", "Balancing off"],
      "B", "The journal is the book of original entry."),
    Q("When cash is received from a customer on account the entry is:", SUB, "mcq", "medium", "Journal and Accounting Equation", 1,
      ["Debit Cash and Credit Sales", "Debit Sales and Credit Cash", "Debit Cash and Credit the customer's account", "Debit the customer's account and Credit Cash"],
      "C", "Cash (asset) increases with a debit and the debtor's claim decreases with a credit."),
    Q("Every transaction affects at least two accounts in equal amounts. This is the:", SUB, "true_false", "easy", "Journal and Accounting Equation", 1,
      [], "True", "This is the dual aspect concept of double entry book keeping."),
    Q("State the dual aspect concept of accounting.", SUB, "short_answer", "easy", "Journal and Accounting Equation", 2,
      [], "Every transaction has two equal and opposite effects so two entries (a debit and a credit) are recorded.", ""),

    Q("The ledger is called the book of:", SUB, "mcq", "easy", "Ledger and Trial Balance", 1,
      ["Original entry", "Final entry", "Subsidiary entry only", "Cash entry"],
      "B", "The journal records transactions first and the ledger (final entry) groups them by account."),
    Q("The trial balance is prepared mainly to check the:", SUB, "mcq", "easy", "Ledger and Trial Balance", 1,
      ["Profitability of the business", "Arithmetic accuracy of ledger posting", "Solvency of the business", "Efficiency of the staff"],
      "B", "Equality of total debits and credits detects one sided and amount errors."),
    Q("A cash account showing a credit balance in the trial balance indicates:", SUB, "mcq", "medium", "Ledger and Trial Balance", 1,
      ["A cash shortage", "An overdrawn position", "A credit sale", "An arithmetical error only"],
      "B", "When the bank pays more than the business deposits the cash book balance becomes negative."),
    Q("The trial balance will NOT detect an error of omission. This statement is:", SUB, "true_false", "medium", "Ledger and Trial Balance", 1,
      [], "True", "When a transaction is completely left out both sides stay equal so the trial balance agrees."),
    Q("List any four errors that are not disclosed by the trial balance.", SUB, "short_answer", "medium", "Ledger and Trial Balance", 2,
      [], "Errors of omission; errors of commission; errors of principle; and compensating errors.", ""),

    Q("The statement that shows the profit earned from trading is the:", SUB, "mcq", "easy", "Financial Statements", 1,
      ["Profit and Loss Account", "Trading Account", "Balance Sheet", "Cash Flow Statement"],
      "B", "The trading account computes gross profit from sales and cost of goods sold."),
    Q("Gross profit is calculated as:", SUB, "mcq", "easy", "Financial Statements", 1,
      ["Net sales minus all expenses", "Net sales minus cost of goods sold", "Revenue plus capital", "Sales minus drawings"],
      "B", "Cost of goods sold = opening stock + purchases + direct expenses - closing stock."),
    Q("Closing stock is shown:", SUB, "mcq", "medium", "Financial Statements", 1,
      ["Only in the Balance Sheet", "Only in the Trading Account", "On the credit side of the Trading Account and as current asset in the Balance Sheet", "Only in the Profit and Loss Account"],
      "C", "It is valued for the trading account and reported as a current asset."),
    Q("A current liability such as a creditor is shown on the:", SUB, "mcq", "easy", "Financial Statements", 1,
      ["Assets side of the Balance Sheet", "Liabilities side of the Balance Sheet", "Debit side of the Trading Account", "Credit side of the P and L Account only"],
      "B", "Liabilities and capital appear on the liabilities side of the balance sheet."),
    Q("Distinguish between gross profit and net profit.", SUB, "short_answer", "medium", "Financial Statements", 2,
      [], "Gross profit is sales minus cost of goods sold; net profit is gross profit minus operating expenses plus non operating incomes.", ""),

    Q("A bank reconciliation statement is prepared to reconcile:", SUB, "mcq", "easy", "Bank Reconciliation and Depreciation", 1,
      ["The cash book balance with the pass book balance", "The trial balance with the balance sheet", "Sales with debtors", "Assets with liabilities"],
      "A", "It explains differences such as cheques not presented and bank charges not recorded."),
    Q("A cheque deposited and recorded in the cash book but not yet cleared by the bank is in the BRS:", SUB, "mcq", "hard", "Bank Reconciliation and Depreciation", 1,
      ["Deducted from the pass book balance", "Added to the pass book balance", "Ignored completely", "Debited in the pass book"],
      "B", "The pass book has not yet received the credit so it is added to reach the cash book figure."),
    Q("Depreciation is charged because of:", SUB, "mcq", "easy", "Bank Reconciliation and Depreciation", 1,
      ["Physical wear and tear only", "Obsolescence only", "The passage of time; wear and tear; and obsolescence", "Capital loss only"],
      "C", "The service potential of a fixed asset falls for all three reasons."),
    Q("Under the straight line method the depreciation charge each year is the same on the original cost.", SUB, "true_false", "easy", "Bank Reconciliation and Depreciation", 1,
      [], "True", "A fixed percentage of the original cost is charged until the asset is fully depreciated."),
    Q("State any three methods of providing depreciation.", SUB, "short_answer", "medium", "Bank Reconciliation and Depreciation", 2,
      [], "Straight line method; diminishing balance method; and units of production method.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 2. COMMERCIAL LAW
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Commercial Law"

B_COM += [
    Q("A valid contract requires:", SUB, "mcq", "easy", "Indian Contract Act", 1,
      ["Offer and acceptance only", "Free consent; lawful consideration; competent parties; and a lawful object", "A written document only", "Stamp paper only"],
      "B", "All the essentials under the Indian Contract Act 1872 must be present together."),
    Q("An agreement without consideration is generally:", SUB, "mcq", "easy", "Indian Contract Act", 1,
      ["Always valid", "Void", "Enforceable by the court", "A quasi contract"],
      "B", "Consideration is a price in legal terms and agreement without it is void except narrow exceptions."),
    Q("Coercion in the Indian Contract Act means:", SUB, "mcq", "medium", "Indian Contract Act", 1,
      ["An expression of two or more meanings", "Obtaining consent by unlawful pressure or threat", "A casual promise", "A written notice"],
      "B", "Coercion vitiates free consent and makes the contract voidable."),
    Q("A contract may come to an end by performance; mutual agreement; or lapse of time. This statement is:", SUB, "true_false", "easy", "Indian Contract Act", 1,
      [], "True", "These are the standard modes of discharge of a contract."),
    Q("List the essentials of a valid contract under the Indian Contract Act.", SUB, "short_answer", "medium", "Indian Contract Act", 2,
      [], "Offer and acceptance; intention to create legal relation; competent parties; free consent; lawful consideration; lawful object; and it must not be declared void.", ""),

    Q("In the absence of a special agreement risk normally follows:", SUB, "mcq", "medium", "Sale of Goods", 1,
      ["Delivery", "Title", "Payment", "The invoice date"],
      "B", "Where property passes the loss by destruction falls on the owner even before delivery."),
    Q("A sale of goods is complete when:", SUB, "mcq", "easy", "Sale of Goods", 1,
      ["The full price is paid", "Property in the goods passes from the seller to the buyer", "The goods reach the buyer", "The invoice is issued"],
      "B", "Transfer of property is the defining moment of sale."),
    Q("Goods under the Sale of Goods Act include:", SUB, "mcq", "easy", "Sale of Goods", 1,
      ["Money only", "All movable property other than money and actionable claims", "Land and buildings", "Shares in a company"],
      "B", "The Act covers movables such as stock and growing crops but not money or intangible claims."),
    Q("In a sale on approval the buyer may test the goods and return them if not satisfied. This statement is:", SUB, "true_false", "medium", "Sale of Goods", 1,
      [], "True", "Property passes only when the buyer approves or keeps the goods beyond the allowed time."),
    Q("State the conditions implied under the Sale of Goods Act.", SUB, "short_answer", "medium", "Sale of Goods", 2,
      [], "Seller's title; merchantable quality; fitness for the particular purpose; and correspondence with description.", ""),

    Q("A cheque is a negotiable instrument under:", SUB, "mcq", "easy", "Negotiable Instruments", 1,
      ["The Indian Contract Act", "The Negotiable Instruments Act", "The Sales Tax Act", "The Companies Act"],
      "B", "The Negotiable Instruments Act 1881 governs promissory notes; bills of exchange; and cheques."),
    Q("A bill of exchange is a written instruction:", SUB, "mcq", "medium", "Negotiable Instruments", 1,
      ["From the drawer to the drawee to pay a certain sum to the order of a person", "From the buyer to the seller", "From the bank to the customer only", "From the government to the citizen"],
      "A", "It involves three parties: the drawer; the drawee; and the payee."),
    Q("A holder in due course must take the instrument:", SUB, "mcq", "hard", "Negotiable Instruments", 1,
      ["After maturity only", "In good faith and for value before or at maturity", "By gift only", "From a stranger to the chain"],
      "B", "These conditions give the holder a better title than the transferor."),
    Q("A promissory note is made and signed by the debtor who promises to pay. This statement is:", SUB, "true_false", "easy", "Negotiable Instruments", 1,
      [], "True", "The maker of a note is the principal debtor and only two parties are involved."),
    Q("Distinguish between a promissory note and a bill of exchange.", SUB, "short_answer", "medium", "Negotiable Instruments", 2,
      [], "A note is a written promise by the maker to pay and has two parties; a bill is a written order from drawer to drawee and has three parties; a note needs no acceptance.", ""),

    Q("The Consumer Protection Act 2019 replaced the:", SUB, "mcq", "easy", "Consumer Protection", 1,
      ["Act of 1986", "Contract Act of 1872", "Sale of Goods Act of 1930", "Companies Act of 2013"],
      "A", "The 2019 Act introduced e commerce protection and a three level commission structure."),
    Q("A dissatisfied consumer may approach the:", SUB, "mcq", "easy", "Consumer Protection", 1,
      ["Supreme Court only", "Appropriate Consumer Disputes Redressal Commission", "Police station only", "A private arbitration tribunal only"],
      "B", "Complaints go to the district; state; or national commission depending on the value of the claim."),
    Q("Deficiency in service means any fault or lack in the quality or standard of service. This statement is:", SUB, "true_false", "medium", "Consumer Protection", 1,
      [], "True", "It covers poor quality; delay; and non performance of promised services."),
    Q("The basic consumer rights include the right to safety; information; choice; and redressal. This statement is:", SUB, "true_false", "easy", "Consumer Protection", 1,
      [], "True", "The Act also lists the right to be heard and consumer education."),
    Q("List any four rights of a consumer under the Consumer Protection Act.", SUB, "short_answer", "medium", "Consumer Protection", 2,
      [], "Right to safety; right to be informed; right to choose; right to redressal; right to be heard; and consumer education.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 3. BUSINESS MATHEMATICS
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Business Mathematics"

B_COM += [
    Q("The probability of an impossible event is:", SUB, "mcq", "easy", "Probability and Statistics", 1,
      ["1", "0", "0.5", "-1"],
      "B", "An impossible event never occurs so its probability is zero."),
    Q("The sum of the probabilities of all outcomes of a random experiment is:", SUB, "mcq", "easy", "Probability and Statistics", 1,
      ["0", "1", "Greater than 1", "Undefined"],
      "B", "All possible outcomes together are certain so their probabilities add to one."),
    Q("The standard deviation is the square root of the:", SUB, "mcq", "medium", "Probability and Statistics", 1,
      ["Range", "Variance", "Median", "Mode"],
      "B", "It expresses the average spread of data around the mean in the original units."),
    Q("The mean of a grouped frequency distribution can be estimated by the step deviation method. This statement is:", SUB, "true_false", "medium", "Probability and Statistics", 1,
      [], "True", "It is a shortcut of the assumed mean method that works on small coded deviations."),
    Q("State Bayes theorem in words.", SUB, "short_answer", "hard", "Probability and Statistics", 2,
      [], "The posterior probability of a cause given observed evidence equals the prior probability of the cause times the likelihood of the evidence divided by the total probability of the evidence.", ""),

    Q("An index number expresses the:", SUB, "mcq", "easy", "Index Numbers", 1,
      ["Absolute change in a single item", "Relative change in a group of related variables", "Only a single price", "Quantity of goods produced"],
      "B", "It measures percentage change of a group of prices; quantities; or values against a base period."),
    Q("The simple aggregate method of constructing a price index is also called the:", SUB, "mcq", "medium", "Index Numbers", 1,
      ["Geometric method", "Arithmetic method", "Weighted method", "Fisher method"],
      "B", "It divides the aggregate of current prices by the aggregate of base prices and multiplies by 100."),
    Q("Fishers ideal index number is the geometric mean of the:", SUB, "mcq", "medium", "Index Numbers", 1,
      ["Laspeyres and Paasche indices", "Base year and current year prices", "Quantity index and price index", "Two aggregate indices"],
      "A", "It satisfies the time reversal and factor reversal tests."),
    Q("A consumer price index is mainly useful for measuring household inflation. This statement is:", SUB, "true_false", "easy", "Index Numbers", 1,
      [], "True", "It tracks price changes of a fixed basket of consumer goods and services."),
    Q("State any four uses of index numbers.", SUB, "short_answer", "medium", "Index Numbers", 2,
      [], "Measuring inflation; deflating values into real terms; comparing changes over time and across regions; and guiding economic policy.", ""),

    Q("The four components of a time series are:", SUB, "mcq", "easy", "Time Series", 1,
      ["Trend; seasonal; cyclical; and irregular", "Mean; median; mode; and range", "Debit; credit; balance; and total", "Input; output; stock; and flow"],
      "A", "Any observed value is modeled as a combination of these four forces."),
    Q("The long term rising or falling movement in data is called the:", SUB, "mcq", "easy", "Time Series", 1,
      ["Seasonal variation", "Trend", "Irregular variation", "Business cycle"],
      "B", "It is the secular movement that shows the general direction of the series."),
    Q("Seasonal variation is a change within a year that repeats regularly. This statement is:", SUB, "true_false", "medium", "Time Series", 1,
      [], "True", "Examples are holiday shopping peaks and monsoon demand patterns."),
    Q("The moving average method is used to estimate the:", SUB, "mcq", "medium", "Time Series", 1,
      ["Trend", "Mode", "Irregular variation only", "Random error only"],
      "A", "Averaging over a window smooths seasonal and irregular fluctuations to reveal the trend."),
    Q("Explain the concept of the business cycle.", SUB, "short_answer", "medium", "Time Series", 2,
      [], "It is the recurring but irregular rise and fall of economic activity around the trend with the phases of prosperity; recession; depression; and recovery.", ""),

    Q("In a linear programming problem the objective is to:", SUB, "mcq", "easy", "Linear Programming", 1,
      ["Maximize or minimize a linear function subject to linear constraints", "Solve a quadratic equation", "Compute a determinant", "Balance the books of account"],
      "A", "Both the objective function and the constraints must be linear."),
    Q("The set of all feasible solutions of a linear programming problem is called the:", SUB, "mcq", "easy", "Linear Programming", 1,
      ["Objective region", "Feasible region", "Shadow region", "Dual region"],
      "B", "It is the common area satisfying every constraint including non negativity."),
    Q("The simplex method moves from one:", SUB, "mcq", "hard", "Linear Programming", 1,
      ["Random point to another random point", "Corner point to an adjacent better corner point", "Center to the edge of the graph", "Row to the next column"],
      "B", "An optimum of a linear program always lies at a vertex of the feasible region."),
    Q("Slack variables are added to less than or equal to constraints to convert them into equations. This statement is:", SUB, "true_false", "medium", "Linear Programming", 1,
      [], "True", "They represent the unused portion of a scarce resource."),
    Q("State the steps of the graphical method for a two variable linear programming problem.", SUB, "short_answer", "medium", "Linear Programming", 2,
      [], "Plot each constraint line; shade the feasible region; evaluate the objective function at every corner point; and choose the corner that gives the best value.", ""),
]

# ═══════════════════════════════════════════════════════════════════════════
# 4. ECONOMICS
# ═══════════════════════════════════════════════════════════════════════════
SUB = "Economics"

B_COM += [
    Q("According to the law of demand a rise in price causes the quantity demanded to fall. This statement is:", SUB, "true_false", "easy", "Demand and Supply", 1,
      [], "True", "The inverse relation holds when other determinants remain unchanged (ceteris paribus)."),
    Q("A shift of the demand curve (not a movement along it) is caused by:", SUB, "mcq", "medium", "Demand and Supply", 1,
      ["A change in the own price of the good", "A change in consumer income", "A change in the quantity demanded", "A change in the price alone"],
      "B", "Income; tastes; prices of related goods; expectations; and the number of buyers shift the curve."),
    Q("When demand rises and supply stays the same the equilibrium price:", SUB, "mcq", "easy", "Demand and Supply", 1,
      ["Falls", "Rises", "Stays the same", "Becomes zero"],
      "B", "The demand curve shifts right and the intersection moves up along the supply curve."),
    Q("Perfectly elastic demand has a price elasticity of:", SUB, "mcq", "hard", "Demand and Supply", 1,
      ["0", "1", "Infinity", "-1"],
      "C", "Any rise in price makes quantity demanded drop to zero."),
    Q("Distinguish between a movement along the demand curve and a shift of the demand curve.", SUB, "short_answer", "medium", "Demand and Supply", 2,
      [], "A movement along the curve is caused only by a change in the own price; a shift is caused by changes in income; tastes; prices of related goods; expectations; or the number of buyers.", ""),

    Q("The income method of computing national income adds up:", SUB, "mcq", "easy", "National Income", 1,
      ["The factor incomes of all producers", "Final consumer spending", "Exports only", "Government debt"],
      "A", "Wages; rent; interest; and profit are summed to get factor income at factor cost."),
    Q("GNP at market prices equals GDP at factor cost plus net factor income from abroad plus:", SUB, "mcq", "hard", "National Income", 1,
      ["Indirect taxes minus subsidies", "Subsidies minus indirect taxes", "Depreciation", "Interest on debt"],
      "A", "Statistical adjustments convert factor cost into market prices."),
    Q("Per capita income is national income divided by the population. This statement is:", SUB, "true_false", "easy", "National Income", 1,
      [], "True", "It is used to compare the average income and living standard across countries."),
    Q("The output method computes national income as the sum of value added at each stage of production. This statement is:", SUB, "true_false", "medium", "National Income", 1,
      [], "True", "Adding value added avoids double counting of intermediate goods."),
    Q("List three problems in the measurement of national income.", SUB, "short_answer", "medium", "National Income", 2,
      [], "Double counting; non monetary transactions such as home work; and the underground economy of unrecorded activity.", ""),

    Q("The functions of money include:", SUB, "mcq", "easy", "Money and Banking", 1,
      ["Medium of exchange; store of value; and unit of account", "Only lending", "Only payment of taxes", "Only savings"],
      "A", "These three are the classic functions recognized in monetary theory."),
    Q("The central bank of India is the:", SUB, "mcq", "easy", "Money and Banking", 1,
      ["State Bank of India", "Reserve Bank of India", "National Bank for Agriculture and Rural Development", "Union Bank of India"],
      "B", "The RBI acts as banker to the government and to commercial banks."),
    Q("The cash reserve ratio is the fraction of deposits that banks must keep with the RBI as cash. This statement is:", SUB, "true_false", "medium", "Money and Banking", 1,
      [], "True", "Raising the CRR reduces the money banks can lend and tightens liquidity."),
    Q("An increase in the repo rate usually:", SUB, "mcq", "medium", "Money and Banking", 1,
      ["Increases the money supply", "Reduces the money supply and helps curb inflation", "Raises inflation directly", "Increases the cash reserve ratio automatically"],
      "B", "Borrowing becomes costlier so credit growth slows and demand pressure eases."),
    Q("Explain the credit creation function of commercial banks.", SUB, "short_answer", "hard", "Money and Banking", 2,
      [], "Banks lend out a portion of deposits; when the loan amount is redeposited it is lent again; the process multiplies the initial deposit by the money multiplier which equals one divided by the cash reserve ratio.", ""),

    Q("A country has a comparative advantage when it can produce a good at a:", SUB, "mcq", "medium", "International Trade", 1,
      ["Higher absolute cost", "Lower opportunity cost", "Zero cost", "Equal cost to others"],
      "B", "Gains from trade arise from differences in opportunity costs not absolute costs."),
    Q("The main advantage of free trade is:", SUB, "mcq", "easy", "International Trade", 1,
      ["Protection of infant industries", "Efficient allocation of resources and higher consumer welfare", "Higher tariffs on imports", "Reduced competition"],
      "B", "Resources move to their most productive use and consumers get variety at lower prices."),
    Q("The balance of payments is in equilibrium when the current account plus the capital account equals zero. This statement is:", SUB, "true_false", "hard", "International Trade", 1,
      [], "True", "A deficit in one account is financed by a surplus in the other."),
    Q("A depreciation of the rupee makes:", SUB, "mcq", "medium", "International Trade", 1,
      ["Indian exports cheaper for foreign buyers", "Imports cheaper for Indians", "Both exports and imports cheaper", "International trade impossible"],
      "A", "Foreign buyers need fewer of their own currency units for the same rupee price."),
    Q("Distinguish between free trade and protectionism.", SUB, "short_answer", "medium", "International Trade", 2,
      [], "Free trade removes barriers such as tariffs and quotas so goods move freely; protectionism keeps those barriers to shield domestic industries at the cost of efficiency and higher consumer prices.", ""),
]
