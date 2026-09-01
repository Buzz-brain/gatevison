# GATEVISION: AI-POWERED VEHICLE ACCESS CONTROL SYSTEM

## CHAPTER 4: SYSTEM IMPLEMENTATION AND RESULTS

---

### 4.1 Introduction

This chapter presents the detailed implementation of the GateVision AI-Powered Vehicle Access Control System. It describes the development methodology, the system architecture, the individual modules that were implemented, the artificial-intelligence decision pipeline, the database design, the testing strategy, and the performance results obtained during development and evaluation. The chapter provides a complete account of how the theoretical framework described in the earlier chapters was translated into a working, integrated software system.

The system was developed as a full-stack web application consisting of a responsive single-page front end, a modular RESTful backend, and a NoSQL database, with a set of artificial-intelligence services providing automatic license-plate recognition, face recognition, and vehicle fingerprinting. The implementation combines modern web technologies with computer-vision and machine-learning models to deliver a functional prototype of an intelligent vehicle access control solution.

---

### 4.2 Development Methodology and Tools

#### 4.2.1 Development Methodology

The project was developed using an iterative and incremental (agile-inspired) approach. The system was built in discrete phases, with each phase delivering a functional increment that could be tested and reviewed. The phases included:

1. **Foundation phase** - establishing the authentication system, user roles, and the base API client infrastructure.
2. **Feature-center phase** - implementing each functional center (Recognition, Gate Operations, Identity Management, Administration and Security, Reports and Analytics, System Monitoring, and Settings) as an independently testable module.
3. **Integration phase** - wiring every feature center to the live backend application programming interface (API), removing all mock data, and verifying end-to-end behaviour through real HTTP requests.
4. **Optimization and production-readiness phase** - improving performance, hardening error handling, introducing per-stage timing, adding request logging, and optimising the front-end bundle.

This approach allowed continuous feedback, early detection of integration problems, and progressive refinement of both the user interface and the underlying services.

#### 4.2.2 Development Tools and Technologies

The system was implemented using the following technologies:

**Front End:**
- React 19 with TypeScript (strict mode)
- Vite as the build tool and development server
- Tailwind CSS v4 for styling
- shadcn/ui component library built on Radix UI primitives
- TanStack React Query for server-state management and data fetching
- Zustand for lightweight client-state (authentication and UI) management
- Framer Motion for interface animations (respecting the "prefers-reduced-motion" accessibility setting)
- Axios for HTTP communication with the backend
- React Hook Form and Zod for form handling and validation

**Back End:**
- Python with FastAPI as the asynchronous web framework
- Uvicorn as the ASGI server
- Motor and Beanie as the asynchronous MongoDB object-document mapper (ODM)
- Pydantic v2 for data validation and settings management
- PyJWT (python-jose) for JWT-based authentication
- passlib and bcrypt for password hashing
- python-multipart for multipart file uploads

**Artificial Intelligence and Computer Vision:**
- Ultralytics YOLOv8 for license-plate detection
- EasyOCR for optical character recognition (OCR) of plate characters
- InsightFace (buffalo_l model) for face detection and face embedding generation
- PyTorch and ResNet50 (ImageNet weights) for vehicle fingerprint embedding
- OpenCV for image preprocessing and frame handling
- NumPy for numerical and array operations

**Database:**
- MongoDB (a document-oriented NoSQL database) accessed through the Motor driver and the Beanie ODM

**Testing:**
- pytest and pytest-asyncio for the automated backend test suite
- HTTPX for API-level integration testing

**Version Control and Collaboration:**
- Git and GitHub for source control and remote collaboration

---

### 4.3 System Architecture

GateVision adopts a three-tier client-server architecture, separating the presentation layer (front end), the application layer (backend API), and the data layer (database and AI services).

#### 4.3.1 Architectural Overview

The architecture is organised as follows:

- **Presentation Layer (Front End):** A single-page application built with React that communicates with the backend exclusively through a well-defined REST API. The front end is organised into feature centers, each responsible for a distinct set of user-facing capabilities.

- **Application Layer (Back End):** A FastAPI application that exposes a REST API under the `/api/v1` namespace. The backend follows a layered design that separates routing, business logic, data access, and model definitions:
  - **Routers** - define the HTTP endpoints and perform request/response handling.
  - **Services** - encapsulate business logic, including the AI pipeline, decision engine, gate workflow, authentication, and reporting.
  - **Repositories** - provide a clean data-access abstraction over the database.
  - **Models** - define the Beanie ODM documents that map to MongoDB collections.

- **Data Layer:** MongoDB stores all persistent data, while the AI services (YOLO, EasyOCR, InsightFace, ResNet50) run within the backend process and are loaded on demand.

#### 4.3.2 Authentication and Security Architecture

Authentication is fully backend-driven. Users authenticate with a username/email and password, and the backend issues a JSON Web Token (JWT) access token together with a refresh token. The access token is stored in the browser under a custom key and attached to requests via an Axios interceptor. When a request returns a 401 (unauthorised) status, the interceptor automatically calls the refresh endpoint to obtain a new access token, providing a seamless session without requiring the user to log in again.

Role-based access control distinguishes between an Administrator and a Security Officer, gating sensitive operations such as camera control and user management. Security middleware adds cross-origin resource sharing (CORS) protection, rate limiting to deter abuse, and security headers.

#### 4.3.3 API Surface

The implemented system exposes 105 HTTP API routes across the following functional groups:

- **Auth and Users** - registration, login, token refresh, current-user profile, and user management.
- **Camera** - starting/stopping a server-side camera, querying status, capturing frames, and detecting available cameras.
- **Plate Detection** - uploading an image or using the camera for plate detection, model management, and detection history.
- **OCR** - reading plate text from an uploaded image or from a stored plate detection, model management, and history.
- **Pipeline** - the combined recognition pipeline that orchestrates all AI stages; supports both upload and camera input and includes status and metrics endpoints.
- **Recognition History** - listing, retrieving, and deleting recognition records.
- **Face** - face recognition from upload or camera, face comparison, face enrolment, and face history.
- **Vehicle Fingerprint** - storing, looking up, and verifying vehicle fingerprint records.
- **Decision** - evaluating a decision, listing decision history, statistics, and rules.
- **Gate** - entry/exit operations, active sessions, transactions, movement history, and gate statistics.
- **Admin** - dashboard, reports, search, analytics, events, and manual-review approval/rejection.
- **System** - health, model health, database health, storage, performance, configuration, version, backups, cleanup, and log statistics.

---

### 4.4 System Modules and Features

The system is delivered as a set of integrated feature centers accessible from a unified sidebar. Each center is described below.

#### 4.4.1 Authentication and User Management

The application begins with a secure authentication flow. Users log in with credentials, and the system validates them against the backend before granting access. The authentication module provides:

- Login and logout with JWT-based sessions.
- Automatic access-token refresh on expiry.
- Persistent sessions across page reloads.
- Role-based access (Administrator and Security Officer) controlling which features and operations a user may perform.
- A password-recovery flow and a session-expiry notification.
- A guest-redirect mechanism so unauthorised users are pointed to the login page.

#### 4.4.2 Recognition Center

The Recognition Center is the primary AI-driven module. It processes a single vehicle image and produces a complete recognition result. Key capabilities include:

- **Upload or live capture** - the user can upload an image or use a backend-attached camera for live capture.
- **Automated pipeline execution** - a single request triggers the full AI pipeline (license-plate detection, OCR, face recognition, vehicle fingerprinting, and decision evaluation).
- **Progress visualisation** - the interface animates through the pipeline stages and displays per-stage status.
- **Result panel** - the recognised plate, confidence scores, face and vehicle data, the recommended decision, and supporting evidence are displayed.
- **Recognition History** - a searchable, filterable table of past recognition runs with delete and clear-history functionality. Each entry records the plate, driver, vehicle, direction (entry/exit), decision, and confidence.
- **Investigation Timeline** - a visual reconstruction of a recognition run showing the sequence of stages and their outcomes.

The Recognition Center also hosts the **Live Gate**, an immersive kiosk-style flow described in Section 4.4.3.

#### 4.4.3 Gate Operations Console and Live Gate

The Gate Operations module acts as the operator console and is the landing page of the application. It provides:

- **System-readiness strip** - a live indication of camera status, AI models, database connection, and gate readiness, derived from the backend health endpoints.
- **Live Pipeline visualisation** - a humanised view of the recognition steps (vehicle detected, plate read, vehicle identified, driver verified, decision made, gate opened).
- **Vehicles Inside counter** - the number of vehicles currently within the facility, with details of the longest-present vehicle.
- **Entry and Exit control** - issuing entry and exit commands through the gate workflow API.
- **Gate Status** - the current state of the gate (open/closed) and the gate workload.
- **Active Sessions** - a live list of vehicles currently inside, refreshing automatically.
- **Recent Transactions** - the latest gate entry/exit transactions.
- **Traffic Playback** - a replay facility with play/pause, rewind, speed control, skip, and a timeline scrubber to review gate events.

The **Live Gate** is a driver-facing kiosk overlay that runs a true two-phase identity check. First the vehicle is scanned (plates and vehicle fingerprint); when it is accepted, the system transitions to a dedicated face-scan phase presenting a live camera view with a dashed oval guide and an upload fallback. The captured face is validated, and a combined submission produces the final decision. The flow narrates each step using speech synthesis, plays gate sounds on outcomes, and presents a clear grant/deny result with supporting details. Narration was deliberately kept concise to shorten the flow and avoid contradictory statements.

#### 4.4.4 Identity Management Center

Although architecturally positioned as an enterprise feature, the Identity Management module manages the driver and vehicle records needed for access control. It provides:

- **Driver profiles** - registration of drivers with their personal details and biometric (face) enrollment.
- **Vehicle profiles** - registration of vehicles and their association with drivers.
- **Access policies** - definition of rules governing which vehicles/drivers may enter.
- **Face enrollment** - storing a driver's face embedding for later gallery-based face matching.
- **Driver/vehicle wizards** - guided forms for creating and linking drivers, vehicles, and policies.
- **Identity Intelligence panel** - a visual dashboard of identity-related signals.

#### 4.4.5 Administration and Security Center

The Administration and Security center provides management and oversight tools:

- **Dashboard** - an overview of system activity, reviews, events, and health.
- **Manual Review queue** - reviewing, approving, or rejecting events that could not be resolved automatically (e.g. unrecognised plates).
- **Events feed** - a chronological log of system events.
- **Security Command Center** - an operations wall, incident board, risk gauge, and executive snapshot presented in a security-operations-centre (SOC) style.
- **Users, roles, and RBAC** - administration of users and their roles.

#### 4.4.6 Reports and Analytics Center

The Reports and Analytics module turns recognition and gate data into insight:

- **Traffic analysis** - hourly traffic charts and daily trends.
- **Decision breakdown** - granted/denied/manual-review distributions and ratios.
- **Recognition metrics** - accuracy and performance summaries.
- **Gate utilisation** - charts of gate usage and vehicle distribution.
- **Export** - downloadable reports of transaction data.
- **Security Intelligence Center** - a SOC-style dashboard with an executive summary, security timeline, a 7x24 threat heatmap, AI-confidence analytics, a failure explorer, and a decision-weight simulator.

#### 4.4.7 System Monitoring and AI Operations Center

The System Monitoring module provides operational visibility:

- **System health** - overall health of the API, database, models, and storage.
- **Model health** - the load/availability status of each AI model.
- **Performance metrics** - request timings and throughput measurements.
- **Version and configuration** - deployed version and live configuration values.
- **Backups** - exporting and importing database backups.
- **Log statistics** - breakdown of log entries and warnings within the application logs.
- **Digital Twin Monitor** - an animated topology graph of the system with live data-flow animations, an interactive node-inspection panel, a 24-hour health timeline, and a predictive capacity panel that forecasts storage exhaustion.

#### 4.4.8 Settings and AI Configuration

The Settings center allows administrators to configure the application and to experiment with the AI decision logic:

- A sidebar-driven layout with workspace tabs for the various configuration areas.
- An **AI Configuration Simulator** that lets the administrator adjust the weights assigned to each evidence source (plate, OCR, face, vehicle) and immediately observe how the combined decision would change.

---

### 4.5 The Artificial-Intelligence Decision Pipeline

The core contribution of the system is its automated recognition and decision pipeline, which converts a single captured image into an access decision. The pipeline is implemented as a sequence of stages executed by an orchestrator.

#### 4.5.1 Pipeline Stages

The pipeline executes the following stages in order:

1. **Capture Frame** - obtains the input frame, either from an uploaded image or from a live camera capture.
2. **Detect Plates** - uses the YOLOv8 detector to locate license plates in the frame, returning bounding boxes and confidence scores.
3. **Crop Plates** - extracts each detected plate region for recognition.
4. **Recognize Plates** - uses EasyOCR to read the characters from each plate crop, producing raw text, cleaned text, a confidence score, and a validation status.
5. **Recognize Faces** - uses InsightFace to detect faces and produce facial embeddings (used for gallery matching and for the exit face-consistency check).
6. **Process Vehicle Fingerprint** - uses ResNet50 to derive a visual fingerprint of the vehicle for matching across entry and exit.
7. **Evaluate Decision** - the decision engine combines the evidence from all stages, applies configured weights, and produces a recommendation (GRANT, DENY, or MANUAL_REVIEW) together with an overall confidence score and an explanation.
8. **Persist Decision** - stores the decision record in the database so it appears in the recognition history.
9. **Process Gate Workflow** - executes the gate action (entry or exit), creating or closing a session, recording a transaction, and performing the active-session verification.
10. **Aggregate Results** - consolidates all stage outputs into the final pipeline response.

#### 4.5.2 Decision Logic

The decision engine fuses evidence from the independent recognition stages. Each stage contributes a module name, confidence, whether it matched, and supporting metadata. A weighted fusion combines these into an overall decision:

- **GRANT** - sufficient positive evidence (correct plate, recognised characters, and, when required, a captured face and vehicle).
- **DENY** - the evidence indicates the vehicle should not be admitted (for example, no plate recognised or a security check failed).
- **MANUAL_REVIEW** - the evidence is inconclusive, and a human operator must make the final call.

The engine produces a fusion breakdown (the contribution of each stage), a set of triggered rules (e.g. "plate_detection_failed", "face_not_captured"), and a natural-language explanation that is surfaced to the operator.

#### 4.5.3 Session-Based Gate Workflow

The gate workflow is session-oriented. When a vehicle enters, an active session is created for its plate. When the same vehicle exits, the workflow:

- Looks up the active session for the plate.
- Verifies that the exit capture is consistent with the entry session, including an exit face-consistency check that compares the exit face embedding with the face stored at entry.
- Records a gate transaction and closes (or keeps open) the session accordingly.

If the exit face does not match the entry driver, the match is rejected, the decision is downgraded to DENY, and the session remains open, preventing an unauthorised exfil. This behaviour was validated and surfaced in the user interface so that rejected exits appear in history as denied rather than granted.

---

### 4.6 Database Design

MongoDB stores the persistent state of the system. The principal collections, defined as Beanie documents, are:

- **User** - registered users with hashed passwords and roles.
- **DriverProfile** - driver personal details and the face-embedding reference used for gallery matching.
- **VehicleProfile** - vehicle details and their association with drivers.
- **AccessPolicy** - access-control rules.
- **DecisionRecord** - every pipeline decision, including the decision value, confidence, explanation, evidence, fusion breakdown, triggered rules, direction, and timestamp.
- **GateSession** - active vehicle sessions with their state (INSIDE/OUTSIDE) and entry metadata.
- **GateTransaction** - gateway movement transactions with action (ENTRY/EXIT), vehicle, driver, and decision.
- **PlateDetectionRecord / OcrRecord / FaceRecord / VehicleRecord** - historical outputs of the individual AI stages.
- **ImageRecord** - stored upload images.
- **Audit/Activity logs** - events and manual reviews.

The document-oriented model is well suited to this domain because each pipeline run naturally maps to a document containing nested evidence arrays, and the recognition history is an ordered collection of such documents.

---

### 4.7 Testing

A comprehensive automated test suite validates the correctness and robustness of the system. The backend suite comprises **84 test modules** containing **752 passing tests**, covering:

- **Authentication and user management** - login, registration, token refresh, role enforcement.
- **AI services** - plate detection, OCR, plate reading, face detection, face similarity, vehicle fingerprinting, and their loaders.
- **Decision engine** - confidence fusion, evidence collection, explanation generation, rule triggering.
- **Pipeline orchestration** - every stage, failure modes, partial success, face and vehicle integration, session dispatch.
- **Gate services** - entry/exit sessions, active-session matching, session verification, face-mismatch rejection.
- **API integration** - HTTP-level tests for the pipeline, recognition, gate, decision, face, vehicle, admin, and system endpoints, including the 422 error responses for invalid input.
- **Resilience** - graceful handling of empty or corrupt uploads, no-plate frames, unreadable plates, missing faces, camera disconnects, and database outages.
- **Middleware** - request logging, request-ids, and per-request timing.

The front end is type-checked with TypeScript (strict mode, zero errors) and produces a production build through Vite, with vendor chunk splitting reducing the main bundle significantly.

---

### 4.8 Performance and Results

Performance was prioritised to enable near-real-time access control.

#### 4.8.1 Pipeline Timing

Each pipeline stage records its own duration. A benchmark run over the sample dataset produced the observed stage timings:

- **Plate detection (YOLO)** - the dominant stage for detection, in the order of a few hundred milliseconds on CPU.
- **Optical character recognition (EasyOCR)** - the heaviest stage; reading a set of plate crops on CPU took several seconds in the full benchmark, and was substantially improved by downscaling large crops to a maximum dimension of 480 pixels before recognition.
- **Face recognition and vehicle fingerprint** - rapid once the models are loaded.
- **Decision evaluation and gate workflow** - a fraction of a millisecond.

The measured average total over the benchmark dataset was approximately **5.5 seconds** per image when running the full CPU pipeline (dominated by OCR on a multi-plate image), while a lighter capture ran in well under a second. Model warm-up (loading YOLO and EasyOCR) took approximately 0.8 seconds and 6.3 seconds respectively on first use.

#### 4.8.2 Optimisations

Several optimisations improved performance and responsiveness:

- **Batched OCR** - all plate crops are passed to the OCR engine in a single call, each crop read once, rather than one call per crop.
- **Crop downscaling** - oversized plate crops are downscaled before OCR, dramatically reducing recognition time on CPU.
- **Asynchronous offload** - CPU-bound detection and OCR are moved off the event loop via background threads so the API remains responsive.
- **Shared-reader locks and caching** - models are loaded once and reused across requests.
- **Camera throttling and duplicate-frame detection** - redundant captures are suppressed to avoid reprocessing identical frames.
- **Warm-up** - models can be pre-loaded at startup to remove first-request latency.
- **Front-end bundle optimisation** - vendor chunks are split so the main application chunk is approximately 78 kilobytes, improving initial page load.

#### 4.8.3 Architecture Quality

The system was kept free of mock data: every feature center consumes the live API. Dead code was removed, and unused dependencies were pruned from the front-end, reducing the bundle size from over 500 kilobytes to about 78 kilobytes for the entry chunk without exceeding the build warning threshold.

---

### 4.9 Summary

This chapter described the complete implementation of the GateVision vehicle access control system. A three-tier architecture with a React front end, a FastAPI backend exposing 105 routes, and a MongoDB database was implemented, together with an AI pipeline that combines YOLO-based plate detection, EasyOCR character recognition, InsightFace face recognition, and ResNet50 vehicle fingerprinting into a single automated decision. The system was delivered as seven integrated feature centers, tested with a suite of 752 automated tests, and optimised for responsiveness through batching, downscaling, caching, and bundle splitting. The following chapter presents the conclusions drawn from this work and recommendations for future development.

---

## CHAPTER 5: CONCLUSION AND RECOMMENDATIONS

---

### 5.1 Summary of the Study

This project set out to design and implement an AI-powered vehicle access control system capable of automatically identifying a vehicle at a gate, recognising its license plate and (when required) the driver, and making an access decision without manual intervention. The resulting system, GateVision, meets this objective by integrating computer-vision and machine-learning models within a modern web application.

The system successfully detects license plates in captured frames, reads the plate characters, recognises faces and vehicle appearance, fuses the evidence into a confidence-weighted decision, and drives a session-based gate workflow that controls entry and exit. The implementation is delivered through an intuitive operator console and a driver-facing kiosk flow, supported by comprehensive reporting, administration, system-monitoring, and configuration centres.

### 5.2 Achievements

The following achievements were realised:

1. **A fully working, integrated prototype** - all feature centres operate against a live backend with real AI models and real data; no mock data remains in the system.

2. **An automated recognition and decision pipeline** - a single capture is processed end to end through plate detection, OCR, face recognition, and vehicle fingerprinting to produce an evidence-based GRANT/DENY/MANUAL_REVIEW decision.

3. **A security-conscious gate workflow** - session-based entry/exit tracking with an active-session matcher and an exit face-consistency check that rejects an exit when the driver differs from the one who entered, recording such rejections correctly as denied.

4. **A broad and robust codebase** - 105 API routes, 84 test modules, and 752 automated tests provide confidence in correctness and resilience to failure.

5. **Performance and production readiness** - per-stage timing, model warm-up, OCR batching and downscaling, camera throttling, and front-end bundle splitting (entry chunk approximately 78 kilobytes) were implemented to improve responsiveness and load times.

6. **Operational visibility** - health monitoring, model-availability checks, performance metrics, reports, analytics, and a security-operations-style dashboard give administrators a clear picture of the system's state and security posture.

### 5.3 Limitations

Despite the successes achieved, the system has a number of limitations that should be acknowledged:

1. **CPU-bound performance** - face and OCR models run on the central processing unit (CPU). Reading multiple plate crops can take several seconds, which is acceptable for a prototype but not for high-throughput gate deployments. GPU acceleration would greatly improve throughput.

2. **Model availability** - the AI models (plate detector, EasyOCR, InsightFace, ResNet50) must be downloaded on first use and depend on internet access. An offline deployment requires pre-provisioning the model files.

3. **Plate-model dependency** - plate detection requires a model that is specifically trained to recognise license plates (a generic object-detection model such as the base YOLOv8 does not identify plates). This dependency was resolved by using a plate-tuned model.

4. **Camera role gating** - server-side camera control is restricted to elevated roles, which is intentional for security but limits who can initiate a live capture.

5. **Inconclusive decisions** - when the evidence is insufficient (e.g. an unreadable or absent plate), the system falls back to MANUAL_REVIEW, which still requires human intervention rather than being fully automated.

6. **Limited language support** - OCR is configured for English; other plate alphabets would require additional recognition models.

7. **Single-node deployment** - the system runs as a single process with a local MongoDB, without clustering, load balancing, or containerisation.

### 5.4 Recommendations

To move the prototype towards a production deployment, the following recommendations are made:

1. **Adopt GPU acceleration** - run the YOLO, EasyOCR, and InsightFace models on a GPU to reduce recognition time from seconds to tens of milliseconds, enabling high-throughput gate lanes.

2. **Containerise the application** - package the backend, front end, MongoDB, and model files as Docker containers, and orchestrate them with Docker Compose or Kubernetes to simplify deployment, scaling, and rollback.

3. **Pre-provision model files** - bake the AI model weights into the deployment image or a shared volume so that first-run download is eliminated and offline operation is supported.

4. **Harden security** - use HTTPS in production, store secrets in a secrets manager, strengthen the JWT secret rotation policy, add fine-grained audit trails for sensitive operations, and apply rate limiting and logging at scale.

5. **Expand recognition coverage** - add support for additional plate alphabets and formats, and improve the plate detector with a larger, purpose-trained dataset to raise recognition accuracy on difficult (blurred, angled, or occluded) plates.

6. **Introduce a message queue** - decouple heavy recognition work from the request/response cycle using a task queue (such as Redis/Celery) so the API stays responsive under load and long-running jobs are retryable.

7. **Add observability tooling** - integrate structured logging aggregation (e.g. the ELK stack or Loki), metrics collection, and distributed tracing to monitor a production deployment.

### 5.5 Future Work and Enhancements

Several directions for future work can extend the system:

1. **Multi-camera and multi-lane support** - extend the system to handle several cameras and gate lanes concurrently, with a central coordination service.

2. **Cloud and edge hybrid deployment** - place lightweight recognition at the edge (on the gate device) and aggregate decisions centrally in the cloud.

3. **Driver re-verification and blacklist integration** - automatically flag vehicles or drivers against a blacklist and escalate suspicious activity.

4. **Advanced analytics and predictive maintenance** - use the collected history to predict congestion and proactively plan gate capacity.

5. **Mobile operator application** - provide a companion mobile app so security staff can review and approve manual-review events remotely.

6. **Learning and adaptation** - incorporate a feedback loop whereby manual-review decisions improve the decision engine over time through re-training.

### 5.6 Conclusion

This project successfully designed and implemented GateVision, an AI-powered vehicle access control system that integrates license-plate recognition, optical character recognition, face recognition, and vehicle fingerprinting into an automated, evidence-based decision pipeline, supported by a session-oriented gate workflow and a comprehensive web interface. The system was validated with a large automated test suite and demonstrates the technical feasibility of applying modern computer vision and web technologies to vehicle access control. While the current implementation is a robust prototype, the recommendations and future-work directions outlined above provide a clear path towards a scalable, secure, and production-ready deployment. Overall, the project achieved its stated objectives and provides a strong foundation for further research and development in intelligent access control.
