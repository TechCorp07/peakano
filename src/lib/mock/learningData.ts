/**
 * Mock data for Learning Hub, Assessments, and Annotation Workflow
 * Focused on Women's Health / Pelvic MRI Imaging
 */

// =============================================================================
// COURSES DATA
// =============================================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorTitle: string;
  duration: string;
  modules: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  category: string;
  topics: string[];
  thumbnail?: string;
  progress?: number;
  isEnrolled?: boolean;
  prerequisites?: string[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
  isCompleted?: boolean;
  isLocked?: boolean;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'practice';
  isCompleted?: boolean;
  score?: number;
  order: number;
}

export interface LearningPath {
  id: string;
  name: string;
  icon: string;
  description: string;
  courseCount: number;
  color: string;
}

export const learningPaths: LearningPath[] = [
  {
    id: 'cervical',
    name: 'Cervical Imaging',
    icon: '🔬',
    description: 'Cervical cancer detection and staging',
    courseCount: 4,
    color: 'from-pink-500/20 to-pink-600/20',
  },
  {
    id: 'uterine',
    name: 'Uterine Imaging',
    icon: '🩺',
    description: 'Fibroids and uterine pathology',
    courseCount: 3,
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    id: 'ovarian',
    name: 'Ovarian Imaging',
    icon: '📊',
    description: 'Ovarian cysts and masses',
    courseCount: 3,
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    id: 'pelvic',
    name: 'Pelvic Floor',
    icon: '🏥',
    description: 'Pelvic floor anatomy and disorders',
    courseCount: 2,
    color: 'from-teal-500/20 to-teal-600/20',
  },
];

export const mockCourses: Course[] = [
  {
    id: 'pelvic-mri-fundamentals',
    title: 'Pelvic MRI Fundamentals',
    description: 'Master the basics of pelvic MRI interpretation for women\'s health imaging, including normal anatomy and common pathologies.',
    instructor: 'Prof. Tsungai Chipato',
    instructorTitle: 'Obstetrics and Gynaecology',
    duration: '4 hours',
    modules: 12,
    level: 'Beginner',
    rating: 4.8,
    ratingCount: 234,
    enrolledCount: 1247,
    category: 'pelvic',
    topics: ['Pelvic anatomy', 'MRI sequences', 'Normal findings'],
    progress: 68,
    isEnrolled: true,
  },
  {
    id: 'cervical-cancer-staging',
    title: 'Cervical Cancer Staging',
    description: 'Comprehensive training on FIGO staging of cervical cancer using MRI, including parametrial invasion assessment.',
    instructor: 'Dr. Tangayi Githu',
    instructorTitle: 'Adult Emergency Imaging Specialist',
    duration: '6 hours',
    modules: 18,
    level: 'Intermediate',
    rating: 4.9,
    ratingCount: 189,
    enrolledCount: 892,
    category: 'cervical',
    topics: ['FIGO staging', 'Tumor measurement', 'Parametrial invasion'],
    progress: 0,
    isEnrolled: false,
  },
  {
    id: 'uterine-fibroid-imaging',
    title: 'Uterine Fibroid Imaging',
    description: 'Learn to identify, classify, and map uterine fibroids using MRI for treatment planning.',
    instructor: 'Dr. Melanie Sion',
    instructorTitle: 'Trauma and Surgical Critical Care Specialist',
    duration: '5 hours',
    modules: 15,
    level: 'Intermediate',
    rating: 4.7,
    ratingCount: 156,
    enrolledCount: 734,
    category: 'uterine',
    topics: ['Fibroid classification', 'FIGO mapping', 'Treatment planning'],
    progress: 25,
    isEnrolled: true,
  },
  {
    id: 'ovarian-mass-characterization',
    title: 'Ovarian Mass Characterization',
    description: 'Advanced course on differentiating benign from malignant ovarian masses using MRI features.',
    instructor: 'Prof. Tsungai Chipato',
    instructorTitle: 'Obstetrics and Gynaecology',
    duration: '8 hours',
    modules: 24,
    level: 'Advanced',
    rating: 4.8,
    ratingCount: 178,
    enrolledCount: 534,
    category: 'ovarian',
    topics: ['O-RADS classification', 'Cyst characterization', 'Malignancy risk'],
    progress: 0,
    isEnrolled: false,
    prerequisites: ['pelvic-mri-fundamentals'],
  },
  {
    id: 'endometriosis-detection',
    title: 'Endometriosis Detection',
    description: 'Specialized training on identifying deep infiltrating endometriosis and adenomyosis on MRI.',
    instructor: 'Dr. Tatenda Mujeni',
    instructorTitle: 'Public Health',
    duration: '4 hours',
    modules: 10,
    level: 'Intermediate',
    rating: 4.6,
    ratingCount: 145,
    enrolledCount: 612,
    category: 'pelvic',
    topics: ['Deep endometriosis', 'Adenomyosis', 'Surgical mapping'],
    progress: 0,
    isEnrolled: false,
  },
  {
    id: 'annotation-masterclass',
    title: 'Pelvic MRI Annotation Masterclass',
    description: 'Learn professional annotation techniques for accurate pelvic tumor segmentation and organ delineation.',
    instructor: 'Dr. Tangayi Githu',
    instructorTitle: 'Adult Emergency Imaging Specialist',
    duration: '3 hours',
    modules: 8,
    level: 'Beginner',
    rating: 4.9,
    ratingCount: 98,
    enrolledCount: 423,
    category: 'annotation',
    topics: ['Segmentation techniques', 'Quality standards', 'Best practices'],
    progress: 0,
    isEnrolled: false,
  },
];

export const mockModules: Module[] = [
  {
    id: 'mod-1',
    courseId: 'pelvic-mri-fundamentals',
    title: 'Introduction to Pelvic MRI',
    order: 1,
    isCompleted: true,
    lessons: [
      { id: 'les-1-1', moduleId: 'mod-1', title: 'MRI Physics for Pelvic Imaging', duration: '15 min', type: 'video', isCompleted: true, order: 1 },
      { id: 'les-1-2', moduleId: 'mod-1', title: 'Essential Sequences (T1, T2, DWI)', duration: '20 min', type: 'video', isCompleted: true, order: 2 },
      { id: 'les-1-3', moduleId: 'mod-1', title: 'Module 1 Assessment', duration: '10 min', type: 'quiz', isCompleted: true, score: 92, order: 3 },
    ],
  },
  {
    id: 'mod-2',
    courseId: 'pelvic-mri-fundamentals',
    title: 'Female Pelvic Anatomy',
    order: 2,
    isCompleted: true,
    lessons: [
      { id: 'les-2-1', moduleId: 'mod-2', title: 'Uterine Anatomy on MRI', duration: '25 min', type: 'video', isCompleted: true, order: 1 },
      { id: 'les-2-2', moduleId: 'mod-2', title: 'Cervical Anatomy & Zones', duration: '20 min', type: 'video', isCompleted: true, order: 2 },
      { id: 'les-2-3', moduleId: 'mod-2', title: 'Anatomy Labeling Exercise', duration: '15 min', type: 'practice', isCompleted: true, score: 88, order: 3 },
    ],
  },
  {
    id: 'mod-3',
    courseId: 'pelvic-mri-fundamentals',
    title: 'Ovaries and Adnexa',
    order: 3,
    isCompleted: false,
    lessons: [
      { id: 'les-3-1', moduleId: 'mod-3', title: 'Normal Ovarian Appearance', duration: '18 min', type: 'video', isCompleted: true, order: 1 },
      { id: 'les-3-2', moduleId: 'mod-3', title: 'Adnexal Structures', duration: '22 min', type: 'video', isCompleted: false, order: 2 },
      { id: 'les-3-3', moduleId: 'mod-3', title: 'Annotation Exercise', duration: '20 min', type: 'practice', isCompleted: false, order: 3 },
    ],
  },
  {
    id: 'mod-4',
    courseId: 'pelvic-mri-fundamentals',
    title: 'Common Pelvic Pathologies',
    order: 4,
    isCompleted: false,
    isLocked: true,
    lessons: [
      { id: 'les-4-1', moduleId: 'mod-4', title: 'Cervical Lesions', duration: '30 min', type: 'video', isCompleted: false, order: 1 },
      { id: 'les-4-2', moduleId: 'mod-4', title: 'Uterine Fibroids', duration: '25 min', type: 'video', isCompleted: false, order: 2 },
      { id: 'les-4-3', moduleId: 'mod-4', title: 'Pathology Quiz', duration: '15 min', type: 'quiz', isCompleted: false, order: 3 },
    ],
  },
];

// =============================================================================
// ASSESSMENTS DATA
// =============================================================================

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quick-practice' | 'skill-test' | 'certification';
  category: string;
  caseCount?: number;
  questionCount?: number;
  duration: string;
  passingScore?: number;
  passingDice?: number;
  bestScore?: number;
  bestDice?: number;
  attempts: number;
  icon: string;
  isCompleted?: boolean;
  prerequisitesMet?: boolean;
}

export interface SkillProgress {
  skill: string;
  score: number;
  category: string;
}

export interface UserAssessmentStats {
  overallProficiency: number;
  level: string;
  rank: string;
  streak: number;
  completedCount: number;
  totalCount: number;
  skills: SkillProgress[];
  recommendedAssessment?: string;
}

export const mockUserStats: UserAssessmentStats = {
  overallProficiency: 87,
  level: 'Advanced',
  rank: 'Top 15%',
  streak: 12,
  completedCount: 12,
  totalCount: 20,
  skills: [
    { skill: 'Cervical Lesions', score: 87, category: 'detection' },
    { skill: 'Tumor Segmentation', score: 72, category: 'segmentation' },
    { skill: 'Fibroid Mapping', score: 94, category: 'identification' },
    { skill: 'Quality Control', score: 81, category: 'review' },
  ],
  recommendedAssessment: 'cervical-tumor-segmentation',
};

export const mockAssessments: Assessment[] = [
  // Quick Practice
  {
    id: 'pelvic-anatomy-quiz',
    title: 'Pelvic Anatomy Quiz',
    description: 'Quick questions on female pelvic anatomy and MRI appearance',
    type: 'quick-practice',
    category: 'pelvic',
    questionCount: 10,
    duration: '5 min',
    icon: '🩺',
    attempts: 5,
    bestScore: 90,
    isCompleted: true,
  },
  {
    id: 'spot-the-lesion',
    title: 'Spot the Cervical Lesion',
    description: 'Identify cervical lesions in pelvic MRI cases',
    type: 'quick-practice',
    category: 'detection',
    caseCount: 5,
    duration: '8 min',
    icon: '🎯',
    attempts: 3,
    bestScore: 85,
    isCompleted: true,
  },
  {
    id: 'fibroid-mapping-challenge',
    title: 'Fibroid Mapping Challenge',
    description: 'Map and classify uterine fibroids against the clock',
    type: 'quick-practice',
    category: 'segmentation',
    caseCount: 3,
    duration: '5 min',
    icon: '⏱️',
    attempts: 2,
    bestScore: 78,
    isCompleted: false,
  },
  // Skill Tests
  {
    id: 'cervical-cancer-detection',
    title: 'Cervical Cancer Detection Assessment',
    description: 'Test your ability to identify and stage cervical tumors',
    type: 'skill-test',
    category: 'cervical',
    caseCount: 15,
    duration: '25 min',
    passingScore: 80,
    bestScore: 87,
    attempts: 3,
    icon: '📋',
    isCompleted: true,
  },
  {
    id: 'tumor-segmentation-accuracy',
    title: 'Tumor Segmentation Accuracy',
    description: 'Demonstrate precision in cervical tumor boundary delineation',
    type: 'skill-test',
    category: 'segmentation',
    caseCount: 8,
    duration: '30 min',
    passingDice: 0.85,
    bestDice: 0.82,
    attempts: 2,
    icon: '📊',
    isCompleted: false,
  },
  {
    id: 'ovarian-mass-assessment',
    title: 'Ovarian Mass Assessment',
    description: 'Evaluate and classify ovarian masses using O-RADS criteria',
    type: 'skill-test',
    category: 'ovarian',
    caseCount: 10,
    duration: '20 min',
    passingScore: 75,
    bestScore: 0,
    attempts: 0,
    icon: '🔬',
    isCompleted: false,
  },
  // Certifications
  {
    id: 'pelvic-mri-cert',
    title: 'Certified Pelvic MRI Annotator',
    description: 'Official certification for pelvic MRI annotation proficiency',
    type: 'certification',
    category: 'pelvic',
    questionCount: 50,
    caseCount: 10,
    duration: '2 hours',
    passingScore: 85,
    attempts: 0,
    icon: '🏆',
    isCompleted: false,
    prerequisitesMet: true,
  },
  {
    id: 'cervical-staging-cert',
    title: 'Certified Cervical Cancer Staging Specialist',
    description: 'Advanced certification for cervical cancer staging and annotation',
    type: 'certification',
    category: 'cervical',
    questionCount: 40,
    caseCount: 15,
    duration: '2.5 hours',
    passingDice: 0.90,
    attempts: 0,
    icon: '🎖️',
    isCompleted: false,
    prerequisitesMet: false,
  },
];

// =============================================================================
// ANNOTATION WORKFLOW DATA
// =============================================================================

export interface AnnotationTask {
  id: string;
  caseId: string;
  studyInstanceUID?: string;
  title: string;
  type: string;
  modality: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'in-progress' | 'submitted' | 'under-review' | 'approved' | 'rejected';
  deadline: string;
  estimatedTime: string;
  assignedBy?: string;
  sliceCount?: number;
  progress?: number;
  lastEdited?: string;
  feedback?: string;
  checklist?: AnnotationChecklist[];
}

export interface AnnotationChecklist {
  id: string;
  label: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export interface AnnotationStats {
  pending: number;
  inProgress: number;
  submitted: number;
  approved: number;
  thisMonth: number;
}

export const mockAnnotationStats: AnnotationStats = {
  pending: 8,
  inProgress: 2,
  submitted: 3,
  approved: 47,
  thisMonth: 47,
};

export const mockAnnotationTasks: AnnotationTask[] = [
  {
    id: 'task-1',
    caseId: 'PEL-2026-00123',
    studyInstanceUID: 'static-patient-1-series-0002',
    title: 'Pelvic MRI - Cervical Tumor Segmentation',
    type: 'Cervical Tumor Segmentation',
    modality: 'MR',
    priority: 'normal',
    status: 'in-progress',
    deadline: '2026-01-12',
    estimatedTime: '30 min',
    sliceCount: 34,
    progress: 62,
    lastEdited: '2 hours ago',
    checklist: [
      { id: 'c1', label: 'Primary tumor segmentation', isCompleted: true, isRequired: true },
      { id: 'c2', label: 'Parametrial involvement', isCompleted: true, isRequired: true },
      { id: 'c3', label: 'Vaginal extension', isCompleted: false, isRequired: true },
      { id: 'c4', label: 'Lymph node assessment', isCompleted: false, isRequired: false },
    ],
  },
  {
    id: 'task-2',
    caseId: 'PEL-2026-00089',
    studyInstanceUID: 'static-patient-2-series-0004',
    title: 'Pelvic MRI - Uterine Fibroid Mapping',
    type: 'Fibroid Mapping',
    modality: 'MR',
    priority: 'urgent',
    status: 'pending',
    deadline: '2026-01-09T17:00:00',
    estimatedTime: '30 min',
    assignedBy: 'Dr. Johnson',
    sliceCount: 38,
    checklist: [
      { id: 'c1', label: 'Identify all fibroids', isCompleted: false, isRequired: true },
      { id: 'c2', label: 'FIGO classification', isCompleted: false, isRequired: true },
      { id: 'c3', label: 'Measure dimensions', isCompleted: false, isRequired: true },
      { id: 'c4', label: 'Document location', isCompleted: false, isRequired: true },
    ],
  },
  {
    id: 'task-3',
    caseId: 'PEL-2026-00156',
    studyInstanceUID: 'static-patient-3-series-0004',
    title: 'Pelvic MRI - Ovarian Mass Characterization',
    type: 'Ovarian Assessment',
    modality: 'MR',
    priority: 'normal',
    status: 'pending',
    deadline: '2026-01-12',
    estimatedTime: '20 min',
    sliceCount: 38,
  },
  {
    id: 'task-4',
    caseId: 'PEL-2026-00157',
    studyInstanceUID: 'static-patient-1-series-0002',
    title: 'Pelvic MRI - Endometriosis Mapping',
    type: 'Endometriosis Assessment',
    modality: 'MR',
    priority: 'normal',
    status: 'pending',
    deadline: '2026-01-13',
    estimatedTime: '45 min',
    sliceCount: 34,
  },
  {
    id: 'task-5',
    caseId: 'PEL-2026-00158',
    studyInstanceUID: 'static-patient-2-series-0004',
    title: 'Pelvic MRI - Cervical Cancer Staging',
    type: 'FIGO Staging',
    modality: 'MR',
    priority: 'low',
    status: 'pending',
    deadline: '2026-01-15',
    estimatedTime: '35 min',
    sliceCount: 34,
  },
  {
    id: 'task-6',
    caseId: 'PEL-2026-00098',
    studyInstanceUID: 'static-patient-3-series-0004',
    title: 'Pelvic MRI - Cervical Tumor Follow-up',
    type: 'Tumor Segmentation',
    modality: 'MR',
    priority: 'normal',
    status: 'rejected',
    deadline: '2026-01-10',
    estimatedTime: '25 min',
    feedback: 'Please include all slices with visible tumor margin. Slices 12-15 appear to be missing annotations for parametrial region.',
    sliceCount: 34,
  },
  {
    id: 'task-7',
    caseId: 'PEL-2026-00045',
    studyInstanceUID: 'static-patient-1-series-0002',
    title: 'Pelvic MRI - Adenomyosis Detection',
    type: 'Adenomyosis Assessment',
    modality: 'MR',
    priority: 'normal',
    status: 'submitted',
    deadline: '2026-01-08',
    estimatedTime: '20 min',
    sliceCount: 38,
  },
];

// Helper function to get tasks by status
export function getTasksByStatus(status: AnnotationTask['status']): AnnotationTask[] {
  return mockAnnotationTasks.filter(task => task.status === status);
}

// Helper function to get urgent tasks
export function getUrgentTasks(): AnnotationTask[] {
  return mockAnnotationTasks.filter(task => task.priority === 'urgent' && task.status === 'pending');
}

// Helper function to get tasks needing attention (rejected)
export function getTasksNeedingAttention(): AnnotationTask[] {
  return mockAnnotationTasks.filter(task => task.status === 'rejected');
}

// Helper function to get in-progress task for "continue where you left off"
export function getContinueTask(): AnnotationTask | undefined {
  return mockAnnotationTasks.find(task => task.status === 'in-progress');
}
