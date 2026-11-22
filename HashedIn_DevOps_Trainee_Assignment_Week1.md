# HashedIn University DevOps Trainee Assignment --- Week 1

## Track 2: Docker, CI/CD, Kubernetes, and DevSecOps & Cyber Security

**Assignment:** Ship, Secure and Document the HU Inventory App

## Scenario

You are a DevOps engineer at HashedIn and have inherited the **HU
Inventory App**, which has a React frontend (FE), a Node.js backend (BE)
and a PostgreSQL database. It runs on a developer laptop but has no
containers, pipeline, Kubernetes deployment or security review. Take it
from source code to a secured, automated, Helm-based Kubernetes
deployment, and document everything you find and fix.

Read `app/README.md` first. The app works but has not been
security-reviewed. Expect problems and prove them with tools, not
guesses.

## Required Toolchain

Use the tool listed for each purpose. An alternative is allowed only
where the assignment says so, and you must note the choice in your
report. Pin every tool version (pipeline, local install and chart
dependencies) and record the versions in your report.

  -----------------------------------------------------------------------
  Purpose                             Tool
  ----------------------------------- -----------------------------------
  CI                                  GitHub Actions

  CD / GitOps                         ArgoCD

  Image registry                      GitHub Container Registry (GHCR)

  Container build                     Docker

  Kubernetes                          Minikube or Kind

  Packaging                           Helm

  Database                            Postgres

  Secrets Scanning                    TruffleHog

  SAST                                Semgrep and CodeQL (use both and
                                      compare)

  Dependency scan (SCA)               Grype

  Dockerfile lint                     Hadolint

  Dockerfile / IaC misconfiguration   Checkov

  Container image scan                Trivy

  Helm / manifest security scan       kube-linter

  DAST                                OWASP ZAP

  Reports                             Tool-native output (SARIF, JSON or
                                      HTML) kept as pipeline artifacts
  -----------------------------------------------------------------------

The ephemeral environment is created and destroyed inside the pipeline
run. Start the image you just built (with a PostgreSQL container) as
Docker containers on the runner, and run OWASP ZAP against the running
BE from the same job. An API scan is expected. A ZAP baseline scan of
the FE is optional.

------------------------------------------------------------------------

## Question 1: Containerize the Application (Docker)

Your manager wants the app to run in containers before anything is
automated.

1.  Write Dockerfiles for the FE and the BE that follow industry best
    practices.
2.  Build both images locally and run them with a PostgreSQL container
    using Docker Compose.
3.  Test the application functionality end to end locally.
4.  Record the final size of each image.

**Note:** Local builds are for development only. Nothing is deployed to
the cluster at this stage.

## Question 2: Continuous Integration (GitHub Actions)

Build a CI pipeline for the FE and BE with at least these stages:
**lint/test, build, scan, push image, publish reports**.

1.  Trigger on push and pull request, scoped by changed paths (FE
    changes build the FE, BE changes build the BE).
2.  Do not hardcode environment values in the workflow. Parameterize
    everything.
3.  Push both images to GHCR, tagged with the commit SHA, and only after
    all scan gates have passed. Do not use the `latest` tag. Follow a
    standard tagging process.
4.  The pipeline must fail on failures. Do not use `continue-on-error`,
    swallowed exit codes or ignore files to hide them.
5.  Record the tags and the GHCR images that were stored.

## Question 3: Kubernetes Basics (Local Cluster)

1.  Create a local cluster (Kind or Minikube) and deploy the FE, the BE
    and PostgreSQL inside it.
2.  Pull the FE and BE images from GHCR, using an `imagePullSecret` if
    the package is private. Do not load images from your machine.
3.  Prove the pull is real. Show the `kubectl describe pod` events
    containing `Pulling image 'ghcr.io/...'` and show the image digest
    that is actually running.
4.  Connect the BE to the database through a Kubernetes Service, with
    the credentials in a Secret.
5.  Restart the database pod and confirm that the data survives.
6.  Expose the application with port-forward and prove it works end to
    end.
7.  Record every problem you troubleshoot in an issue log.

## Question 4: Helm Packaging and Deployment

1.  Package the FE and BE as Helm charts with no copy-paste between
    charts (use a shared library chart or an umbrella chart).
2.  Deploy PostgreSQL through Helm (your own chart or a pinned community
    chart) and integrate it with the BE through chart values and
    Secrets, using the `existingSecret` pattern for credentials.
3.  Provide per-environment values files (for example, `values-dev.yaml`
    and `values-prod.yaml`).
4.  Follow Kubernetes Deployment best practices.
5.  Run `helm lint` and `helm template` and make sure both pass.
6.  Run `helm upgrade` and `helm rollback` at least once each and show
    the release history (`helm history`).

## Question 5: Continuous Delivery (ArgoCD)

Git must be the single source of truth for what runs in the cluster.

1.  Install ArgoCD in your local cluster.
2.  Create ArgoCD Applications that deploy your Helm charts from Git.
    Parameterize the repo URL, revision, path, destination namespace and
    sync policy.
3.  Configure CI to update the image tag in Git so that ArgoCD syncs it
    and the cluster converges with no manual `kubectl` commands.
4.  Demonstrate the full flow: code change, CI build, Git tag bump,
    ArgoCD sync, visible change in the running app.
5.  Demonstrate a rollback performed through Git.

## Question 6: DevSecOps: Scan, Fix, Rescan

The security team needs proof that the app is safe to run. Add security
gates to the same CI pipeline for both the FE and the BE.

### Part A: Pipeline Order

Arrange the stages in a single workflow, for both FE and BE, in this
order:

1.  Lint/test
2.  Secrets
3.  SAST
4.  SCA
5.  Dockerfile lint
6.  Build image
7.  Image scan
8.  Helm lint, render and manifest scan
9.  Push image (only if all gates pass)
10. Deploy to an ephemeral environment
11. DAST
12. Publish reports

### Part B: Requirements

1.  Fail the pipeline on any High or Critical finding from every
    scanner, including the image and manifest scans. The severity
    threshold must be a parameter.
2.  Scan the image you just built, by SHA or digest, before pushing it.
    Do not scan a base image, an older tag or `latest`.
3.  Scan the chart once per values file (dev and prod), not just with
    the defaults.
4.  Run the scans first, before making any fix. Keep the original
    (before) reports in `reports/before/` at the root of your
    repository, using the folder structure described under Deliverables.
5.  Fix every High and Critical finding (and Medium findings where
    practical) at the root cause, in code, dependencies, base images,
    Dockerfiles, Helm templates, values or the pipeline. Suppression is
    not a fix.
6.  Fix image findings by changing the base image or version,
    rebuilding, upgrading packages, or removing unneeded packages and
    tools. Document the approach you chose and why.
7.  Fix Helm and manifest findings in the chart templates and values,
    not by editing live objects with `kubectl`.
8.  Rescan the fixed code, the newly built images and the re-rendered
    charts. Keep the clean (after) reports in `reports/after/` at the
    root of your repository, using the same folder structure as
    `reports/before/`.

### Part C: Prove Each Fix

1.  **Code findings:** re-run the original exploit or test and show that
    it no longer works.
2.  **Image findings:** show the new image's scan result and its new
    size or digest.
3.  **Helm findings:** show the deployed pod's effective settings.
4.  Show that the app still passes its functional tests after the fixes.
5.  A suppression (ignore file or baseline) is allowed only for a proven
    false positive. It needs a written justification, an owner and an
    expiry date in your report.
6.  Show that each scanner actually scanned something. A green pipeline
    with an empty scan is a failure. Provide evidence of coverage, such
    as the number of URLs, files, packages, image layers or rendered
    resources scanned.
7.  Show the gate working: one pipeline run that fails on a real High or
    Critical finding, and a later run that passes after your fix.

------------------------------------------------------------------------

## Transcription and image-coverage notes

-   The supplied photographs show the assignment pages in sequence, with
    some overlap between page photographs.
-   A small fragment immediately above the "Track 2" heading in the
    first photograph reads: `flags (SYN, SYN-ACK, ACK).` It appears to
    belong to the preceding track, so it has not been incorporated into
    Track 2 requirements.
-   The photographs do not show the assignment's **Deliverables**
    section or any further pages after Question 6, Part C. The reference
    to a folder structure "described under Deliverables" is therefore
    retained as written; that folder structure is not visible in the
    supplied images.
-   The transcription preserves the visible wording and technical names.
    Minor punctuation and Markdown formatting have been normalized for
    readability.
