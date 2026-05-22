import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execAsync = promisify(exec);

// Find xelatex executable path
async function getXelatexPath(): Promise<string> {
  const programDataPath = 'C:\\ProgramData\\TinyTeX\\bin\\windows\\xelatex.exe';
  try {
    await fs.access(programDataPath);
    return `"${programDataPath}"`;
  } catch {
    // If not in ProgramData, check AppData Roaming
    const appDataPath = path.join(process.env.APPDATA || '', 'TinyTeX', 'bin', 'windows', 'xelatex.exe');
    try {
      await fs.access(appDataPath);
      return `"${appDataPath}"`;
    } catch {
      // Fallback to system xelatex
      return 'xelatex';
    }
  }
}

// LaTeX escape function
function escapeLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

export async function POST(req: NextRequest) {
  let tempDir = '';
  try {
    const data = await req.json();

    // 1. Generate the LaTeX content
    const latexContent = generateLatex(data);

    // 2. Create a unique temporary directory
    const randId = Math.random().toString(36).substring(2, 10);
    // On Windows, temp folders in UserProfile contain spaces and tildes (~), which breaks XeLaTeX command parsing.
    // We target C:\ProgramData on Windows as a safe, space-free, tilde-free alternative.
    const isWindows = process.platform === 'win32';
    tempDir = isWindows 
      ? `C:\\ProgramData\\resumake-temp-${randId}`
      : path.join(os.tmpdir(), `resumake-${randId}`);
    await fs.mkdir(tempDir, { recursive: true });

    const texFilePath = path.join(tempDir, 'resume.tex');
    const pdfFilePath = path.join(tempDir, 'resume.pdf');
    const logFilePath = path.join(tempDir, 'resume.log');

    // 3. Write the LaTeX content to the .tex file
    // Write as UTF-8
    await fs.writeFile(texFilePath, latexContent, 'utf-8');

    // 4. Resolve the xelatex path
    const xelatexPath = await getXelatexPath();

    // 5. Run xelatex compiler
    // We execute it inside the temp folder so any auxiliary files are generated there
    const cmd = `${xelatexPath} -interaction=nonstopmode -output-directory="${tempDir}" "${texFilePath}"`;

    try {
      await execAsync(cmd, { cwd: tempDir, timeout: 30000 }); // 30s timeout
    } catch (execErr: any) {
      // If compiler failed, let's extract the log to explain why
      let logContent = 'No log file found.';
      try {
        logContent = await fs.readFile(logFilePath, 'utf-8');
        // Extract LaTeX errors (lines starting with ! or containing warning/error info)
        const errorLines = logContent
          .split('\n')
          .filter(line => line.startsWith('!') || line.includes('Error') || line.includes('Fatal error'))
          .slice(0, 10)
          .join('\n');
        
        return NextResponse.json(
          {
            error: 'LaTeX Compilation Failed',
            details: execErr.message,
            latexErrors: errorLines || 'Check full log in raw compilation output.',
            log: logContent.slice(-4000) // return last 4000 chars of log for debug
          },
          { status: 422 }
        );
      } catch {
        return NextResponse.json(
          {
            error: 'LaTeX Compilation Failed and Log could not be read.',
            details: execErr.message
          },
          { status: 500 }
        );
      }
    }

    // 6. Read generated PDF
    const pdfBuffer = await fs.readFile(pdfFilePath);

    // 7. Clean up the temp directory asynchronously
    // We don't block the response for cleanup
    fs.rm(tempDir, { recursive: true, force: true }).catch(err => {
      console.error('Error cleaning up temp directory:', err);
    });

    // 8. Return PDF as binary download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (err: any) {
    console.error('Request error:', err);
    // Cleanup if directory was created
    if (tempDir) {
      fs.rm(tempDir, { recursive: true, force: true }).catch(cleanupErr => {
        console.error('Cleanup error in catch:', cleanupErr);
      });
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}

function generateLatex(data: any): string {
  const personalInfo = data.personalInfo || {};
  const education = data.education || [];
  const experience = data.experience || [];
  const projects = data.projects || [];
  const skills = data.skills || [];
  const achievements = data.achievements || [];

  // Personal Info Block
  const name = personalInfo.fullName ? `\\textbf{\\Huge \\scshape ${escapeLatex(personalInfo.fullName)}}` : '';
  
  const contactDetails: string[] = [];
  if (personalInfo.location) contactDetails.push(escapeLatex(personalInfo.location));
  if (personalInfo.phone) contactDetails.push(escapeLatex(personalInfo.phone));
  if (personalInfo.email) {
    contactDetails.push(`\\href{mailto:${personalInfo.email}}{\\underline{${escapeLatex(personalInfo.email)}}}`);
  }
  
  const socialDetails: string[] = [];
  if (personalInfo.github) {
    const rawGit = personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
    socialDetails.push(`\\href{${personalInfo.github}}{\\underline{github.com/${escapeLatex(rawGit)}}}`);
  }
  if (personalInfo.linkedin) {
    const rawIn = personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '');
    socialDetails.push(`\\href{${personalInfo.linkedin}}{\\underline{linkedin.com/in/${escapeLatex(rawIn)}}}`);
  }
  if (personalInfo.portfolio) {
    const rawPort = personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/i, '');
    socialDetails.push(`\\href{${personalInfo.portfolio}}{\\underline{${escapeLatex(rawPort)}}}`);
  }
  if (personalInfo.leetcode) {
    const rawLeet = personalInfo.leetcode.replace(/^https?:\/\/(www\.)?leetcode\.com\//i, '');
    socialDetails.push(`\\href{${personalInfo.leetcode}}{\\underline{leetcode.com/${escapeLatex(rawLeet)}}}`);
  }

  const contactLine = contactDetails.length > 0 ? contactDetails.join(' $|$ ') : '';
  const socialLine = socialDetails.length > 0 ? socialDetails.join(' $|$ ') : '';

  let personalBlock = '\\begin{center}\n';
  if (name) personalBlock += `    ${name} \\\\ \\vspace{1pt}\n`;
  if (contactLine) personalBlock += `    \\small ${contactLine}`;
  if (socialLine) {
    if (contactLine) personalBlock += ' $|$\n    ';
    personalBlock += `${socialLine}\n`;
  } else {
    personalBlock += '\n';
  }
  personalBlock += '\\end{center}';

  // Education Section
  let educationBlock = '';
  if (education && education.length > 0) {
    educationBlock += '\\section{Education}\n\\resumeSubHeadingListStart\n';
    for (const edu of education) {
      if (edu.school || edu.degree) {
        educationBlock += `    \\resumeSubheading\n`;
        educationBlock += `      {${escapeLatex(edu.school || '')}}{${escapeLatex(edu.location || '')}}\n`;
        educationBlock += `      {${escapeLatex(edu.degree || '')}}{${escapeLatex(edu.dates || '')}}\n`;
      }
    }
    educationBlock += '\\resumeSubHeadingListEnd\n';
  }

  // Experience Section
  let experienceBlock = '';
  if (experience && experience.length > 0) {
    experienceBlock += '\\section{Experience}\n\\resumeSubHeadingListStart\n';
    for (const exp of experience) {
      if (exp.company || exp.role) {
        const loc = exp.location ? escapeLatex(exp.location) : '';
        experienceBlock += `    \\resumeSubheading\n`;
        experienceBlock += `      {${escapeLatex(exp.role || '')}}{${escapeLatex(exp.dates || '')}}\n`;
        experienceBlock += `      {${escapeLatex(exp.company || '')}}{${loc}}\n`;
        if (exp.bullets && exp.bullets.length > 0) {
          experienceBlock += `      \\resumeItemListStart\n`;
          for (const bullet of exp.bullets) {
            if (bullet && bullet.trim()) {
              experienceBlock += `        \\resumeItem{${escapeLatex(bullet)}}\n`;
            }
          }
          experienceBlock += `      \\resumeItemListEnd\n`;
        }
      }
    }
    experienceBlock += '\\resumeSubHeadingListEnd\n';
  }

  // Projects Section
  let projectsBlock = '';
  if (projects && projects.length > 0) {
    projectsBlock += '\\section{Projects}\n\\resumeSubHeadingListStart\n';
    for (const proj of projects) {
      if (proj.name) {
        let title = escapeLatex(proj.name);
        if (proj.githubLink) {
          title += ` $|$ \\normalfont{\\href{${proj.githubLink}}{\\underline{GitHub}}}`;
        }
        const tech = proj.technologies ? escapeLatex(proj.technologies) : '';
        const dates = proj.dates ? escapeLatex(proj.dates) : '';
        
        projectsBlock += `    \\resumeSubheading\n`;
        projectsBlock += `      {${title}}{${dates}}\n`;
        projectsBlock += `      {${tech}}{}\n`;
        if (proj.bullets && proj.bullets.length > 0) {
          projectsBlock += `      \\resumeItemListStart\n`;
          for (const bullet of proj.bullets) {
            if (bullet && bullet.trim()) {
              projectsBlock += `        \\resumeItem{${escapeLatex(bullet)}}\n`;
            }
          }
          projectsBlock += `      \\resumeItemListEnd\n`;
        }
      }
    }
    projectsBlock += '\\resumeSubHeadingListEnd\n';
  }

  // Skills Section
  let skillsBlock = '';
  const validSkills = skills.filter((s: any) => s.category && s.items);
  if (validSkills.length > 0) {
    skillsBlock += '\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n';
    for (const skill of validSkills) {
      skillsBlock += `     \\textbf{${escapeLatex(skill.category)}}{: ${escapeLatex(skill.items)}} \\\\\n`;
    }
    // Remove the trailing double backslash
    if (skillsBlock.endsWith(' \\\\\n')) {
      skillsBlock = skillsBlock.slice(0, -4) + '\n';
    }
    skillsBlock += '    }}\n \\end{itemize}\n';
  }

  // Achievements Section
  let achievementsBlock = '';
  const validAchievements = achievements.filter((a: string) => a && a.trim());
  if (validAchievements.length > 0) {
    achievementsBlock += '\\section{Achievements \\& Leadership}\n\\resumeItemListStart\n';
    for (const ach of validAchievements) {
      achievementsBlock += `    \\resumeItem{${escapeLatex(ach)}}\n`;
    }
    achievementsBlock += '\\resumeItemListEnd\n';
  }

  return `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}

%----------FONT OPTIONS----------
\\usepackage[sfdefault]{roboto}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-0.6in}
\\addtolength{\\textheight}{1.2in}
\\setlength{\\footskip}{12pt}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

${personalBlock}

${educationBlock}

${experienceBlock}

${projectsBlock}

${skillsBlock}

${achievementsBlock}

\\end{document}
`;
}
