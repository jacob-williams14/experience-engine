# Experience Bank — Index

> Generated view of `claims.yaml` (the source of truth). Do not edit by hand — run `bun run buildBankIndex`. ★ = featured · ⚓ = hook.

**56 claims** across 5 domains — 16 featured, 9 hooks.

## global leadership-development / education (17)

- ★ ⚓ Architected a headless-CMS integration connecting a Laravel backend to Contentful's delivery APIs for a module-based learning platform, using OPIS JSON Schema validation…  _(Laravel, Contentful, JSON Schema, PHP)_  `edu-headless-cms`
- ★ Owned internationalization end to end for a worldwide user base, translating international stakeholder requirements into API design, content-model architecture, and localized UI  _(Laravel, Contentful, i18n)_  `edu-i18n`
- ★ ⚓ Architected a headless-CMS integration connecting a Laravel/PHP backend to Contentful's delivery API, with content-model mapping for posts, topics, categories, and featured content,…  _(Laravel, PHP, Contentful)_  `edu2-headless-cms-integration`
- ★ Built end-to-end internationalization including a language-selector with dynamic routing, seamless switching, translated navigation/footer, a v2 API for localized content, and language-aware content…  _(React, JavaScript)_  `edu2-i18n-language-selector`
- Established testing infrastructure with PHPUnit and Dusk (headless ChromeDriver in CI), improving deployment reliability and code quality across the team  _(PHPUnit, Dusk, CI/CD)_  `edu-testing-infra`
- Designed dynamic content-parsing logic for sophisticated relationships between CMS content types and the application layer, with caching and API optimization for scalable…  _(Laravel, Contentful, REST API)_  `edu-content-parsing`
- Led Docker containerization for a companion learning platform, building a multi-application environment that ran several apps concurrently without port conflicts  _(Docker)_  `edu2-containerization`
- Migrated content infrastructure from a legacy system to Contentful, enabling dynamic multi-language delivery of blogs, articles, and podcasts for post-curriculum development  _(Contentful)_  `edu2-cms-migration`
- Designed Contentful content models defining structures for modules, tools, videos, commitments, and breakout sessions to power dynamic, locale-aware experiences  _(Contentful)_  `edu-content-modeling`
- Built reusable React components (language selectors, navigation) with responsive design and accessibility improvements including color-contrast fixes and semantic HTML  _(React, JavaScript)_  `edu-accessible-react-ui`
- Designed asset-hashing and cache-busting strategies to optimize build output across development and production environments  _(Laravel, Heroku)_  `edu-build-asset-hashing`
- Translated requirements from content creators and international stakeholders into Contentful models, and led code reviews and mentoring around CMS and internationalization integration  _(Contentful)_  `edu-cross-functional-cms`
- Systematically refactored a React front-end from class to functional components, improving maintainability and performance and optimizing cross-component data flow and state management  _(React, JavaScript)_  `edu2-react-modernization`
- Delivered UX features including a favorites system with real-time updates and persistent state, post categorization and filtering, and topic-based content navigation  _(React, JavaScript)_  `edu2-favorites-feature`
- Grew from an entry-level developer into a contributor with emerging technical leadership, owning architecture decisions and testing strategy while collaborating across design,…  `edu2-growth-leadership`
- Improved a Docker-based dev environment (PostgreSQL, Redis) and wrote setup documentation that accelerated team onboarding  _(Docker, PostgreSQL, Redis)_  `edu-docker-env`
- Refactored the browser test suite and standardized the PHPUnit/Node runtime across dev and production  _(PHPUnit, Node.js)_  `edu2-testing`

## healthcare / clinical (11)

- ★ Built a PayloadCMS platform for a kinesiology practice managing client health histories and movement evaluations, architecting collection structures for hundreds of interconnected…  _(PayloadCMS, TypeScript)_  `health-payload-platform`
- ★ ⚓ Solved form-composition problems unique to multi-session clinical evaluations — autosave with live draft management, conditional field visibility that preserved data relationships, and…  _(PayloadCMS, TypeScript, React)_  `health-clinical-forms`
- ★ Kept the platform stable through a PayloadCMS beta-to-stable migration (v109 to v116 to release), maintaining data integrity across breaking upgrades while adding…  _(PayloadCMS, RBAC)_  `health-migration-stability`
- ★ ⚓ Solved hard state-management problems for very large clinical forms, building data persistence across a multi-tab evaluation interface so practitioners could move between…  _(PayloadCMS, React, TypeScript, Next.js)_  `health-multitab-persistence`
- Designed auto-population that cut duplicate data entry by pre-filling client fields and seeding result types from test categories, streamlining practitioner workflows  _(PayloadCMS)_  `health-autopopulation`
- Built end-to-end client lifecycle management (creation, viewing, editing, rich note-taking) as the cornerstone workflow for the clinical evaluation platform  _(PayloadCMS, React, Next.js, TypeScript, MongoDB)_  `health-client-crud-platform`
- Modeled complex relationships across clients, evaluations, individual movement tests, and training data, plus configurable test types with dynamic result typing  _(MongoDB, PayloadCMS, TypeScript)_  `health-relational-modeling`
- Designed baseline-and-follow-up tracking linking initial exams to later reassessments, enabling longitudinal comparison of a client's results over time  _(PayloadCMS, MongoDB, TypeScript)_  `health-baseline-followup`
- Built filtering, sorting, and logical grouping for a catalog of hundreds of assessments, letting clinicians navigate and select tests efficiently during evaluations  _(React, Next.js, TypeScript, PayloadCMS)_  `health-large-catalog-search`
- Developed custom dropdown components and form controls to meet specific clinical workflow needs while staying compatible with the underlying CMS framework  _(React, TypeScript, PayloadCMS)_  `health-custom-form-controls`
- ⚓ Worked directly across engineering, clinical, and business stakeholders to translate real-world kinesiology and physiology evaluation workflows into software, incorporating user-testing feedback iteratively  `health-clinical-collaboration`

## retail / consumer mobile (13)

- ★ Stepped into co-technical lead mid-project on a greenfield React Native mobile ordering app for a national coffee chain, balancing hands-on feature work…  _(React Native, Expo, TypeScript)_  `mobile-cotech-lead`
- ★ ⚓ Drove Stripe payment integration across multiple methods (cards, mobile pay, digital gift cards) in a React Native/Expo app, coordinating with GraphQL and…  _(Stripe, React Native, GraphQL, REST)_  `mobile-payments`
- ★ ⚓ Built a mobile authentication system with a robust refresh-token flow, automatic retry logic, and secure token storage, plus a guest mode with…  _(React Native, TypeScript, Expo)_  `mobile-auth-token-refresh`
- ★ ⚓ Built a hierarchical menu and ordering system with product customization (sizes, add-ons), full cart management, and a three-step checkout spanning cart, pickup,…  _(React Native, TypeScript)_  `mobile-menu-ordering-cart`
- Built the project's CI/CD foundation from scratch with EAS Build and GitHub Actions — automated iOS/Android builds, multi-environment deploys, and TestFlight/Play Console…  _(EAS Build, GitHub Actions, CI/CD)_  `mobile-cicd`
- Led proactive tech-debt remediation including an Expo SDK 53 migration with breaking-change resolution and routing/repository restructuring that improved team velocity  _(Expo, React Native)_  `mobile-techdebt`
- Turned a brand refresh into a reusable TypeScript component library with Tailwind styling that kept the UI consistent across iOS and Android  _(TypeScript, Tailwind CSS)_  `mobile-design-system`
- Architected integration patterns spanning both GraphQL and REST endpoints, with consistent error handling across mixed backend protocols  _(GraphQL, REST, TypeScript, React Native)_  `mobile-graphql-rest-integration`
- Designed the app's state-management architecture covering cart persistence, authentication, and store selection  _(React Native, TypeScript, React Hooks)_  `mobile-state-architecture`
- Designed store-selection and geolocation features including a bottom-sheet store picker, dynamic filtering by hours and online-ordering availability, and pickup options like drive-through  _(React Native, TypeScript)_  `mobile-store-selection-location`
- Diagnosed and resolved a complex iOS password-manager autofill bug that caused double-login, along with other iOS-specific UX inconsistencies  _(React Native, Expo)_  `mobile-ios-autofill-bug`
- Established testing and validation for pricing calculations and tax-rate implementations across multiple store locations, exercising payment-method edge cases  _(React Native)_  `mobile-pricing-tax-testing`
- Communicated technical progress and trade-offs to non-technical stakeholders while leading code reviews and mentoring teammates on React Native best practices  _(React Native)_  `mobile-stakeholder-mentoring`

## state judicial / government finance (12)

- ★ ⚓ Built a consent-based payment-reminder system for a statewide court finance platform, designing token-based correlation between the finance and reminders subsystems so citizens…  _(.NET/C#, Twilio, SendGrid, SQL)_  `courts-payment-reminders`
- ★ Grew from UI features and defect fixes to designing REST endpoints and data models for payment plan reminders, progressively owning end-to-end delivery…  _(Angular, .NET/C#, SQL)_  `courts-growth-fullstack`
- Enforced single-active-version governance across a statewide court forms ecosystem with database constraints and UX guardrails that prevented configuration drift in document templates…  _(SQL, Angular)_  `courts-form-governance`
- Packaged and shipped a reusable forms component library as an NPM package with an Azure DevOps pipeline, letting other applications adopt standardized…  _(NPM, Azure DevOps, CI/CD)_  `courts-forms-library`
- Built a party-records case search experience with tenant and party inputs and a selectable, horizontally-scrollable results table with client-side pagination and batch-enable…  _(Angular, TypeScript)_  `courts-case-search-table`
- Developed Auto-Case-Numbering safeguards with cancellation prompts and confirmation modals, consistent keyboard and focus handling, and corrected copy and date handling to reduce…  _(Angular, TypeScript)_  `courts-auto-case-numbering`
- Standardized dialog accessibility across the UI, normalizing escape-to-close and click-outside behaviors and tightening focus management for modal controls  _(Angular, Material Design)_  `courts-accessibility-modals`
- Diagnosed and fixed UTC-versus-local date defects and implemented a server-derived current-date function for accurate document date population, improving correctness  _(Angular, TypeScript, .NET/C#)_  `courts-timezone-date-fixes`
- Built form-template PDF preview and drafting workflows, customizing an extended PDF viewer with preloaded version PDFs, progress overlays, error surfacing, and save-to-draft…  _(Angular, ngx-extended-pdf-viewer)_  `courts-pdf-viewer`
- Implemented legacy-aware document rendering and deep-link routing with draft and document-display routes and proper 404 handling to keep older and newer systems…  _(Angular, TypeScript)_  `courts-legacy-doc-routing`
- Introduced a structured QA process template that standardized testing across the team and tightened alignment between designs and delivered features  `courts-qa-process`
- Partnered closely with designers to deliver UI in tight alignment with Figma specifications, improving usability and stakeholder trust  _(Figma, Angular)_  `courts-figma-collaboration`

## working style / approach (3)

- ★ Approaches problems by generating several paths to a goal and tracing them to root cause — drawn to diagnosing and fixing what…  `style-problem-solving`
- ★ Takes initiative and makes the call others hesitate on; a calming presence in tense moments who thinks several steps ahead, trusted to…  `style-leadership-initiative`
- Mentors and teaches naturally, getting to know people personally and helping them grow; connects facts and events to reason from cause to…  `style-mentoring-connection`
