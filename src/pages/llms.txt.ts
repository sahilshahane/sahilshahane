import type { APIRoute } from 'astro';

// Emits /llms.txt (https://llmstxt.org): a Markdown summary of the site for AI
// tools. The spec allows it in a subpath, which is all we have under /~sahilshahane/.
// Hand-written from the home page sections, so update it when they change.
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const body = `# Sahil Shahane

> Software engineer at IIT Bombay working a layer below the product: billing systems, authentication, Kubernetes controllers, build tooling and systems programming in Rust and Go.

Previously at Outpost Innovations (billing, auth, Kubernetes), Sagitec Solutions (internal tooling on .NET Core) and Boossti (frontend, CI/CD). Contact: sahilpshahane123@gmail.com.

## Site

- [Home](${url('')}): Profile, experience, projects, skills and contact
- [Experience](${url('#work')}): Roles at IIT Bombay, Sagitec Solutions, Outpost Innovations and Boossti
- [Projects](${url('#projects')}): Open source work and side projects

## Experience

- [IIT Bombay](https://www.cse.iitb.ac.in/): Software Engineer, Aug 2025 to present; Next.js, React, Django
- [Sagitec Solutions](https://www.sagitec.com/en-us/): Engineer I intern, Jun 2024 to Apr 2025; flowchart editor for internal tooling on a .NET Core + EF Core API
- [Outpost Innovations](https://outpost.run/): Software Engineer intern, Feb 2023 to Jun 2024; built the Stripe billing system for 6+ products (recovered 1.6% of revenue), designed RBAC and OAuth 2.0 / OIDC auth, wrote Go Kubernetes controllers for CPU and GPU usage
- Boossti: Frontend Developer intern, Jul 2022 to Dec 2022; migrated to TypeScript, cut CI/CD build time by 80%

## Projects

- [Jenga Icons](https://github.com/outpostHQ/jengaicons): Icon library with 2,100+ icons for multiple web frameworks; 10x smaller bundles, 1.5x faster builds
- [Redis, in Rust](https://github.com/sahilshahane/valkey-rust): Key-value database written from scratch, with the RESP protocol, storage engine and event loop

## Profiles

- [GitHub](https://github.com/sahilshahane)
- [LinkedIn](https://linkedin.com/in/sahilshahane)
- [Résumé (PDF)](https://drive.google.com/file/d/1sKMw3bHdF0yt8C6r2aRPM7vS26wqnb0c/view?usp=drive_link)

## Optional

- [Rock Paper Scissors](https://rock-paper-scissors-sahilbest999.vercel.app/): Small typed Next.js game
- [Snake](https://sahilshahane.github.io/Snake-Game/index.html): Snake on a canvas with p5.js
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
