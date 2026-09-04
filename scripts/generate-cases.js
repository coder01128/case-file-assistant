import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const firstNames = [
  'Maria', 'James', 'Sarah', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David',
  'Patricia', 'Carlos', 'Angela', 'Thomas', 'Karen', 'William', 'Barbara',
  'Richard', 'Susan', 'Joseph', 'Margaret', 'Daniel', 'Lisa', 'Anthony',
  'Betty', 'Mark', 'Dorothy', 'Steven', 'Sandra', 'Kevin', 'Ashley', 'Brian'
];

const lastNames = [
  'Martinez', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Garcia',
  'Rodriguez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis',
  'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill'
];

const accidentTypes = [
  'car accident', 'slip and fall', 'workplace injury', 'pedestrian',
  'truck accident', 'motorcycle', 'medical malpractice', 'dog bite',
  'premises liability'
];

const lawFirms = [
  'Henderson & Associates', 'Morgan Legal Group', 'Carter & Phillips LLP',
  'Blackwell Law Firm', 'Rivera & Partners', 'Summit Legal Services',
  'Garrison & Cole', 'Whitfield Injury Law'
];

const doctors = [
  'Dr. Raymond Chen', 'Dr. Alicia Fernandez', 'Dr. Marcus Webb',
  'Dr. Priya Sharma', 'Dr. Jonathan Blake', 'Dr. Catherine Okafor',
  'Dr. Steven Reeves', 'Dr. Elena Vasquez', 'Dr. Howard Kim',
  'Dr. Natalie Cross'
];

const facilities = [
  'St. Mary\'s Medical Center', 'Riverside General Hospital',
  'Metro Orthopedic Institute', 'Lakewood Regional Medical Center',
  'Pinnacle Spine & Joint Clinic', 'Valley Trauma Center',
  'Northside Community Hospital', 'Pacific Coast Medical Group',
  'Harborview Medical Center', 'Suncoast Rehabilitation Center'
];

const surgeryStatuses = ['scheduled', 'completed', 'not required'];
const fundingStatuses = ['approved', 'pending', 'disbursed'];
const caseStatuses = ['active', 'settled', 'in litigation'];

const injuryTemplates = {
  'car accident': [
    'cervical herniated disc at C5-C6 with radiculopathy',
    'lumbar fracture at L3 with chronic pain syndrome',
    'torn rotator cuff and bilateral knee contusions',
    'traumatic brain injury with post-concussion syndrome',
    'whiplash with cervical strain and thoracic spine compression'
  ],
  'slip and fall': [
    'fractured right hip requiring surgical repair',
    'torn ACL and meniscus in left knee',
    'compression fracture of T12 vertebra',
    'fractured left wrist and elbow dislocation',
    'concussion and cervical sprain'
  ],
  'workplace injury': [
    'crush injury to left hand with multiple fractures',
    'herniated disc at L4-L5 from heavy lifting',
    'chemical burns to forearms and chest',
    'repetitive strain injury to both wrists',
    'fractured tibia from falling equipment'
  ],
  'pedestrian': [
    'fractured pelvis and internal bleeding',
    'bilateral leg fractures with nerve damage',
    'traumatic brain injury and facial lacerations',
    'spinal cord contusion at T8 level',
    'multiple rib fractures and collapsed lung'
  ],
  'truck accident': [
    'multiple spinal fractures requiring fusion surgery',
    'crushed femur with compartment syndrome',
    'traumatic amputation of left lower leg',
    'severe thoracic injuries with flail chest',
    'cervical disc herniation at C4-C5 and C5-C6'
  ],
  'motorcycle': [
    'road rash with skin grafting required on right leg',
    'shattered left clavicle and scapula',
    'open fracture of right tibia and fibula',
    'separated shoulder and cracked ribs',
    'degloving injury to left forearm'
  ],
  'medical malpractice': [
    'surgical nerve damage causing chronic pain',
    'misdiagnosed fracture leading to improper healing',
    'post-surgical infection requiring additional procedures',
    'medication error resulting in organ damage',
    'delayed diagnosis of spinal compression'
  ],
  'dog bite': [
    'deep lacerations to right forearm requiring reconstructive surgery',
    'puncture wounds to left calf with tendon damage',
    'facial scarring requiring plastic surgery',
    'nerve damage to right hand with limited mobility',
    'infected bite wound on left thigh'
  ],
  'premises liability': [
    'fractured vertebrae from structural collapse',
    'electrical burns from exposed wiring',
    'fall injury with bilateral wrist fractures',
    'head trauma from falling ceiling fixture',
    'chemical inhalation causing respiratory damage'
  ]
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickIndex(arr) {
  return Math.floor(Math.random() * arr.length);
}

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function randomFunding() {
  const amounts = [2500, 5000, 7500, 10000, 15000, 20000, 25000, 35000, 50000, 75000];
  return pick(amounts);
}

function generateNarrative(c, detailed) {
  const paragraphs = [];

  const dateObj = new Date(c.accident_date);
  const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  paragraphs.push(
    `On ${dateStr}, ${c.client_name} was involved in a ${c.accident_type} incident. ` +
    `The client sustained ${c.injury_description}. Following the incident, ${c.client_name} ` +
    `was transported to ${c.medical_facility} for emergency evaluation and treatment. ` +
    `The attending physician documented the injuries and initiated a treatment plan.`
  );

  const surgeryText = c.surgery_status === 'completed'
    ? `${c.client_name} underwent surgery performed by ${c.treating_doctor} at ${c.medical_facility}. The surgical procedure was completed successfully, and the client is currently in the post-operative recovery phase with ongoing physical therapy.`
    : c.surgery_status === 'scheduled'
    ? `Surgery has been scheduled with ${c.treating_doctor} at ${c.medical_facility}. The client is currently undergoing conservative treatment while awaiting the surgical date. Pre-operative assessments have been completed.`
    : `${c.treating_doctor} at ${c.medical_facility} determined that surgical intervention is not required at this time. The client is being managed with conservative treatment including physical therapy, pain management, and regular follow-up appointments.`;

  paragraphs.push(surgeryText);

  if (detailed) {
    paragraphs.push(
      `The case is being handled by ${c.law_firm}. Current case status is ${c.case_status}. ` +
      `A funding application of $${c.funding_amount.toLocaleString()} has been submitted, ` +
      `with the current funding status listed as ${c.funding_status}. The legal team is ` +
      `coordinating with medical providers to compile comprehensive documentation of all ` +
      `treatment received and projected future medical needs.`
    );
  }

  if (detailed && Math.random() > 0.4) {
    paragraphs.push(
      `${c.treating_doctor} has provided a detailed medical report outlining the extent of ` +
      `the injuries and the expected recovery timeline. The prognosis indicates that ` +
      `${c.client_name} will require ongoing medical treatment for an estimated ${Math.floor(Math.random() * 18) + 6} ` +
      `months. The client has been unable to return to work since the date of the incident ` +
      `and continues to experience significant limitations in daily activities.`
    );
  }

  return paragraphs.join('\n\n');
}

function generateCases() {
  const cases = [];
  const usedNames = new Set();

  function uniqueName(forceFirst, forceLast) {
    let first = forceFirst || pick(firstNames);
    let last = forceLast || pick(lastNames);
    let full = `${first} ${last}`;
    let attempts = 0;
    while (usedNames.has(full) && attempts < 50) {
      first = pick(firstNames);
      if (!forceLast) last = pick(lastNames);
      full = `${first} ${last}`;
      attempts++;
    }
    usedNames.add(full);
    return full;
  }

  // Case 0: Martinez — surgery completed (HARD REQUIREMENT 1)
  cases.push({
    case_id: 'HRF-2024-0042',
    client_name: uniqueName('Maria', 'Martinez'),
    accident_date: randomDate(2023, 2024),
    accident_type: 'car accident',
    injury_description: 'cervical herniated disc at C5-C6 with radiculopathy',
    treating_doctor: 'Dr. Raymond Chen',
    medical_facility: 'St. Mary\'s Medical Center',
    surgery_status: 'completed',
    law_firm: 'Henderson & Associates',
    funding_amount: 25000,
    funding_status: 'approved',
    case_status: 'active'
  });

  // Case 1: Johnson — clearly named treating doctor (HARD REQUIREMENT 4)
  cases.push({
    case_id: 'HRF-2024-0015',
    client_name: uniqueName('James', 'Johnson'),
    accident_date: randomDate(2023, 2024),
    accident_type: 'workplace injury',
    injury_description: 'herniated disc at L4-L5 from heavy lifting',
    treating_doctor: 'Dr. Priya Sharma',
    medical_facility: 'Metro Orthopedic Institute',
    surgery_status: 'scheduled',
    law_firm: 'Morgan Legal Group',
    funding_amount: 15000,
    funding_status: 'pending',
    case_status: 'active'
  });

  // Cases 2-3: More Henderson & Associates cases (HARD REQUIREMENT 2 — need >= 3 total)
  cases.push({
    case_id: 'HRF-2024-0028',
    client_name: uniqueName(null, null),
    accident_date: randomDate(2023, 2024),
    accident_type: 'slip and fall',
    injury_description: 'fractured right hip requiring surgical repair',
    treating_doctor: pick(doctors),
    medical_facility: pick(facilities),
    surgery_status: 'completed',
    law_firm: 'Henderson & Associates',
    funding_amount: 35000,
    funding_status: 'disbursed',
    case_status: 'settled'
  });

  cases.push({
    case_id: 'HRF-2024-0036',
    client_name: uniqueName(null, null),
    accident_date: randomDate(2023, 2024),
    accident_type: 'premises liability',
    injury_description: 'head trauma from falling ceiling fixture',
    treating_doctor: pick(doctors),
    medical_facility: pick(facilities),
    surgery_status: 'not required',
    law_firm: 'Henderson & Associates',
    funding_amount: 10000,
    funding_status: 'approved',
    case_status: 'in litigation'
  });

  // Cases 4-7: Active car accidents with approved/disbursed funding (HARD REQUIREMENT 3 — need >= 4)
  const carFundingStatuses = ['approved', 'disbursed', 'approved', 'disbursed'];
  for (let i = 0; i < 4; i++) {
    cases.push({
      case_id: `HRF-2024-${String(50 + i).padStart(4, '0')}`,
      client_name: uniqueName(null, null),
      accident_date: randomDate(2023, 2024),
      accident_type: 'car accident',
      injury_description: pick(injuryTemplates['car accident']),
      treating_doctor: pick(doctors),
      medical_facility: pick(facilities),
      surgery_status: pick(surgeryStatuses),
      law_firm: pick(lawFirms.filter(f => f !== 'Henderson & Associates')),
      funding_amount: randomFunding(),
      funding_status: carFundingStatuses[i],
      case_status: 'active'
    });
  }

  // Cases 8-29: Fill remaining 22 cases with variety
  for (let i = 8; i < 30; i++) {
    const accType = pick(accidentTypes);
    cases.push({
      case_id: `HRF-2024-${String(60 + i).padStart(4, '0')}`,
      client_name: uniqueName(null, null),
      accident_date: randomDate(2023, 2024),
      accident_type: accType,
      injury_description: pick(injuryTemplates[accType]),
      treating_doctor: pick(doctors),
      medical_facility: pick(facilities),
      surgery_status: pick(surgeryStatuses),
      law_firm: pick(lawFirms),
      funding_amount: randomFunding(),
      funding_status: pick(fundingStatuses),
      case_status: pick(caseStatuses)
    });
  }

  // Generate narratives
  for (let i = 0; i < cases.length; i++) {
    const detailed = i < 4 || Math.random() > 0.35;
    cases[i].narrative = generateNarrative(cases[i], detailed);
  }

  return cases;
}

const cases = generateCases();
const outPath = join(__dirname, 'cases.json');
writeFileSync(outPath, JSON.stringify(cases, null, 2));
console.log(`Generated ${cases.length} cases → ${outPath}`);
