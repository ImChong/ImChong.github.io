# User Profile — Chong Liu (刘冲)

## Identity

- **Name:** Chong Liu (刘冲)
- **Role:** Robot Control Engineer
- **Location:** Shenzhen, Guangdong, China
- **Email:** chongliu2021@163.com
- **GitHub:** https://github.com/ImChong
- **Google Scholar:** https://scholar.google.com/citations?user=-VDCGIwAAAAJ
- **Personal Site:** https://imchong.github.io

## Background

M.S. Mechanical Engineering (Robotics & Control) from Columbia University (GPA 3.78), B.S. Mechanical Engineering Summa Cum Laude from Miami University (GPA 3.91). Private helicopter pilot certified. Undergraduate research focused on micro-EDM machining; graduate and career pivot into robotics, motion control, reinforcement learning, and humanoid robots.

Currently at **BridgeDP Robotics** (Feb 2025–present), training and deploying RL/IL motion control policies for client humanoid robots. The core technical domain is humanoid robot locomotion: policy training in simulation, Sim2Real transfer, and real-world deployment.

## Core Technical Skills

**Primary:** Reinforcement Learning (RL), Imitation Learning (IL), motion control, Sim2Real transfer, humanoid robot locomotion, MuJoCo simulation, ONNX inference, robot kinematics (parallel structure solvers)

**Secondary:** Embedded C/C++ firmware (three-layer MCU architecture), Python, Vue 3, WebAssembly, Vite, Three.js, CAD (Fusion 360), mechatronics

**Tools & Frameworks:** Isaac Lab / IsaacGym (implied by RL workflow), MuJoCo, ONNX Runtime, Git, GitHub Actions

## Work Experience

### BridgeDP Robotics Co., Ltd. — Robot Control Engineer
**Feb 2025 – Present · Shenzhen, China**

BridgeDP builds the "cerebellum" (motion control) for humanoid, quadruped, and wheeled robots. Core product: BridgeDP Engine — RL-based motion control using high-precision mocap data.

- Trains RL + IL motion control policies for client humanoid robots (varied morphologies: bipedal, humanoid, quadruped)
- Handles full pipeline: policy design → simulation training → Sim2Real transfer → real robot deployment
- Implemented a **universal parallel-structure solver** enabling bidirectional motor↔joint space conversion (position, velocity, torque) across all supported mechanisms
- Refactored deployment code workflow: reduced single-deployment development time from ~1 day → **1–2 hours**

### Shenzhen Huikon Electric Technology Co., Ltd. — Co-founder & Technical Lead
**Jan 2024 – Jan 2025 · Shenzhen, China**

Hardware startup building high-pressure solenoid proportional valves for industrial laser cutting machines.

- Led R&D from design to prototype: broke through pneumatic control ceiling to **2.5 MPa** (industry-leading)
- Managed tolerance control, iterative production data analysis, supplier screening, and quality monitoring
- Built cross-department collaboration processes (hardware, PCB, sales teams)

### Huawei Technologies Co., Ltd. — Embedded Software Engineer
**Dec 2021 – Jan 2024 · Shenzhen, China**
Department: Central Hardware Engineering Institute — 2012 Lab, Electromechanical Engineering Dept.

- Developed and maintained **UniMOP** firmware (three-layer: App / Adapter / Port) shared across 10+ fan box product types; contributed **10,000+ lines** of production code
- Led full-process upgrade of Galileo fan box (flagship optical access product): restructured 8-fan unified control into **4 independent pairwise-controlled modules** with partitioned temperature management; resolved local overheating under high load
- Built team documentation system from scratch: **70+ technical documents**; introduced centralized file/version management that eliminated version confusion and delivery delays

## Projects

| Project | Stack | Description |
|---|---|---|
| [Humanoid Robot Learning Paper Notebooks](https://imchong.github.io/Humanoid_Robot_Learning_Paper_Notebooks/) | Markdown, GitHub Pages | Curated RL/IL/motion control paper reading notes for humanoid robots |
| [Robotics Tech Stack](https://imchong.github.io/Robotics_Notebooks/) | Markdown, GitHub Pages | Full-stack robotics knowledge map: motion control → RL → IL → perception → deployment |
| [RL Sim2Sim Demo Website](https://imchong.github.io/RL_Sim2Sim_Demo_Website/) | Vue 3, Vite, MuJoCo WASM, ONNX Runtime, Three.js | Browser-based humanoid robot RL policy inference demo; no local install needed |
| Proportional Control Valve | CAD (Fusion 360), Mechatronics | Designed & manufactured pneumatic proportional control valve; kinematic analysis, tolerance stack-up, spring characterization |

## Research & Publications

All on Google Scholar: https://scholar.google.com/citations?user=-VDCGIwAAAAJ

**Robotics (primary focus):**
1. **Fourier Analysis Guided Cable Actuator Design for Coordinated Walking Assistance** — Chong Liu, Rand Hidayah, Sunil Agrawal — ASME IDETC/CIE, August 2021. Cable-driven exoskeleton actuator reduction via Fourier analysis of walking assistance requirements.

**Manufacturing / Micro-EDM (undergraduate research, 7 publications, 2018–2019):**
2. Machining of High Aspect Ratio Micro-Holes on Ti-6Al-4V Using Silver Nanopowder Mixed Micro-EDM — ASME IMECE 2019. Cited ×11.
3. Micro-EDM Machinability of Bulk Metallic Glass — ASME IMECE 2019. Cited ×2.
4. Effect of Conductive Coatings on Micro-EDM of Aluminum Nitride Ceramic — Materials, MDPI, Vol. 12(20), 2019. Cited ×35.
5. Micro-EDM Crater Sizes of Bulk Metallic Glass: Experiment & Simulation — Procedia Manufacturing, Elsevier, Vol. 34, 2019. Cited ×34.
6. Powder Mixed Micro-EDM of Aluminium Nitride Ceramic — MATEC Web of Conferences, Vol. 303, 2019. Cited ×5.
7. Optimization of Electric Discharge Machining Based Processes — Springer, June 2019. Cited ×2.
8. Micro-Wire-EDM — Micro-EDM Processes, Springer, December 2018. Cited ×9.

## Honors & Awards

- **HUAWEI Future Star** — Huawei Technologies, March 2023
- **Featured on Columbia Engineering YouTube** — Creature 2 Robot project, 2020
- **Summa Cum Laude** — Miami University, May 2019
- **Best Presentation Award** — ASME Dayton Engineering Science Symposium (DESS), November 2018
- **Featured Undergraduate Researcher** (Micro-EDM of Bulk Metallic Glass) — Miami University CEC, August 2018
- **Dean's List** (7 semesters) — Miami University, 2016–2018

## Current Focus & Interests

- Humanoid robot locomotion: RL/IL policy training, Sim2Real, whole-body control
- Building open knowledge resources for the robotics community (paper notes, tech stack navigation, interactive demos)
- Full-stack robotics engineering: from low-level kinematics/control to high-level planning and deployment
