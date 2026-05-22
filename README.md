# Resumake 📄💫

Resumake is a production-grade, high-fidelity resume builder web application built on **Next.js 16**, **React Hook Form**, and **XeLaTeX**. It allows developers to create beautiful, ATS-optimized resumes that compile instantly into machine-readable PDFs.

---

## 🚀 Key Features

* **Vercel-Inspired Dark Slate UI**: High-density responsive workspace design with smooth transitions.
* **Real-time ATS Health Score circular gauge**: Automatically scores resume completeness and provides actionable advice.
* **Smart Warning System**: Instant alerts for overcrowded skills, page overflow estimation, and overly long bullet points.
* **Automated Link Cleaners**: Validates, sanitizes, and structures social profiles (GitHub, LinkedIn, LeetCode) cleanly.
* **Raw PDF Iframe Preview**: Instantly renders compiled PDF updates directly inside the browser using a high-fidelity LaTeX renderer.
* **Draft Backup Management**: Save drafts locally as JSON files and load them back to resume editing at any time.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
* **Forms & Validation**: React Hook Form, Zod.
* **Compilation Backend**: Next.js API Routes, Node.js `child_process` compiler pipeline.
* **LaTeX Engine**: TinyTeX (XeLaTeX compiler).

---

## 💻 Local Setup & Run

### 1. Prerequisites
Ensure you have **Node.js** and a local **LaTeX compiler** (specifically XeLaTeX) installed.

For a lightweight local LaTeX environment (TinyTeX):
```powershell
# Windows PowerShell (installs to C:\ProgramData\TinyTeX)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://yihui.org/tinytex/install-bin-windows.ps1'))
```
Ensure required packages are present:
```powershell
& "C:\ProgramData\TinyTeX\bin\windows\tlmgr.bat" install tools fontaxes mweights roboto fancyhdr fullpage preprint enumitem titlesec marvosym
```

### 2. Run Next.js Server
```bash
# Install dependencies
npm install

# Run build verification
npm run build

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your local workspace.

---

## ☁️ Cloud Deployment Guidelines (Vercel vs. Containerized VPS)

### ⚠️ The Vercel Serverless Constraint
Vercel's serverless function environments are lightweight, stateless micro-VMs. They **do not** include native command-line applications like `xelatex` or the LaTeX package libraries. If you deploy this project as-is directly to Vercel, the `/api/generate` route will throw errors since the host system has no compiler.

### 🌟 Recommended: Containerized Deployments (Railway, Render, Fly.io)
This project is pre-configured with a **production Dockerfile** that sets up a full Node.js environment, installs XeLaTeX and LaTeX extra tools, and exposes the Next.js port automatically.

To deploy on **Railway** or **Render**:
1. Push this repository to **GitHub**.
2. Create a new service on Railway or Render, connecting it to your GitHub repository.
3. The platform will automatically detect the `Dockerfile`, build the container, install the LaTeX engine, and expose the Next.js site. The compiler API will work out-of-the-box seamlessly!
