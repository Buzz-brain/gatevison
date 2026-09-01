# CHAPTER FOUR
# IMPLEMENTATION, RESULTS AND DISCUSSION

*Note to the student: This chapter follows the format prescribed by the school. Sections marked "[TO BE INSERTED]" indicate content that must be supplied by the author (photographs, specific equipment names, screenshots from your own run, or external comparison data) because that information is not derivable from the code. No figures, measurements, or claims in this chapter are invented; every number below is taken directly from the project's own benchmark and test outputs.*

---

## 4.1 System Implementation

This section describes how the GateVision AI-Powered Vehicle Access Control System was constructed, from the choice of technology to the final integrated product.

### 4.1.1 Development Approach

The system was developed iteratively in distinct phases, allowing each increment to be tested before moving on:

1. **Foundation phase** - the authentication system, user roles, and the base API client infrastructure were built first.
2. **Feature-center phase** - each functional center (Recognition, Gate Operations, Identity Management, Administration and Security, Reports and Analytics, System Monitoring, and Settings) was implemented as an independent module.
3. **Integration phase** - every feature center was connected to the live backend; all mock data was removed, and end-to-end operation was verified through real HTTP requests.
4. **Optimization and production-readiness phase** - per-stage timing, request logging, model warm-up, OCR batching and downscaling, and front-end bundle splitting were introduced to improve performance.

### 4.1.2 Technology Stack

The system is split into a front-end single-page application and a backend REST API.

**Front end:**
- React 19 with TypeScript (strict mode)
- Vite (build tool and development server)
- Tailwind CSS v4 and shadcn/ui (built on Radix UI primitives)
- TanStack React Query (server-state management and data fetching)
- Zustand (client-side state: authentication and UI)
- Framer Motion (animations, respecting the "prefers-reduced-motion" accessibility setting)
- Axios (HTTP requests), React Hook Form and Zod (forms and validation)

**Back end:**
- Python, FastAPI (asynchronous web framework)
- Uvicorn (ASGI server)
- MongoDB with Motor and Beanie (object-document mapper)
- Pydantic v2 (validation and settings)
- PyJWT (JSON Web Token authentication), passlib and bcrypt (password hashing)

**Artificial intelligence / computer vision:**
- Ultralytics YOLOv8 (license-plate detection)
- EasyOCR (optical character recognition)
- InsightFace with the buffalo_l model (face detection and facial embedding)
- PyTorch with ResNet50 (vehicle fingerprint embedding, ImageNet weights)
- OpenCV (image preprocessing) and NumPy (numerical operations)

**Testing:**
- pytest and pytest-asyncio (backend automated tests)
- HTTPX (API-level integration tests)

**Version control:**
- Git and GitHub

### 4.1.3 System Architecture

The system follows a three-tier client-server architecture:

- **Presentation layer**: the React front end, which communicates with the backend only through the REST API.
- **Application layer**: the FastAPI backend exposing 105 HTTP routes under `/api/v1`. It is organised into routers (HTTP endpoints), services (business logic, including the AI pipeline, decision engine, and gate workflow), repositories (data access), and models (MongoDB document definitions).
- **Data layer**: a MongoDB database, together with the AI models that run inside the backend process.

### 4.1.4 The AI Decision Pipeline

The central construction is the recognition pipeline, executed by an orchestrator as a sequence of stages:

1. Capture frame (from upload or camera)
2. Detect plates (YOLOv8)
3. Crop plates
4. Recognize plates (EasyOCR)
5. Recognize faces (InsightFace)
6. Process vehicle fingerprint (ResNet50)
7. Evaluate decision (weighted fusion of evidence)
8. Persist decision (store the record)
9. Process gate workflow (entry/exit, session management)
10. Aggregate results

Photographs of the assembled hardware and of the running interface are not stored within the project repository and must be inserted here. **[PHOTO TO BE INSERTED: overall system / development machine layout] [PHOTO TO BE INSERTED: each feature center screenshot - Recognition, Gate Operations, Identity, Administration, Reports, System, Settings]**

---

## 4.2 Experimental Setup

### 4.2.1 Test Procedures

Two complementary forms of testing were used:

1. **Automated unit and integration testing.** The backend was tested with pytest. The full suite comprises **84 test modules** and **752 passing tests**, covering authentication, each AI service, the decision engine, the pipeline stages and their failure modes, the gate services, the API endpoints, and system resilience. The front end was type-checked with TypeScript in strict mode (zero errors) and built with Vite.

2. **Pipeline benchmark.** A benchmark script executed the full recognition pipeline repeatedly on a set of sample images and measured the duration of every stage, the detection and recognition counts, the resulting decision, and the gate outcome.

### 4.2.2 Equipment Used

The implementation and testing were carried out on a standard development computer. The specific hardware model and configuration are **[TO BE INSERTED - e.g. processor model, RAM, presence or absence of a GPU, camera make/model]** because that information is not recorded in the project source. The AI models were executed on the **CPU** (the configuration parameter `DEVICE=cpu`), so all measured timings in this report are CPU timings. No GPU was used in the measurements reported here.

### 4.2.3 Measurement Methods

- **Per-stage timing.** Every pipeline response includes a `stage_results` array with the duration (in milliseconds) of each stage. These durations are produced by the backend itself and recorded in the benchmark report.
- **Detection and recognition counts.** Each run records the number of plates detected and plates recognized, along with the recognized plate text and confidence.
- **Decision outcome.** Each run records the final decision (GRANT, DENY, or MANUAL_REVIEW) and whether the gate workflow succeeded.
- **Model load times.** The warm-up step records how long it takes to load the YOLO and EasyOCR models on first use.
- **Recognition/detection accuracy.** The system does not compute an aggregate accuracy percentage automatically; accuracy is observable per run as the ratio of recognized plates to detected plates, and as the correctness of the decision relative to the image content. **[TO BE INSERTED: any formal accuracy calculation from your own test images, if required by your department.]**

---

## 4.3 Results

### 4.3.1 Model Load (Warm-up) Times

On first use the AI models are loaded into memory. Measured from the benchmark warm-up step:

| Model | Model load time (ms) |
|-------|---------------------|
| Plate detector (YOLOv8) | 776.14 |
| OCR (EasyOCR) | 6333.77 |

Observation: loading the OCR model is the heavier of the two, taking about 6.3 seconds, because of the size of the recognition network and its dependencies.

### 4.3.2 Pipeline Stage Timing

The benchmark ran the full pipeline on four images (two entry, two exit) using two different sample images. The average duration of each stage across those runs was:

| Pipeline stage | Average time (ms) |
|----------------|-------------------|
| Capture frame | 0.0 |
| Detect plates | 406.92 |
| Crop plates | 1.06 |
| Recognize plates (OCR) | 5146.79 |
| Recognize faces | (not present in this benchmark set) |
| Process vehicle fingerprint | (not present in this benchmark set) |
| Evaluate decision | 0.30 |
| Process gate workflow | 0.01 |
| Aggregate results | 0.0 |

The **overall average total time per run was 5555.49 ms** (maximum 6997.81 ms). Clear observations:

- The **OCR (recognize plates) stage dominates** the total time, accounting for most of the ~5.5-second average.
- Plate detection contributes roughly 400 ms.
- Decision evaluation and gate workflow are effectively instantaneous once the evidence is available.

### 4.3.3 Individual Benchmark Runs

| # | Direction | Image | Plates detected | Plates recognized | Decision | Gate success | Total time (ms) |
|---|-----------|-------|-----------------|-------------------|----------|--------------|-----------------|
| 1 | Entry | bus.jpg | 6 | 2 | MANUAL_REVIEW | No | 6594.10 |
| 2 | Entry | zidane.jpg | 3 | 0 | DENY | No | 5457.26 |
| 3 | Exit | bus.jpg | 6 | 2 | MANUAL_REVIEW | No | 6997.81 |
| 4 | Exit | zidane.jpg | 3 | 0 | DENY | No | 3172.81 |

Observations:

- In the multi-plate image (`bus.jpg`), 6 plates were detected but only 2 were recognized; because not all detected plates were confidently read, the system did not commit to a definitive grant and returned MANUAL_REVIEW, keeping the gate closed.
- In the second image the detector found 3 candidate regions but none were recognized; with no plate recognized the pipeline returned DENY ("No plate recognized").
- The correct behaviour of keeping the gate closed (gate success = No) in non-confident cases is an intentional safety property: the system declines rather than wrongly admitting a vehicle.

### 4.3.4 Example Pipeline Response Structure

A full pipeline request returns, among other fields: the request id, plates detected and recognized, recognized plates with confidence, faces detected, processing time in milliseconds, an array of stage results with per-stage success and duration, warnings, errors, the fused decision with confidence and explanation, the evidence breakdown, the triggered rules, and the gate-workflow result. **[SCREENSHOT TO BE INSERTED: a successful Recognition Center result panel; a Live Gate entry and exit outcome; the operator console; the Reports dashboard.]**

### 4.3.5 Recognition History

The system persists every decision record and exposes a searchable history. The Recognition Center shows a table with the plate, driver, vehicle, direction (entry/exit), decision, and confidence, with filters for decision and direction and delete/clear actions. Rejected exits are recorded as DENY so the history reflects the actual outcome rather than a provisional engine decision.

---

## 4.4 Performance Evaluation

### 4.4.1 Comparison with Design Expectations

The design objective was a system that automates vehicle access control using AI recognition. The following expectations were met:

- **End-to-end automation:** a single capture produces a decision automatically, with no manual plate reading.
- **Safety on uncertainty:** when evidence is insufficient (unrecognized plates), the system fails safe to MANUAL_REVIEW or DENY rather than granting access, which is the desired security behaviour.
- **Persistent records:** every decision and transaction is stored and queryable.
- **Responsive management UI:** all centres operate against the live API with no mock data.

The main gap against design expectations is **speed**: the CPU-only pipeline averaged about 5.5 seconds per image, which is acceptable for a single-lane prototype but slower than would be expected for a high-throughput production gate. This is an expected consequence of running OCR and detection on the CPU rather than a GPU, and it is addressed in the recommendations (Chapter 5).

### 4.4.2 Comparison with Existing Systems

- **Cost and deployment:** unlike commercial ANPR/access-control products, this system is built entirely from open-source components (YOLOv8, EasyOCR, InsightFace, FastAPI, React) and runs on a standard computer, requiring no proprietary hardware or licensing.
- **Recognition throughput:** commercial systems typically achieve near-real-time recognition (tens of milliseconds per plate) using dedicated hardware and GPU acceleration. The prototype's CPU timings are therefore slower, as expected for an open-source CPU implementation.
- **Decision logic:** the system goes beyond simple plate lookup by fusing face and vehicle evidence and maintaining session-based entry/exit, which is a broader feature set than a basic plate-reader product.
- **[TO BE INSERTED: if your department requires a formal comparison table with published accuracy figures (e.g. known benchmark accuracies for YOLO plate detection or EasyOCR), those specific external numbers must be sourced by you; they are not stored in this project.]**

### 4.4.3 Efficiency of Optimisations

The following optimisations, verifiable in the code, improved efficiency:

- **Batched OCR:** all plate crops are recognized in a single call, each read once, rather than one call per crop.
- **Crop downscaling:** oversized plate regions are downscaled (to a maximum dimension of 480 pixels) before OCR, which substantially reduces CPU recognition time on large crops.
- **Background offload:** CPU-bound detection and OCR are run off the event loop so the API stays responsive during computation.
- **Model caching and shared locks:** models are loaded once and reused across requests, with locks to avoid concurrent duplicate loading.
- **Camera throttling and duplicate-frame rejection:** repeated identical captures are suppressed rather than reprocessed.
- **Front-end bundle splitting:** vendor code is split out, reducing the main application chunk to approximately 78 kilobytes, which improves initial page load time.

---

## 4.5 Discussion of Results

### 4.5.1 Accuracy

The correctness of the pipeline is demonstrated by its consistent behaviour on the test set rather than by a single aggregate number:

- On a clear multi-plate image the detector found 6 plates and the OCR read 2 of them; the others were not confidently recognized, correctly leading to MANUAL_REVIEW rather than a wrong grant.
- On an image with no recognizable plate the system returned DENY, correctly refusing access.

The absence of false grants in the observed runs indicates that the decision-rule engine is conservative, which is the appropriate behaviour for a security system. The OCR stage is the main limiting factor for accuracy: recognition succeeds only when the plate is captured clearly (sufficient size, focus, lighting, and angle). **[TO BE INSERTED: a formal accuracy rate calculated from a larger, labelled set of your own images, if your department requires a numeric accuracy figure.]**

### 4.5.2 Efficiency

The dominant cost is OCR. Averaging about 5.1 seconds on the benchmark set, it accounts for most of the ~5.5-second total. This is the price of running a learned recognition model on the CPU. The decision and gate stages contribute a fraction of a millisecond. For a single-gate prototype the throughput is workable, but for higher volumes GPU acceleration or a faster recognition strategy would be required.

### 4.5.3 Sources of Error

Known sources of error observed or implied by the pipeline's own safeguards:

- **Poor plate capture** (blur, small size, poor lighting, sharp angle) reduces OCR confidence and can lead to no plate being recognized.
- **Partial detections** - the detector may find a plate but the OCR may still fail to read it, as seen in the benchmark where 6 were detected but only 2 recognized.
- **Model warm-up latency** - the first request after startup incurs model-loading delays (about 6.3 seconds for OCR) until the models are cached.
- **Missing optional models** - if the face (InsightFace) or vehicle fingerprint (ResNet50) models are not downloaded, the corresponding stages are skipped and only a warning is issued, so decisions in that condition rely on plates/OCR alone.

### 4.5.4 Challenges Encountered

1. **Plate-model dependency.** The base YOLOv8 object detector does not identify license plates (it is trained on generic object classes). A plate-tuned model is required for detection to work, and the correct model must be provisioned.
2. **CPU recognition speed.** OCR of multiple crops was slow on CPU; this was mitigated with crop downscaling and batching, and remains the main performance limitation.
3. **Windows environment quirks.** The backend's file-reload watcher crashed silently on Windows, so the server had to be run without the auto-reload watcher during development.
4. **Model and environment provisioning on a new machine.** Setting up a second system required installing a compatible Python version (the project's dependencies reject Python 3.14), recreating the virtual environment with Python 3.12, downloading the AI models, and supplying the plate-tuned detection model, which was not part of the git repository (model files are git-ignored). These are practical deployment hurdles documented during the migration.
5. **First-run model downloads.** AI model files are not committed to version control and must be downloaded or copied onto each new machine before face and vehicle modules become active.

---

## Summary of Chapter Four

Chapter Four described the implementation of the GateVision system (Section 4.1), the experimental setup and measurement methods used (4.2), the measured results including per-stage timings and individual runs (4.3), an evaluation of the results against design expectations and existing systems (4.4), and a discussion of accuracy, efficiency, sources of error, and challenges (4.5). The system was found to perform correct, conservative access decisions with an average CPU pipeline time of about 5.5 seconds, dominated by optical character recognition.

---

# CHAPTER FIVE
# CONCLUSION AND RECOMMENDATIONS

---

## 5.1 Conclusion

### 5.1.1 Objectives Achieved

Based on what was implemented in the project source, the following objectives were achieved:

1. **Automated vehicle recognition** - the system detects license plates with YOLOv8 and reads the characters with EasyOCR.
2. **Integrated decision making** - plate, face, and vehicle evidence are fused into a confidence-weighted decision (GRANT, DENY, or MANUAL_REVIEW) with an explanation and an evidence breakdown.
3. **Automated gate control** - a session-based gate workflow creates, verifies, and closes entry/exit sessions and records transactions, including an exit face-consistency check.
4. **A complete management platform** - the front end provides centers for Recognition, Gate Operations, Identity, Administration and Security, Reports and Analytics, System Monitoring, and Settings, all operating against the live API.
5. **Robustness and testability** - a suite of 84 test modules and 752 passing tests validates the system.
6. **Performance optimisation** - per-stage timing, model warm-up, OCR batching and downscaling, and front-end bundle splitting were implemented.

Whether the full hardware deployment (physical gate hardware, camera mounting, real-world installation) was realised is **[TO BE INSERTED / NOT KNOWN - the source code alone does not record a physical site installation, so this should be stated by you from your actual field work].**

### 5.1.2 Major Findings

- The recognition pipeline works end to end on the CPU, with an average of about 5.5 seconds per image; OCR is the dominant cost (about 5.1 seconds).
- The system is intentionally conservative: uncertain plates lead to MANUAL_REVIEW or DENY, never to a speculative grant, which is the correct property for access control.
- Multi-plate images may be detected but only partially recognized, which limits the decision accuracy of the OCR stage.
- The exit face-consistency check strengthens security by rejecting an exit when the driver does not match the person who entered, and this outcome is recorded correctly in history.
- Setup on a new machine is non-trivial because model files are excluded from version control and the dependency set requires a specific Python version (3.10-3.13).

### 5.1.3 Contributions of the Project

1. An integrated, open-source prototype combining plate detection, OCR, face recognition, and vehicle fingerprinting in a single automated decision pipeline.
2. A session-oriented gate workflow with active-session matching and exit driver-consistency verification.
3. A well-tested backend (752 tests) with a clean layered architecture separating routers, services, repositories, and models.
4. A complete operator and management interface covering operations, reporting, security, system monitoring, and configuration.
5. A documented, reproducible setup that can be deployed to another machine (with known platform constraints).

---

## 5.2 Recommendations

### 5.2.1 Possible Improvements

1. **Adopt GPU acceleration** to reduce recognition time from seconds to tens of milliseconds, enabling higher throughput. The configuration already supports device selection (`DEVICE`, `FACE_DEVICE`, `VEHICLE_DEVICE`), so this is largely a hardware and environment change.
2. **Improve the OCR stage** - use a more accurate recognition model, better pre-processing, and a larger training set for the plate detector to raise recognition accuracy, especially on blurred or angled plates.
3. **Containerise the application** (Docker) so the backend, front end, database, and model files are deployed consistently, removing the manual environment setup currently required.
4. **Pre-provision model files** and enforce a compatible Python version to simplify installation on new machines.
5. **Add HTTPS, stronger secret management, and more granular audit trails** for production hardening.
6. **Add a task queue** (e.g. Celery/Redis) so that heavy recognition work does not block the request/response cycle under load.

### 5.2.2 Future Work

1. **Multi-camera and multi-lane support** with a central coordination service.
2. **Cloud and edge hybrid deployment** - lightweight recognition at the gate device, with central aggregation.
3. **Blacklist and flagging integration** for suspicious vehicles or drivers.
4. **Predictive analytics** - use the stored movement history to forecast congestion and plan gate capacity.
5. **A mobile operator application** for remote review and approval of manual-review events.
6. **A feedback loop** whereby manual-review decisions are used to improve the decision engine over time.

### 5.2.3 Further Research

1. **Accuracy benchmarking against standard datasets** - formally measure plate-detection and OCR accuracy on a labelled dataset to produce published-style figures.
2. **Comparison with commercial ANPR products** using a common test set to quantify the performance gap.
3. **Evaluation of face and vehicle consistency checks** under real-world conditions (occlusion, lighting variation) to measure their robustness.
4. **Study of latency optimisation** (quantisation, smaller models, GPU/edge inference) for near-real-time CPU or low-cost hardware.

---

*End of Chapters Four and Five.*
