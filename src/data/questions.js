const QUESTION_BANK = [
  {
    id: 1,
    topic: "Safety",
    question: "What does GFCI stand for?",
    options: ["Ground Fault Circuit Interrupter", "General Fault Current Indicator", "Ground Frequency Current Insulator", "General Frequency Circuit Interrupter"],
    answer: 0
  },
  {
    id: 2,
    topic: "Safety",
    question: "What color is the grounding conductor in a standard NEC installation?",
    options: ["White", "Black", "Green or bare", "Red"],
    answer: 2
  },
  {
    id: 3,
    topic: "Safety",
    question: "When working on energized circuits above 50V, you must use:",
    options: ["Rubber-soled shoes only", "PPE rated for the voltage level", "Cotton gloves", "Any insulated gloves"],
    answer: 1
  },
  {
    id: 4,
    topic: "Safety",
    question: "Lockout/Tagout (LOTO) procedures are required by which agency?",
    options: ["EPA", "NEC", "OSHA", "IEEE"],
    answer: 2
  },
  {
    id: 5,
    topic: "Safety",
    question: "Which fire extinguisher class is appropriate for electrical fires?",
    options: ["Class A", "Class B", "Class C", "Class D"],
    answer: 2
  },
  {
    id: 6,
    topic: "Ohm's Law",
    question: "If a circuit has 120V and 10 ohms resistance, what is the current?",
    options: ["12 A", "1200 A", "0.12 A", "120 A"],
    answer: 0
  },
  {
    id: 7,
    topic: "Ohm's Law",
    question: "A 60W bulb operates at 120V. What is its resistance?",
    options: ["2 Ω", "240 Ω", "7200 Ω", "0.5 Ω"],
    answer: 1
  },
  {
    id: 8,
    topic: "Ohm's Law",
    question: "Power (P) in a circuit is calculated as:",
    options: ["P = V/I", "P = V × I", "P = I/V", "P = R × V"],
    answer: 1
  },
  {
    id: 9,
    topic: "Ohm's Law",
    question: "Three resistors of 4Ω, 6Ω, and 12Ω are connected in parallel. What is the total resistance?",
    options: ["22 Ω", "2 Ω", "8 Ω", "0.5 Ω"],
    answer: 1
  },
  {
    id: 10,
    topic: "Ohm's Law",
    question: "In a series circuit with R1=10Ω and R2=20Ω at 90V, what is the voltage drop across R1?",
    options: ["45 V", "60 V", "30 V", "90 V"],
    answer: 2
  },
  {
    id: 11,
    topic: "Wiring",
    question: "What is the standard wire gauge for a 20A branch circuit?",
    options: ["14 AWG", "12 AWG", "10 AWG", "8 AWG"],
    answer: 1
  },
  {
    id: 12,
    topic: "Wiring",
    question: "Which wire color represents the hot conductor in a standard 120V circuit?",
    options: ["White", "Green", "Black", "Gray"],
    answer: 2
  },
  {
    id: 13,
    topic: "Wiring",
    question: "The maximum number of 12 AWG conductors allowed in a standard 2-gang box of 42 cubic inches is:",
    options: ["6", "9", "12", "15"],
    answer: 2
  },
  {
    id: 14,
    topic: "Wiring",
    question: "What does NM-B cable stand for?",
    options: ["Neutral Metal-Base", "Non-Metallic sheathed cable rated 90°C", "Normal Metal-Bonded", "Non-Magnetic Base"],
    answer: 1
  },
  {
    id: 15,
    topic: "Wiring",
    question: "What is the minimum burial depth for UF cable (direct burial) under a residential driveway?",
    options: ["6 inches", "12 inches", "18 inches", "24 inches"],
    answer: 3
  },
  {
    id: 16,
    topic: "Circuits",
    question: "A circuit breaker trips repeatedly. The FIRST step should be:",
    options: ["Replace the breaker", "Identify and fix the cause of overload/fault", "Reset and ignore it", "Add another circuit"],
    answer: 1
  },
  {
    id: 17,
    topic: "Circuits",
    question: "What is the purpose of a neutral wire in an AC circuit?",
    options: ["Carry fault current to ground", "Complete the circuit by returning current to the source", "Prevent voltage surges", "Provide an alternate hot path"],
    answer: 1
  },
  {
    id: 18,
    topic: "Circuits",
    question: "A 15A, 120V circuit can safely carry a continuous load of:",
    options: ["15 A", "12 A", "20 A", "10 A"],
    answer: 1
  },
  {
    id: 19,
    topic: "Circuits",
    question: "Which type of circuit is required for bathroom receptacles per NEC?",
    options: ["Dedicated 20A circuit", "GFCI-protected circuit", "AFCI-protected circuit", "Both A and B"],
    answer: 1
  },
  {
    id: 20,
    topic: "Circuits",
    question: "What is the standard voltage for a clothes dryer outlet in North America?",
    options: ["120V", "208V", "240V", "480V"],
    answer: 2
  },
  {
    id: 21,
    topic: "Tools & Instruments",
    question: "A clamp meter measures current by detecting:",
    options: ["Voltage drop across a shunt", "Magnetic field around a conductor", "Resistance of the circuit", "Phase angle difference"],
    answer: 1
  },
  {
    id: 22,
    topic: "Tools & Instruments",
    question: "Before using a multimeter on an unknown circuit, you should set it to:",
    options: ["Lowest range", "Highest range", "Auto range if available, else highest", "Resistance mode"],
    answer: 2
  },
  {
    id: 23,
    topic: "Tools & Instruments",
    question: "What does a megohmmeter (Megger) test?",
    options: ["Low-resistance connections", "Insulation resistance", "Capacitance", "Voltage quality"],
    answer: 1
  },
  {
    id: 24,
    topic: "Tools & Instruments",
    question: "Which tool is used to pull wire through conduit?",
    options: ["Fish tape", "Conduit bender", "Wire stripper", "Knockout punch"],
    answer: 0
  },
  {
    id: 25,
    topic: "Tools & Instruments",
    question: "A non-contact voltage tester indicates voltage by:",
    options: ["Measuring current flow", "Detecting the electric field without touching conductors", "Completing a test circuit", "Measuring resistance to ground"],
    answer: 1
  },
  {
    id: 26,
    topic: "NEC Code",
    question: "NEC stands for:",
    options: ["National Electrical Code", "National Engineering Codebook", "North American Electrical Code", "National Energy Compliance"],
    answer: 0
  },
  {
    id: 27,
    topic: "NEC Code",
    question: "AFCI protection is required by NEC in:",
    options: ["Bathrooms only", "All kitchen circuits", "Most bedroom and living area circuits", "Outdoor circuits only"],
    answer: 2
  },
  {
    id: 28,
    topic: "NEC Code",
    question: "What is the required height of receptacles above a finished floor in a dwelling per NEC?",
    options: ["No specific requirement as long as accessible", "Exactly 12 inches", "No more than 5.5 feet", "At least 18 inches"],
    answer: 0
  },
  {
    id: 29,
    topic: "NEC Code",
    question: "Per NEC, what is the maximum distance between receptacles along a wall in a living room?",
    options: ["6 feet", "10 feet", "12 feet", "No limit"],
    answer: 0
  },
  {
    id: 30,
    topic: "NEC Code",
    question: "Service entrance conductors must be protected from physical damage. The minimum height above a rooftop with a slope of less than 4/12 is:",
    options: ["3 feet", "8 feet", "18 inches", "10 feet"],
    answer: 0
  },
  {
    id: 31,
    topic: "AC Theory",
    question: "The frequency of standard AC power in North America is:",
    options: ["50 Hz", "60 Hz", "120 Hz", "25 Hz"],
    answer: 1
  },
  {
    id: 32,
    topic: "AC Theory",
    question: "RMS voltage of a 170V peak AC waveform is approximately:",
    options: ["170 V", "240 V", "120 V", "85 V"],
    answer: 2
  },
  {
    id: 33,
    topic: "AC Theory",
    question: "Power factor is the ratio of:",
    options: ["Real power to apparent power", "Reactive power to real power", "Voltage to current", "Impedance to resistance"],
    answer: 0
  },
  {
    id: 34,
    topic: "AC Theory",
    question: "Inductors in an AC circuit cause current to:",
    options: ["Lead voltage by 90°", "Lag voltage by 90°", "Be in phase with voltage", "Double in magnitude"],
    answer: 1
  },
  {
    id: 35,
    topic: "AC Theory",
    question: "What is the impedance of a circuit with R=3Ω and XL=4Ω?",
    options: ["7 Ω", "1 Ω", "5 Ω", "12 Ω"],
    answer: 2
  },
  {
    id: 36,
    topic: "Motors",
    question: "A single-phase induction motor fails to start but hums. The likely cause is:",
    options: ["Open main winding", "Failed start capacitor or start winding", "Overvoltage", "Wrong direction of rotation"],
    answer: 1
  },
  {
    id: 37,
    topic: "Motors",
    question: "The nameplate of a motor shows 'FLA 10A'. This means:",
    options: ["Fuse rating is 10A", "Full Load Amperes is 10A", "Frequency Lock Amperes is 10A", "Fault Level Amps is 10A"],
    answer: 1
  },
  {
    id: 38,
    topic: "Motors",
    question: "To reverse the direction of a three-phase motor, you:",
    options: ["Swap any two of the three phase leads", "Swap all three phase leads", "Reverse the ground wire", "Change the capacitor polarity"],
    answer: 0
  },
  {
    id: 39,
    topic: "Motors",
    question: "Motor overload protection is sized based on:",
    options: ["Locked Rotor Amperes (LRA)", "Full Load Amperes (FLA) × a code-allowed percentage", "Breaker size only", "Voltage rating"],
    answer: 1
  },
  {
    id: 40,
    topic: "Motors",
    question: "Which motor type has no brushes and is commonly used in HVAC systems?",
    options: ["DC shunt motor", "Universal motor", "Squirrel-cage induction motor", "Wound-rotor motor"],
    answer: 2
  },
  {
    id: 41,
    topic: "Conduit & Raceway",
    question: "The maximum fill percentage for a conduit with 3 or more conductors is:",
    options: ["40%", "53%", "31%", "60%"],
    answer: 2
  },
  {
    id: 42,
    topic: "Conduit & Raceway",
    question: "EMT stands for:",
    options: ["Electrical Metal Tubing", "Enclosed Metallic Tray", "External Metal Tube", "Electrical Metallic Threaded"],
    answer: 0
  },
  {
    id: 43,
    topic: "Conduit & Raceway",
    question: "The maximum number of 90° bends allowed between pull points in a conduit run is:",
    options: ["2", "4", "3", "6"],
    answer: 1
  },
  {
    id: 44,
    topic: "Conduit & Raceway",
    question: "Rigid Metal Conduit (RMC) can serve as an equipment grounding conductor:",
    options: ["Never", "Only if it's galvanized", "Yes, when properly installed with listed fittings", "Only in dry locations"],
    answer: 2
  },
  {
    id: 45,
    topic: "Conduit & Raceway",
    question: "PVC conduit should NOT be used:",
    options: ["Underground", "In concealed walls", "Where exposed to physical damage without protection", "In wet locations"],
    answer: 2
  },
  {
    id: 46,
    topic: "Grounding & Bonding",
    question: "The purpose of equipment grounding is to:",
    options: ["Provide a neutral return path", "Limit fault current magnitude", "Provide a low-impedance path for fault current to operate overcurrent protection", "Prevent static buildup only"],
    answer: 2
  },
  {
    id: 47,
    topic: "Grounding & Bonding",
    question: "Bonding jumpers are used to:",
    options: ["Connect two circuits together", "Ensure electrical continuity between metal parts", "Increase ampacity", "Reduce voltage drop"],
    answer: 1
  },
  {
    id: 48,
    topic: "Grounding & Bonding",
    question: "The main bonding jumper connects:",
    options: ["Panel to earth", "Neutral bus to equipment grounding bus at the service", "Two separate panels", "Ground rod to water pipe"],
    answer: 1
  },
  {
    id: 49,
    topic: "Transformers",
    question: "A step-down transformer with a 10:1 turns ratio and 240V primary has a secondary voltage of:",
    options: ["2400 V", "24 V", "240 V", "12 V"],
    answer: 1
  },
  {
    id: 50,
    topic: "Transformers",
    question: "If a transformer steps voltage down by a factor of 2, the secondary current compared to primary is:",
    options: ["Half", "Equal", "Double", "Four times"],
    answer: 2
  }
];

// Make available globally
if (typeof module !== 'undefined') module.exports = QUESTION_BANK;

function getRandomQuestions(allQuestions, numQuestions) {
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numQuestions);
}

// Example usage:
// const studentQuestions = getRandomQuestions(allQuestions, 10);
