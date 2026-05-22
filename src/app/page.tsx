'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
  User, GraduationCap, Briefcase, Code, Wrench, Award, 
  Plus, Trash2, Download, Upload, AlertTriangle, CheckCircle, 
  RefreshCw, FileText, ArrowRight, ChevronRight, Check, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Resume Schema
interface PersonalInfo {
  fullName: string;
  location: string;
  phone: string;
  email: string;
  github: string;
  linkedin: string;
  portfolio: string;
  leetcode: string;
}

interface EducationEntry {
  school: string;
  location: string;
  degree: string;
  dates: string;
}

interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  dates: string;
  bullets: string[];
}

interface ProjectEntry {
  name: string;
  technologies: string;
  githubLink: string;
  dates: string;
  bullets: string[];
}

interface SkillEntry {
  category: string;
  items: string;
}

interface ResumeData {
  personalInfo: PersonalInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillEntry[];
  achievements: string[];
}

// Prefilled Biswajit Samal Resume Data
const DEFAULT_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: 'Biswajit Samal',
    location: 'Bhubaneswar, Odisha',
    phone: '+91 637-073-6410',
    email: '2025samalbiswajit@gmail.com',
    github: 'https://github.com/Samal-Biswajit',
    linkedin: 'https://www.linkedin.com/in/samal-biswajit/',
    portfolio: '',
    leetcode: ''
  },
  education: [
    {
      school: 'Silicon University',
      location: 'Bhubaneswar, Odisha',
      degree: 'Bachelor of Technology in Computer Engineering (8.08/10)',
      dates: 'Sep 2023 -- Present'
    },
    {
      school: 'e-Tech Higher Secondary School',
      location: 'Dhenkanal, Odisha',
      degree: '12th (76%)',
      dates: 'May 2022'
    },
    {
      school: 'Saraswati Sishu Vidya Mandir',
      location: 'Dhenkanal, Odisha',
      degree: '10th (86%)',
      dates: 'March 2020'
    }
  ],
  experience: [
    {
      company: 'Codebeat',
      role: 'MERN Stack Developer Intern',
      location: '',
      dates: 'June 2024 -- July 2024',
      bullets: [
        'Engineered a responsive multi-page fitness platform using HTML, CSS, and JavaScript, building modular UI components for product grids and checkout systems',
        'Implemented client-side state management for cart operations and dynamic product rendering, optimizing cross-device behavior',
        'Integrated JSON-based mock APIs to simulate seamless frontend-backend data flow and scalable product listing'
      ]
    }
  ],
  projects: [
    {
      name: 'ShopFlow',
      technologies: 'React 19, Express.js, Axios, Vitest',
      githubLink: 'https://github.com/Samal-Biswajit/shopflow',
      dates: '',
      bullets: [
        'Engineered a full-stack e-commerce platform using React 19 and Express.js, featuring a dynamic shopping cart and a comprehensive catalog of 40+ products',
        'Developed a RESTful API with 9 endpoints integrated with Sequelize ORM and SQLite to manage cart states, checkout flows, and real-time payment summaries',
        'Implemented automated unit and integration testing workflows utilizing Vitest and React Testing Library to ensure robust UI and API reliability'
      ]
    },
    {
      name: 'URL Shortener API',
      technologies: 'Node.js, Express.js, PostgreSQL, Drizzle ORM, Docker',
      githubLink: 'https://github.com/Samal-Biswajit/URL_Shortener',
      dates: '',
      bullets: [
        'Developed a secure RESTful URL shortening service managing 6 API endpoints, implementing JWT authentication, bcrypt password hashing, and Zod schema validation',
        'Architected a type-safe PostgreSQL database using Drizzle ORM to manage relational data for user dashboards, nanoid-based URL generation, and fast redirection',
        'Containerized the database environment using Docker Compose to establish a consistent and reproducible local development workflow'
      ]
    }
  ],
  skills: [
    { category: 'Languages', items: 'JavaScript (ES6+), TypeScript, Python, Java, SQL' },
    { category: 'Frameworks & Libraries', items: 'React.js, Next.js, Node.js, Express.js, Tailwind CSS, Drizzle ORM, Zod' },
    { category: 'Databases', items: 'PostgreSQL, MongoDB, MySQL' },
    { category: 'Cloud & DevOps', items: 'AWS (EC2, S3, IAM, VPC), Docker' },
    { category: 'Tools', items: 'Git/GitHub, Postman, Linux, Vite' }
  ],
  achievements: [
    'Selected for Silicon University Entrepreneurship Development Program for building SwapX, a Battery-as-a-Service startup concept for mobility',
    'Shortlisted for the Google Student Ambassador program based on technical and community engagement profile',
    'Participated in multiple college-level and national hackathons focused on web development, AI, and startup problem solving',
    'Awarded Odisha State Scholarship for academic performance in Class 10 board examinations'
  ]
};

type ActiveSection = 'personal' | 'education' | 'experience' | 'projects' | 'skills' | 'achievements';

export default function ResumeBuilder() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('personal');
  const [compiling, setCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<{
    error: string;
    details: string;
    latexErrors?: string;
    log?: string;
  } | null>(null);

  // Initialize React Hook Form
  const { register, control, handleSubmit, watch, reset, setValue } = useForm<ResumeData>({
    defaultValues: DEFAULT_RESUME_DATA
  });

  const watchAllFields = watch();

  // Field Arrays for lists
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: 'education'
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: 'experience'
  });

  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({
    control,
    name: 'projects'
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'skills'
  });

  // Since achievements is a simple string array, we handle it slightly differently
  const [achievementsState, setAchievementsState] = useState<string[]>(DEFAULT_RESUME_DATA.achievements);

  useEffect(() => {
    // Keep achievements form value in sync with our state
    setValue('achievements', achievementsState);
  }, [achievementsState, setValue]);

  // Clean URLs helper
  const cleanUrl = (url: string): string => {
    if (!url) return '';
    let cleaned = url.trim().replace(/\/+$/, ''); // remove trailing slash
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'https://' + cleaned;
    }
    return cleaned;
  };

  // Trigger URL auto-clean on blur
  const handleUrlBlur = (fieldName: keyof PersonalInfo, value: string) => {
    if (value) {
      setValue(`personalInfo.${fieldName}` as any, cleanUrl(value));
    }
  };

  const handleProjUrlBlur = (index: number, value: string) => {
    if (value) {
      setValue(`projects.${index}.githubLink`, cleanUrl(value));
    }
  };

  // Add/Remove bullets for experience
  const addExpBullet = (expIndex: number) => {
    const currentExp = watchAllFields.experience[expIndex];
    const newBullets = [...(currentExp.bullets || []), ''];
    setValue(`experience.${expIndex}.bullets`, newBullets);
  };

  const removeExpBullet = (expIndex: number, bulletIndex: number) => {
    const currentExp = watchAllFields.experience[expIndex];
    const newBullets = currentExp.bullets.filter((_, i) => i !== bulletIndex);
    setValue(`experience.${expIndex}.bullets`, newBullets);
  };

  // Add/Remove bullets for projects
  const addProjBullet = (projIndex: number) => {
    const currentProj = watchAllFields.projects[projIndex];
    const newBullets = [...(currentProj.bullets || []), ''];
    setValue(`projects.${projIndex}.bullets`, newBullets);
  };

  const removeProjBullet = (projIndex: number, bulletIndex: number) => {
    const currentProj = watchAllFields.projects[projIndex];
    const newBullets = currentProj.bullets.filter((_, i) => i !== bulletIndex);
    setValue(`projects.${projIndex}.bullets`, newBullets);
  };

  // Resume Score & Warning calculations
  const healthAnalysis = useMemo(() => {
    const data = watchAllFields;
    const warnings: { type: string; message: string; severity: 'warning' | 'info' | 'critical' }[] = [];
    const successes: string[] = [];
    let score = 100;

    // 1. Personal Info details
    const personal = data.personalInfo || {};
    if (!personal.fullName) {
      warnings.push({ type: 'personal', message: 'Full Name is missing.', severity: 'critical' });
      score -= 20;
    } else {
      successes.push('✓ Personal name added.');
    }

    if (!personal.email || !personal.phone) {
      warnings.push({ type: 'personal', message: 'Contact details (email or phone) are missing.', severity: 'critical' });
      score -= 10;
    } else {
      successes.push('✓ Contact details complete.');
    }

    if (!personal.github && !personal.linkedin) {
      warnings.push({ type: 'personal', message: 'Adding Github and LinkedIn is highly recommended for tech roles.', severity: 'warning' });
      score -= 10;
    } else {
      successes.push('✓ Professional links added.');
    }

    // 2. Education section check
    const edu = data.education || [];
    if (edu.length === 0) {
      warnings.push({ type: 'education', message: 'Education section is empty.', severity: 'critical' });
      score -= 15;
    } else {
      successes.push(`✓ Education details listed (${edu.length} entries).`);
    }

    // 3. Experience section checks
    const exp = data.experience || [];
    let totalExpBullets = 0;
    let longExpBullets = 0;
    
    if (exp.length === 0) {
      warnings.push({ type: 'experience', message: 'No Experience items listed. Consider adding projects or internships.', severity: 'warning' });
      score -= 15;
    } else {
      successes.push(`✓ Professional experience details listed (${exp.length} entries).`);
      exp.forEach((entry, idx) => {
        const bullets = entry.bullets || [];
        totalExpBullets += bullets.length;
        if (bullets.length < 2) {
          warnings.push({ 
            type: 'experience', 
            message: `Experience ${idx + 1} (${entry.company || 'Unnamed'}) has very few details. Recommended: 2-4 bullet points.`, 
            severity: 'info' 
          });
          score -= 5;
        }
        bullets.forEach((bullet) => {
          if (bullet.length > 170) {
            longExpBullets++;
          }
        });
      });
    }

    // 4. Projects section checks
    const proj = data.projects || [];
    let totalProjBullets = 0;
    let longProjBullets = 0;

    if (proj.length === 0) {
      warnings.push({ type: 'projects', message: 'Projects section is empty. Students need 2-3 strong projects.', severity: 'critical' });
      score -= 20;
    } else {
      successes.push(`✓ Project details added (${proj.length} entries).`);
      proj.forEach((entry, idx) => {
        const bullets = entry.bullets || [];
        totalProjBullets += bullets.length;
        if (bullets.length < 2) {
          warnings.push({ 
            type: 'projects', 
            message: `Project ${idx + 1} (${entry.name || 'Unnamed'}) has minimal details. Recommended: 2-3 bullet points.`, 
            severity: 'info' 
          });
          score -= 5;
        }
        bullets.forEach((bullet) => {
          if (bullet.length > 170) {
            longProjBullets++;
          }
        });
      });
    }

    // Bullet points length warning
    if (longExpBullets > 0 || longProjBullets > 0) {
      warnings.push({ 
        type: 'bullet-length', 
        message: `${longExpBullets + longProjBullets} bullet points exceed 170 characters. Keep them under 2 lines on the PDF for readability.`, 
        severity: 'warning' 
      });
      score -= Math.min(15, (longExpBullets + longProjBullets) * 4);
    } else if (totalExpBullets > 0 || totalProjBullets > 0) {
      successes.push('✓ Bullet lengths are highly optimized (under 2 lines).');
    }

    // 5. Skills checks
    const skills = data.skills || [];
    let totalSkillsCount = 0;
    let overcrowdedCategory = false;

    if (skills.length === 0) {
      warnings.push({ type: 'skills', message: 'Technical Skills section is completely empty.', severity: 'critical' });
      score -= 15;
    } else {
      skills.forEach(category => {
        const list = category.items ? category.items.split(',').map(s => s.trim()).filter(Boolean) : [];
        totalSkillsCount += list.length;
        if (list.length > 12) {
          overcrowdedCategory = true;
        }
      });

      if (totalSkillsCount > 35) {
        warnings.push({ 
          type: 'skills', 
          message: `Too many skills listed (${totalSkillsCount}). Keyword stuffing reduces ATS readability. Group only core items.`, 
          severity: 'warning' 
        });
        score -= 10;
      } else {
        successes.push(`✓ Skills optimized (${totalSkillsCount} total skills listed).`);
      }

      if (overcrowdedCategory) {
        warnings.push({
          type: 'skills',
          message: 'One or more skill categories are overcrowded. Recommended: under 8 key items per row.',
          severity: 'info'
        });
        score -= 5;
      }
    }

    // 6. Page Overflow Estimation
    // An elegant line-based page budget estimator
    // Standard page budget is ~18-20 content rows before overflowing 1 page
    const totalLines = 
      edu.length * 2 + 
      exp.length * 3 + 
      totalExpBullets + 
      proj.length * 3 + 
      totalProjBullets + 
      (achievementsState.filter(Boolean).length * 1.2) + 
      (skills.length * 1) + 
      4; // header spaces

    if (totalLines > 22) {
      warnings.push({ 
        type: 'overflow', 
        message: `Your resume size (${Math.round(totalLines)} line units) is highly likely to exceed 1 page. Reduce bullets or entries to stay under 1 page.`, 
        severity: 'warning' 
      });
      score -= 15;
    } else {
      successes.push('✓ Resume length fits comfortably on 1 page.');
    }

    // Achievements check
    const achCount = achievementsState.filter(Boolean).length;
    if (achCount === 0) {
      warnings.push({ type: 'achievements', message: 'Achievements list is empty.', severity: 'info' });
      score -= 5;
    } else {
      successes.push('✓ Achievements list included.');
    }

    return {
      score: Math.max(10, score),
      warnings,
      successes,
      totalLines
    };
  }, [watchAllFields, achievementsState]);

  // Draft Save (JSON)
  const saveDraft = () => {
    const data = watchAllFields;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'resumake-draft.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Draft Load (JSON)
  const loadDraft = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (files && files.length > 0) {
      fileReader.readAsText(files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          reset(parsed);
          if (parsed.achievements) {
            setAchievementsState(parsed.achievements);
          }
          setCompileError(null);
        } catch (err) {
          alert('Failed to parse draft JSON file. Ensure it is a valid Resumake JSON backup.');
        }
      };
    }
  };

  // PDF Generation Trigger
  const generatePDF = async () => {
    setCompiling(true);
    setCompileError(null);
    try {
      const payload = {
        ...watchAllFields,
        achievements: achievementsState
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json();
        setCompileError({
          error: errJson.error || 'Compilation Error',
          details: errJson.details || 'Unknown error occurred.',
          latexErrors: errJson.latexErrors,
          log: errJson.log
        });
        setPdfUrl(null);
      } else {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);

        // Auto trigger download
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', blobUrl);
        downloadAnchor.setAttribute('download', `${watchAllFields.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err: any) {
      console.error(err);
      setCompileError({
        error: 'Network / Server Error',
        details: err.message || 'Could not reach compilation server.'
      });
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090b10]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#f1f5f9] to-slate-400 bg-clip-text text-transparent">
                Resumake
              </h1>
              <p className="text-xs text-slate-500 font-medium">Production LaTeX PDF Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Save / Load Draft Buttons */}
            <button 
              onClick={saveDraft}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold hover:bg-slate-900 hover:border-slate-700 transition duration-200"
              title="Save current state to file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>
            <label 
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold hover:bg-slate-900 hover:border-slate-700 cursor-pointer transition duration-200"
              title="Restore state from backup"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load Backup</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={loadDraft} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Section Navigation */}
          <div className="lg:col-span-3 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">Resume Sections</h2>
            
            <button
              onClick={() => setActiveSection('personal')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition duration-200 ${
                activeSection === 'personal'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/20'
                  : 'bg-[#0f121d]/40 border-slate-900 text-slate-400 hover:bg-[#0f121d]/80 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4" />
                <span>Personal Details</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition ${activeSection === 'personal' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => setActiveSection('education')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition duration-200 ${
                activeSection === 'education'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/20'
                  : 'bg-[#0f121d]/40 border-slate-900 text-slate-400 hover:bg-[#0f121d]/80 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-4 h-4" />
                <span>Education</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition ${activeSection === 'education' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => setActiveSection('experience')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition duration-200 ${
                activeSection === 'experience'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/20'
                  : 'bg-[#0f121d]/40 border-slate-900 text-slate-400 hover:bg-[#0f121d]/80 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Briefcase className="w-4 h-4" />
                <span>Experience</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition ${activeSection === 'experience' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => setActiveSection('projects')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition duration-200 ${
                activeSection === 'projects'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/20'
                  : 'bg-[#0f121d]/40 border-slate-900 text-slate-400 hover:bg-[#0f121d]/80 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Code className="w-4 h-4" />
                <span>Projects</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition ${activeSection === 'projects' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => setActiveSection('skills')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition duration-200 ${
                activeSection === 'skills'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/20'
                  : 'bg-[#0f121d]/40 border-slate-900 text-slate-400 hover:bg-[#0f121d]/80 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Wrench className="w-4 h-4" />
                <span>Technical Skills</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition ${activeSection === 'skills' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => setActiveSection('achievements')}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition duration-200 ${
                activeSection === 'achievements'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-950/20'
                  : 'bg-[#0f121d]/40 border-slate-900 text-slate-400 hover:bg-[#0f121d]/80 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Award className="w-4 h-4" />
                <span>Achievements</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition ${activeSection === 'achievements' ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
            </button>
          </div>

          {/* MIDDLE: Form Section Content */}
          <div className="lg:col-span-5 bg-[#0f121d]/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                
                {/* 1. PERSONAL INFO SECTION */}
                {activeSection === 'personal' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Personal Details</h3>
                      <p className="text-xs text-slate-400">Your profile header details. URLs are auto-formatted securely.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Full Name</label>
                        <input 
                          {...register('personalInfo.fullName')} 
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="e.g. Biswajit Samal"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Location</label>
                        <input 
                          {...register('personalInfo.location')} 
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="e.g. Bhubaneswar, Odisha"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Phone Number</label>
                        <input 
                          {...register('personalInfo.phone')} 
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="e.g. +91 637-073-6410"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Email Address</label>
                        <input 
                          {...register('personalInfo.email')} 
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="e.g. 2025samalbiswajit@gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">GitHub Profile</label>
                        <input 
                          {...register('personalInfo.github')} 
                          onBlur={(e) => handleUrlBlur('github', e.target.value)}
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="github.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">LinkedIn Profile</label>
                        <input 
                          {...register('personalInfo.linkedin')} 
                          onBlur={(e) => handleUrlBlur('linkedin', e.target.value)}
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="linkedin.com/in/username"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Portfolio Website</label>
                        <input 
                          {...register('personalInfo.portfolio')} 
                          onBlur={(e) => handleUrlBlur('portfolio', e.target.value)}
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="e.g. my-portfolio.com"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">LeetCode Profile</label>
                        <input 
                          {...register('personalInfo.leetcode')} 
                          onBlur={(e) => handleUrlBlur('leetcode', e.target.value)}
                          className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                          placeholder="leetcode.com/username"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. EDUCATION SECTION */}
                {activeSection === 'education' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Education Details</h3>
                        <p className="text-xs text-slate-400">List colleges, schools, degrees, and dates.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => appendEdu({ school: '', location: '', degree: '', dates: '' })}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-indigo-550/15 shadow transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Entry</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {eduFields.map((field, idx) => (
                        <div key={field.id} className="relative p-4 border border-slate-800 bg-[#0a0c16]/40 rounded-xl space-y-4">
                          <button
                            type="button"
                            onClick={() => removeEdu(idx)}
                            className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition"
                            title="Remove Education entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <h4 className="text-xs font-bold text-indigo-400">Education #{idx + 1}</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">School / University</label>
                              <input 
                                {...register(`education.${idx}.school`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Silicon University"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
                              <input 
                                {...register(`education.${idx}.location`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Bhubaneswar, Odisha"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dates / Duration</label>
                              <input 
                                {...register(`education.${idx}.dates`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Sep 2023 -- Present"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Degree & Majors (with optional Grade)</label>
                              <input 
                                {...register(`education.${idx}.degree`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Bachelor of Technology in Computer Engineering (8.08/10)"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. EXPERIENCE SECTION */}
                {activeSection === 'experience' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Work Experience</h3>
                        <p className="text-xs text-slate-400">List internships, full-time jobs, and roles.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => appendExp({ company: '', role: '', location: '', dates: '', bullets: [''] })}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-indigo-550/15 shadow transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Job</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {expFields.map((field, expIdx) => (
                        <div key={field.id} className="relative p-4 border border-slate-800 bg-[#0a0c16]/40 rounded-xl space-y-4">
                          <button
                            type="button"
                            onClick={() => removeExp(expIdx)}
                            className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition"
                            title="Remove job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <h4 className="text-xs font-bold text-indigo-400">Job Entry #{expIdx + 1}</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company Name</label>
                              <input 
                                {...register(`experience.${expIdx}.company`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Codebeat"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Job Role / Title</label>
                              <input 
                                {...register(`experience.${expIdx}.role`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. MERN Stack Developer Intern"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location (Optional)</label>
                              <input 
                                {...register(`experience.${expIdx}.location`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Remote"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dates / Duration</label>
                              <input 
                                {...register(`experience.${expIdx}.dates`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. June 2024 -- July 2024"
                              />
                            </div>

                            {/* Experience Bullets list */}
                            <div className="col-span-2 space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-semibold text-slate-400">Description Bullets (Highly ATS-optimized)</label>
                                <button
                                  type="button"
                                  onClick={() => addExpBullet(expIdx)}
                                  className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-400 hover:text-white transition"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Bullet</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                {watchAllFields.experience[expIdx]?.bullets?.map((_, bulletIdx) => (
                                  <div key={bulletIdx} className="flex items-start space-x-2">
                                    <span className="text-slate-600 mt-2 text-xs">•</span>
                                    <textarea 
                                      {...register(`experience.${expIdx}.bullets.${bulletIdx}`)} 
                                      rows={2}
                                      className="flex-1 bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                      placeholder="Engineered scalable systems that improved API speed by 25%..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeExpBullet(expIdx, bulletIdx)}
                                      className="mt-2 p-1 text-slate-600 hover:text-red-450 hover:bg-slate-900 rounded transition"
                                      title="Delete bullet point"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. PROJECTS SECTION */}
                {activeSection === 'projects' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Key Projects</h3>
                        <p className="text-xs text-slate-400">Showcase technical projects with Github URLs.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => appendProj({ name: '', technologies: '', githubLink: '', dates: '', bullets: [''] })}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-indigo-550/15 shadow transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Project</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {projFields.map((field, projIdx) => (
                        <div key={field.id} className="relative p-4 border border-slate-800 bg-[#0a0c16]/40 rounded-xl space-y-4">
                          <button
                            type="button"
                            onClick={() => removeProj(projIdx)}
                            className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition"
                            title="Remove project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <h4 className="text-xs font-bold text-indigo-400">Project Entry #{projIdx + 1}</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Name</label>
                              <input 
                                {...register(`projects.${projIdx}.name`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. ShopFlow"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Technologies Stack</label>
                              <input 
                                {...register(`projects.${projIdx}.technologies`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. React 19, Express.js, Axios, Vitest"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">GitHub Repository Link</label>
                              <input 
                                {...register(`projects.${projIdx}.githubLink`)} 
                                onBlur={(e) => handleProjUrlBlur(projIdx, e.target.value)}
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="github.com/username/project"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dates / Duration (Optional)</label>
                              <input 
                                {...register(`projects.${projIdx}.dates`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Dec 2024"
                              />
                            </div>

                            {/* Project Bullets list */}
                            <div className="col-span-2 space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-semibold text-slate-400">Description Bullets (Start with active action verbs)</label>
                                <button
                                  type="button"
                                  onClick={() => addProjBullet(projIdx)}
                                  className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-400 hover:text-white transition"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Bullet</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                {watchAllFields.projects[projIdx]?.bullets?.map((_, bulletIdx) => (
                                  <div key={bulletIdx} className="flex items-start space-x-2">
                                    <span className="text-slate-600 mt-2 text-xs">•</span>
                                    <textarea 
                                      {...register(`projects.${projIdx}.bullets.${bulletIdx}`)} 
                                      rows={2}
                                      className="flex-1 bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                      placeholder="Engineered automated unit and integration testing workflows utilizing Vitest..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeProjBullet(projIdx, bulletIdx)}
                                      className="mt-2 p-1 text-slate-600 hover:text-red-450 hover:bg-slate-900 rounded transition"
                                      title="Delete bullet point"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. SKILLS SECTION */}
                {activeSection === 'skills' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Technical Skills</h3>
                        <p className="text-xs text-slate-400">Categorize your expertise (e.g. Languages, Databases, Tools).</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => appendSkill({ category: '', items: '' })}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-indigo-550/15 shadow transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Category</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {skillFields.map((field, idx) => (
                        <div key={field.id} className="flex items-end space-x-3 p-4 border border-slate-800 bg-[#0a0c16]/40 rounded-xl relative">
                          <button
                            type="button"
                            onClick={() => removeSkill(idx)}
                            className="absolute top-2 right-2 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-950 transition"
                            title="Remove Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="flex-1 grid grid-cols-3 gap-4 mt-2">
                            <div className="col-span-1">
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Category</label>
                              <input 
                                {...register(`skills.${idx}.category`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. Languages"
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Technologies (comma-separated)</label>
                              <input 
                                {...register(`skills.${idx}.items`)} 
                                className="w-full bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                                placeholder="e.g. JavaScript, Python, SQL"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. ACHIEVEMENTS SECTION */}
                {activeSection === 'achievements' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Achievements & Leadership</h3>
                        <p className="text-xs text-slate-400">List scholarships, hackathons, and certifications.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAchievementsState([...achievementsState, ''])}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-indigo-550/15 shadow transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Achievement</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {achievementsState.map((ach, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 bg-[#0a0c16]/20 border border-slate-850 rounded-xl">
                          <span className="text-indigo-550 font-bold text-xs mt-3">#{idx + 1}</span>
                          <textarea 
                            value={ach}
                            onChange={(e) => {
                              const list = [...achievementsState];
                              list[idx] = e.target.value;
                              setAchievementsState(list);
                            }}
                            rows={2}
                            className="flex-1 bg-[#0a0c16]/80 border border-slate-800 focus:border-indigo-500/50 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition text-white font-medium"
                            placeholder="e.g. Awarded Odisha State Scholarship for academic performance in board examinations"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = achievementsState.filter((_, i) => i !== idx);
                              setAchievementsState(list);
                            }}
                            className="mt-3 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Health Score, Warnings, and PDF Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* SCORE & HEALTH CARD */}
            <div className="bg-[#0f121d]/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center space-x-4 mb-6">
                {/* Glowing Score Circle Gauge */}
                <div className="relative w-18 h-18 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="36" cy="36" r="30" 
                      stroke="#1e293b" strokeWidth="6" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="36" cy="36" r="30" 
                      stroke={healthAnalysis.score >= 85 ? '#10b981' : healthAnalysis.score >= 70 ? '#f59e0b' : '#ef4444'} 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={188.4} 
                      strokeDashoffset={188.4 - (188.4 * healthAnalysis.score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-extrabold text-white">{healthAnalysis.score}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Health</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">ATS Health Audit</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time resume assessment score.</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      healthAnalysis.score >= 85 ? 'bg-emerald-500/15 text-emerald-400' : healthAnalysis.score >= 70 ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {healthAnalysis.score >= 85 ? 'Excellent' : healthAnalysis.score >= 70 ? 'Needs Tweaking' : 'Weak Build'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">~{Math.round(healthAnalysis.totalLines)} lines</span>
                  </div>
                </div>
              </div>

              {/* Success / Warning list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {healthAnalysis.warnings.map((warn, i) => (
                  <div key={i} className={`flex items-start space-x-2.5 p-2 rounded-xl text-xs ${
                    warn.severity === 'critical' 
                      ? 'bg-rose-500/5 text-rose-450 border border-rose-950/20' 
                      : warn.severity === 'warning' 
                      ? 'bg-amber-500/5 text-amber-450 border border-amber-950/20' 
                      : 'bg-indigo-500/5 text-indigo-400 border border-indigo-950/20'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{warn.message}</span>
                  </div>
                ))}

                {healthAnalysis.warnings.length === 0 && (
                  <div className="flex items-center space-x-2 p-3 bg-emerald-500/5 text-emerald-400 border border-emerald-950/30 rounded-xl text-xs">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">Your resume is perfectly optimized for ATS! Ready to compile.</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION CARD: COMPILE PDF */}
            <div className="bg-[#0f121d]/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Compiler & Downloads</span>
              </h3>
              
              <button
                type="button"
                onClick={generatePDF}
                disabled={compiling}
                className="w-full flex items-center justify-center space-x-2.5 py-4 bg-gradient-to-r from-indigo-600 via-indigo-550 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compiling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing XeLaTeX Engine...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Compile & Download PDF</span>
                  </>
                )}
              </button>

              {/* Compile Error View */}
              {compileError && (
                <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-red-400 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{compileError.error}</span>
                  </h4>
                  <p className="text-slate-400 leading-relaxed font-mono">{compileError.details}</p>
                  
                  {compileError.latexErrors && (
                    <div className="mt-2 space-y-1">
                      <p className="font-semibold text-red-300">Detailed LaTeX errors:</p>
                      <pre className="p-2 bg-black/60 rounded font-mono text-[10px] text-red-400 overflow-x-auto whitespace-pre-wrap leading-normal">
                        {compileError.latexErrors}
                      </pre>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500">
                    Tip: Check for nested brackets, special unescaped math items, or broken links inside your text details.
                  </p>
                </div>
              )}

              {/* Preview PDF Block */}
              {pdfUrl && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-950/30 rounded-xl flex items-center justify-between text-xs text-emerald-400">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">PDF compiled successfully!</span>
                  </div>
                  <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center space-x-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Tab</span>
                  </a>
                </div>
              )}
            </div>

            {/* PREVIEW CONTAINER */}
            {pdfUrl && (
              <div className="bg-[#0f121d]/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interactive PDF Viewer</span>
                  <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-slate-500 font-bold">1 Page</span>
                </div>
                
                <div className="border border-slate-800 bg-[#06070a] rounded-xl overflow-hidden shadow-inner h-96 relative">
                  <iframe 
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                    className="w-full h-full border-none"
                    title="Compiled PDF Resume Preview"
                  />
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-[#06070a] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Resumake Resume System © 2026.</span>
            <span className="text-slate-700">|</span>
            <span className="font-medium text-slate-400">Bespoke LaTeX Rendering</span>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="hover:text-slate-400 transition cursor-default">Privacy</span>
            <span className="hover:text-slate-400 transition cursor-default">Terms</span>
            <span className="hover:text-slate-400 transition cursor-default">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
