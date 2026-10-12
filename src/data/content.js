/**
 * All site copy lives here so it can be edited without touching components.
 * Items marked `SWAP` or `CONFIRM` need sign-off from Rameesha before launch.
 */

export const hero = {
  eyebrow: 'HR Strategy Lead · People & Culture',
  tagline: 'People strategy that helps teams thrive.',
  // Alternative taglines (swap into `tagline` if preferred):
  alternativeTaglines: [
    'Strategic HR, human at heart.',
    'Building workplaces where people grow, and businesses follow.',
  ],
  location: 'Based in Karachi · Working with teams worldwide',
}

export const about = {
  heading: 'A people leader who treats culture as strategy.',
  bio: [
    "I'm an HR professional with 6+ years of experience across HR operations, organizational development, talent management, performance management, employee engagement, recruitment, compensation & benefits, and diversity & inclusion.",
    "I've run HR across four international business units, with teams in Pakistan, Canada, the USA and Indonesia, which taught me that good people practice has to work across time zones, cultures and growth stages.",
    "Today I'm the HR Strategy Lead at Deckgrow (Ohio, US), designing the HR roadmap and people systems from the ground up.",
    'I hold a Master’s in Management from IBA Karachi, where my research focused on workplace friendships and how they help employees thrive.',
  ],
  facts: [
    { label: 'Experience', value: '6+ years, since 2020' },
    { label: 'Countries', value: 'Pakistan · Canada · USA · Indonesia' },
    { label: 'Currently', value: 'HR Strategy Lead, Deckgrow' },
    { label: 'Education', value: 'MS Management, IBA Karachi' },
  ],
  portraitAlt:
    'Portrait of Rameesha Fatima smiling, wearing a grey turtleneck, with long dark hair.',
}

export const impact = [
  { value: 400, suffix: '%', label: 'Increase in NPS survey participation (2024 → 2025)' },
  { value: 350, suffix: '%', label: 'Further increase in participation (2025 → 2026)' },
  { value: 30, suffix: '%', label: 'Reduction in time-to-hire' },
  { value: 30, suffix: '%', label: 'Reduction in employee escalations' },
  { value: 250, suffix: '', label: 'Employees covered by the TalentX talent programme' },
  { value: 200, suffix: '+', label: 'Employees trained on the FlowHCM HRMS' },
  { value: 4, suffix: '', label: 'Countries · 4 international business units' },
]

export const initiatives = [
  {
    id: 'talentx',
    title: 'TalentX',
    org: 'Jaffer Business Systems',
    summary:
      'An AI-assisted talent programme giving 250 employees a clear development plan and a visible path to grow.',
    outcomes: [
      'Individual Development Plans and personalized learning journeys for 250 employees',
      'Career pathways, succession visibility and a promotions framework',
      'Every job description revamped and the designation structure redesigned',
    ],
    caseStudy: {
      problem:
        'Growth had outpaced the talent architecture. Job descriptions were outdated, designations were inconsistent, and employees had no clear picture of how to develop or where their careers could go. Leadership had limited visibility of succession.',
      approach: [
        'Project-managed the rollout of an AI-based assessment portal that turned each assessment into an Individual Development Plan.',
        'Paired every plan with a personalized learning journey, so development was specific rather than generic.',
        'Established career pathways and a promotions framework, giving managers a shared, fair basis for progression decisions.',
        'Rewrote every job description and redesigned the designation structure so roles, levels and expectations finally lined up.',
      ],
      outcome:
        'All 250 employees now have a development plan and a visible path forward, and leadership has succession visibility it did not have before. The programme also gave the organisation one consistent language for roles and growth.',
    },
  },
  {
    id: 'deckgrow-roadmap',
    title: 'HR Roadmap & People Systems',
    org: 'Deckgrow · Ohio, US',
    summary:
      'Designing a six-month HR roadmap and building the company’s people systems from a blank page.',
    outcomes: [
      'A 6-month roadmap spanning operations, compliance, talent acquisition, performance and employee experience',
      'Policies and governance frameworks built from scratch',
      'Recruitment workflows, onboarding, leave management and HR reporting',
    ],
    caseStudy: {
      problem:
        'A growing US company needed HR foundations that would scale: clear policies, compliant processes and reliable people data, without slowing the business down.',
      approach: [
        'Mapped the current state and sequenced a 6-month roadmap across HR operations, compliance, talent acquisition, performance and employee experience.',
        'Building policies and governance frameworks from scratch, written to be practical for managers to apply.',
        'Designing recruitment workflows, onboarding, leave management and HR reporting as one connected system.',
      ],
      outcome:
        'In progress. The roadmap gives leadership a clear, staged plan for HR, with each system designed to scale with the team rather than be rebuilt later.',
    },
  },
  {
    id: 'employee-voice',
    title: 'Employee Voice & Engagement',
    org: 'Jaffer Business Systems',
    summary:
      'Turning a quiet survey into a real feedback loop across three offices.',
    outcomes: [
      'NPS survey participation up 400%, then a further 350% year on year',
      'Engagement programmes across the Karachi, Lahore and Islamabad offices',
      'Grievance handling streamlined, cutting escalations by 30%',
    ],
    caseStudy: {
      problem:
        'Leadership wanted to hear from employees, but survey participation was low and concerns often surfaced only once they had escalated.',
      approach: [
        'Rebuilt the NPS survey process around trust and visible follow-through, so employees could see their feedback lead to action.',
        'Ran engagement initiatives across the Karachi, Lahore and Islamabad offices so every location had the same voice.',
        'Streamlined grievance handling with clearer routes and faster first responses.',
      ],
      outcome:
        'Survey participation grew 400% from 2024 to 2025 and a further 350% from 2025 to 2026. Employee escalations fell by 30%.',
    },
  },
  {
    id: 'hrms',
    title: 'HRMS Implementation',
    org: 'FlowHCM · AMZ One Step',
    summary:
      'Moving HR onto one system, and making sure people actually used it.',
    outcomes: [
      'Led HRMS rollouts end to end',
      'Trained 200+ employees on the FlowHCM platform',
      'Built reporting dashboards for leadership decisions',
    ],
    caseStudy: {
      problem:
        'HR data lived in scattered spreadsheets and manual processes, making it slow to answer basic workforce questions and hard for leadership to plan.',
      approach: [
        'Led the HRMS rollouts, from configuration through launch.',
        'Designed and delivered training so 200+ employees could self-serve with confidence.',
        'Built reporting dashboards that put live people data in front of leadership.',
      ],
      outcome:
        'HR moved onto a single system of record, more than 200 employees were trained to use it, and leadership gained dashboards to make faster, better-informed decisions.',
    },
  },
  {
    id: 'performance-culture',
    title: 'Performance & Culture',
    org: 'People & Culture programmes',
    summary:
      'Making goals measurable and learning a weekly habit.',
    outcomes: [
      'Introduced SMART goal-setting (AWOs) and trained employees on measurable goals',
      'Created “LevelUp”, a weekly knowledge-sharing session',
      'Wrote employee handbooks and equity-focused policies',
    ],
    caseStudy: {
      problem:
        'Goals were vague, which made performance conversations subjective. Knowledge stayed in silos, and policies did not reflect the inclusive culture the company wanted.',
      approach: [
        'Introduced SMART goal-setting through AWOs and trained employees to write goals that could actually be measured.',
        'Created LevelUp, a weekly session where colleagues teach each other what they know.',
        'Wrote employee handbooks and equity-focused policies so expectations were clear and fair for everyone.',
      ],
      outcome:
        'Performance conversations moved from opinion to evidence, learning became a weekly habit, and policy finally matched the culture.',
    },
  },
  {
    id: 'road-to-100',
    title: 'Road to 100',
    org: 'Jaffer Business Systems',
    // CONFIRM: the campaign's target figure and scope before publishing.
    summary:
      'A company-wide transformation campaign, taken from concept to execution.',
    outcomes: [
      'Spearheaded the campaign from first concept to company-wide execution',
      'Aligned teams across the business behind one shared goal',
      'Kept people informed and involved throughout the journey',
    ],
    caseStudy: {
      problem:
        'The company had an ambitious goal and needed every team pulling in the same direction to reach it.',
      approach: [
        'Spearheaded the “Road to 100” campaign from concept to execution.',
        'Translated the goal into a story and a rhythm that every team could see themselves in.',
        'Coordinated execution across departments and kept momentum through regular communication.',
      ],
      outcome:
        'A company-wide transformation campaign delivered from concept to execution. (Target figure and results to be confirmed.)',
    },
  },
]

export const experience = [
  {
    role: 'HR Strategy Lead',
    company: 'Deckgrow',
    location: 'Ohio, US · Remote',
    period: 'Jun 2026 – Present',
    detail:
      'Leading a 6-month HR roadmap and building policies, governance, recruitment workflows, onboarding, leave management and HR reporting from scratch.',
  },
  {
    role: 'Sr. Executive People & Culture',
    company: 'Jaffer Business Systems',
    location: 'Karachi · Lahore · Islamabad',
    period: 'Jul 2024 – Jun 2026',
    detail:
      'Project-managed TalentX for 250 employees, grew NPS participation 400% then 350%, cut escalations by 30% and spearheaded the “Road to 100” campaign.',
  },
  {
    role: 'Sr. People & Culture Specialist',
    company: 'AMZ One Step',
    location: '',
    period: 'Aug 2022 – Jul 2024',
    detail:
      'Led the FlowHCM HRMS rollout, trained 200+ employees and built leadership dashboards. Remarkable Dedication Award 2022–23 and Extraordinary Services Award 2023–24.',
  },
  {
    role: 'Employee Engagement, People & Culture Specialist',
    company: 'AMZ One Step',
    location: '',
    period: 'Jan 2022 – Jul 2022',
    detail:
      'Focused on employee engagement and experience programmes across the people & culture function.',
  },
  {
    role: 'HR Generalist',
    company: 'AMZ One Step',
    location: '',
    period: 'Oct 2020 – Dec 2021',
    detail:
      'Built a broad foundation across recruitment, onboarding, HR operations and employee relations.',
  },
]

export const rolesHired = [
  'Verification Engineers',
  'Cybersecurity Analysts',
  'SAP & Oracle',
  'Data Engineers',
  'Business Analysts',
  'Tech Sales',
  'Shopify Developers',
  'Project Managers',
  'Operations Directors',
  'Creative Leads',
  'PPC & Amazon Specialists',
]

/** `icon` keys map to line icons in components/ui/ExpertiseIcon.jsx */
export const expertise = [
  {
    title: 'HR Strategy & Organizational Development',
    icon: 'compass',
    body: 'Roadmaps that connect people priorities to business goals: org design, governance, policy and the sequencing that gets it done without overwhelming a growing team.',
  },
  {
    title: 'Talent Management & Succession Planning',
    icon: 'ladder',
    body: 'Development plans, career pathways, promotion frameworks and succession visibility, so good people can see a future and leadership can see the bench.',
  },
  {
    title: 'Performance Management',
    icon: 'target',
    body: 'SMART goal-setting, fair review cycles and manager coaching that make performance conversations evidence-based and useful.',
  },
  {
    title: 'Employee Engagement & Experience',
    icon: 'heart',
    body: 'Listening systems that people actually use, from NPS surveys to programmes like LevelUp, and the follow-through that builds trust.',
  },
  {
    title: 'Recruitment & Onboarding',
    icon: 'door',
    body: 'Hiring workflows for technical, commercial and creative roles, and onboarding that gets new joiners productive and connected quickly. Time-to-hire cut by 30%.',
  },
  {
    title: 'HR Technology & Analytics',
    icon: 'chart',
    body: 'HRMS selection and rollout, adoption training and dashboards that give leadership reliable people data.',
  },
  {
    title: 'Conflict Resolution & Grievance Handling',
    icon: 'bridge',
    body: 'Clear, humane grievance processes that resolve issues early. Employee escalations reduced by 30%.',
  },
  {
    title: 'Cross-Cultural HR Leadership',
    icon: 'globe',
    body: 'People practice that works across Pakistan, Canada, the USA and Indonesia, with respect for local context and one consistent standard of care.',
  },
]

export const research = {
  title:
    'Workplace Friendships, Interpersonal Conflict and Employee Thriving at Work: An Experimental Study',
  meta: 'Master’s thesis · IBA Karachi · 2024',
  supervisor: 'Supervised by Dr. Yasir Mansoor Kundi',
  finding:
    'In a 2×2 experiment with 138 white-collar employees in Pakistan, workplace friendships significantly increased employees’ thriving at work, and interpersonal conflict did not significantly weaken that effect, showing how resilient good workplace relationships are.',
  stats: [
    { value: '2×2', label: 'Experimental design' },
    { value: '138', label: 'White-collar employees' },
  ],
  others: [
    'Employee Retention in the Banking Sector of Pakistan',
    'Employee Retention in Firms Post COVID-19',
    'Post-COVID Trauma among PNS Shifa Healthcare Workers',
    'Project Management Maturity',
    'Supply Chain Management Post COVID-19 (thematic analysis)',
    'Sustainable Innovation (literature review)',
    'Consumer Buying Behaviour of Automobiles',
  ],
}

export const recognition = {
  education: [
    { title: 'Master’s in Management', place: 'IBA Karachi', year: '2024' },
    { title: 'BBA', place: 'University of Karachi', year: '2020' },
  ],
  awards: [
    { title: 'Extraordinary Services Award', place: 'AMZ One Step', year: '2023–24' },
    { title: 'Remarkable Dedication Award', place: 'AMZ One Step', year: '2022–23' },
    { title: '55 Hours Community Service Award', place: 'FESF NGO', year: '' },
  ],
  community: [
    {
      title: 'Project Manager & Social Worker',
      place: 'FESF',
      note: 'Education for underprivileged children and transgender awareness.',
    },
    { title: 'Volunteer', place: 'Al-Khidmat Hospital', note: '' },
    { title: 'Volunteer Teacher', place: 'Bright Future Public School', note: '' },
    { title: 'Brand Ambassador', place: 'Procom 18 (FAST)', note: '' },
  ],
  training: [
    { title: 'Leadership workshops', place: 'with Zeeshan Shafi and Umair Jaliawala' },
  ],
}

/**
 * PLACEHOLDER testimonials. These are NOT real quotes and must be replaced
 * with real, approved testimonials before setting FLAGS.SHOW_TESTIMONIALS = true.
 */
export const testimonials = [
  {
    quote: '[PLACEHOLDER] Replace with a real testimonial from a founder or CEO Rameesha has worked with.',
    name: '[Placeholder name]',
    title: '[Title, Company]',
  },
  {
    quote: '[PLACEHOLDER] Replace with a real testimonial from a manager or colleague.',
    name: '[Placeholder name]',
    title: '[Title, Company]',
  },
  {
    quote: '[PLACEHOLDER] Replace with a real testimonial from a team member or programme participant.',
    name: '[Placeholder name]',
    title: '[Title, Company]',
  },
]

export const nav = [
  { id: 'about', label: 'About' },
  { id: 'impact', label: 'Impact' },
  { id: 'initiatives', label: 'Initiatives' },
  { id: 'experience', label: 'Experience' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'research', label: 'Research' },
  { id: 'contact', label: 'Contact' },
]
