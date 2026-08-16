// src/scripts/seedStudents.ts
// ============================================================
// ONE-TIME SEED SCRIPT — Import all 500 students into Firestore
// ============================================================
//
// HOW TO RUN:
//   1. Place this file in src/scripts/seedStudents.ts
//   2. Import and call from a protected admin route/component:
//      import { seedStudents } from '../scripts/seedStudents';
//      await seedStudents('YOUR_COLLEGE_ID');
//
//   OR run via a temporary button in your SuperAdmin dashboard:
//      <button onClick={() => seedStudents(collegeId)}>Seed Students</button>
//
// ⚠️  This will WIPE existing students and re-import. Use only once.
//
// ============================================================

import { importStudentIndexBulk, deleteAllStudentIndex } from '../api/studentIndexApi';
import type { StudentImportRow } from '../types/students';

// Embedded seed data (500 students from your CSV)
const SEED_DATA: StudentImportRow[] = [
  {
    "name": "Vihaan Shinde",
    "email": "vihaan.shinde1@vriddhi.edu.in",
    "registrationNumber": "VA0001",
    "phoneNumber": "9395310485",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Shailesh Khanna",
    "email": "shailesh.khanna13@vriddhi.edu.in",
    "registrationNumber": "VA0013",
    "phoneNumber": "9853573823",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Pratham Goel",
    "email": "pratham.goel16@vriddhi.edu.in",
    "registrationNumber": "VA0016",
    "phoneNumber": "9530747414",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Parth More",
    "email": "parth.more25@vriddhi.edu.in",
    "registrationNumber": "VA0025",
    "phoneNumber": "9382811832",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Mohit Bhat",
    "email": "mohit.bhat34@vriddhi.edu.in",
    "registrationNumber": "VA0034",
    "phoneNumber": "9168747287",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Kangana Ranganathan",
    "email": "kangana.ranganathan37@vriddhi.edu.in",
    "registrationNumber": "VA0037",
    "phoneNumber": "9330035022",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Disha Gaikwad",
    "email": "disha.gaikwad40@vriddhi.edu.in",
    "registrationNumber": "VA0040",
    "phoneNumber": "9158165865",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Kiara Nair",
    "email": "kiara.nair49@vriddhi.edu.in",
    "registrationNumber": "VA0049",
    "phoneNumber": "9727255918",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Saraswati Joshi",
    "email": "saraswati.joshi55@vriddhi.edu.in",
    "registrationNumber": "VA0055",
    "phoneNumber": "9110002396",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Madhuri Nath",
    "email": "madhuri.nath58@vriddhi.edu.in",
    "registrationNumber": "VA0058",
    "phoneNumber": "9855420240",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Dev Sachdeva",
    "email": "dev.sachdeva64@vriddhi.edu.in",
    "registrationNumber": "VA0064",
    "phoneNumber": "9692362342",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Alia Gopal",
    "email": "alia.gopal76@vriddhi.edu.in",
    "registrationNumber": "VA0076",
    "phoneNumber": "9455569462",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Anil Mukherjee",
    "email": "anil.mukherjee79@vriddhi.edu.in",
    "registrationNumber": "VA0079",
    "phoneNumber": "9304095531",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Tanvi Sharma",
    "email": "tanvi.sharma85@vriddhi.edu.in",
    "registrationNumber": "VA0085",
    "phoneNumber": "9426283245",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Nikhil Cheema",
    "email": "nikhil.cheema91@vriddhi.edu.in",
    "registrationNumber": "VA0091",
    "phoneNumber": "9776205431",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Harish Shetty",
    "email": "harish.shetty94@vriddhi.edu.in",
    "registrationNumber": "VA0094",
    "phoneNumber": "9230307805",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Om Venkataraman",
    "email": "om.venkataraman97@vriddhi.edu.in",
    "registrationNumber": "VA0097",
    "phoneNumber": "9583258726",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Shweta Nath",
    "email": "shweta.nath100@vriddhi.edu.in",
    "registrationNumber": "VA0100",
    "phoneNumber": "9186519602",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Raghav Cheema",
    "email": "raghav.cheema103@vriddhi.edu.in",
    "registrationNumber": "VA0103",
    "phoneNumber": "9518197538",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Kavita Khanna",
    "email": "kavita.khanna106@vriddhi.edu.in",
    "registrationNumber": "VA0106",
    "phoneNumber": "9567975319",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Meena Mehta",
    "email": "meena.mehta112@vriddhi.edu.in",
    "registrationNumber": "VA0112",
    "phoneNumber": "9604988121",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Saurabh Shukla",
    "email": "saurabh.shukla115@vriddhi.edu.in",
    "registrationNumber": "VA0115",
    "phoneNumber": "9222824732",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Megha Trivedi",
    "email": "megha.trivedi118@vriddhi.edu.in",
    "registrationNumber": "VA0118",
    "phoneNumber": "9502982778",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Lovepreet Batra",
    "email": "lovepreet.batra121@vriddhi.edu.in",
    "registrationNumber": "VA0121",
    "phoneNumber": "9810303128",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Shivansh More",
    "email": "shivansh.more136@vriddhi.edu.in",
    "registrationNumber": "VA0136",
    "phoneNumber": "9306785808",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Pankaj Kumar",
    "email": "pankaj.kumar139@vriddhi.edu.in",
    "registrationNumber": "VA0139",
    "phoneNumber": "9860229059",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Mohit Tiwari",
    "email": "mohit.tiwari145@vriddhi.edu.in",
    "registrationNumber": "VA0145",
    "phoneNumber": "9699226355",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Mukesh Pai",
    "email": "mukesh.pai148@vriddhi.edu.in",
    "registrationNumber": "VA0148",
    "phoneNumber": "9384161612",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Kareena Mann",
    "email": "kareena.mann163@vriddhi.edu.in",
    "registrationNumber": "VA0163",
    "phoneNumber": "9973559879",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Yatin Iyer",
    "email": "yatin.iyer169@vriddhi.edu.in",
    "registrationNumber": "VA0169",
    "phoneNumber": "9433665422",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Sara Raju",
    "email": "sara.raju181@vriddhi.edu.in",
    "registrationNumber": "VA0181",
    "phoneNumber": "9590622789",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Shweta Srivastava",
    "email": "shweta.srivastava184@vriddhi.edu.in",
    "registrationNumber": "VA0184",
    "phoneNumber": "9871716956",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Ronak Dutta",
    "email": "ronak.dutta190@vriddhi.edu.in",
    "registrationNumber": "VA0190",
    "phoneNumber": "9510753814",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Megha Arora",
    "email": "megha.arora196@vriddhi.edu.in",
    "registrationNumber": "VA0196",
    "phoneNumber": "9850845198",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Ritesh Rai",
    "email": "ritesh.rai199@vriddhi.edu.in",
    "registrationNumber": "VA0199",
    "phoneNumber": "9827744047",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Anvi Brar",
    "email": "anvi.brar205@vriddhi.edu.in",
    "registrationNumber": "VA0205",
    "phoneNumber": "9114945047",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Tanish Bansal",
    "email": "tanish.bansal217@vriddhi.edu.in",
    "registrationNumber": "VA0217",
    "phoneNumber": "9361530104",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Vikram Nair",
    "email": "vikram.nair223@vriddhi.edu.in",
    "registrationNumber": "VA0223",
    "phoneNumber": "9236105947",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Dhruv Mehta",
    "email": "dhruv.mehta235@vriddhi.edu.in",
    "registrationNumber": "VA0235",
    "phoneNumber": "9200105056",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Kajal Bajaj",
    "email": "kajal.bajaj238@vriddhi.edu.in",
    "registrationNumber": "VA0238",
    "phoneNumber": "9477577220",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Kajol Banerjee",
    "email": "kajol.banerjee241@vriddhi.edu.in",
    "registrationNumber": "VA0241",
    "phoneNumber": "9924024405",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Rudra Shinde",
    "email": "rudra.shinde244@vriddhi.edu.in",
    "registrationNumber": "VA0244",
    "phoneNumber": "9779863265",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Abeer Iyer",
    "email": "abeer.iyer247@vriddhi.edu.in",
    "registrationNumber": "VA0247",
    "phoneNumber": "9910069356",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Soham Ahuja",
    "email": "soham.ahuja262@vriddhi.edu.in",
    "registrationNumber": "VA0262",
    "phoneNumber": "9476990466",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Suresh Srinivasan",
    "email": "suresh.srinivasan268@vriddhi.edu.in",
    "registrationNumber": "VA0268",
    "phoneNumber": "9585238820",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Mahesh Bose",
    "email": "mahesh.bose271@vriddhi.edu.in",
    "registrationNumber": "VA0271",
    "phoneNumber": "9610702777",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Katrina Bansal",
    "email": "katrina.bansal280@vriddhi.edu.in",
    "registrationNumber": "VA0280",
    "phoneNumber": "9973150512",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Darsh Thakur",
    "email": "darsh.thakur283@vriddhi.edu.in",
    "registrationNumber": "VA0283",
    "phoneNumber": "9182855381",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Seema Mukherjee",
    "email": "seema.mukherjee304@vriddhi.edu.in",
    "registrationNumber": "VA0304",
    "phoneNumber": "9547286055",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Sonal Subramanian",
    "email": "sonal.subramanian310@vriddhi.edu.in",
    "registrationNumber": "VA0310",
    "phoneNumber": "9778321204",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Suman Nath",
    "email": "suman.nath313@vriddhi.edu.in",
    "registrationNumber": "VA0313",
    "phoneNumber": "9608309128",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Abhishek Pillai",
    "email": "abhishek.pillai331@vriddhi.edu.in",
    "registrationNumber": "VA0331",
    "phoneNumber": "9865975088",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Shivansh Rajan",
    "email": "shivansh.rajan334@vriddhi.edu.in",
    "registrationNumber": "VA0334",
    "phoneNumber": "9950474042",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Lokesh Das",
    "email": "lokesh.das340@vriddhi.edu.in",
    "registrationNumber": "VA0340",
    "phoneNumber": "9786973497",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Trisha Chatterjee",
    "email": "trisha.chatterjee370@vriddhi.edu.in",
    "registrationNumber": "VA0370",
    "phoneNumber": "9421897671",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Arnav Shukla",
    "email": "arnav.shukla388@vriddhi.edu.in",
    "registrationNumber": "VA0388",
    "phoneNumber": "9670201461",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Rani Krishnamurthy",
    "email": "rani.krishnamurthy394@vriddhi.edu.in",
    "registrationNumber": "VA0394",
    "phoneNumber": "9300050585",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Rohit Venkatesh",
    "email": "rohit.venkatesh397@vriddhi.edu.in",
    "registrationNumber": "VA0397",
    "phoneNumber": "9602533479",
    "division": "C",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Dharmesh Arora",
    "email": "dharmesh.arora406@vriddhi.edu.in",
    "registrationNumber": "VA0406",
    "phoneNumber": "9494647257",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Meena Sharma",
    "email": "meena.sharma415@vriddhi.edu.in",
    "registrationNumber": "VA0415",
    "phoneNumber": "9900801470",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Lokesh More",
    "email": "lokesh.more424@vriddhi.edu.in",
    "registrationNumber": "VA0424",
    "phoneNumber": "9921938559",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Dev Reddy",
    "email": "dev.reddy427@vriddhi.edu.in",
    "registrationNumber": "VA0427",
    "phoneNumber": "9531929128",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Pankaj Choudhary",
    "email": "pankaj.choudhary430@vriddhi.edu.in",
    "registrationNumber": "VA0430",
    "phoneNumber": "9808897689",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Poonam Trivedi",
    "email": "poonam.trivedi439@vriddhi.edu.in",
    "registrationNumber": "VA0439",
    "phoneNumber": "9749580994",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Dev Tiwari",
    "email": "dev.tiwari442@vriddhi.edu.in",
    "registrationNumber": "VA0442",
    "phoneNumber": "9901955461",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Nidhi Murthy",
    "email": "nidhi.murthy445@vriddhi.edu.in",
    "registrationNumber": "VA0445",
    "phoneNumber": "9633947427",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Aarush Raju",
    "email": "aarush.raju460@vriddhi.edu.in",
    "registrationNumber": "VA0460",
    "phoneNumber": "9259877461",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Shraddha Mehta",
    "email": "shraddha.mehta463@vriddhi.edu.in",
    "registrationNumber": "VA0463",
    "phoneNumber": "9801943382",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Shruti Agarwal",
    "email": "shruti.agarwal466@vriddhi.edu.in",
    "registrationNumber": "VA0466",
    "phoneNumber": "9667106600",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Rohit Goel",
    "email": "rohit.goel469@vriddhi.edu.in",
    "registrationNumber": "VA0469",
    "phoneNumber": "9116812751",
    "division": "B",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Shashank Pawar",
    "email": "shashank.pawar472@vriddhi.edu.in",
    "registrationNumber": "VA0472",
    "phoneNumber": "9471363809",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Manoj Das",
    "email": "manoj.das475@vriddhi.edu.in",
    "registrationNumber": "VA0475",
    "phoneNumber": "9503111666",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Shweta Bedi",
    "email": "shweta.bedi478@vriddhi.edu.in",
    "registrationNumber": "VA0478",
    "phoneNumber": "9214408183",
    "division": "A",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Vihaan Shah",
    "email": "vihaan.shah481@vriddhi.edu.in",
    "registrationNumber": "VA0481",
    "phoneNumber": "9480012570",
    "division": "E",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Reema More",
    "email": "reema.more487@vriddhi.edu.in",
    "registrationNumber": "VA0487",
    "phoneNumber": "9771124810",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Lovepreet Venkatesh",
    "email": "lovepreet.venkatesh499@vriddhi.edu.in",
    "registrationNumber": "VA0499",
    "phoneNumber": "9842716738",
    "division": "D",
    "batch": 2027,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Dev Verma",
    "email": "dev.verma2@vriddhi.edu.in",
    "registrationNumber": "VA0002",
    "phoneNumber": "9826600539",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Abhishek Sen",
    "email": "abhishek.sen5@vriddhi.edu.in",
    "registrationNumber": "VA0005",
    "phoneNumber": "9398704996",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Preeti Reddy",
    "email": "preeti.reddy8@vriddhi.edu.in",
    "registrationNumber": "VA0008",
    "phoneNumber": "9883543540",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Reyansh Srinivasan",
    "email": "reyansh.srinivasan14@vriddhi.edu.in",
    "registrationNumber": "VA0014",
    "phoneNumber": "9507437181",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Jitendra Srivastava",
    "email": "jitendra.srivastava26@vriddhi.edu.in",
    "registrationNumber": "VA0026",
    "phoneNumber": "9420452650",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Ayaan Kamath",
    "email": "ayaan.kamath29@vriddhi.edu.in",
    "registrationNumber": "VA0029",
    "phoneNumber": "9709194872",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Yogesh Bhat",
    "email": "yogesh.bhat35@vriddhi.edu.in",
    "registrationNumber": "VA0035",
    "phoneNumber": "9107721109",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Reema Venkataraman",
    "email": "reema.venkataraman38@vriddhi.edu.in",
    "registrationNumber": "VA0038",
    "phoneNumber": "9967043303",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Meera Goyal",
    "email": "meera.goyal41@vriddhi.edu.in",
    "registrationNumber": "VA0041",
    "phoneNumber": "9959629660",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Arnav Upadhyay",
    "email": "arnav.upadhyay44@vriddhi.edu.in",
    "registrationNumber": "VA0044",
    "phoneNumber": "9680451872",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Utkarsh Mehta",
    "email": "utkarsh.mehta50@vriddhi.edu.in",
    "registrationNumber": "VA0050",
    "phoneNumber": "9299528037",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Anita Shukla",
    "email": "anita.shukla53@vriddhi.edu.in",
    "registrationNumber": "VA0053",
    "phoneNumber": "9869005091",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Ravi Pai",
    "email": "ravi.pai56@vriddhi.edu.in",
    "registrationNumber": "VA0056",
    "phoneNumber": "9643189555",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Kareena Verma",
    "email": "kareena.verma59@vriddhi.edu.in",
    "registrationNumber": "VA0059",
    "phoneNumber": "9244193987",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Ishaan Bhardwaj",
    "email": "ishaan.bhardwaj65@vriddhi.edu.in",
    "registrationNumber": "VA0065",
    "phoneNumber": "9260045822",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Rekha Hegde",
    "email": "rekha.hegde74@vriddhi.edu.in",
    "registrationNumber": "VA0074",
    "phoneNumber": "9339362341",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Pooja Bhattacharya",
    "email": "pooja.bhattacharya77@vriddhi.edu.in",
    "registrationNumber": "VA0077",
    "phoneNumber": "9385042337",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Aadhya Prasad",
    "email": "aadhya.prasad80@vriddhi.edu.in",
    "registrationNumber": "VA0080",
    "phoneNumber": "9965984448",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Jyoti Kulkarni",
    "email": "jyoti.kulkarni83@vriddhi.edu.in",
    "registrationNumber": "VA0083",
    "phoneNumber": "9417457352",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Shreyas Chavan",
    "email": "shreyas.chavan89@vriddhi.edu.in",
    "registrationNumber": "VA0089",
    "phoneNumber": "9352188235",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Jaspreet Mann",
    "email": "jaspreet.mann92@vriddhi.edu.in",
    "registrationNumber": "VA0092",
    "phoneNumber": "9361976301",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Anil Bhardwaj",
    "email": "anil.bhardwaj101@vriddhi.edu.in",
    "registrationNumber": "VA0101",
    "phoneNumber": "9264073400",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Arti Shukla",
    "email": "arti.shukla107@vriddhi.edu.in",
    "registrationNumber": "VA0107",
    "phoneNumber": "9829223044",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Arnav Bhatia",
    "email": "arnav.bhatia110@vriddhi.edu.in",
    "registrationNumber": "VA0110",
    "phoneNumber": "9507059676",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Kavita Upadhyay",
    "email": "kavita.upadhyay113@vriddhi.edu.in",
    "registrationNumber": "VA0113",
    "phoneNumber": "9173678414",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Sonal Rai",
    "email": "sonal.rai116@vriddhi.edu.in",
    "registrationNumber": "VA0116",
    "phoneNumber": "9923450567",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Yogesh Bhardwaj",
    "email": "yogesh.bhardwaj119@vriddhi.edu.in",
    "registrationNumber": "VA0119",
    "phoneNumber": "9991819497",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Ananya Cheema",
    "email": "ananya.cheema122@vriddhi.edu.in",
    "registrationNumber": "VA0122",
    "phoneNumber": "9982971099",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Mayank Jain",
    "email": "mayank.jain128@vriddhi.edu.in",
    "registrationNumber": "VA0128",
    "phoneNumber": "9295249057",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Navya Nair",
    "email": "navya.nair140@vriddhi.edu.in",
    "registrationNumber": "VA0140",
    "phoneNumber": "9694164665",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Kavya Desai",
    "email": "kavya.desai143@vriddhi.edu.in",
    "registrationNumber": "VA0143",
    "phoneNumber": "9530256336",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Atharv Das",
    "email": "atharv.das149@vriddhi.edu.in",
    "registrationNumber": "VA0149",
    "phoneNumber": "9180600295",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Mukul Hegde",
    "email": "mukul.hegde152@vriddhi.edu.in",
    "registrationNumber": "VA0152",
    "phoneNumber": "9384063364",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Dhruv Hegde",
    "email": "dhruv.hegde158@vriddhi.edu.in",
    "registrationNumber": "VA0158",
    "phoneNumber": "9824022357",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Anvi Goel",
    "email": "anvi.goel164@vriddhi.edu.in",
    "registrationNumber": "VA0164",
    "phoneNumber": "9371011200",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Durga Nair",
    "email": "durga.nair167@vriddhi.edu.in",
    "registrationNumber": "VA0167",
    "phoneNumber": "9318568997",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Anvi Bhat",
    "email": "anvi.bhat170@vriddhi.edu.in",
    "registrationNumber": "VA0170",
    "phoneNumber": "9221827951",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Anil Kurup",
    "email": "anil.kurup173@vriddhi.edu.in",
    "registrationNumber": "VA0173",
    "phoneNumber": "9743576792",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Kartik Srivastava",
    "email": "kartik.srivastava185@vriddhi.edu.in",
    "registrationNumber": "VA0185",
    "phoneNumber": "9834868441",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Amit Sodhi",
    "email": "amit.sodhi188@vriddhi.edu.in",
    "registrationNumber": "VA0188",
    "phoneNumber": "9502482554",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Anushka Rai",
    "email": "anushka.rai194@vriddhi.edu.in",
    "registrationNumber": "VA0194",
    "phoneNumber": "9590523712",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Priyanka Sandhu",
    "email": "priyanka.sandhu209@vriddhi.edu.in",
    "registrationNumber": "VA0209",
    "phoneNumber": "9225279834",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Kiara Brar",
    "email": "kiara.brar215@vriddhi.edu.in",
    "registrationNumber": "VA0215",
    "phoneNumber": "9396225446",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Kiran Naik",
    "email": "kiran.naik218@vriddhi.edu.in",
    "registrationNumber": "VA0218",
    "phoneNumber": "9695076080",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Kian Pathak",
    "email": "kian.pathak221@vriddhi.edu.in",
    "registrationNumber": "VA0221",
    "phoneNumber": "9127681228",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Saurabh Talwar",
    "email": "saurabh.talwar224@vriddhi.edu.in",
    "registrationNumber": "VA0224",
    "phoneNumber": "9935389432",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Shraddha Verma",
    "email": "shraddha.verma227@vriddhi.edu.in",
    "registrationNumber": "VA0227",
    "phoneNumber": "9626422169",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Ajay Cheema",
    "email": "ajay.cheema245@vriddhi.edu.in",
    "registrationNumber": "VA0245",
    "phoneNumber": "9587098457",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Navya Bhat",
    "email": "navya.bhat251@vriddhi.edu.in",
    "registrationNumber": "VA0251",
    "phoneNumber": "9524410834",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Kamal Bajaj",
    "email": "kamal.bajaj260@vriddhi.edu.in",
    "registrationNumber": "VA0260",
    "phoneNumber": "9900801837",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Rudra Rai",
    "email": "rudra.rai263@vriddhi.edu.in",
    "registrationNumber": "VA0263",
    "phoneNumber": "9311818984",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Abhishek Verma",
    "email": "abhishek.verma272@vriddhi.edu.in",
    "registrationNumber": "VA0272",
    "phoneNumber": "9970768982",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Alia Ghosh",
    "email": "alia.ghosh275@vriddhi.edu.in",
    "registrationNumber": "VA0275",
    "phoneNumber": "9156227043",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Kamlesh Goyal",
    "email": "kamlesh.goyal284@vriddhi.edu.in",
    "registrationNumber": "VA0284",
    "phoneNumber": "9922816526",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Saraswati Pawar",
    "email": "saraswati.pawar287@vriddhi.edu.in",
    "registrationNumber": "VA0287",
    "phoneNumber": "9941599226",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Shreyas Rajan",
    "email": "shreyas.rajan290@vriddhi.edu.in",
    "registrationNumber": "VA0290",
    "phoneNumber": "9960345542",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Manpreet Choudhary",
    "email": "manpreet.choudhary293@vriddhi.edu.in",
    "registrationNumber": "VA0293",
    "phoneNumber": "9992329618",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Vijay Bhat",
    "email": "vijay.bhat296@vriddhi.edu.in",
    "registrationNumber": "VA0296",
    "phoneNumber": "9130266145",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Ronak Singh",
    "email": "ronak.singh299@vriddhi.edu.in",
    "registrationNumber": "VA0299",
    "phoneNumber": "9374796224",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Kian Krishnamurthy",
    "email": "kian.krishnamurthy302@vriddhi.edu.in",
    "registrationNumber": "VA0302",
    "phoneNumber": "9740743666",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Myra Raju",
    "email": "myra.raju305@vriddhi.edu.in",
    "registrationNumber": "VA0305",
    "phoneNumber": "9684203557",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Chirag Wadhwa",
    "email": "chirag.wadhwa311@vriddhi.edu.in",
    "registrationNumber": "VA0311",
    "phoneNumber": "9139711044",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Vandana Mehta",
    "email": "vandana.mehta317@vriddhi.edu.in",
    "registrationNumber": "VA0317",
    "phoneNumber": "9880697625",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Vihaan Choudhary",
    "email": "vihaan.choudhary323@vriddhi.edu.in",
    "registrationNumber": "VA0323",
    "phoneNumber": "9752376434",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Ruchi Sachdeva",
    "email": "ruchi.sachdeva326@vriddhi.edu.in",
    "registrationNumber": "VA0326",
    "phoneNumber": "9919355714",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Vikram Bhatia",
    "email": "vikram.bhatia329@vriddhi.edu.in",
    "registrationNumber": "VA0329",
    "phoneNumber": "9855954847",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Karan Venkatesh",
    "email": "karan.venkatesh341@vriddhi.edu.in",
    "registrationNumber": "VA0341",
    "phoneNumber": "9159499094",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Mukesh Sethi",
    "email": "mukesh.sethi344@vriddhi.edu.in",
    "registrationNumber": "VA0344",
    "phoneNumber": "9759737342",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Aniket Mukherjee",
    "email": "aniket.mukherjee347@vriddhi.edu.in",
    "registrationNumber": "VA0347",
    "phoneNumber": "9547306651",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Tushar Dhillon",
    "email": "tushar.dhillon353@vriddhi.edu.in",
    "registrationNumber": "VA0353",
    "phoneNumber": "9652955706",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Seema Pai",
    "email": "seema.pai359@vriddhi.edu.in",
    "registrationNumber": "VA0359",
    "phoneNumber": "9726360971",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Nihar Pandit",
    "email": "nihar.pandit374@vriddhi.edu.in",
    "registrationNumber": "VA0374",
    "phoneNumber": "9360056579",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Mohit Malhotra",
    "email": "mohit.malhotra380@vriddhi.edu.in",
    "registrationNumber": "VA0380",
    "phoneNumber": "9699240979",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Aarush Sandhu",
    "email": "aarush.sandhu389@vriddhi.edu.in",
    "registrationNumber": "VA0389",
    "phoneNumber": "9454650074",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Katrina Rao",
    "email": "katrina.rao392@vriddhi.edu.in",
    "registrationNumber": "VA0392",
    "phoneNumber": "9925412179",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Kunal Shukla",
    "email": "kunal.shukla401@vriddhi.edu.in",
    "registrationNumber": "VA0401",
    "phoneNumber": "9202418976",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Vikram Upadhyay",
    "email": "vikram.upadhyay404@vriddhi.edu.in",
    "registrationNumber": "VA0404",
    "phoneNumber": "9486066116",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Ira Chatterjee",
    "email": "ira.chatterjee410@vriddhi.edu.in",
    "registrationNumber": "VA0410",
    "phoneNumber": "9220483278",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Arun Ahuja",
    "email": "arun.ahuja416@vriddhi.edu.in",
    "registrationNumber": "VA0416",
    "phoneNumber": "9852032540",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Usha Sidhu",
    "email": "usha.sidhu419@vriddhi.edu.in",
    "registrationNumber": "VA0419",
    "phoneNumber": "9503346325",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Sonali Sawant",
    "email": "sonali.sawant425@vriddhi.edu.in",
    "registrationNumber": "VA0425",
    "phoneNumber": "9116799547",
    "division": "B",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Sheena Malhotra",
    "email": "sheena.malhotra431@vriddhi.edu.in",
    "registrationNumber": "VA0431",
    "phoneNumber": "9165452764",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Sneha Chavan",
    "email": "sneha.chavan434@vriddhi.edu.in",
    "registrationNumber": "VA0434",
    "phoneNumber": "9677596076",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Pranav Naik",
    "email": "pranav.naik440@vriddhi.edu.in",
    "registrationNumber": "VA0440",
    "phoneNumber": "9730913181",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Samar Bansal",
    "email": "samar.bansal449@vriddhi.edu.in",
    "registrationNumber": "VA0449",
    "phoneNumber": "9346980616",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Sandeep Srivastava",
    "email": "sandeep.srivastava455@vriddhi.edu.in",
    "registrationNumber": "VA0455",
    "phoneNumber": "9348499712",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Suman Sodhi",
    "email": "suman.sodhi461@vriddhi.edu.in",
    "registrationNumber": "VA0461",
    "phoneNumber": "9387037751",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Poonam Sidhu",
    "email": "poonam.sidhu464@vriddhi.edu.in",
    "registrationNumber": "VA0464",
    "phoneNumber": "9693458652",
    "division": "D",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Ira Sethi",
    "email": "ira.sethi470@vriddhi.edu.in",
    "registrationNumber": "VA0470",
    "phoneNumber": "9274429624",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Pari Sawant",
    "email": "pari.sawant476@vriddhi.edu.in",
    "registrationNumber": "VA0476",
    "phoneNumber": "9764233758",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Asha Bedi",
    "email": "asha.bedi479@vriddhi.edu.in",
    "registrationNumber": "VA0479",
    "phoneNumber": "9917489574",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Ashish Rajan",
    "email": "ashish.rajan494@vriddhi.edu.in",
    "registrationNumber": "VA0494",
    "phoneNumber": "9735898931",
    "division": "E",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Dharmesh Sethi",
    "email": "dharmesh.sethi497@vriddhi.edu.in",
    "registrationNumber": "VA0497",
    "phoneNumber": "9359868249",
    "division": "C",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Sonal Gopal",
    "email": "sonal.gopal500@vriddhi.edu.in",
    "registrationNumber": "VA0500",
    "phoneNumber": "9737609304",
    "division": "A",
    "batch": 2027,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Aaradhya Patel",
    "email": "aaradhya.patel3@vriddhi.edu.in",
    "registrationNumber": "VA0003",
    "phoneNumber": "9200604502",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Juhi Sawant",
    "email": "juhi.sawant15@vriddhi.edu.in",
    "registrationNumber": "VA0015",
    "phoneNumber": "9933223566",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Katrina Wadhwa",
    "email": "katrina.wadhwa18@vriddhi.edu.in",
    "registrationNumber": "VA0018",
    "phoneNumber": "9253407200",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Shlok Nair",
    "email": "shlok.nair21@vriddhi.edu.in",
    "registrationNumber": "VA0021",
    "phoneNumber": "9217734861",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Vijay Naik",
    "email": "vijay.naik27@vriddhi.edu.in",
    "registrationNumber": "VA0027",
    "phoneNumber": "9273461957",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Suman Desai",
    "email": "suman.desai30@vriddhi.edu.in",
    "registrationNumber": "VA0030",
    "phoneNumber": "9916690353",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Krishna Gupta",
    "email": "krishna.gupta36@vriddhi.edu.in",
    "registrationNumber": "VA0036",
    "phoneNumber": "9454794895",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Veer Sandhu",
    "email": "veer.sandhu45@vriddhi.edu.in",
    "registrationNumber": "VA0045",
    "phoneNumber": "9621453189",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Pranav Arora",
    "email": "pranav.arora48@vriddhi.edu.in",
    "registrationNumber": "VA0048",
    "phoneNumber": "9333754555",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Kunal Tiwari",
    "email": "kunal.tiwari51@vriddhi.edu.in",
    "registrationNumber": "VA0051",
    "phoneNumber": "9711684318",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Myra Shetty",
    "email": "myra.shetty57@vriddhi.edu.in",
    "registrationNumber": "VA0057",
    "phoneNumber": "9496776692",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Rashmi Das",
    "email": "rashmi.das66@vriddhi.edu.in",
    "registrationNumber": "VA0066",
    "phoneNumber": "9259014493",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Monali Pawar",
    "email": "monali.pawar69@vriddhi.edu.in",
    "registrationNumber": "VA0069",
    "phoneNumber": "9265950383",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Tanish Kulkarni",
    "email": "tanish.kulkarni72@vriddhi.edu.in",
    "registrationNumber": "VA0072",
    "phoneNumber": "9216066793",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Lovepreet Pawar",
    "email": "lovepreet.pawar105@vriddhi.edu.in",
    "registrationNumber": "VA0105",
    "phoneNumber": "9888807316",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Samar Singh",
    "email": "samar.singh114@vriddhi.edu.in",
    "registrationNumber": "VA0114",
    "phoneNumber": "9767154083",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Soham Iyer",
    "email": "soham.iyer117@vriddhi.edu.in",
    "registrationNumber": "VA0117",
    "phoneNumber": "9433975497",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Kajol Pandit",
    "email": "kajol.pandit120@vriddhi.edu.in",
    "registrationNumber": "VA0120",
    "phoneNumber": "9744687060",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Nidhi Dwivedi",
    "email": "nidhi.dwivedi123@vriddhi.edu.in",
    "registrationNumber": "VA0123",
    "phoneNumber": "9989817696",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Kiran Shah",
    "email": "kiran.shah126@vriddhi.edu.in",
    "registrationNumber": "VA0126",
    "phoneNumber": "9399496923",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Sushma Singh",
    "email": "sushma.singh132@vriddhi.edu.in",
    "registrationNumber": "VA0132",
    "phoneNumber": "9199915275",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Shruti Tripathi",
    "email": "shruti.tripathi147@vriddhi.edu.in",
    "registrationNumber": "VA0147",
    "phoneNumber": "9164671796",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Harpreet Nath",
    "email": "harpreet.nath156@vriddhi.edu.in",
    "registrationNumber": "VA0156",
    "phoneNumber": "9630208579",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Asha Kulkarni",
    "email": "asha.kulkarni168@vriddhi.edu.in",
    "registrationNumber": "VA0168",
    "phoneNumber": "9620455331",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Yuvaan Venkatesh",
    "email": "yuvaan.venkatesh180@vriddhi.edu.in",
    "registrationNumber": "VA0180",
    "phoneNumber": "9733701411",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Sagar Sandhu",
    "email": "sagar.sandhu189@vriddhi.edu.in",
    "registrationNumber": "VA0189",
    "phoneNumber": "9707660630",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Parvati Hegde",
    "email": "parvati.hegde198@vriddhi.edu.in",
    "registrationNumber": "VA0198",
    "phoneNumber": "9751831074",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Dhruv Arora",
    "email": "dhruv.arora201@vriddhi.edu.in",
    "registrationNumber": "VA0201",
    "phoneNumber": "9450811990",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Riya Trivedi",
    "email": "riya.trivedi207@vriddhi.edu.in",
    "registrationNumber": "VA0207",
    "phoneNumber": "9351064359",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Pankaj Krishnamurthy",
    "email": "pankaj.krishnamurthy210@vriddhi.edu.in",
    "registrationNumber": "VA0210",
    "phoneNumber": "9224683417",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Beena Gupta",
    "email": "beena.gupta213@vriddhi.edu.in",
    "registrationNumber": "VA0213",
    "phoneNumber": "9841183219",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Anvi Pathak",
    "email": "anvi.pathak216@vriddhi.edu.in",
    "registrationNumber": "VA0216",
    "phoneNumber": "9327746886",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Ganesh Choudhary",
    "email": "ganesh.choudhary219@vriddhi.edu.in",
    "registrationNumber": "VA0219",
    "phoneNumber": "9946799779",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Sushma Kamath",
    "email": "sushma.kamath222@vriddhi.edu.in",
    "registrationNumber": "VA0222",
    "phoneNumber": "9732276010",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Mahesh Bose",
    "email": "mahesh.bose228@vriddhi.edu.in",
    "registrationNumber": "VA0228",
    "phoneNumber": "9259272239",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Vedant Kulkarni",
    "email": "vedant.kulkarni231@vriddhi.edu.in",
    "registrationNumber": "VA0231",
    "phoneNumber": "9222851168",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Varun Sodhi",
    "email": "varun.sodhi237@vriddhi.edu.in",
    "registrationNumber": "VA0237",
    "phoneNumber": "9814403943",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Kavya Naik",
    "email": "kavya.naik240@vriddhi.edu.in",
    "registrationNumber": "VA0240",
    "phoneNumber": "9399110343",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Neena More",
    "email": "neena.more246@vriddhi.edu.in",
    "registrationNumber": "VA0246",
    "phoneNumber": "9448303473",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Sangeeta Khanna",
    "email": "sangeeta.khanna249@vriddhi.edu.in",
    "registrationNumber": "VA0249",
    "phoneNumber": "9331465414",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Kamal Shinde",
    "email": "kamal.shinde255@vriddhi.edu.in",
    "registrationNumber": "VA0255",
    "phoneNumber": "9145421708",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Yash Tripathi",
    "email": "yash.tripathi258@vriddhi.edu.in",
    "registrationNumber": "VA0258",
    "phoneNumber": "9594025283",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Parvati Menon",
    "email": "parvati.menon261@vriddhi.edu.in",
    "registrationNumber": "VA0261",
    "phoneNumber": "9182011731",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Lakshay Goyal",
    "email": "lakshay.goyal282@vriddhi.edu.in",
    "registrationNumber": "VA0282",
    "phoneNumber": "9922653967",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Zara Iyer",
    "email": "zara.iyer285@vriddhi.edu.in",
    "registrationNumber": "VA0285",
    "phoneNumber": "9294181873",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Vanya Chaturvedi",
    "email": "vanya.chaturvedi291@vriddhi.edu.in",
    "registrationNumber": "VA0291",
    "phoneNumber": "9616030284",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Kavya Chopra",
    "email": "kavya.chopra300@vriddhi.edu.in",
    "registrationNumber": "VA0300",
    "phoneNumber": "9355164255",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Chirag Choudhary",
    "email": "chirag.choudhary303@vriddhi.edu.in",
    "registrationNumber": "VA0303",
    "phoneNumber": "9412750915",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Sai Sodhi",
    "email": "sai.sodhi309@vriddhi.edu.in",
    "registrationNumber": "VA0309",
    "phoneNumber": "9686277792",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Divya Goel",
    "email": "divya.goel327@vriddhi.edu.in",
    "registrationNumber": "VA0327",
    "phoneNumber": "9797460535",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Anushka Ranganathan",
    "email": "anushka.ranganathan330@vriddhi.edu.in",
    "registrationNumber": "VA0330",
    "phoneNumber": "9314939857",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Vandana Das",
    "email": "vandana.das336@vriddhi.edu.in",
    "registrationNumber": "VA0336",
    "phoneNumber": "9239340792",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Disha Varma",
    "email": "disha.varma351@vriddhi.edu.in",
    "registrationNumber": "VA0351",
    "phoneNumber": "9465278987",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Bhavesh Venkataraman",
    "email": "bhavesh.venkataraman372@vriddhi.edu.in",
    "registrationNumber": "VA0372",
    "phoneNumber": "9385111130",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Aditya Sachdeva",
    "email": "aditya.sachdeva375@vriddhi.edu.in",
    "registrationNumber": "VA0375",
    "phoneNumber": "9436824737",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Ansh Dutta",
    "email": "ansh.dutta387@vriddhi.edu.in",
    "registrationNumber": "VA0387",
    "phoneNumber": "9895525625",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Atharv Cheema",
    "email": "atharv.cheema393@vriddhi.edu.in",
    "registrationNumber": "VA0393",
    "phoneNumber": "9999371401",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Vivaan Shinde",
    "email": "vivaan.shinde399@vriddhi.edu.in",
    "registrationNumber": "VA0399",
    "phoneNumber": "9461971444",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Sonal Das",
    "email": "sonal.das408@vriddhi.edu.in",
    "registrationNumber": "VA0408",
    "phoneNumber": "9605547798",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Veer Jain",
    "email": "veer.jain411@vriddhi.edu.in",
    "registrationNumber": "VA0411",
    "phoneNumber": "9658712474",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Harish Srinivasan",
    "email": "harish.srinivasan414@vriddhi.edu.in",
    "registrationNumber": "VA0414",
    "phoneNumber": "9822378827",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Saurabh Gupta",
    "email": "saurabh.gupta417@vriddhi.edu.in",
    "registrationNumber": "VA0417",
    "phoneNumber": "9408261300",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Siya Pillai",
    "email": "siya.pillai420@vriddhi.edu.in",
    "registrationNumber": "VA0420",
    "phoneNumber": "9676876906",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Aarush Ghosh",
    "email": "aarush.ghosh426@vriddhi.edu.in",
    "registrationNumber": "VA0426",
    "phoneNumber": "9136052248",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Pankaj Deshpande",
    "email": "pankaj.deshpande435@vriddhi.edu.in",
    "registrationNumber": "VA0435",
    "phoneNumber": "9254996504",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Anvi Gopal",
    "email": "anvi.gopal438@vriddhi.edu.in",
    "registrationNumber": "VA0438",
    "phoneNumber": "9878016905",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Anita Bansal",
    "email": "anita.bansal441@vriddhi.edu.in",
    "registrationNumber": "VA0441",
    "phoneNumber": "9425545658",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Navya Chatterjee",
    "email": "navya.chatterjee447@vriddhi.edu.in",
    "registrationNumber": "VA0447",
    "phoneNumber": "9337591250",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Mahendra Nath",
    "email": "mahendra.nath453@vriddhi.edu.in",
    "registrationNumber": "VA0453",
    "phoneNumber": "9789137659",
    "division": "A",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Lakshay Venkatesh",
    "email": "lakshay.venkatesh456@vriddhi.edu.in",
    "registrationNumber": "VA0456",
    "phoneNumber": "9589636644",
    "division": "C",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Shashank Kulkarni",
    "email": "shashank.kulkarni459@vriddhi.edu.in",
    "registrationNumber": "VA0459",
    "phoneNumber": "9823737375",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Jyoti Wadhwa",
    "email": "jyoti.wadhwa462@vriddhi.edu.in",
    "registrationNumber": "VA0462",
    "phoneNumber": "9706666479",
    "division": "B",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Ishaan Pandit",
    "email": "ishaan.pandit468@vriddhi.edu.in",
    "registrationNumber": "VA0468",
    "phoneNumber": "9401048226",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Alia Nath",
    "email": "alia.nath471@vriddhi.edu.in",
    "registrationNumber": "VA0471",
    "phoneNumber": "9456192204",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Ronak Khanna",
    "email": "ronak.khanna477@vriddhi.edu.in",
    "registrationNumber": "VA0477",
    "phoneNumber": "9265593497",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Parth Banerjee",
    "email": "parth.banerjee483@vriddhi.edu.in",
    "registrationNumber": "VA0483",
    "phoneNumber": "9360642799",
    "division": "E",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Kamal Goel",
    "email": "kamal.goel492@vriddhi.edu.in",
    "registrationNumber": "VA0492",
    "phoneNumber": "9412940071",
    "division": "D",
    "batch": 2027,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Harish Rajan",
    "email": "harish.rajan4@vriddhi.edu.in",
    "registrationNumber": "VA0004",
    "phoneNumber": "9868820204",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Dhruv Sidhu",
    "email": "dhruv.sidhu7@vriddhi.edu.in",
    "registrationNumber": "VA0007",
    "phoneNumber": "9203848421",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Yatin Desai",
    "email": "yatin.desai10@vriddhi.edu.in",
    "registrationNumber": "VA0010",
    "phoneNumber": "9149203558",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Om Banerjee",
    "email": "om.banerjee19@vriddhi.edu.in",
    "registrationNumber": "VA0019",
    "phoneNumber": "9678722458",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Kajal Desai",
    "email": "kajal.desai22@vriddhi.edu.in",
    "registrationNumber": "VA0022",
    "phoneNumber": "9513140753",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Simran Singh",
    "email": "simran.singh28@vriddhi.edu.in",
    "registrationNumber": "VA0028",
    "phoneNumber": "9220117054",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Kamlesh Venkataraman",
    "email": "kamlesh.venkataraman31@vriddhi.edu.in",
    "registrationNumber": "VA0031",
    "phoneNumber": "9690347116",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Rajesh Srinivasan",
    "email": "rajesh.srinivasan43@vriddhi.edu.in",
    "registrationNumber": "VA0043",
    "phoneNumber": "9368227631",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Kiara Menon",
    "email": "kiara.menon46@vriddhi.edu.in",
    "registrationNumber": "VA0046",
    "phoneNumber": "9506919288",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Com"
  },
  {
    "name": "Tarun Pathak",
    "email": "tarun.pathak52@vriddhi.edu.in",
    "registrationNumber": "VA0052",
    "phoneNumber": "9726713347",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Chirag Goyal",
    "email": "chirag.goyal61@vriddhi.edu.in",
    "registrationNumber": "VA0061",
    "phoneNumber": "9318610946",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Suresh Bedi",
    "email": "suresh.bedi67@vriddhi.edu.in",
    "registrationNumber": "VA0067",
    "phoneNumber": "9954829815",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Lokesh Sandhu",
    "email": "lokesh.sandhu70@vriddhi.edu.in",
    "registrationNumber": "VA0070",
    "phoneNumber": "9126614158",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Kavita Rajan",
    "email": "kavita.rajan73@vriddhi.edu.in",
    "registrationNumber": "VA0073",
    "phoneNumber": "9976803188",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Parth Sethi",
    "email": "parth.sethi82@vriddhi.edu.in",
    "registrationNumber": "VA0082",
    "phoneNumber": "9644518647",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Kamlesh Mehta",
    "email": "kamlesh.mehta88@vriddhi.edu.in",
    "registrationNumber": "VA0088",
    "phoneNumber": "9404713332",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Ronak Chaturvedi",
    "email": "ronak.chaturvedi109@vriddhi.edu.in",
    "registrationNumber": "VA0109",
    "phoneNumber": "9560219456",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Pooja Gaikwad",
    "email": "pooja.gaikwad124@vriddhi.edu.in",
    "registrationNumber": "VA0124",
    "phoneNumber": "9660221300",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Shruti Dutta",
    "email": "shruti.dutta127@vriddhi.edu.in",
    "registrationNumber": "VA0127",
    "phoneNumber": "9817461907",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Akash Kurup",
    "email": "akash.kurup130@vriddhi.edu.in",
    "registrationNumber": "VA0130",
    "phoneNumber": "9191926217",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Anushka Shetty",
    "email": "anushka.shetty133@vriddhi.edu.in",
    "registrationNumber": "VA0133",
    "phoneNumber": "9428786222",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Asha Goyal",
    "email": "asha.goyal142@vriddhi.edu.in",
    "registrationNumber": "VA0142",
    "phoneNumber": "9297958983",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BBA"
  },
  {
    "name": "Rohan Chopra",
    "email": "rohan.chopra151@vriddhi.edu.in",
    "registrationNumber": "VA0151",
    "phoneNumber": "9859088046",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Ishaan Rao",
    "email": "ishaan.rao154@vriddhi.edu.in",
    "registrationNumber": "VA0154",
    "phoneNumber": "9278158234",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Mahendra Chawla",
    "email": "mahendra.chawla157@vriddhi.edu.in",
    "registrationNumber": "VA0157",
    "phoneNumber": "9888699799",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Beena Nambiar",
    "email": "beena.nambiar160@vriddhi.edu.in",
    "registrationNumber": "VA0160",
    "phoneNumber": "9728492896",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Vanya Kurup",
    "email": "vanya.kurup166@vriddhi.edu.in",
    "registrationNumber": "VA0166",
    "phoneNumber": "9656670062",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Madhuri Subramanian",
    "email": "madhuri.subramanian172@vriddhi.edu.in",
    "registrationNumber": "VA0172",
    "phoneNumber": "9607042130",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Rekha Sharma",
    "email": "rekha.sharma175@vriddhi.edu.in",
    "registrationNumber": "VA0175",
    "phoneNumber": "9403696046",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Vishal Sandhu",
    "email": "vishal.sandhu178@vriddhi.edu.in",
    "registrationNumber": "VA0178",
    "phoneNumber": "9146865930",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Rupesh Sethi",
    "email": "rupesh.sethi187@vriddhi.edu.in",
    "registrationNumber": "VA0187",
    "phoneNumber": "9131081879",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Ishaan Sachdeva",
    "email": "ishaan.sachdeva193@vriddhi.edu.in",
    "registrationNumber": "VA0193",
    "phoneNumber": "9471048258",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BA (English)"
  },
  {
    "name": "Yuvaan Nath",
    "email": "yuvaan.nath202@vriddhi.edu.in",
    "registrationNumber": "VA0202",
    "phoneNumber": "9492836532",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Sonali Bhat",
    "email": "sonali.bhat208@vriddhi.edu.in",
    "registrationNumber": "VA0208",
    "phoneNumber": "9795411453",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Anil Wadhwa",
    "email": "anil.wadhwa211@vriddhi.edu.in",
    "registrationNumber": "VA0211",
    "phoneNumber": "9498370582",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Asha Kamath",
    "email": "asha.kamath214@vriddhi.edu.in",
    "registrationNumber": "VA0214",
    "phoneNumber": "9489431174",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Tabu Choudhary",
    "email": "tabu.choudhary220@vriddhi.edu.in",
    "registrationNumber": "VA0220",
    "phoneNumber": "9239577989",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Katrina Patel",
    "email": "katrina.patel226@vriddhi.edu.in",
    "registrationNumber": "VA0226",
    "phoneNumber": "9165310776",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Monali Dwivedi",
    "email": "monali.dwivedi229@vriddhi.edu.in",
    "registrationNumber": "VA0229",
    "phoneNumber": "9728530544",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Usha Hegde",
    "email": "usha.hegde232@vriddhi.edu.in",
    "registrationNumber": "VA0232",
    "phoneNumber": "9544328940",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Lata Mishra",
    "email": "lata.mishra250@vriddhi.edu.in",
    "registrationNumber": "VA0250",
    "phoneNumber": "9404133583",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BCA"
  },
  {
    "name": "Swati Tiwari",
    "email": "swati.tiwari253@vriddhi.edu.in",
    "registrationNumber": "VA0253",
    "phoneNumber": "9108299923",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Ira Goel",
    "email": "ira.goel256@vriddhi.edu.in",
    "registrationNumber": "VA0256",
    "phoneNumber": "9718216692",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Kajol Verma",
    "email": "kajol.verma259@vriddhi.edu.in",
    "registrationNumber": "VA0259",
    "phoneNumber": "9361259074",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Shraddha Chatterjee",
    "email": "shraddha.chatterjee265@vriddhi.edu.in",
    "registrationNumber": "VA0265",
    "phoneNumber": "9790407222",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Deepak Dhillon",
    "email": "deepak.dhillon274@vriddhi.edu.in",
    "registrationNumber": "VA0274",
    "phoneNumber": "9403754671",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Radhika Pathak",
    "email": "radhika.pathak277@vriddhi.edu.in",
    "registrationNumber": "VA0277",
    "phoneNumber": "9747145068",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Navya Sandhu",
    "email": "navya.sandhu286@vriddhi.edu.in",
    "registrationNumber": "VA0286",
    "phoneNumber": "9491163514",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Disha Sawant",
    "email": "disha.sawant289@vriddhi.edu.in",
    "registrationNumber": "VA0289",
    "phoneNumber": "9402550088",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Sunil Mehta",
    "email": "sunil.mehta292@vriddhi.edu.in",
    "registrationNumber": "VA0292",
    "phoneNumber": "9919390458",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Kamal Venkatesh",
    "email": "kamal.venkatesh295@vriddhi.edu.in",
    "registrationNumber": "VA0295",
    "phoneNumber": "9501538092",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Sonal Yadav",
    "email": "sonal.yadav298@vriddhi.edu.in",
    "registrationNumber": "VA0298",
    "phoneNumber": "9914799481",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Pharm"
  },
  {
    "name": "Kartik Cheema",
    "email": "kartik.cheema301@vriddhi.edu.in",
    "registrationNumber": "VA0301",
    "phoneNumber": "9786069196",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Lakshmi Singh",
    "email": "lakshmi.singh307@vriddhi.edu.in",
    "registrationNumber": "VA0307",
    "phoneNumber": "9483426624",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Arti Nambiar",
    "email": "arti.nambiar316@vriddhi.edu.in",
    "registrationNumber": "VA0316",
    "phoneNumber": "9632794158",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Ronak Jain",
    "email": "ronak.jain319@vriddhi.edu.in",
    "registrationNumber": "VA0319",
    "phoneNumber": "9809656613",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Deepika Rao",
    "email": "deepika.rao322@vriddhi.edu.in",
    "registrationNumber": "VA0322",
    "phoneNumber": "9180574838",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Shruti Gupta",
    "email": "shruti.gupta325@vriddhi.edu.in",
    "registrationNumber": "VA0325",
    "phoneNumber": "9749715626",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Vihaan Shinde",
    "email": "vihaan.shinde328@vriddhi.edu.in",
    "registrationNumber": "VA0328",
    "phoneNumber": "9299767568",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Suresh Brar",
    "email": "suresh.brar337@vriddhi.edu.in",
    "registrationNumber": "VA0337",
    "phoneNumber": "9869801588",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Kajol Mehta",
    "email": "kajol.mehta343@vriddhi.edu.in",
    "registrationNumber": "VA0343",
    "phoneNumber": "9369085407",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Nihar Patel",
    "email": "nihar.patel346@vriddhi.edu.in",
    "registrationNumber": "VA0346",
    "phoneNumber": "9187212377",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Pratham Pandit",
    "email": "pratham.pandit349@vriddhi.edu.in",
    "registrationNumber": "VA0349",
    "phoneNumber": "9536038528",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BHM"
  },
  {
    "name": "Nandini Goel",
    "email": "nandini.goel352@vriddhi.edu.in",
    "registrationNumber": "VA0352",
    "phoneNumber": "9888340979",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Rudra Agarwal",
    "email": "rudra.agarwal355@vriddhi.edu.in",
    "registrationNumber": "VA0355",
    "phoneNumber": "9154337019",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Neena Krishnamurthy",
    "email": "neena.krishnamurthy358@vriddhi.edu.in",
    "registrationNumber": "VA0358",
    "phoneNumber": "9124885365",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Rohit Verma",
    "email": "rohit.verma361@vriddhi.edu.in",
    "registrationNumber": "VA0361",
    "phoneNumber": "9562705171",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Anil Venkatesh",
    "email": "anil.venkatesh364@vriddhi.edu.in",
    "registrationNumber": "VA0364",
    "phoneNumber": "9583564328",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Sai Gupta",
    "email": "sai.gupta367@vriddhi.edu.in",
    "registrationNumber": "VA0367",
    "phoneNumber": "9247141682",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Satish Subramanian",
    "email": "satish.subramanian373@vriddhi.edu.in",
    "registrationNumber": "VA0373",
    "phoneNumber": "9283085932",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Anushka Varma",
    "email": "anushka.varma376@vriddhi.edu.in",
    "registrationNumber": "VA0376",
    "phoneNumber": "9540639384",
    "division": "E",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Kulpreet Sodhi",
    "email": "kulpreet.sodhi379@vriddhi.edu.in",
    "registrationNumber": "VA0379",
    "phoneNumber": "9825708356",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Roshni Ahuja",
    "email": "roshni.ahuja382@vriddhi.edu.in",
    "registrationNumber": "VA0382",
    "phoneNumber": "9701818966",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Nitin Sachdeva",
    "email": "nitin.sachdeva385@vriddhi.edu.in",
    "registrationNumber": "VA0385",
    "phoneNumber": "9804344630",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Priyanka Rajan",
    "email": "priyanka.rajan391@vriddhi.edu.in",
    "registrationNumber": "VA0391",
    "phoneNumber": "9911653317",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Hitesh Dwivedi",
    "email": "hitesh.dwivedi400@vriddhi.edu.in",
    "registrationNumber": "VA0400",
    "phoneNumber": "9535391971",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "B.Ed"
  },
  {
    "name": "Abhishek Chavan",
    "email": "abhishek.chavan403@vriddhi.edu.in",
    "registrationNumber": "VA0403",
    "phoneNumber": "9386682971",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Mukul Chavan",
    "email": "mukul.chavan409@vriddhi.edu.in",
    "registrationNumber": "VA0409",
    "phoneNumber": "9739750911",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Chirag Bhattacharya",
    "email": "chirag.bhattacharya412@vriddhi.edu.in",
    "registrationNumber": "VA0412",
    "phoneNumber": "9624875038",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Aniket Chaturvedi",
    "email": "aniket.chaturvedi418@vriddhi.edu.in",
    "registrationNumber": "VA0418",
    "phoneNumber": "9883068639",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Kiran Sharma",
    "email": "kiran.sharma421@vriddhi.edu.in",
    "registrationNumber": "VA0421",
    "phoneNumber": "9911941471",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Sonal Cheema",
    "email": "sonal.cheema433@vriddhi.edu.in",
    "registrationNumber": "VA0433",
    "phoneNumber": "9538364955",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Sangeeta Banerjee",
    "email": "sangeeta.banerjee436@vriddhi.edu.in",
    "registrationNumber": "VA0436",
    "phoneNumber": "9669074377",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Tanvi Bhattacharya",
    "email": "tanvi.bhattacharya448@vriddhi.edu.in",
    "registrationNumber": "VA0448",
    "phoneNumber": "9721849977",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BFA"
  },
  {
    "name": "Radhika Chaturvedi",
    "email": "radhika.chaturvedi451@vriddhi.edu.in",
    "registrationNumber": "VA0451",
    "phoneNumber": "9894133105",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Shreyas Shukla",
    "email": "shreyas.shukla454@vriddhi.edu.in",
    "registrationNumber": "VA0454",
    "phoneNumber": "9152091933",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Kareena Ranganathan",
    "email": "kareena.ranganathan457@vriddhi.edu.in",
    "registrationNumber": "VA0457",
    "phoneNumber": "9116891857",
    "division": "A",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Neha Yadav",
    "email": "neha.yadav484@vriddhi.edu.in",
    "registrationNumber": "VA0484",
    "phoneNumber": "9388749542",
    "division": "C",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Lata Upadhyay",
    "email": "lata.upadhyay490@vriddhi.edu.in",
    "registrationNumber": "VA0490",
    "phoneNumber": "9738224541",
    "division": "B",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Poonam Malhotra",
    "email": "poonam.malhotra493@vriddhi.edu.in",
    "registrationNumber": "VA0493",
    "phoneNumber": "9976704309",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Madhuri Bhardwaj",
    "email": "madhuri.bhardwaj496@vriddhi.edu.in",
    "registrationNumber": "VA0496",
    "phoneNumber": "9174258554",
    "division": "D",
    "batch": 2028,
    "mentorName": "Jayashree g",
    "department": "BMS"
  },
  {
    "name": "Vishal Hegde",
    "email": "vishal.hegde11@vriddhi.edu.in",
    "registrationNumber": "VA0011",
    "phoneNumber": "9208449460",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Ashish Jadhav",
    "email": "ashish.jadhav17@vriddhi.edu.in",
    "registrationNumber": "VA0017",
    "phoneNumber": "9437882805",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Nidhi Bhat",
    "email": "nidhi.bhat20@vriddhi.edu.in",
    "registrationNumber": "VA0020",
    "phoneNumber": "9248532577",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Tanvi Kumar",
    "email": "tanvi.kumar23@vriddhi.edu.in",
    "registrationNumber": "VA0023",
    "phoneNumber": "9830448745",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Sarita Nath",
    "email": "sarita.nath32@vriddhi.edu.in",
    "registrationNumber": "VA0032",
    "phoneNumber": "9910959828",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Rani Wadhwa",
    "email": "rani.wadhwa47@vriddhi.edu.in",
    "registrationNumber": "VA0047",
    "phoneNumber": "9406284028",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Com"
  },
  {
    "name": "Kajol Nair",
    "email": "kajol.nair62@vriddhi.edu.in",
    "registrationNumber": "VA0062",
    "phoneNumber": "9199104722",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Mukul Shetty",
    "email": "mukul.shetty68@vriddhi.edu.in",
    "registrationNumber": "VA0068",
    "phoneNumber": "9816114302",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Vandana Shukla",
    "email": "vandana.shukla71@vriddhi.edu.in",
    "registrationNumber": "VA0071",
    "phoneNumber": "9889262019",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Rani Bhattacharya",
    "email": "rani.bhattacharya86@vriddhi.edu.in",
    "registrationNumber": "VA0086",
    "phoneNumber": "9751397897",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Kangana Raju",
    "email": "kangana.raju95@vriddhi.edu.in",
    "registrationNumber": "VA0095",
    "phoneNumber": "9700141462",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Kali Prasad",
    "email": "kali.prasad98@vriddhi.edu.in",
    "registrationNumber": "VA0098",
    "phoneNumber": "9620332086",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Roshni Sharma",
    "email": "roshni.sharma104@vriddhi.edu.in",
    "registrationNumber": "VA0104",
    "phoneNumber": "9477698143",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Lata Gaikwad",
    "email": "lata.gaikwad125@vriddhi.edu.in",
    "registrationNumber": "VA0125",
    "phoneNumber": "9736164778",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Prachi Naik",
    "email": "prachi.naik131@vriddhi.edu.in",
    "registrationNumber": "VA0131",
    "phoneNumber": "9358045858",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Tanvi Raju",
    "email": "tanvi.raju134@vriddhi.edu.in",
    "registrationNumber": "VA0134",
    "phoneNumber": "9469106688",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Pranav Pai",
    "email": "pranav.pai137@vriddhi.edu.in",
    "registrationNumber": "VA0137",
    "phoneNumber": "9893070706",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Usha Sachdeva",
    "email": "usha.sachdeva146@vriddhi.edu.in",
    "registrationNumber": "VA0146",
    "phoneNumber": "9419280490",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BBA"
  },
  {
    "name": "Siya Srinivasan",
    "email": "siya.srinivasan155@vriddhi.edu.in",
    "registrationNumber": "VA0155",
    "phoneNumber": "9839462365",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Saurabh Ahuja",
    "email": "saurabh.ahuja161@vriddhi.edu.in",
    "registrationNumber": "VA0161",
    "phoneNumber": "9538460431",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Abhishek Gopal",
    "email": "abhishek.gopal176@vriddhi.edu.in",
    "registrationNumber": "VA0176",
    "phoneNumber": "9620057604",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Komal Pathak",
    "email": "komal.pathak179@vriddhi.edu.in",
    "registrationNumber": "VA0179",
    "phoneNumber": "9950826208",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Priyanka Thakur",
    "email": "priyanka.thakur182@vriddhi.edu.in",
    "registrationNumber": "VA0182",
    "phoneNumber": "9180346223",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Rashmi Choudhary",
    "email": "rashmi.choudhary191@vriddhi.edu.in",
    "registrationNumber": "VA0191",
    "phoneNumber": "9349310440",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Beena Kumar",
    "email": "beena.kumar197@vriddhi.edu.in",
    "registrationNumber": "VA0197",
    "phoneNumber": "9707661655",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Suresh Sachdeva",
    "email": "suresh.sachdeva200@vriddhi.edu.in",
    "registrationNumber": "VA0200",
    "phoneNumber": "9135824891",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BA (English)"
  },
  {
    "name": "Rahul Subramanian",
    "email": "rahul.subramanian203@vriddhi.edu.in",
    "registrationNumber": "VA0203",
    "phoneNumber": "9965960427",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Ruchi Trivedi",
    "email": "ruchi.trivedi206@vriddhi.edu.in",
    "registrationNumber": "VA0206",
    "phoneNumber": "9904245086",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Mahendra Cheema",
    "email": "mahendra.cheema212@vriddhi.edu.in",
    "registrationNumber": "VA0212",
    "phoneNumber": "9803217037",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Kajal Raju",
    "email": "kajal.raju230@vriddhi.edu.in",
    "registrationNumber": "VA0230",
    "phoneNumber": "9416644047",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Sangeeta Gaikwad",
    "email": "sangeeta.gaikwad233@vriddhi.edu.in",
    "registrationNumber": "VA0233",
    "phoneNumber": "9202097643",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Preeti Pandey",
    "email": "preeti.pandey236@vriddhi.edu.in",
    "registrationNumber": "VA0236",
    "phoneNumber": "9697398528",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Kamlesh Subramanian",
    "email": "kamlesh.subramanian239@vriddhi.edu.in",
    "registrationNumber": "VA0239",
    "phoneNumber": "9340781088",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Saanvi Nambiar",
    "email": "saanvi.nambiar242@vriddhi.edu.in",
    "registrationNumber": "VA0242",
    "phoneNumber": "9393421844",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Sanjay Sachdeva",
    "email": "sanjay.sachdeva248@vriddhi.edu.in",
    "registrationNumber": "VA0248",
    "phoneNumber": "9810751262",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BCA"
  },
  {
    "name": "Yuvaan Sidhu",
    "email": "yuvaan.sidhu254@vriddhi.edu.in",
    "registrationNumber": "VA0254",
    "phoneNumber": "9671855941",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Heena Mishra",
    "email": "heena.mishra257@vriddhi.edu.in",
    "registrationNumber": "VA0257",
    "phoneNumber": "9534900128",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Zara Sachdeva",
    "email": "zara.sachdeva266@vriddhi.edu.in",
    "registrationNumber": "VA0266",
    "phoneNumber": "9173321814",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Madhuri Chopra",
    "email": "madhuri.chopra269@vriddhi.edu.in",
    "registrationNumber": "VA0269",
    "phoneNumber": "9182389284",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Satish Pathak",
    "email": "satish.pathak278@vriddhi.edu.in",
    "registrationNumber": "VA0278",
    "phoneNumber": "9251857566",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Manpreet Bedi",
    "email": "manpreet.bedi281@vriddhi.edu.in",
    "registrationNumber": "VA0281",
    "phoneNumber": "9119574893",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Pharm"
  },
  {
    "name": "Neel Pathak",
    "email": "neel.pathak308@vriddhi.edu.in",
    "registrationNumber": "VA0308",
    "phoneNumber": "9774585778",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Sunil Sodhi",
    "email": "sunil.sodhi314@vriddhi.edu.in",
    "registrationNumber": "VA0314",
    "phoneNumber": "9938422254",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Payal Jadhav",
    "email": "payal.jadhav320@vriddhi.edu.in",
    "registrationNumber": "VA0320",
    "phoneNumber": "9557538651",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Kangana Ahuja",
    "email": "kangana.ahuja332@vriddhi.edu.in",
    "registrationNumber": "VA0332",
    "phoneNumber": "9861863296",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Saanvi Bedi",
    "email": "saanvi.bedi335@vriddhi.edu.in",
    "registrationNumber": "VA0335",
    "phoneNumber": "9694875990",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Rekha Mukherjee",
    "email": "rekha.mukherjee338@vriddhi.edu.in",
    "registrationNumber": "VA0338",
    "phoneNumber": "9179189225",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Rupesh Rao",
    "email": "rupesh.rao350@vriddhi.edu.in",
    "registrationNumber": "VA0350",
    "phoneNumber": "9269737590",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BHM"
  },
  {
    "name": "Reema Iyer",
    "email": "reema.iyer356@vriddhi.edu.in",
    "registrationNumber": "VA0356",
    "phoneNumber": "9973465185",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Durga Mann",
    "email": "durga.mann362@vriddhi.edu.in",
    "registrationNumber": "VA0362",
    "phoneNumber": "9492922240",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Yuvaan Agarwal",
    "email": "yuvaan.agarwal365@vriddhi.edu.in",
    "registrationNumber": "VA0365",
    "phoneNumber": "9522950895",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Zara Bose",
    "email": "zara.bose368@vriddhi.edu.in",
    "registrationNumber": "VA0368",
    "phoneNumber": "9653520069",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Kirti Trivedi",
    "email": "kirti.trivedi371@vriddhi.edu.in",
    "registrationNumber": "VA0371",
    "phoneNumber": "9217687031",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Yatin Yadav",
    "email": "yatin.yadav377@vriddhi.edu.in",
    "registrationNumber": "VA0377",
    "phoneNumber": "9656931857",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Manish Trivedi",
    "email": "manish.trivedi383@vriddhi.edu.in",
    "registrationNumber": "VA0383",
    "phoneNumber": "9683246764",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Samar Gopal",
    "email": "samar.gopal386@vriddhi.edu.in",
    "registrationNumber": "VA0386",
    "phoneNumber": "9391126537",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Pankaj Chatterjee",
    "email": "pankaj.chatterjee395@vriddhi.edu.in",
    "registrationNumber": "VA0395",
    "phoneNumber": "9747233283",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Ganesh Iyer",
    "email": "ganesh.iyer398@vriddhi.edu.in",
    "registrationNumber": "VA0398",
    "phoneNumber": "9885033297",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "B.Ed"
  },
  {
    "name": "Darsh Subramanian",
    "email": "darsh.subramanian407@vriddhi.edu.in",
    "registrationNumber": "VA0407",
    "phoneNumber": "9264481748",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Nikhil Pandey",
    "email": "nikhil.pandey413@vriddhi.edu.in",
    "registrationNumber": "VA0413",
    "phoneNumber": "9651095672",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Alia More",
    "email": "alia.more422@vriddhi.edu.in",
    "registrationNumber": "VA0422",
    "phoneNumber": "9684593732",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Shlok Rao",
    "email": "shlok.rao428@vriddhi.edu.in",
    "registrationNumber": "VA0428",
    "phoneNumber": "9250469429",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Rahul Varma",
    "email": "rahul.varma437@vriddhi.edu.in",
    "registrationNumber": "VA0437",
    "phoneNumber": "9454617185",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Kamal Kamath",
    "email": "kamal.kamath443@vriddhi.edu.in",
    "registrationNumber": "VA0443",
    "phoneNumber": "9692790631",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Durga Goel",
    "email": "durga.goel446@vriddhi.edu.in",
    "registrationNumber": "VA0446",
    "phoneNumber": "9318106480",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BFA"
  },
  {
    "name": "Neel Sodhi",
    "email": "neel.sodhi452@vriddhi.edu.in",
    "registrationNumber": "VA0452",
    "phoneNumber": "9281747678",
    "division": "B",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Aditya Raju",
    "email": "aditya.raju458@vriddhi.edu.in",
    "registrationNumber": "VA0458",
    "phoneNumber": "9875448533",
    "division": "C",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Jitendra Bhardwaj",
    "email": "jitendra.bhardwaj467@vriddhi.edu.in",
    "registrationNumber": "VA0467",
    "phoneNumber": "9708579840",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Geeta Joshi",
    "email": "geeta.joshi473@vriddhi.edu.in",
    "registrationNumber": "VA0473",
    "phoneNumber": "9465708674",
    "division": "E",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Komal Kumar",
    "email": "komal.kumar482@vriddhi.edu.in",
    "registrationNumber": "VA0482",
    "phoneNumber": "9413368711",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Mira Desai",
    "email": "mira.desai485@vriddhi.edu.in",
    "registrationNumber": "VA0485",
    "phoneNumber": "9279537578",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Riya Yadav",
    "email": "riya.yadav488@vriddhi.edu.in",
    "registrationNumber": "VA0488",
    "phoneNumber": "9427124037",
    "division": "A",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Payal Bhardwaj",
    "email": "payal.bhardwaj491@vriddhi.edu.in",
    "registrationNumber": "VA0491",
    "phoneNumber": "9315662642",
    "division": "D",
    "batch": 2028,
    "mentorName": "Supreeth",
    "department": "BMS"
  },
  {
    "name": "Arti Malhotra",
    "email": "arti.malhotra6@vriddhi.edu.in",
    "registrationNumber": "VA0006",
    "phoneNumber": "9266944844",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Pari Das",
    "email": "pari.das9@vriddhi.edu.in",
    "registrationNumber": "VA0009",
    "phoneNumber": "9414797776",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Deepika Bedi",
    "email": "deepika.bedi12@vriddhi.edu.in",
    "registrationNumber": "VA0012",
    "phoneNumber": "9274648506",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Kavya Arora",
    "email": "kavya.arora24@vriddhi.edu.in",
    "registrationNumber": "VA0024",
    "phoneNumber": "9566825638",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Kangana Upadhyay",
    "email": "kangana.upadhyay33@vriddhi.edu.in",
    "registrationNumber": "VA0033",
    "phoneNumber": "9500957212",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Aarush Pathak",
    "email": "aarush.pathak39@vriddhi.edu.in",
    "registrationNumber": "VA0039",
    "phoneNumber": "9562837684",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Pranav Gopal",
    "email": "pranav.gopal42@vriddhi.edu.in",
    "registrationNumber": "VA0042",
    "phoneNumber": "9581695135",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Com"
  },
  {
    "name": "Divya Pandey",
    "email": "divya.pandey54@vriddhi.edu.in",
    "registrationNumber": "VA0054",
    "phoneNumber": "9821221887",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Om Das",
    "email": "om.das60@vriddhi.edu.in",
    "registrationNumber": "VA0060",
    "phoneNumber": "9266910922",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Aarav Bansal",
    "email": "aarav.bansal63@vriddhi.edu.in",
    "registrationNumber": "VA0063",
    "phoneNumber": "9927982963",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Kirti Malhotra",
    "email": "kirti.malhotra75@vriddhi.edu.in",
    "registrationNumber": "VA0075",
    "phoneNumber": "9174539964",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Bharti Gaikwad",
    "email": "bharti.gaikwad78@vriddhi.edu.in",
    "registrationNumber": "VA0078",
    "phoneNumber": "9944420824",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Lata Desai",
    "email": "lata.desai81@vriddhi.edu.in",
    "registrationNumber": "VA0081",
    "phoneNumber": "9813219781",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Tarun Shukla",
    "email": "tarun.shukla84@vriddhi.edu.in",
    "registrationNumber": "VA0084",
    "phoneNumber": "9507104143",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Asha Trivedi",
    "email": "asha.trivedi87@vriddhi.edu.in",
    "registrationNumber": "VA0087",
    "phoneNumber": "9329460134",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Rudra Patel",
    "email": "rudra.patel90@vriddhi.edu.in",
    "registrationNumber": "VA0090",
    "phoneNumber": "9149621604",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Soham Batra",
    "email": "soham.batra93@vriddhi.edu.in",
    "registrationNumber": "VA0093",
    "phoneNumber": "9334978881",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Sonali More",
    "email": "sonali.more96@vriddhi.edu.in",
    "registrationNumber": "VA0096",
    "phoneNumber": "9642001424",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Ira Jadhav",
    "email": "ira.jadhav99@vriddhi.edu.in",
    "registrationNumber": "VA0099",
    "phoneNumber": "9406798268",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Sc (Mathematics)"
  },
  {
    "name": "Mamta Bansal",
    "email": "mamta.bansal102@vriddhi.edu.in",
    "registrationNumber": "VA0102",
    "phoneNumber": "9682624278",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Tara Tripathi",
    "email": "tara.tripathi108@vriddhi.edu.in",
    "registrationNumber": "VA0108",
    "phoneNumber": "9673510887",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Swati Goyal",
    "email": "swati.goyal111@vriddhi.edu.in",
    "registrationNumber": "VA0111",
    "phoneNumber": "9917364173",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Vandana Bhatia",
    "email": "vandana.bhatia129@vriddhi.edu.in",
    "registrationNumber": "VA0129",
    "phoneNumber": "9465436049",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Sonal Wadhwa",
    "email": "sonal.wadhwa135@vriddhi.edu.in",
    "registrationNumber": "VA0135",
    "phoneNumber": "9390894296",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Sara Kurup",
    "email": "sara.kurup138@vriddhi.edu.in",
    "registrationNumber": "VA0138",
    "phoneNumber": "9418092217",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Riya Kumar",
    "email": "riya.kumar141@vriddhi.edu.in",
    "registrationNumber": "VA0141",
    "phoneNumber": "9716396766",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Abeer Thakur",
    "email": "abeer.thakur144@vriddhi.edu.in",
    "registrationNumber": "VA0144",
    "phoneNumber": "9970957171",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Usha Bhardwaj",
    "email": "usha.bhardwaj150@vriddhi.edu.in",
    "registrationNumber": "VA0150",
    "phoneNumber": "9737599912",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BBA"
  },
  {
    "name": "Kavya Nath",
    "email": "kavya.nath153@vriddhi.edu.in",
    "registrationNumber": "VA0153",
    "phoneNumber": "9341387305",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Megha Reddy",
    "email": "megha.reddy159@vriddhi.edu.in",
    "registrationNumber": "VA0159",
    "phoneNumber": "9919382051",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Vishal Iyer",
    "email": "vishal.iyer162@vriddhi.edu.in",
    "registrationNumber": "VA0162",
    "phoneNumber": "9454123990",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Manpreet Sharma",
    "email": "manpreet.sharma165@vriddhi.edu.in",
    "registrationNumber": "VA0165",
    "phoneNumber": "9806157458",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Mayank Jadhav",
    "email": "mayank.jadhav171@vriddhi.edu.in",
    "registrationNumber": "VA0171",
    "phoneNumber": "9413383963",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Rajesh Sawant",
    "email": "rajesh.sawant174@vriddhi.edu.in",
    "registrationNumber": "VA0174",
    "phoneNumber": "9948262678",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Nisha Jain",
    "email": "nisha.jain177@vriddhi.edu.in",
    "registrationNumber": "VA0177",
    "phoneNumber": "9302563940",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Monali Bhardwaj",
    "email": "monali.bhardwaj183@vriddhi.edu.in",
    "registrationNumber": "VA0183",
    "phoneNumber": "9526794469",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Karan Agarwal",
    "email": "karan.agarwal186@vriddhi.edu.in",
    "registrationNumber": "VA0186",
    "phoneNumber": "9916440738",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Meena Shukla",
    "email": "meena.shukla192@vriddhi.edu.in",
    "registrationNumber": "VA0192",
    "phoneNumber": "9110090412",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Tabu Subramanian",
    "email": "tabu.subramanian195@vriddhi.edu.in",
    "registrationNumber": "VA0195",
    "phoneNumber": "9214518079",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BA (English)"
  },
  {
    "name": "Harsh Joshi",
    "email": "harsh.joshi204@vriddhi.edu.in",
    "registrationNumber": "VA0204",
    "phoneNumber": "9251136695",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Harpreet Bhat",
    "email": "harpreet.bhat225@vriddhi.edu.in",
    "registrationNumber": "VA0225",
    "phoneNumber": "9760465943",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Kangana Rai",
    "email": "kangana.rai234@vriddhi.edu.in",
    "registrationNumber": "VA0234",
    "phoneNumber": "9501902658",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Aadhya Nambiar",
    "email": "aadhya.nambiar243@vriddhi.edu.in",
    "registrationNumber": "VA0243",
    "phoneNumber": "9253815116",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BCA"
  },
  {
    "name": "Raghav Sethi",
    "email": "raghav.sethi252@vriddhi.edu.in",
    "registrationNumber": "VA0252",
    "phoneNumber": "9326810757",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Atharv Sawant",
    "email": "atharv.sawant264@vriddhi.edu.in",
    "registrationNumber": "VA0264",
    "phoneNumber": "9774254861",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Sushma Malhotra",
    "email": "sushma.malhotra267@vriddhi.edu.in",
    "registrationNumber": "VA0267",
    "phoneNumber": "9735032128",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Rashmi Das",
    "email": "rashmi.das270@vriddhi.edu.in",
    "registrationNumber": "VA0270",
    "phoneNumber": "9950207886",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Sai Shetty",
    "email": "sai.shetty273@vriddhi.edu.in",
    "registrationNumber": "VA0273",
    "phoneNumber": "9859803019",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Sara Banerjee",
    "email": "sara.banerjee276@vriddhi.edu.in",
    "registrationNumber": "VA0276",
    "phoneNumber": "9828404274",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Tara Ghosh",
    "email": "tara.ghosh279@vriddhi.edu.in",
    "registrationNumber": "VA0279",
    "phoneNumber": "9861104727",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Suresh Venkataraman",
    "email": "suresh.venkataraman288@vriddhi.edu.in",
    "registrationNumber": "VA0288",
    "phoneNumber": "9996696177",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Shreyas Talwar",
    "email": "shreyas.talwar294@vriddhi.edu.in",
    "registrationNumber": "VA0294",
    "phoneNumber": "9475364113",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Sushma Choudhary",
    "email": "sushma.choudhary297@vriddhi.edu.in",
    "registrationNumber": "VA0297",
    "phoneNumber": "9247746438",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Pharm"
  },
  {
    "name": "Ishita Reddy",
    "email": "ishita.reddy306@vriddhi.edu.in",
    "registrationNumber": "VA0306",
    "phoneNumber": "9782546314",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Vedant Rajan",
    "email": "vedant.rajan312@vriddhi.edu.in",
    "registrationNumber": "VA0312",
    "phoneNumber": "9144996163",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Siya Dhillon",
    "email": "siya.dhillon315@vriddhi.edu.in",
    "registrationNumber": "VA0315",
    "phoneNumber": "9569172971",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Payal Nambiar",
    "email": "payal.nambiar318@vriddhi.edu.in",
    "registrationNumber": "VA0318",
    "phoneNumber": "9685698675",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Usha Reddy",
    "email": "usha.reddy321@vriddhi.edu.in",
    "registrationNumber": "VA0321",
    "phoneNumber": "9880411013",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Krishna Kamath",
    "email": "krishna.kamath324@vriddhi.edu.in",
    "registrationNumber": "VA0324",
    "phoneNumber": "9935924516",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Kajol Iyer",
    "email": "kajol.iyer333@vriddhi.edu.in",
    "registrationNumber": "VA0333",
    "phoneNumber": "9864299201",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Abhishek Srinivasan",
    "email": "abhishek.srinivasan339@vriddhi.edu.in",
    "registrationNumber": "VA0339",
    "phoneNumber": "9830261466",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Neha Iyer",
    "email": "neha.iyer342@vriddhi.edu.in",
    "registrationNumber": "VA0342",
    "phoneNumber": "9446454337",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Yogesh Bhattacharya",
    "email": "yogesh.bhattacharya345@vriddhi.edu.in",
    "registrationNumber": "VA0345",
    "phoneNumber": "9265564833",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Aishwarya Nath",
    "email": "aishwarya.nath348@vriddhi.edu.in",
    "registrationNumber": "VA0348",
    "phoneNumber": "9411032572",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BHM"
  },
  {
    "name": "Seema Srinivasan",
    "email": "seema.srinivasan354@vriddhi.edu.in",
    "registrationNumber": "VA0354",
    "phoneNumber": "9231556899",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Tushar Iyer",
    "email": "tushar.iyer357@vriddhi.edu.in",
    "registrationNumber": "VA0357",
    "phoneNumber": "9635008544",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Sunil Krishnamurthy",
    "email": "sunil.krishnamurthy360@vriddhi.edu.in",
    "registrationNumber": "VA0360",
    "phoneNumber": "9741580895",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Ashish Banerjee",
    "email": "ashish.banerjee363@vriddhi.edu.in",
    "registrationNumber": "VA0363",
    "phoneNumber": "9309009538",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Saraswati Choudhary",
    "email": "saraswati.choudhary366@vriddhi.edu.in",
    "registrationNumber": "VA0366",
    "phoneNumber": "9313736772",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Priya Brar",
    "email": "priya.brar369@vriddhi.edu.in",
    "registrationNumber": "VA0369",
    "phoneNumber": "9761962359",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Navpreet Sidhu",
    "email": "navpreet.sidhu378@vriddhi.edu.in",
    "registrationNumber": "VA0378",
    "phoneNumber": "9436889280",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Kali Chopra",
    "email": "kali.chopra381@vriddhi.edu.in",
    "registrationNumber": "VA0381",
    "phoneNumber": "9856881618",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Kali Choudhary",
    "email": "kali.choudhary384@vriddhi.edu.in",
    "registrationNumber": "VA0384",
    "phoneNumber": "9411871167",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Aarav Das",
    "email": "aarav.das390@vriddhi.edu.in",
    "registrationNumber": "VA0390",
    "phoneNumber": "9269587940",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Nisha Chaturvedi",
    "email": "nisha.chaturvedi396@vriddhi.edu.in",
    "registrationNumber": "VA0396",
    "phoneNumber": "9683364453",
    "division": "E",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "B.Ed"
  },
  {
    "name": "Swati Shetty",
    "email": "swati.shetty402@vriddhi.edu.in",
    "registrationNumber": "VA0402",
    "phoneNumber": "9107333788",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Harsh Bajaj",
    "email": "harsh.bajaj405@vriddhi.edu.in",
    "registrationNumber": "VA0405",
    "phoneNumber": "9271494637",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Mohit Wadhwa",
    "email": "mohit.wadhwa423@vriddhi.edu.in",
    "registrationNumber": "VA0423",
    "phoneNumber": "9471686188",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Shreyas Gaikwad",
    "email": "shreyas.gaikwad429@vriddhi.edu.in",
    "registrationNumber": "VA0429",
    "phoneNumber": "9718593766",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Prachi Krishnamurthy",
    "email": "prachi.krishnamurthy432@vriddhi.edu.in",
    "registrationNumber": "VA0432",
    "phoneNumber": "9150341410",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Disha Gopal",
    "email": "disha.gopal444@vriddhi.edu.in",
    "registrationNumber": "VA0444",
    "phoneNumber": "9796559239",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Tanvi Upadhyay",
    "email": "tanvi.upadhyay450@vriddhi.edu.in",
    "registrationNumber": "VA0450",
    "phoneNumber": "9835348453",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BFA"
  },
  {
    "name": "Brijesh Menon",
    "email": "brijesh.menon465@vriddhi.edu.in",
    "registrationNumber": "VA0465",
    "phoneNumber": "9188783547",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Saanvi Dwivedi",
    "email": "saanvi.dwivedi474@vriddhi.edu.in",
    "registrationNumber": "VA0474",
    "phoneNumber": "9393482659",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Dhruv Nambiar",
    "email": "dhruv.nambiar480@vriddhi.edu.in",
    "registrationNumber": "VA0480",
    "phoneNumber": "9562760731",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Sheena Subramanian",
    "email": "sheena.subramanian486@vriddhi.edu.in",
    "registrationNumber": "VA0486",
    "phoneNumber": "9940381893",
    "division": "A",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Juhi Tripathi",
    "email": "juhi.tripathi489@vriddhi.edu.in",
    "registrationNumber": "VA0489",
    "phoneNumber": "9507903732",
    "division": "C",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Neel Srinivasan",
    "email": "neel.srinivasan495@vriddhi.edu.in",
    "registrationNumber": "VA0495",
    "phoneNumber": "9860603328",
    "division": "B",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BMS"
  },
  {
    "name": "Sushma Sidhu",
    "email": "sushma.sidhu498@vriddhi.edu.in",
    "registrationNumber": "VA0498",
    "phoneNumber": "9179419456",
    "division": "D",
    "batch": 2028,
    "mentorName": "Gangandhar",
    "department": "BMS"
  }
];

/** Wipe existing students and import all 500 from seed data */
export async function seedStudents(collegeId: string): Promise<{
  success: boolean;
  message: string;
  deleted: number;
  imported: number;
  elapsedMs: number;
}> {
  const start = performance.now();

  console.log('[Seed] Deleting existing students...');
  const deleted = await deleteAllStudentIndex(collegeId);
  console.log(`[Seed] Deleted ${deleted} existing records`);

  console.log(`[Seed] Importing ${SEED_DATA.length} students...`);
  const result = await importStudentIndexBulk(collegeId, SEED_DATA, { skipExisting: false });

  const elapsed = Math.round(performance.now() - start);
  console.log(`[Seed] Done in ${elapsed}ms — Created: ${result.created}, Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    console.error('[Seed] Errors:', result.errors.slice(0, 5));
  }

  return {
    success: result.success,
    message: result.success
      ? `Successfully seeded ${result.created} students (deleted ${deleted} old)`
      : `Import completed with ${result.failed} failures`,
    deleted,
    imported: result.created,
    elapsedMs: elapsed,
  };
}

/** Import only new students (skips existing by regNo) */
export async function importNewStudents(collegeId: string): Promise<{
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  elapsedMs: number;
}> {
  const start = performance.now();
  const result = await importStudentIndexBulk(collegeId, SEED_DATA, { skipExisting: true });
  return {
    success: result.success,
    created: result.created,
    skipped: result.skipped,
    failed: result.failed,
    elapsedMs: Math.round(performance.now() - start),
  };
}