# OrchStep Binary License

**Effective:** 2026-11-22 · applies to OrchStep v0.15.0 and later

**In short:** OrchStep is free for individual and commercial use. Your workflows are yours. Don't resell OrchStep itself, don't reverse-engineer it, and it comes with no warranty.

This license covers the compiled OrchStep engine ("the Software"): the `orchstep` binaries, the container images, and the packages that install them (Homebrew, npm, pip, the GitHub Actions). The open content in the [orchstep/orchstep](https://github.com/orchstep/orchstep) repository (the YAML spec, modules, skills, demos, examples and docs) is licensed separately under [Apache 2.0](LICENSE).

### 1. Free to use, for anything
You may install and use the Software at no cost, for personal, educational, internal business and commercial purposes, on any number of machines, by any number of people in your organization, including in CI/CD and production.

### 2. Your work is yours
Workflows, modules, configuration and outputs that you create with the Software belong to you. We claim no rights in them.

### 3. Redistribution
You may redistribute **unmodified** official builds, for example inside your container images, CI runner images, internal mirrors or developer setup scripts, as long as this license accompanies them. You may not sell the Software itself, or offer it to third parties as a hosted or managed service where the Software is the main value provided.

### 4. Restrictions
You may not: modify the binaries; decompile, disassemble or reverse-engineer the Software, except to the extent applicable law expressly permits this despite this restriction; remove or alter license notices; or bypass the license-key checks that gate Pro features.

### 5. Pro features
Some organizational features (for example team management, audit and governance) require a paid license with its own terms. **Running workflows never requires a license key.** Every execution feature stays free.

### 6. Data
The Software does not send your workflows, variables, environment, secrets or outputs anywhere. It runs an occasional update check (at most every 48 hours; in CI it runs silently and never prints) that sends only the event name, OrchStep version, OS, CPU architecture and whether it is running in CI, with no user or machine identifiers. Disable it with `ORCHSTEP_NO_UPDATE_CHECK=1` or `DO_NOT_TRACK=1`. Network calls your workflows make (HTTP, git, modules) are made on your behalf, to the destinations you configure.

### 7. Third-party components
The Software includes open-source components under their own licenses. Each release publishes an SBOM listing them, and nothing in this license limits your rights under those licenses.

### 8. No warranty
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. You are responsible for the workflows you run and the commands they execute.

### 9. Limitation of liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE AUTHORS OF ORCHSTEP ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR LOSS OF DATA, PROFITS OR BUSINESS, ARISING FROM YOUR USE OF THE SOFTWARE. Because the Software is provided free of charge, total liability for any claim is limited to US$100.

### 10. Termination
This license ends automatically if you breach it. If it ends, stop using the Software and delete your copies. Sections 2, 8 and 9 survive termination.

### 11. Changes
We may publish new versions of this license for future releases. The license that ships with a release continues to govern that release.

Questions: [open a discussion](https://github.com/orchstep/orchstep/discussions).
