/**
 * Mock data for Learning Hub, Assessments, and Annotation Workflow
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
    id: 'neuro',
    name: 'Neuro Imaging',
    icon: '🧠',
    description: 'Brain and spine MRI interpretation',
    courseCount: 4,
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    id: 'msk',
    name: 'MSK Imaging',
    icon: '🦴',
    description: 'Musculoskeletal MRI analysis',
    courseCount: 3,
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    id: 'cardiac',
    name: 'Cardiac Imaging',
    icon: '💗',
    description: 'Heart and vascular MRI',
    courseCount: 2,
    color: 'from-red-500/20 to-red-600/20',
  },
  {
    id: 'thoracic',
    name: 'Thoracic Imaging',
    icon: '🫁',
    description: 'Chest and lung imaging',
    courseCount: 3,
    color: 'from-teal-500/20 to-teal-600/20',
  },
];

export const mockCourses: Course[] = [
  {
    id: 'brain-mri-fundamentals',
    title: 'Brain MRI Fundamentals',
    description: 'Master the basics of brain MRI interpretation and learn to identify common anatomical structures and pathologies.',
    instructor: 'Dr. Sarah Chen',
    instructorTitle: 'Neuroradiologist',
    duration: '4 hours',
    modules: 12,
    level: 'Beginner',
    rating: 4.8,
    ratingCount: 234,
    enrolledCount: 1247,
    category: 'neuro',
    topics: ['Brain anatomy', 'MRI sequences', 'Common findings'],
    progress: 68,
    isEnrolled: true,
  },
  {
    id: 'annotation-masterclass',
    title: 'Annotation Masterclass',
    description: 'Learn professional annotation techniques for accurate medical image segmentation and labeling.',
    instructor: 'Dr. Michael Torres',
    instructorTitle: 'Medical Imaging Specialist',
    duration: '6 hours',
    modules: 18,
    level: 'Intermediate',
    rating: 4.9,
    ratingCount: 189,
    enrolledCount: 892,
    category: 'annotation',
    topics: ['Segmentation techniques', 'Quality standards', 'Best practices'],
    progress: 0,
    isEnrolled: false,
  },
  {
    id: 'tumor-detection-specialist',
    title: 'Tumor Detection Specialist',
    description: 'Advanced course on identifying and classifying brain tumors using multi-sequence MRI analysis.',
    instructor: 'Dr. Emily Watson',
    instructorTitle: 'Neuro-oncology Radiologist',
    duration: '8 hours',
    modules: 24,
    level: 'Advanced',
    rating: 4.7,
    ratingCount: 156,
    enrolledCount: 534,
    category: 'neuro',
    topics: ['Tumor identification', 'Grading', 'Differential diagnosis'],
    progress: 0,
    isEnrolled: false,
    prerequisites: ['brain-mri-fundamentals'],
  },
  {
    id: 'spine-mri-essentials',
    title: 'Spine MRI Essentials',
    description: 'Comprehensive guide to spinal MRI interpretation including disc pathology and nerve root assessment.',
    instructor: 'Dr. James Park',
    instructorTitle: 'Spine Imaging Specialist',
    duration: '5 hours',
    modules: 15,
    level: 'Intermediate',
    rating: 4.6,
    ratingCount: 178,
    enrolledCount: 756,
    category: 'msk',
    topics: ['Spine anatomy', 'Disc herniation', 'Stenosis'],
    progress: 25,
    isEnrolled: true,
  },
  {
    id: 'cardiac-mri-basics',
    title: 'Cardiac MRI Basics',
    description: 'Introduction to cardiac MRI including ventricular function assessment and common pathologies.',
    instructor: 'Dr. Lisa Anderson',
    instructorTitle: 'Cardiovascular Radiologist',
    duration: '4 hours',
    modules: 10,
    level: 'Beginner',
    rating: 4.5,
    ratingCount: 98,
    enrolledCount: 423,
    category: 'cardiac',
    topics: ['Heart anatomy', 'Function analysis', 'Cardiomyopathy'],
    progress: 0,
    isEnrolled: false,
  },
  {
    id: 'ms-lesion-mapping',
    title: 'MS Lesion Mapping',
    description: 'Specialized training on identifying and tracking multiple sclerosis lesions across MRI sequences.',
    instructor: 'Dr. Robert Kim',
    instructorTitle: 'Neuroimaging Fellow',
    duration: '3 hours',
    modules: 8,
    level: 'Intermediate',
    rating: 4.8,
    ratingCount: 145,
    enrolledCount: 612,
    category: 'neuro',
    topics: ['MS diagnosis', 'Lesion detection', 'Follow-up imaging'],
    progress: 0,
    isEnrolled: false,
  },
];

export const mockModules: Module[] = [
  {
    id: 'mod-1',
    courseId: 'brain-mri-fundamentals',
    title: 'Introduction to Brain MRI',
    order: 1,
    isCompleted: true,
    lessons: [
      { id: 'les-1-1', moduleId: 'mod-1', title: 'MRI Physics Basics', duration: '15 min', type: 'video', isCompleted: true, order: 1 },
      { id: 'les-1-2', moduleId: 'mod-1', title: 'Common Sequences', duration: '20 min', type: 'video', isCompleted: true, order: 2 },
      { id: 'les-1-3', moduleId: 'mod-1', title: 'Module 1 Assessment', duration: '10 min', type: 'quiz', isCompleted: true, score: 92, order: 3 },
    ],
  },
  {
    id: 'mod-2',
    courseId: 'brain-mri-fundamentals',
    title: 'Normal Brain Anatomy',
    order: 2,
    isCompleted: true,
    lessons: [
      { id: 'les-2-1', moduleId: 'mod-2', title: 'Cortical Structures', duration: '25 min', type: 'video', isCompleted: true, order: 1 },
      { id: 'les-2-2', moduleId: 'mod-2', title: 'Deep Gray Matter', duration: '20 min', type: 'video', isCompleted: true, order: 2 },
      { id: 'les-2-3', moduleId: 'mod-2', title: 'Anatomy Labeling Exercise', duration: '15 min', type: 'practice', isCompleted: true, score: 88, order: 3 },
    ],
  },
  {
    id: 'mod-3',
    courseId: 'brain-mri-fundamentals',
    title: 'White Matter Anatomy',
    order: 3,
    isCompleted: false,
    lessons: [
      { id: 'les-3-1', moduleId: 'mod-3', title: 'Major White Matter Tracts', duration: '18 min', type: 'video', isCompleted: true, order: 1 },
      { id: 'les-3-2', moduleId: 'mod-3', title: 'White Matter Pathology', duration: '22 min', type: 'video', isCompleted: false, order: 2 },
      { id: 'les-3-3', moduleId: 'mod-3', title: 'Annotation Exercise', duration: '20 min', type: 'practice', isCompleted: false, order: 3 },
    ],
  },
  {
    id: 'mod-4',
    courseId: 'brain-mri-fundamentals',
    title: 'Common Pathologies',
    order: 4,
    isCompleted: false,
    isLocked: true,
    lessons: [
      { id: 'les-4-1', moduleId: 'mod-4', title: 'Stroke Imaging', duration: '30 min', type: 'video', isCompleted: false, order: 1 },
      { id: 'les-4-2', moduleId: 'mod-4', title: 'Tumor Recognition', duration: '25 min', type: 'video', isCompleted: false, order: 2 },
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
    { skill: 'Brain Lesions', score: 87, category: 'detection' },
    { skill: 'Tumor Segmentation', score: 72, category: 'segmentation' },
    { skill: 'Anatomy ID', score: 94, category: 'identification' },
    { skill: 'Quality Control', score: 81, category: 'review' },
  ],
  recommendedAssessment: 'tumor-segmentation-practice',
};

export const mockAssessments: Assessment[] = [
  // Quick Practice
  {
    id: 'brain-quiz',
    title: 'Brain Quiz',
    description: 'Quick questions on brain anatomy and pathology',
    type: 'quick-practice',
    category: 'neuro',
    questionCount: 10,
    duration: '5 min',
    icon: '🧠',
    attempts: 5,
    bestScore: 90,
    isCompleted: true,
  },
  {
    id: 'spot-the-lesion',
    title: 'Spot the Lesion',
    description: 'Identify lesions in brain MRI cases',
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
    id: 'speed-challenge',
    title: 'Speed Challenge',
    description: 'Annotate cases against the clock',
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
    id: 'brain-lesion-detection',
    title: 'Brain Lesion Detection Assessment',
    description: 'Test your ability to identify and classify brain lesions',
    type: 'skill-test',
    category: 'neuro',
    caseCount: 15,
    duration: '25 min',
    passingScore: 80,
    bestScore: 87,
    attempts: 3,
    icon: '📋',
    isCompleted: true,
  },
  {
    id: 'segmentation-accuracy',
    title: 'Segmentation Accuracy Assessment',
    description: 'Demonstrate precision in tumor boundary delineation',
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
    id: 'spine-assessment',
    title: 'Spine MRI Assessment',
    description: 'Evaluate disc pathology and nerve root compression',
    type: 'skill-test',
    category: 'msk',
    caseCount: 10,
    duration: '20 min',
    passingScore: 75,
    bestScore: 0,
    attempts: 0,
    icon: '🦴',
    isCompleted: false,
  },
  // Certifications
  {
    id: 'brain-mri-cert',
    title: 'Certified Brain MRI Annotator',
    description: 'Official certification for brain MRI annotation proficiency',
    type: 'certification',
    category: 'neuro',
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
    id: 'segmentation-cert',
    title: 'Certified Segmentation Specialist',
    description: 'Advanced certification for medical image segmentation',
    type: 'certification',
    category: 'segmentation',
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
    caseId: 'MRI-2026-00123',
    title: 'Brain MRI - Tumor Segmentation',
    type: 'Tumor Segmentation',
    modality: 'MR',
    priority: 'normal',
    status: 'in-progress',
    deadline: '2026-01-12',
    estimatedTime: '30 min',
    sliceCount: 24,
    progress: 62,
    lastEdited: '2 hours ago',
    checklist: [
      { id: 'c1', label: 'Tumor core segmentation', isCompleted: true, isRequired: true },
      { id: 'c2', label: 'Peritumoral edema', isCompleted: true, isRequired: true },
      { id: 'c3', label: 'Enhancement regions', isCompleted: false, isRequired: true },
      { id: 'c4', label: 'Necrotic areas', isCompleted: false, isRequired: false },
    ],
  },
  {
    id: 'task-2',
    caseId: 'MRI-2026-00089',
    title: 'Brain MRI - Stroke Assessment',
    type: 'Stroke Assessment',
    modality: 'MR',
    priority: 'urgent',
    status: 'pending',
    deadline: '2026-01-09T17:00:00',
    estimatedTime: '30 min',
    assignedBy: 'Dr. Johnson',
    sliceCount: 32,
    checklist: [
      { id: 'c1', label: 'Acute infarct core', isCompleted: false, isRequired: true },
      { id: 'c2', label: 'Penumbra (if visible)', isCompleted: false, isRequired: true },
      { id: 'c3', label: 'Hemorrhagic transformation', isCompleted: false, isRequired: true },
      { id: 'c4', label: 'Midline shift measurement', isCompleted: false, isRequired: true },
    ],
  },
  {
    id: 'task-3',
    caseId: 'MRI-2026-00156',
    title: 'Spine MRI - Disc Herniation',
    type: 'Disc Assessment',
    modality: 'MR',
    priority: 'normal',
    status: 'pending',
    deadline: '2026-01-12',
    estimatedTime: '20 min',
    sliceCount: 18,
  },
  {
    id: 'task-4',
    caseId: 'MRI-2026-00157',
    title: 'Brain MRI - MS Lesion Mapping',
    type: 'MS Lesion Mapping',
    modality: 'MR',
    priority: 'normal',
    status: 'pending',
    deadline: '2026-01-13',
    estimatedTime: '45 min',
    sliceCount: 48,
  },
  {
    id: 'task-5',
    caseId: 'MRI-2026-00158',
    title: 'Cardiac MRI - LV Segmentation',
    type: 'LV Segmentation',
    modality: 'MR',
    priority: 'low',
    status: 'pending',
    deadline: '2026-01-15',
    estimatedTime: '35 min',
    sliceCount: 20,
  },
  {
    id: 'task-6',
    caseId: 'MRI-2026-00098',
    title: 'Brain MRI - Tumor Follow-up',
    type: 'Tumor Segmentation',
    modality: 'MR',
    priority: 'normal',
    status: 'rejected',
    deadline: '2026-01-10',
    estimatedTime: '25 min',
    feedback: 'Please include all slices with visible tumor margin. Slices 12-15 appear to be missing annotations.',
    sliceCount: 28,
  },
  {
    id: 'task-7',
    caseId: 'MRI-2026-00045',
    title: 'Brain MRI - Lesion Detection',
    type: 'Lesion Detection',
    modality: 'MR',
    priority: 'normal',
    status: 'submitted',
    deadline: '2026-01-08',
    estimatedTime: '20 min',
    sliceCount: 22,
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
